// components/ProposalTemplate.tsx
//
// Renders a proposal as a finished, submission-ready document: cover
// page, problem statement, proposed solution (with budget/resources),
// benefits & community support, and a conclusion. Structure follows
// what a citizen-drafted proposal needs before Citizen Voice can pitch
// it to a legislative sponsor (state level) or bring it to a city/county
// meeting (local level) — see ARCHITECTURE.md for the sourcing notes.
//
// Used on /billboard/proposal for the "View Full Template" section, and
// mirrored field-for-field by lib/generateProposalPdf.ts for the
// downloadable PDF, so what someone sees on screen matches what they get.

import type { Proposal } from "@/types/academy";

function formatDate(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default function ProposalTemplate({ proposal }: { proposal: Proposal }) {
  return (
    <div className="bg-white text-[#151823] rounded-2xl overflow-hidden print:rounded-none">
      <div className="px-8 py-10 sm:px-12 sm:py-14 space-y-10">
        {/* Cover page */}
        <div className="text-center border-b border-black/10 pb-8">
          <p className="text-xs tracking-widest uppercase text-black/40">
            Community Proposal · Processed by Citizen Voice
          </p>
          <h1 className="mt-3 text-2xl sm:text-3xl font-semibold leading-snug">{proposal.title}</h1>
          <div className="mt-4 text-sm text-black/60 space-y-0.5">
            <p>Submitted by {proposal.authorName}</p>
            {(proposal.contactEmail || proposal.contactPhone) && (
              <p>{[proposal.contactEmail, proposal.contactPhone].filter(Boolean).join(" · ")}</p>
            )}
            <p>{proposal.areaLabel}</p>
            <p>{formatDate(proposal.createdAt)}</p>
          </div>
        </div>

        {proposal.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={proposal.photoUrl} alt={proposal.title} className="w-full rounded-xl object-cover max-h-72" />
        )}

        <TemplateSection number="1" title="Problem Statement">
          <p>{proposal.problem}</p>
          {proposal.evidence && (
            <>
              <p className="mt-3 text-xs uppercase tracking-wide text-black/40">Supporting evidence</p>
              <p className="mt-1">{proposal.evidence}</p>
            </>
          )}
        </TemplateSection>

        <TemplateSection number="2" title="Proposed Solution">
          <p>{proposal.proposedChange}</p>
          <p className="mt-3 text-xs uppercase tracking-wide text-black/40">Who's affected</p>
          <p className="mt-1">{proposal.whoAffected}</p>

          {(proposal.budgetSummary || proposal.resourcesNeeded) && (
            <div className="mt-5 rounded-xl bg-black/[0.03] px-5 py-4">
              <p className="text-xs uppercase tracking-wide text-black/40">Budget &amp; resources</p>
              {proposal.budgetSummary && <p className="mt-1">{proposal.budgetSummary}</p>}
              {proposal.resourcesNeeded && (
                <p className="mt-2 text-black/70">{proposal.resourcesNeeded}</p>
              )}
            </div>
          )}
        </TemplateSection>

        {proposal.benefits && (
          <TemplateSection number="3" title="Benefits & Community Support">
            <p>{proposal.benefits}</p>
            <div className="mt-4 rounded-xl border border-black/10 px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-sm">✍️ {proposal.upvoteCount} {proposal.upvoteCount === 1 ? "signature" : "signatures"} on this petition</p>
                <p className="text-xs text-black/50 mt-0.5">Community support strengthens the case for this proposal.</p>
              </div>
            </div>
          </TemplateSection>
        )}

        {proposal.conclusion && (
          <TemplateSection number="4" title="Conclusion">
            <p>{proposal.conclusion}</p>
          </TemplateSection>
        )}

        <div className="border-t border-black/10 pt-6 text-xs text-black/40 text-center">
          This proposal was created by a community member and processed on their
          behalf by Citizen Voice. It does not represent an officially filed bill
          or ordinance until a sponsoring legislator or local official takes it up.
        </div>
      </div>
    </div>
  );
}

function TemplateSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-semibold tracking-wide text-black/70">
        <span className="text-black/30 mr-2">{number}.</span>
        {title.toUpperCase()}
      </h2>
      <div className="mt-2 text-[15px] leading-relaxed text-black/85">{children}</div>
    </div>
  );
}
