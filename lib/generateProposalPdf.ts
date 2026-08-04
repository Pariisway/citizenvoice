// lib/generateProposalPdf.ts
//
// Builds a downloadable PDF of a proposal, mirroring the on-screen
// structure in components/ProposalTemplate.tsx: cover page, problem
// statement, proposed solution + budget, benefits & community support,
// conclusion. Uses jsPDF directly (text drawn programmatically) rather
// than rasterizing the DOM, so the result is crisp, selectable, and
// small — no font/canvas-scaling issues to fight.
//
// Requires the "jspdf" package — add it with:
//   npm install jspdf

import type { Proposal } from "@/types/academy";

const PAGE_WIDTH = 612; // 8.5in letter, points
const PAGE_HEIGHT = 792; // 11in letter, points
const MARGIN = 56;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function formatDate(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export async function downloadProposalPdf(proposal: Proposal): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "letter" });

  let y = MARGIN;

  function ensureSpace(needed: number) {
    if (y + needed > PAGE_HEIGHT - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  }

  function writeParagraph(text: string, size = 11, lineHeight = 15, color = "#1a1a2e") {
    doc.setFontSize(size);
    doc.setTextColor(color);
    const lines = doc.splitTextToSize(text, CONTENT_WIDTH) as string[];
    for (const line of lines) {
      ensureSpace(lineHeight);
      doc.text(line, MARGIN, y);
      y += lineHeight;
    }
  }

  function writeSectionHeading(number: string, title: string) {
    ensureSpace(30);
    y += 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor("#0E1225");
    doc.text(`${number}. ${title.toUpperCase()}`, MARGIN, y);
    doc.setFont("helvetica", "normal");
    y += 8;
    doc.setDrawColor("#dddddd");
    doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
    y += 16;
  }

  // ---- Cover ----
  doc.setFontSize(9);
  doc.setTextColor("#888888");
  doc.text("COMMUNITY PROPOSAL · PROCESSED BY CITIZEN VOICE", MARGIN, y, { align: "left" });
  y += 26;

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor("#0E1225");
  const titleLines = doc.splitTextToSize(proposal.title, CONTENT_WIDTH) as string[];
  for (const line of titleLines) {
    doc.text(line, MARGIN, y);
    y += 24;
  }
  doc.setFont("helvetica", "normal");
  y += 6;

  doc.setFontSize(10.5);
  doc.setTextColor("#555555");
  const contactLine = [proposal.contactEmail, proposal.contactPhone].filter(Boolean).join("  ·  ");
  const coverLines = [
    `Submitted by ${proposal.authorName}`,
    contactLine || null,
    proposal.areaLabel,
    formatDate(proposal.createdAt),
  ].filter(Boolean) as string[];
  for (const line of coverLines) {
    doc.text(line, MARGIN, y);
    y += 15;
  }
  y += 10;
  doc.setDrawColor("#0E1225");
  doc.setLineWidth(1.2);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  doc.setLineWidth(1);
  y += 24;

  // ---- 1. Problem Statement ----
  writeSectionHeading("1", "Problem Statement");
  writeParagraph(proposal.problem);
  if (proposal.evidence) {
    y += 6;
    writeParagraph("Supporting evidence", 9.5, 13, "#888888");
    writeParagraph(proposal.evidence);
  }

  // ---- 2. Proposed Solution ----
  writeSectionHeading("2", "Proposed Solution");
  writeParagraph(proposal.proposedChange);
  y += 6;
  writeParagraph("Who's affected", 9.5, 13, "#888888");
  writeParagraph(proposal.whoAffected);
  if (proposal.budgetSummary || proposal.resourcesNeeded) {
    y += 6;
    writeParagraph("Budget & resources", 9.5, 13, "#888888");
    if (proposal.budgetSummary) writeParagraph(proposal.budgetSummary);
    if (proposal.resourcesNeeded) writeParagraph(proposal.resourcesNeeded);
  }

  // ---- 3. Benefits & Community Support ----
  if (proposal.benefits) {
    writeSectionHeading("3", "Benefits & Community Support");
    writeParagraph(proposal.benefits);
    y += 4;
    writeParagraph(
      `${proposal.upvoteCount} ${proposal.upvoteCount === 1 ? "signature" : "signatures"} on this petition as of the date of this document.`,
      10, 14, "#0E1225"
    );
  }

  // ---- 4. Conclusion ----
  if (proposal.conclusion) {
    writeSectionHeading("4", "Conclusion");
    writeParagraph(proposal.conclusion);
  }

  // ---- Footer note ----
  ensureSpace(40);
  y += 20;
  doc.setDrawColor("#dddddd");
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  y += 16;
  writeParagraph(
    "This proposal was created by a community member and processed on their behalf by " +
    "Citizen Voice. It does not represent an officially filed bill or ordinance until a " +
    "sponsoring legislator or local official takes it up.",
    8.5, 12, "#999999"
  );

  const filenameSafe = proposal.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60) || "proposal";
  doc.save(`${filenameSafe}.pdf`);
}
