"use client";

// app/donate/page.tsx

import { useEffect, useState } from "react";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { firebaseApp } from "@/lib/firebaseClient";
import { DEFAULT_DONATE_CONTENT } from "@/lib/defaultDonateContent";
import type { DonateContent } from "@/types/siteContent";
import TopNav from "@/components/TopNav";

export default function DonatePage() {
  const [content, setContent] = useState<DonateContent>(DEFAULT_DONATE_CONTENT);

  useEffect(() => {
    const db = getFirestore(firebaseApp);
    getDoc(doc(db, "siteContent", "donate")).then((snap) => {
      if (snap.exists()) setContent(snap.data() as DonateContent);
    });
  }, []);

  const hasLink = !!content.paymentLink?.trim();

  return (
    <main className="min-h-screen bg-[#0E1225] text-white">
      <TopNav />
      <div className="max-w-xl mx-auto px-6 py-16 text-center">
        <span className="text-4xl">💛</span>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">{content.headline}</h1>
        <p className="mt-6 text-white/70 leading-relaxed whitespace-pre-line text-left">
          {content.body}
        </p>

        {hasLink ? (
          <a
            href={content.paymentLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-block rounded-xl bg-[#00E5C3] text-[#0E1225] font-medium px-8 py-3.5
                       hover:opacity-90 transition-opacity"
          >
            Donate
          </a>
        ) : (
          <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-5">
            <p className="text-white/60 text-sm">
              We're finishing setup on secure payments — check back soon.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
