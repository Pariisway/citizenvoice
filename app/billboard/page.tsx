"use client";

// app/billboard/page.tsx

import { useEffect, useState } from "react";
import Link from "next/link";
import { getFirestore, collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { firebaseApp } from "@/lib/firebaseClient";
import { useAnonymousIdentity } from "@/lib/useAnonymousIdentity";
import type { Proposal } from "@/types/academy";
import TopNav from "@/components/TopNav";

export default function BillboardPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const { uid } = useAnonymousIdentity();
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());

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

  async function handleUpvote(id: string) {
    if (!uid || votedIds.has(id)) return;
    const functions = getFunctions(firebaseApp);
    const upvote = httpsCallable(functions, "upvoteProposal");
    const result = await upvote({ proposalId: id });
    setVotedIds((s) => new Set(s).add(id));
    if (!(result.data as any).alreadyVoted) {
      setProposals((ps) => ps.map((p) => (p.id === id ? { ...p, upvoteCount: p.upvoteCount + 1 } : p)));
    }
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
                  onClick={() => handleUpvote(p.id)}
                  disabled={votedIds.has(p.id)}
                  className="text-sm flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5
                             hover:border-[#00E5C3]/50 transition-colors disabled:opacity-50"
                >
                  ▲ {p.upvoteCount}
                </button>
                <button
                  onClick={() => handleShare(p)}
                  className="text-sm rounded-lg border border-white/15 px-3 py-1.5 hover:border-[#00E5C3]/50 transition-colors"
                >
                  Share
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
