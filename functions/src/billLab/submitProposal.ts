// functions/src/billLab/submitProposal.ts
//
// Creates a proposal in "pending_review" status. Called from the wizard
// after the client-side checklist — but client-side checks are trivially
// bypassable, so this function re-verifies Academy completion server-side
// too. That's the real gate right now.
//
// TODO(payment): this is currently NOT gated on payment. When Stripe is
// wired back in:
//   1. Add a `paymentIntentId` (or Checkout Session ID) param to the
//      request.
//   2. Verify it server-side with the Stripe SDK (retrieve the session,
//      confirm `payment_status === "paid"` and that it hasn't been used
//      for a previous proposal — e.g. check a `usedPaymentIds` set).
//   3. Only then proceed to create the proposal doc below.
// Everything else in this function stays the same — this is a small,
// contained change, not a rearchitecture.

import * as functions from "firebase-functions/v2/https";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp();
}
const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

interface SubmitProposalRequest {
  title: string;
  problem: string;
  whoAffected: string;
  proposedChange: string;
  evidence: string;
  photoUrl?: string;
  areaLabel: string;
  areaCityFips?: string;
  areaCountyFips?: string;
  authorName: string;
}

export const submitProposal = functions.onCall(async (request) => {
  if (!request.auth) {
    throw new functions.HttpsError("unauthenticated", "Sign-in required.");
  }
  const uid = request.auth.uid;

  // Re-verify Academy completion server-side — the client-side checklist
  // and gate are UX, not security; someone could otherwise call this
  // function directly and skip Academy entirely.
  const [lessonsSnap, progressSnap] = await Promise.all([
    db.collection("lessons").get(),
    db.collection("lessonProgress").doc(uid).get(),
  ]);
  const totalLessons = lessonsSnap.size;
  const completedCount = progressSnap.exists
    ? (progressSnap.data()?.completedLessonIds?.length ?? 0)
    : 0;

  if (totalLessons === 0 || completedCount < totalLessons) {
    throw new functions.HttpsError(
      "failed-precondition",
      "Complete Civic Academy before submitting a proposal."
    );
  }

  const data = request.data as SubmitProposalRequest;
  const required: (keyof SubmitProposalRequest)[] = [
    "title", "problem", "whoAffected", "proposedChange", "evidence", "areaLabel", "authorName",
  ];
  for (const field of required) {
    if (!data[field] || !String(data[field]).trim()) {
      throw new functions.HttpsError("invalid-argument", `Missing required field: ${field}`);
    }
  }

  const proposalRef = db.collection("proposals").doc();
  await proposalRef.set({
    title: data.title.trim(),
    problem: data.problem.trim(),
    whoAffected: data.whoAffected.trim(),
    proposedChange: data.proposedChange.trim(),
    evidence: data.evidence.trim(),
    photoUrl: data.photoUrl,
    areaLabel: data.areaLabel.trim(),
    areaCityFips: data.areaCityFips,
    areaCountyFips: data.areaCountyFips,
    authorUid: uid,
    authorName: data.authorName.trim(),
    status: "pending_review",
    upvoteCount: 0,
    createdAt: new Date().toISOString(),
  });

  return { success: true, proposalId: proposalRef.id };
});
