"use client";

// app/build-a-bill/wizard/page.tsx
//
// Single page, step index in state — simpler than a route per step, and
// avoids yet another query-string route. Submits to submitProposal
// (Cloud Function), which is where payment verification will be added
// later without needing to change this UI.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { firebaseApp } from "@/lib/firebaseClient";
import { useAnonymousIdentity } from "@/lib/useAnonymousIdentity";
import { useAcademyCompletion } from "@/lib/useAcademyCompletion";
import TopNav from "@/components/TopNav";

const STEPS = ["problem", "area", "who", "change", "evidence", "photo", "review"] as const;
type Step = typeof STEPS[number];

export default function WizardPage() {
  const router = useRouter();
  const { displayName } = useAnonymousIdentity();
  const { loading, isComplete } = useAcademyCompletion();

  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState({
    title: "",
    problem: "",
    areaLabel: "",
    whoAffected: "",
    proposedChange: "",
    evidence: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step: Step = STEPS[stepIndex];

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function next() {
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }
  function back() {
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      let photoUrl: string | undefined;
      if (photoFile) {
        const storage = getStorage(firebaseApp);
        const path = `proposal-photos/${Date.now()}_${photoFile.name}`;
        const storageRef = ref(storage, path);
        const task = uploadBytesResumable(storageRef, photoFile);
        await new Promise<void>((resolve, reject) => {
          task.on("state_changed", undefined, reject, () => resolve());
        });
        photoUrl = await getDownloadURL(task.snapshot.ref);
      }

      const functions = getFunctions(firebaseApp);
      const submit = httpsCallable(functions, "submitProposal");
      await submit({
        title: form.title || form.problem.slice(0, 60),
        problem: form.problem,
        areaLabel: form.areaLabel,
        whoAffected: form.whoAffected,
        proposedChange: form.proposedChange,
        evidence: form.evidence,
        photoUrl,
        authorName: displayName ?? "Anonymous",
      });

      router.push("/build-a-bill/success");
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong submitting your proposal.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0E1225] text-white">
        <TopNav />
        <p className="text-center mt-10 text-white/40">Loading…</p>
      </main>
    );
  }

  if (!isComplete) {
    return (
      <main className="min-h-screen bg-[#0E1225] text-white">
        <TopNav />
        <div className="max-w-xl mx-auto px-6 py-16 text-center">
          <p className="text-white/60">Finish Civic Academy to unlock this.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0E1225] text-white">
      <TopNav />
      <div className="max-w-xl mx-auto px-6 py-16">
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-[#00E5C3] transition-all"
            style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-white/40">Step {stepIndex + 1} of {STEPS.length}</p>

        <div className="mt-6">
          {step === "problem" && (
            <StepBlock title="What's the problem?">
              <textarea
                value={form.problem}
                onChange={(e) => update("problem", e.target.value)}
                rows={4}
                placeholder="Describe it in a sentence or two — be specific."
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3"
                autoFocus
              />
            </StepBlock>
          )}

          {step === "area" && (
            <StepBlock title="Where does this happen?">
              <input
                value={form.areaLabel}
                onChange={(e) => update("areaLabel", e.target.value)}
                placeholder="e.g. Fairview Heights, IL"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3"
                autoFocus
              />
              <p className="mt-2 text-xs text-white/40">
                Your proposal will only be listed under this area.
              </p>
            </StepBlock>
          )}

          {step === "who" && (
            <StepBlock title="Who's affected, and how?">
              <textarea
                value={form.whoAffected}
                onChange={(e) => update("whoAffected", e.target.value)}
                rows={4}
                placeholder="Residents of a specific block? Parents at a school? Be concrete."
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3"
                autoFocus
              />
            </StepBlock>
          )}

          {step === "change" && (
            <StepBlock title="What should actually change?">
              <textarea
                value={form.proposedChange}
                onChange={(e) => update("proposedChange", e.target.value)}
                rows={4}
                placeholder="Not just what's wrong — what you want done about it."
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3"
                autoFocus
              />
            </StepBlock>
          )}

          {step === "evidence" && (
            <StepBlock title="What evidence backs this up?">
              <textarea
                value={form.evidence}
                onChange={(e) => update("evidence", e.target.value)}
                rows={4}
                placeholder="Numbers, examples, incidents, comparisons to other cities — whatever you've got."
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3"
                autoFocus
              />
            </StepBlock>
          )}

          {step === "photo" && (
            <StepBlock title="Add a photo (optional)">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-white/70"
              />
            </StepBlock>
          )}

          {step === "review" && (
            <StepBlock title="Review before you submit">
              <div className="space-y-3 text-sm">
                <ReviewRow label="Problem" value={form.problem} />
                <ReviewRow label="Area" value={form.areaLabel} />
                <ReviewRow label="Who's affected" value={form.whoAffected} />
                <ReviewRow label="Proposed change" value={form.proposedChange} />
                <ReviewRow label="Evidence" value={form.evidence} />
              </div>
              <p className="mt-4 text-xs text-white/40">
                This goes to our team for a quick review before it's posted
                publicly on the Community Billboard.
              </p>
            </StepBlock>
          )}

          {error && <p className="mt-4 text-red-300 text-sm">{error}</p>}

          <div className="mt-8 flex justify-between">
            <button
              onClick={back}
              disabled={stepIndex === 0}
              className="text-white/50 hover:text-white/80 disabled:opacity-0 text-sm"
            >
              ← Back
            </button>

            {step === "review" ? (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-xl bg-[#00E5C3] text-[#0E1225] font-medium px-6 py-3
                           hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {submitting ? "Submitting…" : "Submit for review"}
              </button>
            ) : (
              <button
                onClick={next}
                className="rounded-xl bg-[#00E5C3] text-[#0E1225] font-medium px-6 py-3
                           hover:opacity-90 transition-opacity"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function StepBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h1 className="text-xl font-semibold">{title}</h1>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-white/40 text-xs">{label}</p>
      <p className="text-white/80 mt-0.5">{value || "—"}</p>
    </div>
  );
}
