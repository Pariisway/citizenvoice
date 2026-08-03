"use client";

// app/admin/proposals/page.tsx

import { useEffect, useState } from "react";
import {
  getFirestore, collection, getDocs, query, where, orderBy, doc, updateDoc,
} from "firebase/firestore";
import { firebaseApp } from "@/lib/firebaseClient";
import type { Proposal, ProposalStatus } from "@/types/academy";

const TABS: { status: ProposalStatus; label: string }[] = [
  { status: "pending_review", label: "Pending Review" },
  { status: "active", label: "Active" },
  { status: "passed", label: "Passed" },
  { status: "rejected", label: "Rejected" },
];

export default function AdminProposalsPage() {
  const [tab, setTab] = useState<ProposalStatus>("pending_review");
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [badgeInput, setBadgeInput] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    const db = getFirestore(firebaseApp);
    const snap = await getDocs(
      query(collection(db, "proposals"), where("status", "==", tab), orderBy("createdAt", "desc"))
    );
    setProposals(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Proposal)));
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function setStatus(id: string, status: ProposalStatus, extra?: Record<string, unknown>) {
    const db = getFirestore(firebaseApp);
    await updateDoc(doc(db, "proposals", id), {
      status,
      reviewedAt: new Date().toISOString(),
      ...extra,
    });
    await load();
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold">Proposals</h1>

      <div className="mt-6 flex gap-4 border-b border-white/10 text-sm">
        {TABS.map((t) => (
          <button
            key={t.status}
            onClick={() => setTab(t.status)}
            className={`pb-3 -mb-px border-b-2 transition-colors ${
              tab === t.status ? "border-[#00E5C3] text-[#00E5C3]" : "border-transparent text-white/50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {loading && <p className="text-white/40 text-sm">Loading…</p>}
        {!loading && proposals.length === 0 && (
          <p className="text-white/40 text-sm">Nothing here.</p>
        )}

        {proposals.map((p) => (
          <div key={p.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="font-medium">{p.title}</p>
            <p className="text-xs text-white/40 mt-0.5">{p.areaLabel} · by {p.authorName}</p>
            <p className="text-sm text-white/70 mt-3"><span className="text-white/40">Problem:</span> {p.problem}</p>
            <p className="text-sm text-white/70 mt-2"><span className="text-white/40">Change:</span> {p.proposedChange}</p>
            <p className="text-sm text-white/70 mt-2"><span className="text-white/40">Evidence:</span> {p.evidence}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {tab === "pending_review" && (
                <>
                  <button
                    onClick={() => setStatus(p.id, "active")}
                    className="text-sm rounded-lg bg-[#00E5C3] text-[#0E1225] font-medium px-4 py-1.5"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => setStatus(p.id, "rejected", { reviewNote: "Did not meet community guidelines." })}
                    className="text-sm rounded-lg border border-white/20 px-4 py-1.5"
                  >
                    Reject
                  </button>
                </>
              )}
              {tab === "active" && (
                <>
                  <input
                    value={badgeInput[p.id] ?? ""}
                    onChange={(e) => setBadgeInput({ ...badgeInput, [p.id]: e.target.value })}
                    placeholder="Badge label, e.g. 'Passed City Council'"
                    className="text-sm rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 flex-1 min-w-[200px]"
                  />
                  <button
                    onClick={() =>
                      setStatus(p.id, "passed", {
                        passedAt: new Date().toISOString(),
                        passedBadgeLabel: badgeInput[p.id] || "Community Win",
                      })
                    }
                    className="text-sm rounded-lg bg-[#00E5C3] text-[#0E1225] font-medium px-4 py-1.5"
                  >
                    Mark Passed
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
