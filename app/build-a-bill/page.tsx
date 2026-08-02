"use client";

// app/build-a-bill/page.tsx
//
// Real gate, honest placeholder: the full wizard (problem -> evidence ->
// $10 payment -> submission -> admin review -> Community Billboard) is its
// own build. This page does the actual completion check now, runs the
// pre-submission readiness checklist, and tells people exactly what to
// expect once the full builder ships — no dead links, no overpromising a
// feature that doesn't exist yet.

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
      <div className="max-w-xl mx-auto px-6 py-16 text-center">
        {loading && <p className="text-white/40">Loading…</p>}

        {!loading && !isComplete && (
          <>
            <h1 className="text-2xl font-semibold">Bill Lab is locked for now</h1>
            <p className="mt-3 text-white/60">
              Finish Civic Academy first — {completedCount} of {totalLessons}{" "}
              lessons done. It only takes a few minutes, and it's what makes
              a proposal you build here actually well put-together.
            </p>
            <Link
              href="/academy"
              className="mt-6 inline-block rounded-xl bg-[#00E5C3] text-[#0E1225] font-medium px-6 py-3
                         hover:opacity-90 transition-opacity"
            >
              Continue Civic Academy
            </Link>
          </>
        )}

        {!loading && isComplete && (
          <>
            <h1 className="text-2xl font-semibold">🎉 Bill Lab is unlocked</h1>
            <p className="mt-3 text-white/60">
              Before you start, make sure you've actually got what you need
              — check off each one honestly:
            </p>

            <div className="mt-6 space-y-2 text-left">
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
              <div className="mt-6 rounded-2xl bg-[#00E5C3]/10 border border-[#00E5C3]/40 px-5 py-4">
                <p className="text-[#00E5C3] font-medium">You're ready.</p>
                <p className="text-white/60 text-sm mt-1">
                  The full proposal builder is still being built — here's
                  exactly what happens once it's live:
                </p>
              </div>
            ) : (
              <p className="mt-4 text-white/40 text-sm">
                Check off everything above to see what happens next.
              </p>
            )}

            {allChecked && (
              <div className="mt-6 space-y-3 text-left">
                {[
                  "Answer a few guided questions: the problem, who it affects, what should change, and your evidence.",
                  "A small one-time fee unlocks proposal creation — this keeps the board focused on people who are serious about following through.",
                  "Your proposal goes to our team for a quick review before it's posted publicly.",
                  "Once approved, it's listed on the Community Billboard, under the exact city or area it affects — with a picture, a short summary, and a live discussion room attached.",
                  "The community can upvote it, discuss it, and help it rise to the top of the board.",
                ].map((step, i) => (
                  <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 flex gap-3">
                    <span className="text-[#00E5C3] font-medium shrink-0">{i + 1}.</span>
                    <p className="text-white/70 text-sm">{step}</p>
                  </div>
                ))}
              </div>
            )}

            <p className="mt-6 text-xs text-white/40">
              Being on the Community Billboard doesn't guarantee a proposal
              becomes law — but broad, organized community support is
              consistently one of the biggest factors in whether an idea
              gets a lawmaker's attention at all. That's what this board is
              built to help you build.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
