"use client";

// app/community-wins/page.tsx

import { useEffect, useState } from "react";
import Link from "next/link";
import { getFirestore, collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { firebaseApp } from "@/lib/firebaseClient";
import type { Proposal } from "@/types/academy";
import TopNav from "@/components/TopNav";

export default function CommunityWinsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getFirestore(firebaseApp);
    getDocs(query(collection(db, "proposals"), where("status", "==", "passed"), orderBy("passedAt", "desc")))
      .then((snap) => {
        setProposals(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Proposal)));
        setLoading(false);
      });
  }, []);

  return (
    <main className="min-h-screen bg-[#0E1225] text-white">
      <TopNav />
      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Community Wins</h1>
        <p className="mt-2 text-white/60">
          Proposals from this community that made real progress.
        </p>

        {loading && <p className="mt-10 text-white/40 text-sm">Loading…</p>}
        {!loading && proposals.length === 0 && (
          <p className="mt-10 text-white/50">Nothing here yet — the first one could be yours.</p>
        )}

        <div className="mt-8 space-y-4">
          {proposals.map((p) => (
            <Link
              key={p.id}
              href={`/billboard/proposal?id=${p.id}`}
              className="block rounded-2xl border border-[#00E5C3]/30 bg-[#00E5C3]/5 px-5 py-4 hover:bg-[#00E5C3]/10 transition-colors"
            >
              <span className="text-xs rounded-full bg-[#00E5C3]/15 border border-[#00E5C3]/40 text-[#00E5C3] px-3 py-1">
                🏅 {p.passedBadgeLabel}
              </span>
              <p className="font-medium mt-3">{p.title}</p>
              <p className="text-xs text-white/40 mt-1">{p.areaLabel} · by {p.authorName}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
