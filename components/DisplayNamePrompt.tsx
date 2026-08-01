"use client";

// components/DisplayNamePrompt.tsx
//
// Drop this wherever a user is about to post/speak for the first time
// (comment box, "raise hand" button, question form). It renders nothing
// once a name is set — no modal, no interruption on later visits.

import { useState } from "react";
import { useAnonymousIdentity } from "@/lib/useAnonymousIdentity";

export default function DisplayNamePrompt({
  onReady,
}: {
  onReady?: () => void;
}) {
  const { needsName, setDisplayName, ready } = useAnonymousIdentity();
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!ready || !needsName) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    setSubmitting(true);
    await setDisplayName(value);
    setSubmitting(false);
    onReady?.();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 flex gap-2 items-center"
    >
      <span className="text-sm text-white/60 whitespace-nowrap">
        Pick a name to post or speak —
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={40}
        placeholder="e.g. Fairview Resident"
        className="flex-1 min-w-0 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm"
      />
      <button
        type="submit"
        disabled={submitting || !value.trim()}
        className="text-sm rounded-lg bg-[#00E5C3] text-[#0E1225] font-medium px-4 py-1.5
                   hover:opacity-90 transition-opacity disabled:opacity-40 whitespace-nowrap"
      >
        Continue
      </button>
    </form>
  );
}
