"use client";

// app/petitions/page.tsx
//
// A petition-focused view of the same proposals data that powers the
// Billboard — same underlying records, different framing: this page is
// about signatures and rank, not discussion. "Create your own" reuses
// the existing Build a Bill flow rather than a separate lightweight
// petition object, since every proposal already carries everything a
// petition needs (title, problem, benefits, a signature count).

import { useEffect, useState } from "react";
import Link from "next/link";
import { getFirestore, collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { firebaseApp } from "@/lib/firebaseClient";
import type { Proposal } from "@/types/academy";
import TopNav from "@/components/TopNav";
import PetitionSignModal from "@/components/PetitionSignModal";

export default function PetitionsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [signingId, setSigningId] = useState<string | null>(null);

  useEffect(() => {
    const db = getFirestore(firebaseApp);
    getDocs(
      query(collection(db, "proposals"), where("status", "==", "active"), orderBy("upvoteCount", "desc"))
    ).then((snap) => {
      setProposals(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Proposal)));
      setLoading(false);
    });
  }, []);

  function handleSigned(id: string) {
    setVotedIds((s) => new Set(s).add(id));
    setProposals((ps) =>
      ps
        .map((p) => (p.id === id ? { ...p, upvoteCount: p.upvoteCount + 1 } : p))
        .sort((a, b) => b.upvoteCount - a.upvoteCount)
    );
  }

  return (
    <main className="min-h-screen bg-[#0E1225] text-white">
      <TopNav />
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Petitions</h1>
            <p className="mt-2 text-white/60">
              Every active proposal, ranked by real signatures — full name and
              email, not just a click.
            </p>
          </div>
          <Link
            href="/build-a-bill"
            className="shrink-0 rounded-xl bg-[#00E5C3] text-[#0E1225] font-medium px-5 py-2.5 text-sm
                       hover:opacity-90 transition-opacity"
          >
            Start a Petition
          </Link>
        </div>

        {loading && <p className="mt-10 text-white/40 text-sm">Loading…</p>}
        {!loading && proposals.length === 0 && (
          <p className="mt-10 text-white/50">No active petitions yet — be the first.</p>
        )}

        <div className="mt-8 space-y-2">
          {proposals.map((p, i) => (
            <div
              key={p.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 flex items-center gap-4"
            >
              <span
                className={`shrink-0 w-8 text-center text-lg font-semibold ${
                  i < 3 ? "text-[#00E5C3]" : "text-white/30"
                }`}
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <Link href={`/billboard/proposal?id=${p.id}`} className="font-medium hover:text-[#00E5C3] block truncate">
                  {p.title}
                </Link>
                <p className="text-xs text-white/40 mt-0.5">{p.areaLabel} · {p.upvoteCount} signatures</p>
              </div>
              <button
                onClick={() => setSigningId(p.id)}
                disabled={votedIds.has(p.id)}
                className="shrink-0 text-sm rounded-lg border border-white/15 px-4 py-2 hover:border-[#00E5C3]/50 transition-colors disabled:opacity-50"
              >
                ✍️ {votedIds.has(p.id) ? "Signed" : "Sign"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {signingId && (
        <PetitionSignModal
          open={!!signingId}
          proposalId={signingId}
          onClose={() => setSigningId(null)}
          onSigned={() => handleSigned(signingId)}
        />
      )}
    </main>
  );
}
