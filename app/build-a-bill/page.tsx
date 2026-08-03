"use client";

// app/build-a-bill/page.tsx
//
// Academy completion is now a RECOMMENDATION, not a gate. Seeing what's
// possible (the Billboard) is what should pull people in — making them
// do homework before they're even allowed to see what building a
// proposal looks like was working against that. The readiness checklist
// still runs regardless; that's the actual quality bar now, along with
// admin review and (later) payment.

import { useEffect, useState } from "react";
import Link from "next/link";
import TopNav from "@/components/TopNav";
import { useAcademyCompletion } from "@/lib/useAcademyCompletion";
import { useAnonymousIdentity } from "@/lib/useAnonymousIdentity";

const CHECKLIST_ITEMS = [
  { id: "problem", label: "I can describe the specific problem in one or two sentences." },
  { id: "area", label: "I know exactly which city, town, or county this affects." },
  { id: "who", label: "I can explain who's affected and how." },
  { id: "change", label: "I know exactly what I want to change — not just what's wrong." },
  { id: "evidence", label: "I have real examples, numbers, or documentation to back it up." },
  { id: "review", label: "I understand my proposal goes through a quick admin review before it's posted publicly." },
  { id: "fee", label: "I understand there's a small one-time fee to submit a proposal." },
];

export default function BuildABillPage() {
  const { loading, isComplete, completedCount, totalLessons } = useAcademyCompletion();
  const { uid } = useAnonymousIdentity();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [dismissedNudge, setDismissedNudge] = useState(false);

  const storageKey = uid ? `citizenVoice.billChecklist.${uid}` : null;

  useEffect(() => {
    if (!storageKey) return;
    const saved = window.localStorage.getItem(storageKey);
    if (saved) setChecked(JSON.parse(saved));
  }, [storageKey]);

  function toggle(id: string) {
    const next = { ...checked, [id]: !checked[id] };
    setChecked(next);
    if (storageKey) window.localStorage.setItem(storageKey, JSON.stringify(next));
  }

  const allChecked = CHECKLIST_ITEMS.every((item) => checked[item.id]);

  return (
    <main className="min-h-screen bg-[#0E1225] text-white">
      <TopNav />
      <div className="max-w-xl mx-auto px-6 py-16">
        <h1 className="text-2xl font-semibold text-center">Build a Bill</h1>
        <p className="mt-3 text-white/60 text-center">
          Before you start, make sure you've actually got what you need —
          check off each one honestly:
        </p>

        {!loading && !isComplete && !dismissedNudge && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-white/80">
                📖 Most people find Civic Academy's 6 quick lessons make
                their proposal way stronger — {completedCount} of {totalLessons} done.
              </p>
              <Link href="/academy" className="text-sm text-[#00E5C3] mt-1 inline-block">
                Take a look →
              </Link>
            </div>
            <button
              onClick={() => setDismissedNudge(true)}
              className="text-white/40 hover:text-white/70 shrink-0"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        )}

        <div className="mt-6 space-y-2">
          {CHECKLIST_ITEMS.map((item) => (
            <label
              key={item.id}
              className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 cursor-pointer
                         hover:border-[#00E5C3]/30 transition-colors"
            >
              <input
                type="checkbox"
                checked={!!checked[item.id]}
                onChange={() => toggle(item.id)}
                className="mt-1 accent-[#00E5C3]"
              />
              <span className="text-sm text-white/80">{item.label}</span>
            </label>
          ))}
        </div>

        {allChecked ? (
          <div className="mt-6 rounded-2xl bg-[#00E5C3]/10 border border-[#00E5C3]/40 px-5 py-4 text-center">
            <p className="text-[#00E5C3] font-medium">You're ready.</p>
            <p className="text-white/60 text-sm mt-1">
              Answer a few guided questions, submit for a quick review, and
              once approved it goes live on the Community Billboard for
              people to read, upvote, and discuss.
            </p>
            <Link
              href="/build-a-bill/wizard"
              className="mt-4 inline-block rounded-xl bg-[#00E5C3] text-[#0E1225] font-medium px-6 py-3
                         hover:opacity-90 transition-opacity"
            >
              Start Building
            </Link>
          </div>
        ) : (
          <p className="mt-4 text-white/40 text-sm text-center">
            Check off everything above to start building.
          </p>
        )}

        <p className="mt-6 text-xs text-white/40 text-center">
          Being on the Community Billboard doesn't guarantee a proposal
          becomes law — but broad, organized community support is
          consistently one of the biggest factors in whether an idea gets
          a lawmaker's attention at all. That's what this board is built to
          help you build.
        </p>
      </div>
    </main>
  );
}
