"use client";

// app/billboard/page.tsx

import { useEffect, useState } from "react";
import Link from "next/link";
import { getFirestore, collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { firebaseApp } from "@/lib/firebaseClient";
import type { Proposal } from "@/types/academy";
import TopNav from "@/components/TopNav";
import PetitionSignModal from "@/components/PetitionSignModal";

export default function BillboardPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [signingId, setSigningId] = useState<string | null>(null);

  async function load() {
    const db = getFirestore(firebaseApp);
    const snap = await getDocs(
      query(collection(db, "proposals"), where("status", "==", "active"), orderBy("upvoteCount", "desc"))
    );
    setProposals(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Proposal)));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function handleSigned(id: string) {
    setVotedIds((s) => new Set(s).add(id));
    setProposals((ps) => ps.map((p) => (p.id === id ? { ...p, upvoteCount: p.upvoteCount + 1 } : p)));
  }

  function handleShare(p: Proposal) {
    const url = `${window.location.origin}/billboard/proposal?id=${p.id}`;
    if (navigator.share) {
      navigator.share({ title: p.title, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copied.");
    }
  }

  return (
    <main className="min-h-screen bg-[#0E1225] text-white">
      <TopNav />
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Community Billboard</h1>
        <p className="mt-2 text-white/60">
          Proposals from your neighbors, sorted by community support.{" "}
          <Link href="/community-wins" className="text-[#00E5C3]">See what's passed →</Link>
        </p>

        {!loading && proposals.length > 0 && (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
            <p className="text-sm font-medium text-white/80">🔥 Top 10 This Week</p>
            <p className="text-xs text-white/40 mt-0.5">
              Sign a proposal's petition to push it up the list.
            </p>
            <div className="mt-3 space-y-1">
              {proposals.slice(0, 10).map((p, i) => (
                <Link
                  key={p.id}
                  href={`/billboard/proposal?id=${p.id}`}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/5 transition-colors"
                >
                  <span
                    className={`shrink-0 w-6 text-center text-sm font-semibold ${
                      i < 3 ? "text-[#00E5C3]" : "text-white/40"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm truncate">{p.title}</span>
                  <span className="shrink-0 text-xs text-white/40">✍️ {p.upvoteCount}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {loading && <p className="mt-10 text-white/40 text-sm">Loading…</p>}
        {!loading && proposals.length === 0 && (
          <p className="mt-10 text-white/50">No proposals yet — be the first.</p>
        )}

        <div className="mt-8 grid sm:grid-cols-2 gap-5">
          {proposals.map((p) => (
            <div key={p.id} className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
              <Link href={`/billboard/proposal?id=${p.id}`}>
                {p.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.photoUrl} alt={p.title} className="w-full aspect-video object-cover" />
                ) : (
                  <div className="w-full aspect-video bg-white/5 flex items-center justify-center text-3xl">📜</div>
                )}
                <div className="px-4 pt-3">
                  <p className="font-medium">{p.title}</p>
                  <p className="text-xs text-white/40 mt-0.5">{p.areaLabel}</p>
                  <p className="text-sm text-white/60 mt-2 line-clamp-2">{p.problem}</p>
                </div>
              </Link>
              <div className="px-4 py-3 mt-2 flex items-center gap-3 border-t border-white/10">
                <button
                  onClick={() => setSigningId(p.id)}
                  disabled={votedIds.has(p.id)}
                  className="text-sm flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5
                             hover:border-[#00E5C3]/50 transition-colors disabled:opacity-50"
                >
                  ✍️ {votedIds.has(p.id) ? "Signed" : "Sign"} · {p.upvoteCount}
                </button>
                <button
                  onClick={() => handleShare(p)}
                  className="text-sm rounded-lg border border-white/15 px-3 py-1.5 hover:border-[#00E5C3]/50 transition-colors"
                >
                  Share
                </button>
                <Link
                  href={`/billboard/proposal?id=${p.id}`}
                  className="text-sm rounded-lg border border-white/15 px-3 py-1.5 hover:border-[#00E5C3]/50 transition-colors"
                >
                  🎙️ Discuss
                </Link>
              </div>
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
