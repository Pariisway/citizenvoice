"use client";

// app/build-a-bill/page.tsx
//
// Real gate, honest placeholder: the full wizard (problem -> evidence ->
// $10 payment -> submission -> admin review -> Community Billboard) is its
// own build. This page does the actual completion check now, and tells
// people exactly what to expect once it ships — no dead links, no
// overpromising a feature that doesn't exist yet.

import Link from "next/link";
import TopNav from "@/components/TopNav";
import { useAcademyCompletion } from "@/lib/useAcademyCompletion";

export default function BuildABillPage() {
  const { loading, isComplete, completedCount, totalLessons } = useAcademyCompletion();

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
              The full proposal builder is still being built — here's
              exactly what to expect when it's ready:
            </p>

            <div className="mt-8 space-y-3 text-left">
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
