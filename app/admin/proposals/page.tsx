"use client";

// app/admin/proposals/page.tsx

import { useEffect, useState } from "react";
import {
  getFirestore, collection, getDocs, query, where, orderBy, doc, updateDoc, deleteDoc,
} from "firebase/firestore";
import { firebaseApp } from "@/lib/firebaseClient";
import type { Proposal, ProposalStatus } from "@/types/academy";
import { downloadProposalPdf } from "@/lib/generateProposalPdf";

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    title: string; problem: string; whoAffected: string; proposedChange: string; evidence: string; areaLabel: string;
    contactEmail: string; contactPhone: string; budgetSummary: string; resourcesNeeded: string;
    benefits: string; conclusion: string;
  }>({
    title: "", problem: "", whoAffected: "", proposedChange: "", evidence: "", areaLabel: "",
    contactEmail: "", contactPhone: "", budgetSummary: "", resourcesNeeded: "", benefits: "", conclusion: "",
  });

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

  function startEdit(p: Proposal) {
    setEditingId(p.id);
    setEditForm({
      title: p.title, problem: p.problem, whoAffected: p.whoAffected,
      proposedChange: p.proposedChange, evidence: p.evidence, areaLabel: p.areaLabel,
      contactEmail: p.contactEmail ?? "", contactPhone: p.contactPhone ?? "",
      budgetSummary: p.budgetSummary ?? "", resourcesNeeded: p.resourcesNeeded ?? "",
      benefits: p.benefits ?? "", conclusion: p.conclusion ?? "",
    });
  }

  async function saveContentEdit(id: string) {
    const db = getFirestore(firebaseApp);
    // Note: the Firestore web SDK rejects `undefined` field values (unlike
    // the Admin SDK used in Cloud Functions), so optional fields fall back
    // to "" here rather than undefined.
    await updateDoc(doc(db, "proposals", id), {
      title: editForm.title.trim(),
      problem: editForm.problem.trim(),
      whoAffected: editForm.whoAffected.trim(),
      proposedChange: editForm.proposedChange.trim(),
      evidence: editForm.evidence.trim(),
      areaLabel: editForm.areaLabel.trim(),
      contactEmail: editForm.contactEmail.trim(),
      contactPhone: editForm.contactPhone.trim(),
      budgetSummary: editForm.budgetSummary.trim(),
      resourcesNeeded: editForm.resourcesNeeded.trim(),
      benefits: editForm.benefits.trim(),
      conclusion: editForm.conclusion.trim(),
    });
    setEditingId(null);
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this proposal permanently? This can't be undone.")) return;
    const db = getFirestore(firebaseApp);
    await deleteDoc(doc(db, "proposals", id));
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
            {editingId === p.id ? (
              <div className="space-y-2">
                <input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="Title"
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm font-medium"
                />
                <input
                  value={editForm.areaLabel}
                  onChange={(e) => setEditForm({ ...editForm, areaLabel: e.target.value })}
                  placeholder="Area"
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm"
                />
                <textarea
                  value={editForm.problem}
                  onChange={(e) => setEditForm({ ...editForm, problem: e.target.value })}
                  placeholder="Problem"
                  rows={2}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm"
                />
                <textarea
                  value={editForm.whoAffected}
                  onChange={(e) => setEditForm({ ...editForm, whoAffected: e.target.value })}
                  placeholder="Who's affected"
                  rows={2}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm"
                />
                <textarea
                  value={editForm.proposedChange}
                  onChange={(e) => setEditForm({ ...editForm, proposedChange: e.target.value })}
                  placeholder="Proposed change"
                  rows={2}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm"
                />
                <textarea
                  value={editForm.evidence}
                  onChange={(e) => setEditForm({ ...editForm, evidence: e.target.value })}
                  placeholder="Evidence"
                  rows={2}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm"
                />
                <div className="flex gap-2">
                  <input
                    value={editForm.contactEmail}
                    onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })}
                    placeholder="Contact email"
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm"
                  />
                  <input
                    value={editForm.contactPhone}
                    onChange={(e) => setEditForm({ ...editForm, contactPhone: e.target.value })}
                    placeholder="Contact phone"
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm"
                  />
                </div>
                <textarea
                  value={editForm.budgetSummary}
                  onChange={(e) => setEditForm({ ...editForm, budgetSummary: e.target.value })}
                  placeholder="Budget summary"
                  rows={2}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm"
                />
                <textarea
                  value={editForm.resourcesNeeded}
                  onChange={(e) => setEditForm({ ...editForm, resourcesNeeded: e.target.value })}
                  placeholder="Resources needed"
                  rows={2}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm"
                />
                <textarea
                  value={editForm.benefits}
                  onChange={(e) => setEditForm({ ...editForm, benefits: e.target.value })}
                  placeholder="Benefits & community support"
                  rows={2}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm"
                />
                <textarea
                  value={editForm.conclusion}
                  onChange={(e) => setEditForm({ ...editForm, conclusion: e.target.value })}
                  placeholder="Conclusion"
                  rows={2}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm"
                />
                <div className="flex gap-2">
                  <button onClick={() => saveContentEdit(p.id)} className="text-sm rounded-lg bg-[#00E5C3] text-[#0E1225] px-3 py-1.5">Save</button>
                  <button onClick={() => setEditingId(null)} className="text-sm rounded-lg border border-white/15 px-3 py-1.5">Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">{p.title}</p>
                  <div className="flex items-center gap-3 shrink-0">
                    <button onClick={() => downloadProposalPdf(p)} className="text-sm text-white/50 hover:text-white/80">
                      PDF
                    </button>
                    <button onClick={() => startEdit(p)} className="text-sm text-[#00E5C3]/80 hover:text-[#00E5C3]">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="text-sm text-red-300/80 hover:text-red-300">
                      Delete
                    </button>
                  </div>
                </div>
                <p className="text-xs text-white/40 mt-0.5">
                  {p.areaLabel} · by {p.authorName}
                  {p.academyComplete ? " · ✅ completed Academy" : " · Academy not completed"}
                </p>
                <p className="text-sm text-white/70 mt-3"><span className="text-white/40">Problem:</span> {p.problem}</p>
                <p className="text-sm text-white/70 mt-2"><span className="text-white/40">Change:</span> {p.proposedChange}</p>
                <p className="text-sm text-white/70 mt-2"><span className="text-white/40">Evidence:</span> {p.evidence}</p>
                {p.budgetSummary && (
                  <p className="text-sm text-white/70 mt-2"><span className="text-white/40">Budget:</span> {p.budgetSummary}</p>
                )}
                {p.benefits && (
                  <p className="text-sm text-white/70 mt-2"><span className="text-white/40">Benefits:</span> {p.benefits}</p>
                )}
              </>
            )}

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
