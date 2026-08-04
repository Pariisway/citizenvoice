"use client";

// components/PetitionSignModal.tsx
//
// A one-click "upvote" isn't a real petition signature — nothing stops
// duplicate/fake support and there's nothing to hand to a legislator's
// office. This collects a real name + email (address optional) at sign
// time; the Cloud Function (upvoteProposal.ts) stores it alongside the
// vote record so proposals can eventually export an actual signature
// list. Pre-fills name from the site display name, but the signer can
// correct it — this is meant to be their real name, not necessarily
// whatever handle they post under.

import { useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { firebaseApp } from "@/lib/firebaseClient";
import { useAnonymousIdentity } from "@/lib/useAnonymousIdentity";

export default function PetitionSignModal({
  open, proposalId, onClose, onSigned,
}: {
  open: boolean;
  proposalId: string;
  onClose: () => void;
  onSigned: () => void;
}) {
  const { displayName } = useAnonymousIdentity();
  const [fullName, setFullName] = useState(displayName ?? "");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (fullName.trim().length < 2) { setError("Enter your full name."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError("Enter a valid email."); return; }
    setSubmitting(true);
    try {
      const functions = getFunctions(firebaseApp);
      const sign = httpsCallable(functions, "upvoteProposal");
      await sign({ proposalId, fullName: fullName.trim(), email: email.trim(), address: address.trim() || undefined });
      onSigned();
      onClose();
    } catch (err: any) {
      setError(err?.message ?? "Couldn't sign — try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-[#151a33] border border-white/10 p-6"
      >
        <h2 className="text-lg font-semibold">Sign this petition</h2>
        <p className="mt-1.5 text-sm text-white/50">
          Your real name and email — this is what makes it an actual
          signature Citizen Voice can present, not just a click.
        </p>

        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Full legal name"
          className="mt-4 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm"
          autoFocus
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="mt-2 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm"
        />
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Home address (optional — strengthens it as a constituent signature)"
          className="mt-2 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm"
        />

        {error && <p className="mt-3 text-red-300 text-xs">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-5 w-full rounded-xl bg-[#00E5C3] text-[#0E1225] font-medium px-4 py-3 text-sm
                     hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {submitting ? "Signing…" : "Sign the petition"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 w-full text-center text-xs text-white/40 hover:text-white/60"
        >
          Cancel
        </button>
        <p className="mt-3 text-[11px] text-white/30 leading-relaxed">
          Your name and email are only visible to Citizen Voice moderators —
          not shown publicly on the proposal.
        </p>
      </form>
    </div>
  );
}
