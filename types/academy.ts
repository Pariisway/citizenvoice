// types/academy.ts
//
// Civic Academy: short, optional lessons. Free to watch, no account needed
// — progress is tracked against the visitor's anonymous identity
// (lib/useAnonymousIdentity.ts). When the paid "Build a Law" proposal flow
// ships (step 3), completing Academy becomes a prerequisite for it, and
// that anonymous identity gets *linked* to a real account at the payment
// step — carrying this progress forward, not resetting it.

export interface Lesson {
  id: string;
  title: string;
  hook: string;              // the short, attention-grabbing question, e.g. "Can ONE person change a city?"
  durationSeconds: number;
  order: number;
  videoUrl?: string;         // short video if available
  cardContent?: string;      // short text/card fallback if no video yet — keep under ~200 chars
  createdAt: string;
}

export interface LessonProgress {
  uid: string;
  completedLessonIds: string[];
  updatedAt: string;
}

// ---- Community Bill Lab / Billboard ----
export type ProposalStatus = "pending_review" | "active" | "passed" | "rejected";

export interface Proposal {
  id: string;
  title: string;
  problem: string;
  whoAffected: string;
  proposedChange: string;
  evidence: string;
  photoUrl?: string;
  areaLabel: string;         // human-readable, e.g. "Fairview Heights, IL"
  areaCityFips?: string;
  areaCountyFips?: string;
  authorUid: string;
  authorName: string;
  status: ProposalStatus;
  upvoteCount: number;
  academyComplete?: boolean;
  createdAt: string;
  reviewedAt?: string;
  reviewNote?: string;       // shown to author if rejected
  passedAt?: string;
  passedBadgeLabel?: string; // shown on the Community Wins page
  // TODO(payment): once Stripe is wired back in, add
  // `paymentStatus: "paid" | "unpaid"` and gate creation on it server-side
  // in functions/src/billLab/submitProposal.ts — see comment there.
}

export interface ProposalComment {
  id: string;
  proposalId: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
}
