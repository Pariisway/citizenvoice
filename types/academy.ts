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

// ---- Forward stub for step 3 (Community Bill Lab) ----
// Not used yet — defined now so the Academy completion-tracking data model
// doesn't need to change shape when proposals ship.
export type ProposalStatus = "queue" | "passed" | "archived";

export interface Proposal {
  id: string;
  title: string;
  problem: string;
  areaCityFips?: string;     // proposal is only listed under the area it affects
  areaCountyFips?: string;
  authorUid: string;
  authorName: string;
  status: ProposalStatus;
  upvoteCount: number;
  createdAt: string;
  passedAt?: string;
  passedBadgeLabel?: string; // shown on the public "community wins" page
}
