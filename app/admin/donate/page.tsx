"use client";

// app/admin/donate/page.tsx

import { useEffect, useState } from "react";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { firebaseApp } from "@/lib/firebaseClient";
import { DEFAULT_DONATE_CONTENT } from "@/lib/defaultDonateContent";
import type { DonateContent } from "@/types/siteContent";

export default function AdminDonatePage() {
  const [content, setContent] = useState<DonateContent>(DEFAULT_DONATE_CONTENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const db = getFirestore(firebaseApp);
    getDoc(doc(db, "siteContent", "donate")).then((snap) => {
      if (snap.exists()) setContent(snap.data() as DonateContent);
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const db = getFirestore(firebaseApp);
    await setDoc(doc(db, "siteContent", "donate"), {
      ...content,
      updatedAt: new Date().toISOString(),
    });
    setSaving(false);
    setSaved(true);
  }

  if (loading) return <p className="text-white/40 text-sm">Loading…</p>;

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold">Donate Page</h1>
      <p className="text-white/50 mt-1">
        Edit what shows on <span className="text-white/70">/donate</span>. Paste a Stripe
        Payment Link below once you have access to your Stripe account — until then, the
        page shows a "coming soon" message instead of a button.
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <p className="text-xs text-white/40 mb-1.5">Headline</p>
          <input
            value={content.headline}
            onChange={(e) => setContent({ ...content, headline: e.target.value })}
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <p className="text-xs text-white/40 mb-1.5">Body</p>
          <textarea
            value={content.body}
            onChange={(e) => setContent({ ...content, body: e.target.value })}
            rows={8}
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <p className="text-xs text-white/40 mb-1.5">
            Stripe Payment Link (leave blank to show "coming soon")
          </p>
          <input
            value={content.paymentLink ?? ""}
            onChange={(e) => setContent({ ...content, paymentLink: e.target.value })}
            placeholder="https://buy.stripe.com/..."
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-[#00E5C3] text-[#0E1225] font-medium px-5 py-2.5 text-sm disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {saved && <span className="ml-3 text-sm text-white/50">Saved.</span>}
      </div>
    </div>
  );
}
