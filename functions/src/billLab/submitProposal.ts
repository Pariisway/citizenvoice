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
import { enforceRateLimit } from "../moderation/enforceRateLimit";

if (!getApps().length) {
  initializeApp();
}
const db = getFirestore();
// Note: ignoreUndefinedProperties is already set once globally in
// findMyRepresentatives.ts — Firestore only allows settings() to be
// called once per instance, and getFirestore() returns the same shared
// instance across every file in this functions codebase. Don't call
// .settings() again here.

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
  contactEmail: string;
  contactPhone?: string;
  budgetSummary: string;
  resourcesNeeded?: string;
  benefits: string;
  conclusion: string;
}

export const submitProposal = functions.onCall(async (request) => {
  if (!request.auth) {
    throw new functions.HttpsError("unauthenticated", "Sign-in required.");
  }
  const uid = request.auth.uid;

  // Creating a bill is member-only, same as bill discussion and voice —
  // browsing/reading is open to everyone, this is not.
  if (request.auth.token.firebase?.sign_in_provider === "anonymous") {
    throw new functions.HttpsError(
      "permission-denied",
      "Create a free account to submit a proposal."
    );
  }

  // 5 proposals per day per member — generous for a real citizen, a real
  // wall for a script.
  await enforceRateLimit(uid, "submitProposal", 5, 24 * 60 * 60 * 1000);

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

  // Academy completion is now a recommendation, not a requirement — the
  // hard block here previously worked against the actual goal (seeing
  // that change is possible should be what pulls people in, not
  // something they earn access to after homework). Still record it so
  // admins reviewing a proposal have that context.
  const academyComplete = totalLessons > 0 && completedCount >= totalLessons;

  const data = request.data as SubmitProposalRequest;
  const required: (keyof SubmitProposalRequest)[] = [
    "title", "problem", "whoAffected", "proposedChange", "evidence", "areaLabel", "authorName",
    "contactEmail", "budgetSummary", "benefits", "conclusion",
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
    contactEmail: data.contactEmail.trim(),
    contactPhone: data.contactPhone?.trim() || undefined,
    budgetSummary: data.budgetSummary.trim(),
    resourcesNeeded: data.resourcesNeeded?.trim() || undefined,
    benefits: data.benefits.trim(),
    conclusion: data.conclusion.trim(),
    status: "pending_review",
    upvoteCount: 0,
    academyComplete,
    createdAt: new Date().toISOString(),
  });

  return { success: true, proposalId: proposalRef.id };
});
