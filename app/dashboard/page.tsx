"use client";

// app/dashboard/page.tsx
//
// The member's home base. Right now this is mostly an Academy progress
// view + the Build a Bill entry point — grows as proposals/notifications
// ship (followed bills, action history, etc. land here later).

import Link from "next/link";
import TopNav from "@/components/TopNav";
import DisplayNamePrompt from "@/components/DisplayNamePrompt";
import { useAnonymousIdentity } from "@/lib/useAnonymousIdentity";
import { useAcademyCompletion } from "@/lib/useAcademyCompletion";

export default function DashboardPage() {
  const { displayName } = useAnonymousIdentity();
  const { loading, isComplete, completedCount, totalLessons } = useAcademyCompletion();

  return (
    <main className="min-h-screen bg-[#0E1225] text-white">
      <TopNav />
      <div className="max-w-xl mx-auto px-6 py-16">
        <h1 className="text-2xl font-semibold">
          {displayName ? `Welcome back, ${displayName}` : "Your Dashboard"}
        </h1>

        <div className="mt-3">
          <DisplayNamePrompt />
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-6">
          <p className="text-sm text-white/50">Civic Academy</p>
          {loading ? (
            <p className="mt-2 text-white/40 text-sm">Loading…</p>
          ) : (
            <>
              <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-[#00E5C3] transition-all"
                  style={{ width: `${totalLessons ? (completedCount! / totalLessons) * 100 : 0}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-white/40">
                {completedCount} of {totalLessons} lessons complete
              </p>
              {!isComplete && (
                <Link
                  href="/academy"
                  className="mt-4 inline-block rounded-xl border border-white/20 text-white px-5 py-2.5 text-sm
                             hover:border-[#00E5C3]/60 transition-colors"
                >
                  Continue Academy
                </Link>
              )}
            </>
          )}
        </div>

        {/* Build a Bill always shows now — Academy is a recommendation on
            the way in, not a locked door. See build-a-bill/page.tsx. */}
        {!loading && (
          <Link
            href="/build-a-bill"
            className="mt-4 block rounded-2xl bg-[#00E5C3]/10 border border-[#00E5C3]/40 px-6 py-5
                       hover:bg-[#00E5C3]/15 transition-colors"
          >
            <p className="text-[#00E5C3] font-medium">🛠️ Build a Bill</p>
            <p className="text-white/60 text-sm mt-1">
              Turn your idea into a community proposal.
            </p>
          </Link>
        )}
      </div>
    </main>
  );
}
