// lib/generateSignaturesPdf.ts
//
// Admin-only export (proposalUpvotes docs are locked to moderators+ and
// the signer themselves — see firestore.rules). Pulls every real
// signature captured via PetitionSignModal for one proposal and lays
// them out as a plain, printable list: this is the document you'd
// actually hand to a legislator's office or attach to a public-comment
// submission.

import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";
import { firebaseApp } from "@/lib/firebaseClient";
import type { Proposal } from "@/types/academy";

interface SignatureRecord {
  fullName: string;
  email: string;
  address?: string | null;
  createdAt: string;
}

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 48;
const ROW_HEIGHT = 20;

export async function downloadSignaturesPdf(proposal: Proposal): Promise<void> {
  const db = getFirestore(firebaseApp);
  const snap = await getDocs(
    query(collection(db, "proposalUpvotes"), where("proposalId", "==", proposal.id))
  );
  const signatures = snap.docs
    .map((d) => d.data() as SignatureRecord)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  let y = MARGIN;

  function ensureSpace(needed: number) {
    if (y + needed > PAGE_HEIGHT - MARGIN) {
      doc.addPage();
      y = MARGIN;
      drawColumnHeader();
    }
  }

  function drawColumnHeader() {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor("#888888");
    doc.text("NAME", MARGIN, y);
    doc.text("EMAIL", MARGIN + 170, y);
    doc.text("ADDRESS", MARGIN + 340, y);
    doc.text("DATE", PAGE_WIDTH - MARGIN - 60, y);
    doc.setFont("helvetica", "normal");
    y += 8;
    doc.setDrawColor("#dddddd");
    doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
    y += 16;
  }

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor("#0E1225");
  const titleLines = doc.splitTextToSize(`Petition Signatures — ${proposal.title}`, PAGE_WIDTH - MARGIN * 2) as string[];
  for (const line of titleLines) {
    doc.text(line, MARGIN, y);
    y += 20;
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor("#555555");
  doc.text(`${proposal.areaLabel} · ${signatures.length} signature${signatures.length === 1 ? "" : "s"} · generated ${new Date().toLocaleDateString("en-US")}`, MARGIN, y);
  y += 24;

  drawColumnHeader();

  doc.setFontSize(9.5);
  doc.setTextColor("#1a1a2e");
  for (const sig of signatures) {
    ensureSpace(ROW_HEIGHT);
    const date = new Date(sig.createdAt).toLocaleDateString("en-US");
    doc.text(truncate(sig.fullName, 32), MARGIN, y);
    doc.text(truncate(sig.email, 34), MARGIN + 170, y);
    doc.text(truncate(sig.address || "—", 28), MARGIN + 340, y);
    doc.text(date, PAGE_WIDTH - MARGIN - 60, y);
    y += ROW_HEIGHT;
  }

  if (signatures.length === 0) {
    doc.setTextColor("#999999");
    doc.text("No signatures yet.", MARGIN, y);
  }

  const filenameSafe = proposal.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50) || "proposal";
  doc.save(`${filenameSafe}-signatures.pdf`);
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}
