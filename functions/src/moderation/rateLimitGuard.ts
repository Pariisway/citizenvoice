// functions/src/moderation/rateLimitGuard.ts
//
// The single biggest risk of dropping "registered users only" is flooding
// and coordinated abuse — especially on a civic platform in the run-up to
// an election. This trigger doesn't block posts outright (that would need
// pre-write validation, which Firestore triggers can't do), but it
// auto-flags bursty posting for moderator review within seconds, and
// disables further posting from that uid until a moderator clears it.
//
// Watches the collections actually written to today — proposalComments
// (bill discussion) and communityMessages (Community Chat). Callable
// functions (submitProposal, upvoteProposal/signPetition,
// generateAgoraToken) have their own separate hard limits — see
// enforceRateLimit.ts — since those can be checked before the write
// happens, not just flagged after.
//
// This is a floor, not a ceiling — pair it with Firebase App Check
// (blocks non-browser/bot traffic) and a moderator queue that's actually
// staffed, especially in the weeks before an election.

import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp();
}
const db = getFirestore();

const BURST_WINDOW_MS = 60 * 1000; // 1 minute
const BURST_THRESHOLD = 5; // more than 5 posts/comments in a minute -> flag

async function checkBurstAndFlag(authorUid: string, collectionName: string, docId: string) {
  const since = new Date(Date.now() - BURST_WINDOW_MS).toISOString();

  const recentSnap = await db
    .collection(collectionName)
    .where("authorId", "==", authorUid)
    .where("createdAt", ">", since)
    .get();

  if (recentSnap.size > BURST_THRESHOLD) {
    // Flag the account, not just the post — a moderator needs to see the
    // pattern, not chase one flagged comment at a time.
    await db.collection("flags").add({
      type: "auto_burst_posting",
      authorId: authorUid,
      collection: collectionName,
      triggeringDocId: docId,
      count: recentSnap.size,
      createdAt: new Date().toISOString(),
      status: "open",
    });

    await db.collection("suspendedAuthors").doc(authorUid).set({
      reason: "burst_posting",
      suspendedAt: new Date().toISOString(),
      // Rules check this doc before allowing new writes from this uid —
      // see the `isNotSuspended()` helper added to firestore.rules.
    });
  }
}

export const guardProposalCommentBursts = onDocumentCreated(
  "proposalComments/{commentId}",
  async (event) => {
    const data = event.data?.data();
    if (!data?.authorId) return;
    await checkBurstAndFlag(data.authorId, "proposalComments", event.params.commentId);
  }
);

export const guardCommunityMessageBursts = onDocumentCreated(
  "communityMessages/{messageId}",
  async (event) => {
    const data = event.data?.data();
    if (!data?.authorId) return;
    await checkBurstAndFlag(data.authorId, "communityMessages", event.params.messageId);
  }
);
