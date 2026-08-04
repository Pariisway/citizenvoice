// functions/src/billLab/upvoteProposal.ts
//
// This is the petition-signature function — "upvote" is the legacy name
// but the button reads "Sign the petition" and, per the legitimacy
// requirement, a signature now means something: it captures the
// signer's real name and email (not just their site display name),
// stored in `proposalUpvotes` alongside the vote record. That's what
// makes the count meaningful enough to actually hand to a legislator's
// office later — a display name alone isn't a verifiable signature, a
// real name + email at least is auditable and contactable.
//
// One signature per identity per proposal, same as before. The
// denormalized `upvoteCount` on the proposal doc still drives the
// Billboard ranking and Top 10 list — unchanged.

import * as functions from "firebase-functions/v2/https";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp();
}
const db = getFirestore();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface UpvoteRequest {
  proposalId: string;
  fullName: string;
  email: string;
  address?: string;
}

export const upvoteProposal = functions.onCall(async (request) => {
  if (!request.auth) {
    throw new functions.HttpsError("unauthenticated", "Sign-in required.");
  }
  const uid = request.auth.uid;
  const { proposalId, fullName, email, address } = request.data as UpvoteRequest;
  if (!proposalId) {
    throw new functions.HttpsError("invalid-argument", "proposalId is required.");
  }
  if (!fullName?.trim() || fullName.trim().length < 2) {
    throw new functions.HttpsError("invalid-argument", "A full name is required to sign.");
  }
  if (!email?.trim() || !EMAIL_RE.test(email.trim())) {
    throw new functions.HttpsError("invalid-argument", "A valid email is required to sign.");
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
    tx.set(voteRef, {
      proposalId,
      uid,
      fullName: fullName.trim(),
      email: email.trim(),
      address: address?.trim() || null,
      createdAt: new Date().toISOString(),
    });
    tx.update(proposalRef, { upvoteCount: FieldValue.increment(1) });
    return { alreadyVoted: false };
  });

  return { success: true, alreadyVoted: result.alreadyVoted };
});
