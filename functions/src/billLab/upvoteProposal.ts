// functions/src/billLab/upvoteProposal.ts
//
// One vote per anonymous identity per proposal. The vote record
// (proposalUpvotes/{proposalId}_{uid}) is the source of truth for "has
// this uid already voted" — the counter on the proposal doc itself is a
// denormalized cache for fast reads, kept in sync here server-side so it
// can't be tampered with by a client writing to it directly (rules block
// direct client writes to proposals/{id}.upvoteCount).

import * as functions from "firebase-functions/v2/https";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp();
}
const db = getFirestore();

interface UpvoteRequest {
  proposalId: string;
}

export const upvoteProposal = functions.onCall(async (request) => {
  if (!request.auth) {
    throw new functions.HttpsError("unauthenticated", "Sign-in required.");
  }
  const uid = request.auth.uid;
  const { proposalId } = request.data as UpvoteRequest;
  if (!proposalId) {
    throw new functions.HttpsError("invalid-argument", "proposalId is required.");
  }

  const voteRef = db.collection("proposalUpvotes").doc(`${proposalId}_${uid}`);
  const proposalRef = db.collection("proposals").doc(proposalId);

  const result = await db.runTransaction(async (tx) => {
    const voteDoc = await tx.get(voteRef);
    if (voteDoc.exists) {
      return { alreadyVoted: true };
    }
    const proposalDoc = await tx.get(proposalRef);
    if (!proposalDoc.exists) {
      throw new functions.HttpsError("not-found", "Proposal not found.");
    }
    tx.set(voteRef, { proposalId, uid, createdAt: new Date().toISOString() });
    tx.update(proposalRef, { upvoteCount: FieldValue.increment(1) });
    return { alreadyVoted: false };
  });

  return { success: true, alreadyVoted: result.alreadyVoted };
});
