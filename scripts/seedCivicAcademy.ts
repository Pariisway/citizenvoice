// scripts/seedCivicAcademy.ts
//
// Seeds 6 short lessons. Run with: npx tsx seedCivicAcademy.ts
// (Needs the same serviceAccountKey.json as seedStClairCounty.ts.)
//
// Written from scratch to be short and punchy, not copied from any
// source. Lesson 4 and 5 cover what speeds a bill up (procedural
// shortcuts, must-pass packages, organized constituent pressure) —
// this is real, general knowledge about how legislatures work, presented
// with an explicit "not a guarantee" caveat, consistent with the rest of
// the site's neutral framing.

import { initializeApp, cert, ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import serviceAccount from "./serviceAccountKey.json";

initializeApp({
  credential: cert(serviceAccount as ServiceAccount),
});
const db = getFirestore();

const lessons = [
  {
    title: "Can one person start something big?",
    hook: "Can ONE person change a city?",
    durationSeconds: 60,
    order: 0,
    cardContent:
      "Short answer: yes — but not alone forever. Every law you've ever heard of started as one person's idea. A resident notices a problem, writes it down clearly, and starts asking other people if they've noticed it too. That's the whole first step. The hard part isn't having the idea — it's turning \"someone should do something\" into \"here's exactly what should change, and why.\" That's what the rest of Civic Academy teaches you to do.",
  },
  {
    title: "What is a bill",
    hook: "What is a bill, actually?",
    durationSeconds: 45,
    order: 1,
    cardContent:
      "A bill is just an idea for a law, written in a specific format so lawmakers can debate and vote on it. It has a title, a summary of what it changes, and the actual text of the change. Nothing more mysterious than that. Every law on the books — from speed limits to school funding — started life as one of these documents, usually written by someone who cared enough to put the problem into words.",
  },
  {
    title: "How a bill becomes law",
    hook: "How does a bill actually become law?",
    durationSeconds: 90,
    order: 2,
    cardContent:
      "The textbook version: a bill is introduced, sent to committee, debated, voted on, and signed. In practice, most bills never even leave committee — thousands get introduced every year and only a small fraction ever get a vote. The bills that move are usually the ones with either broad, non-controversial support, or a champion — a lawmaker willing to actively push it forward. Understanding this is the difference between writing an idea and building a plan.",
  },
  {
    title: "What speeds a bill up",
    hook: "What makes a bill move FAST instead of dying in committee?",
    durationSeconds: 75,
    order: 3,
    cardContent:
      "Most bills move slowly on purpose — that's by design, not an accident. A few things reliably speed things up: broad support across party lines, nothing controversial attached to it, or getting folded into a \"must-pass\" bill like a budget package. Legislatures also have real procedural shortcuts — like skipping lengthy floor debate when there's little to no opposition. None of this is guaranteed for any specific bill. But knowing these levers exist is the first step to using them.",
  },
  {
    title: "How a community changes the math",
    hook: "Can a community actually speed this up?",
    durationSeconds: 75,
    order: 4,
    cardContent:
      "Yes — and this is the part most people never learn. Lawmakers see thousands of proposals a year; most die quietly from lack of attention, not lack of merit. A visible, organized group of constituents — calls, emails, showing up to meetings — changes a lawmaker's incentives fast. It also helps a bill find a \"champion,\" a lawmaker willing to actively carry it forward. None of this guarantees a specific outcome, but organized attention is consistently one of the biggest factors in whether an idea moves at all.",
  },
  {
    title: "After you submit",
    hook: "You submitted a proposal — what happens next?",
    durationSeconds: 60,
    order: 5,
    cardContent:
      "Your proposal goes to our team for a quick review — mainly to make sure it's clear, on-topic, and appropriate for the community board. Once approved, it's posted publicly under the exact city or area it affects, where anyone can read it, upvote it, and join a live discussion about it. The most-supported proposals get the most visibility. Nothing here promises your idea becomes law — but this is the same starting point every real bill has, and now your community can see it too.",
  },
];

async function seed() {
  const batch = db.batch();
  const now = new Date().toISOString();

  for (const lesson of lessons) {
    const ref = db.collection("lessons").doc();
    batch.set(ref, { ...lesson, createdAt: now });
  }

  await batch.commit();
  console.log(`Seeded ${lessons.length} Civic Academy lessons.`);
  console.log(
    "Add real video via /admin/academy by deleting and re-adding any " +
    "lesson with a video file attached — the admin page doesn't support " +
    "editing an existing lesson's video in place yet."
  );
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
