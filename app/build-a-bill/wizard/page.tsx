"use client";

// app/build-a-bill/wizard/page.tsx
//
// Single page, step index in state — simpler than a route per step, and
// avoids yet another query-string route. Submits to submitProposal
// (Cloud Function), which is where payment verification will be added
// later without needing to change this UI.
//
// Step structure follows the finished document shape (see
// components/ProposalTemplate.tsx and ARCHITECTURE.md): cover page,
// problem statement, proposed solution + budget, benefits/community
// support, conclusion. Kept short by design — one clear question per
// step, not a form dump.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { firebaseApp } from "@/lib/firebaseClient";
import { useAnonymousIdentity } from "@/lib/useAnonymousIdentity";
import { useAcademyCompletion } from "@/lib/useAcademyCompletion";
import TopNav from "@/components/TopNav";

const STEPS = [
  "cover", "problem", "evidence", "area", "who", "change",
  "budget", "benefits", "conclusion", "photo", "review",
] as const;
type Step = typeof STEPS[number];

const STEP_LABELS: Record<Step, string> = {
  cover: "Cover Page",
  problem: "Problem Statement",
  evidence: "Problem Statement",
  area: "Cover Page",
  who: "Proposed Solution",
  change: "Proposed Solution",
  budget: "Budget & Resources",
  benefits: "Benefits & Community Support",
  conclusion: "Conclusion",
  photo: "Photo",
  review: "Review",
};

export default function WizardPage() {
  const router = useRouter();
  const { displayName } = useAnonymousIdentity();
  const { loading } = useAcademyCompletion();

  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState({
    title: "",
    contactEmail: "",
    contactPhone: "",
    problem: "",
    evidence: "",
    areaLabel: "",
    whoAffected: "",
    proposedChange: "",
    budgetSummary: "",
    resourcesNeeded: "",
    benefits: "",
    conclusion: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step: Step = STEPS[stepIndex];

  const REQUIRED_STEPS: Partial<Record<Step, (keyof typeof form)[]>> = {
    cover: ["title", "contactEmail"],
    problem: ["problem"],
    area: ["areaLabel"],
    who: ["whoAffected"],
    change: ["proposedChange"],
    budget: ["budgetSummary"],
    benefits: ["benefits"],
    conclusion: ["conclusion"],
  };
  const requiredFields = REQUIRED_STEPS[step];
  const canAdvance = !requiredFields || requiredFields.every((f) => form[f].trim().length > 0);

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
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone || undefined,
        budgetSummary: form.budgetSummary,
        resourcesNeeded: form.resourcesNeeded || undefined,
        benefits: form.benefits,
        conclusion: form.conclusion,
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
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-white/40">
            {STEP_LABELS[step]} · Step {stepIndex + 1} of {STEPS.length}
          </p>
          <button
            type="button"
            onClick={() => {
              const hasProgress = Object.values(form).some((v) => v.trim().length > 0) || !!photoFile;
              if (!hasProgress || window.confirm("Discard this proposal and go back? Nothing you've entered will be saved.")) {
                router.push("/build-a-bill");
              }
            }}
            className="text-xs text-white/40 hover:text-red-300 transition-colors"
          >
            Cancel
          </button>
        </div>

        <div className="mt-6">
          {step === "cover" && (
            <StepBlock title="Give it a title" hint="This is what appears at the top of the finished proposal — short and specific.">
              <input
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="e.g. Add a crosswalk at 5th & Main"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3"
                autoFocus
              />
              <p className="mt-4 text-xs text-white/40">
                Contact info — so Citizen Voice (and a legislator's office, if this moves forward) can reach you.
              </p>
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) => update("contactEmail", e.target.value)}
                placeholder="Email address"
                className="mt-2 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3"
              />
              <input
                type="tel"
                value={form.contactPhone}
                onChange={(e) => update("contactPhone", e.target.value)}
                placeholder="Phone number (optional)"
                className="mt-2 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3"
              />
              <p className="mt-2 text-xs text-white/40">
                Your name ({displayName ?? "not set yet"}) and today's date get added automatically when you submit.
              </p>
            </StepBlock>
          )}

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

          {step === "evidence" && (
            <StepBlock title="What evidence backs this up?" hint="Facts, data, statistics — this is what makes a problem statement credible.">
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
            <StepBlock title="What should actually change?" hint="This is your proposed solution — not just what's wrong, what you want done about it.">
              <textarea
                value={form.proposedChange}
                onChange={(e) => update("proposedChange", e.target.value)}
                rows={4}
                placeholder="Be specific about the fix you're proposing."
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3"
                autoFocus
              />
            </StepBlock>
          )}

          {step === "budget" && (
            <StepBlock title="What will it cost, and who pays?" hint="A rough estimate is fine — this is what shows you've thought it through.">
              <textarea
                value={form.budgetSummary}
                onChange={(e) => update("budgetSummary", e.target.value)}
                rows={3}
                placeholder="e.g. Estimated $15,000 for signage and paint, funded through the city's existing traffic-safety budget."
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3"
                autoFocus
              />
              <p className="mt-4 text-xs text-white/40">Resources needed (optional)</p>
              <textarea
                value={form.resourcesNeeded}
                onChange={(e) => update("resourcesNeeded", e.target.value)}
                rows={2}
                placeholder="Staff time, permits, land, equipment — anything beyond money."
                className="mt-2 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3"
              />
            </StepBlock>
          )}

          {step === "benefits" && (
            <StepBlock title="Who benefits, and how?" hint="This is the case for community support — keep it concrete.">
              <textarea
                value={form.benefits}
                onChange={(e) => update("benefits", e.target.value)}
                rows={4}
                placeholder="e.g. Safer street crossing for the 200+ students who walk to Lincoln Elementary every day."
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3"
                autoFocus
              />
              <p className="mt-2 text-xs text-white/40">
                Once this is posted, a petition and share link get added automatically so supporters can back it.
              </p>
            </StepBlock>
          )}

          {step === "conclusion" && (
            <StepBlock title="Wrap it up" hint="2-3 sentences: the problem, the solution, and exactly what you're asking for.">
              <textarea
                value={form.conclusion}
                onChange={(e) => update("conclusion", e.target.value)}
                rows={4}
                placeholder="e.g. Kids crossing 5th & Main have no marked crosswalk and it's caused two near-misses this year. Adding a crosswalk and signage would fix this at low cost. We're asking the city to approve installation this budget cycle."
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
                <ReviewRow label="Title" value={form.title} />
                <ReviewRow label="Contact" value={[form.contactEmail, form.contactPhone].filter(Boolean).join(" · ")} />
                <ReviewRow label="Problem" value={form.problem} />
                <ReviewRow label="Evidence" value={form.evidence} />
                <ReviewRow label="Area" value={form.areaLabel} />
                <ReviewRow label="Who's affected" value={form.whoAffected} />
                <ReviewRow label="Proposed change" value={form.proposedChange} />
                <ReviewRow label="Budget & resources" value={[form.budgetSummary, form.resourcesNeeded].filter(Boolean).join(" — ")} />
                <ReviewRow label="Benefits" value={form.benefits} />
                <ReviewRow label="Conclusion" value={form.conclusion} />
              </div>
              <p className="mt-4 text-xs text-white/40">
                This goes to our team for a quick review before it's posted publicly on
                the Community Billboard. Once approved, you'll be able to view and
                download the finished document from your dashboard.
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
                disabled={!canAdvance}
                className="rounded-xl bg-[#00E5C3] text-[#0E1225] font-medium px-6 py-3
                           hover:opacity-90 transition-opacity disabled:opacity-40"
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

function StepBlock({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <h1 className="text-xl font-semibold">{title}</h1>
      {hint && <p className="mt-1.5 text-sm text-white/40">{hint}</p>}
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
