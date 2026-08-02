"use client";

// app/admin/homepage/page.tsx

import { useEffect, useState } from "react";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { firebaseApp } from "@/lib/firebaseClient";
import { DEFAULT_HOMEPAGE_CONTENT } from "@/lib/defaultHomepageContent";
import type { HomepageContent, ContentSection, FaqItem } from "@/types/siteContent";

function newId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function AdminHomepagePage() {
  const [content, setContent] = useState<HomepageContent>(DEFAULT_HOMEPAGE_CONTENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const db = getFirestore(firebaseApp);
    getDoc(doc(db, "siteContent", "homepage")).then((snap) => {
      if (snap.exists()) setContent(snap.data() as HomepageContent);
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const db = getFirestore(firebaseApp);
    await setDoc(doc(db, "siteContent", "homepage"), {
      ...content,
      updatedAt: new Date().toISOString(),
    });
    setSaving(false);
    setSaved(true);
  }

  function updateField<K extends keyof HomepageContent>(key: K, value: HomepageContent[K]) {
    setContent((c) => ({ ...c, [key]: value }));
  }

  function updateSection(id: string, patch: Partial<ContentSection>) {
    updateField("sections", content.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }
  function addSection() {
    updateField("sections", [...content.sections, { id: newId(), title: "", body: "" }]);
  }
  function removeSection(id: string) {
    updateField("sections", content.sections.filter((s) => s.id !== id));
  }

  function updateFaq(id: string, patch: Partial<FaqItem>) {
    updateField("faq", content.faq.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }
  function addFaq() {
    updateField("faq", [...content.faq, { id: newId(), question: "", answer: "" }]);
  }
  function removeFaq(id: string) {
    updateField("faq", content.faq.filter((f) => f.id !== id));
  }

  if (loading) return <p className="text-white/40">Loading…</p>;

  return (
    <div className="max-w-2xl pb-24">
      <h1 className="text-2xl font-semibold">Homepage Content</h1>
      <p className="text-white/50 mt-1">
        Changes go live immediately — no rebuild or redeploy needed.
      </p>

      <SectionBlock title="Hero">
        <Field label="Headline">
          <textarea
            value={content.heroHeadline}
            onChange={(e) => updateField("heroHeadline", e.target.value)}
            rows={2}
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2"
          />
        </Field>
        <Field label="Subheadline">
          <textarea
            value={content.heroSubhead}
            onChange={(e) => updateField("heroSubhead", e.target.value)}
            rows={3}
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2"
          />
        </Field>
      </SectionBlock>

      <SectionBlock title="Mission statement">
        <Field label="Title">
          <input
            value={content.missionTitle}
            onChange={(e) => updateField("missionTitle", e.target.value)}
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2"
          />
        </Field>
        <Field label="Body">
          <textarea
            value={content.missionBody}
            onChange={(e) => updateField("missionBody", e.target.value)}
            rows={3}
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2"
          />
        </Field>
      </SectionBlock>

      <SectionBlock title="Educational sections">
        <div className="space-y-4">
          {content.sections.map((section) => (
            <div key={section.id} className="rounded-xl border border-white/10 p-4 space-y-2">
              <input
                value={section.title}
                onChange={(e) => updateSection(section.id, { title: e.target.value })}
                placeholder="Section title"
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 font-medium"
              />
              <textarea
                value={section.body}
                onChange={(e) => updateSection(section.id, { body: e.target.value })}
                rows={5}
                placeholder="Section body"
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm"
              />
              <button
                onClick={() => removeSection(section.id)}
                className="text-xs text-red-300/70 hover:text-red-300"
              >
                Remove section
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addSection}
          className="mt-3 text-sm text-[#00E5C3] hover:opacity-80"
        >
          + Add section
        </button>
      </SectionBlock>

      <SectionBlock title="FAQ">
        <div className="space-y-4">
          {content.faq.map((item) => (
            <div key={item.id} className="rounded-xl border border-white/10 p-4 space-y-2">
              <input
                value={item.question}
                onChange={(e) => updateFaq(item.id, { question: e.target.value })}
                placeholder="Question"
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 font-medium"
              />
              <textarea
                value={item.answer}
                onChange={(e) => updateFaq(item.id, { answer: e.target.value })}
                rows={3}
                placeholder="Answer"
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm"
              />
              <button
                onClick={() => removeFaq(item.id)}
                className="text-xs text-red-300/70 hover:text-red-300"
              >
                Remove FAQ item
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addFaq}
          className="mt-3 text-sm text-[#00E5C3] hover:opacity-80"
        >
          + Add FAQ item
        </button>
      </SectionBlock>

      <div className="fixed bottom-0 left-0 right-0 bg-[#0E1225] border-t border-white/10 px-6 py-4 flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-[#00E5C3] text-[#0E1225] font-medium px-6 py-2.5
                     hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        {saved && <span className="text-[#00E5C3] text-sm">Saved — live now.</span>}
      </div>
    </div>
  );
}

function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <h2 className="font-medium text-white/80">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm text-white/60">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
