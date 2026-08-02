"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { firebaseApp } from "@/lib/firebaseClient";
import { DEFAULT_HOMEPAGE_CONTENT } from "@/lib/defaultHomepageContent";
import type { HomepageContent } from "@/types/siteContent";
import AdSlot from "@/components/AdSlot";
import TopNav from "@/components/TopNav";
import WeeklyRhythm from "@/components/WeeklyRhythm";
import FeaturedVideo from "@/components/FeaturedVideo";

export default function HomePage() {
  const [content, setContent] = useState<HomepageContent>(DEFAULT_HOMEPAGE_CONTENT);

  useEffect(() => {
    const db = getFirestore(firebaseApp);
    getDoc(doc(db, "siteContent", "homepage")).then((snap) => {
      if (snap.exists()) {
        setContent(snap.data() as HomepageContent);
      }
    });
  }, []);

  return (
    <main className="min-h-screen bg-[#0E1225] text-white">
      <TopNav />

      <section className="px-6 pt-16 pb-24 text-center max-w-3xl mx-auto">
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-512.png"
            alt="Citizen Voice"
            className="w-32 h-32 md:w-40 md:h-40 rounded-full"
          />
        </div>

        <h1 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight leading-tight whitespace-pre-line">
          {content.heroHeadline}
        </h1>

        <p className="mt-6 text-white/60 max-w-xl mx-auto">
          {content.heroSubhead}
        </p>

        <div className="mt-10 flex flex-wrap gap-3 justify-center">
          <Link
            href="/academy"
            className="rounded-xl bg-[#00E5C3] text-[#0E1225] font-medium px-6 py-3
                       hover:opacity-90 transition-opacity"
          >
            Start Civic Academy
          </Link>
          <Link
            href="/find-my-representatives"
            className="rounded-xl border border-white/20 text-white px-6 py-3
                       hover:border-[#00E5C3]/60 transition-colors"
          >
            Find My Representatives
          </Link>
        </div>
      </section>

      <section className="px-6 py-12 border-y border-white/10 bg-white/[0.02]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-xl font-semibold">{content.missionTitle}</h2>
          <p className="mt-3 text-white/60">{content.missionBody}</p>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-center">How it works</h2>
          <div className="mt-10 grid sm:grid-cols-5 gap-4">
            {[
              { emoji: "📖", step: "Learn", desc: "Understand how government works." },
              { emoji: "🔍", step: "Track", desc: "Follow bills that affect your community." },
              { emoji: "🛠️", step: "Build", desc: "Develop community-backed proposals." },
              { emoji: "💬", step: "Discuss", desc: "Join moderated voice conversations." },
              { emoji: "🤝", step: "Participate", desc: "Contact reps, attend meetings, organize." },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-8 text-center
                           hover:border-[#00E5C3]/40 transition-colors"
              >
                <span className="text-4xl">{item.emoji}</span>
                <p className="text-[#00E5C3] font-semibold mt-4 text-lg">{item.step}</p>
                <p className="text-white/50 mt-2 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FeaturedVideo />

      {/* Educational sections — real, substantial content, editable from /admin/homepage */}
      <section className="px-6 py-16 border-y border-white/10 bg-white/[0.02]">
        <div className="max-w-2xl mx-auto space-y-12">
          {content.sections.map((section) => (
            <div key={section.id}>
              <h2 className="text-xl font-semibold">{section.title}</h2>
              <p className="mt-3 text-white/70 leading-relaxed">{section.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-12 border-b border-white/10">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-xl font-semibold">Have an idea for your community?</h2>
          <p className="mt-3 text-white/60">
            Anyone can propose a change — a park, a policy, a fix to
            something broken. Complete Civic Academy to unlock the tools to
            build a real, well-supported community proposal.
          </p>
          <Link
            href="/academy"
            className="mt-5 inline-block rounded-xl bg-[#00E5C3] text-[#0E1225] font-medium px-6 py-3
                       hover:opacity-90 transition-opacity"
          >
            Start Learning
          </Link>
        </div>
      </section>

      <WeeklyRhythm />

      <div className="px-6 max-w-2xl mx-auto">
        <AdSlot slot="home-mid" />
      </div>

      {/* FAQ — real content depth, also directly useful to visitors */}
      <section className="px-6 py-16">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold text-center">Frequently Asked Questions</h2>
          <div className="mt-8 space-y-6">
            {content.faq.map((item) => (
              <div key={item.id}>
                <p className="font-medium">{item.question}</p>
                <p className="mt-1.5 text-white/60 text-sm leading-relaxed">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="px-6 py-10 text-center text-sm text-white/30">
        <Link href="/privacy" className="hover:text-white/60">Privacy Policy</Link>
      </footer>
    </main>
  );
}
