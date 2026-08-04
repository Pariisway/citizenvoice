"use client";

// app/billboard/proposal/page.tsx
// Query-string route (static export can't pre-build a page per proposal
// ID) — same pattern as /representatives.

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  getFirestore, doc, getDoc, collection, query, where, orderBy, onSnapshot, addDoc,
} from "firebase/firestore";
import { firebaseApp } from "@/lib/firebaseClient";
import { useAnonymousIdentity } from "@/lib/useAnonymousIdentity";
import type { Proposal, ProposalComment } from "@/types/academy";
import TopNav from "@/components/TopNav";
import QuickAccountPrompt from "@/components/QuickAccountPrompt";
import ProposalVoiceRoom from "@/components/ProposalVoiceRoom";
import ProposalTemplate from "@/components/ProposalTemplate";
import PetitionSignModal from "@/components/PetitionSignModal";
import { downloadProposalPdf } from "@/lib/generateProposalPdf";

function ProposalProfile() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { uid, displayName, isMember } = useAnonymousIdentity();

  const [proposal, setProposal] = useState<Proposal | null | undefined>(undefined);
  const [comments, setComments] = useState<ProposalComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [voted, setVoted] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showQuickAccount, setShowQuickAccount] = useState(false);

  useEffect(() => {
    if (!id) { setProposal(null); return; }
    const db = getFirestore(firebaseApp);
    getDoc(doc(db, "proposals", id)).then((snap) => {
      setProposal(snap.exists() ? ({ id: snap.id, ...snap.data() } as Proposal) : null);
    });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const db = getFirestore(firebaseApp);
    const q = query(
      collection(db, "proposalComments"),
      where("proposalId", "==", id),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ProposalComment)));
    });
    return unsub;
  }, [id]);

  const [showPetitionModal, setShowPetitionModal] = useState(false);

  function handleSigned() {
    setVoted(true);
    setProposal((p) => (p ? { ...p, upvoteCount: p.upvoteCount + 1 } : p));
  }

  async function handleDownload() {
    if (!proposal) return;
    setDownloading(true);
    try {
      await downloadProposalPdf(proposal);
    } catch (err) {
      alert("Couldn't generate the PDF — try again in a moment.");
    } finally {
      setDownloading(false);
    }
  }

  function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: proposal?.title, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copied.");
    }
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || !uid || !id) return;
    const db = getFirestore(firebaseApp);
    await addDoc(collection(db, "proposalComments"), {
      proposalId: id,
      authorId: uid,
      authorName: displayName ?? "Anonymous",
      text: commentText.trim(),
      createdAt: new Date().toISOString(),
    });
    setCommentText("");
  }

  if (proposal === undefined) return <p className="mt-10 text-white/40 text-center">Loading…</p>;
  if (proposal === null) return <p className="mt-10 text-white/60 text-center">Proposal not found.</p>;

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      {proposal.photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={proposal.photoUrl} alt={proposal.title} className="w-full aspect-video object-cover rounded-2xl" />
      )}

      <div className="mt-4">
        <ProposalVoiceRoom proposalId={proposal.id} />
      </div>

      <div className="mt-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{proposal.title}</h1>
          <p className="text-white/40 text-sm mt-1">
            {proposal.areaLabel} · proposed by {proposal.authorName}
          </p>
        </div>
        {proposal.status === "passed" && proposal.passedBadgeLabel && (
          <span className="shrink-0 rounded-full bg-[#00E5C3]/15 border border-[#00E5C3]/40 text-[#00E5C3] text-xs px-3 py-1.5">
            🏅 {proposal.passedBadgeLabel}
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={() => setShowPetitionModal(true)}
          disabled={voted}
          className="rounded-xl border border-white/20 px-5 py-2.5 text-sm hover:border-[#00E5C3]/50 transition-colors disabled:opacity-50"
        >
          ✍️ {voted ? "Signed" : "Sign the petition"} · {proposal.upvoteCount} signed
        </button>
        <button
          onClick={handleShare}
          className="rounded-xl border border-white/20 px-5 py-2.5 text-sm hover:border-[#00E5C3]/50 transition-colors"
        >
          Share to grow support
        </button>
      </div>

      <div className="mt-8 space-y-5">
        <InfoBlock label="The Problem" text={proposal.problem} />
        <InfoBlock label="Who's Affected" text={proposal.whoAffected} />
        <InfoBlock label="Proposed Change" text={proposal.proposedChange} />
        <InfoBlock label="Evidence" text={proposal.evidence} />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          onClick={() => setShowTemplate((s) => !s)}
          className="rounded-xl bg-white/5 border border-white/10 px-5 py-2.5 text-sm hover:border-[#00E5C3]/50 transition-colors"
        >
          {showTemplate ? "Hide full document" : "View full proposal document"}
        </button>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="rounded-xl bg-[#00E5C3]/10 border border-[#00E5C3]/40 text-[#00E5C3] px-5 py-2.5 text-sm hover:bg-[#00E5C3]/15 transition-colors disabled:opacity-50"
        >
          {downloading ? "Preparing PDF…" : "⬇ Download as PDF"}
        </button>
      </div>

      {showTemplate && (
        <div className="mt-6">
          <ProposalTemplate proposal={proposal} />
        </div>
      )}

      <div className="mt-10">
        <h2 className="font-medium">Discussion</h2>
        <div className="mt-3 space-y-3 max-h-96 overflow-y-auto">
          {comments.length === 0 && (
            <p className="text-white/40 text-sm">No comments yet — start the conversation.</p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <p className="text-xs text-white/40">{c.authorName}</p>
              <p className="text-sm text-white/80 mt-1">{c.text}</p>
            </div>
          ))}
        </div>

        {!isMember ? (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-sm text-white/70">Joining the discussion is a member feature.</p>
            <button
              onClick={() => setShowQuickAccount(true)}
              className="mt-2 rounded-lg bg-[#00E5C3] text-[#0E1225] font-medium px-4 py-2 text-sm hover:opacity-90 transition-opacity"
            >
              Create a free account
            </button>
          </div>
        ) : (
          <form onSubmit={handleComment} className="mt-4 flex gap-2">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add to the discussion…"
              className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-lg bg-[#00E5C3] text-[#0E1225] font-medium px-4 py-2 text-sm"
            >
              Post
            </button>
          </form>
        )}
      </div>

      <QuickAccountPrompt open={showQuickAccount} onClose={() => setShowQuickAccount(false)} />
      {id && (
        <PetitionSignModal
          open={showPetitionModal}
          proposalId={id}
          onClose={() => setShowPetitionModal(false)}
          onSigned={handleSigned}
        />
      )}
    </div>
  );
}

function InfoBlock({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-xs text-white/40 uppercase tracking-wide">{label}</p>
      <p className="text-white/80 mt-1 leading-relaxed">{text}</p>
    </div>
  );
}

export default function ProposalProfilePage() {
  return (
    <main className="min-h-screen bg-[#0E1225] text-white">
      <TopNav />
      <Suspense fallback={<p className="mt-10 text-white/40 text-center">Loading…</p>}>
        <ProposalProfile />
      </Suspense>
    </main>
  );
}
