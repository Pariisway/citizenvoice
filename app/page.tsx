import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import TopNav from "@/components/TopNav";
import WeeklyRhythm from "@/components/WeeklyRhythm";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0E1225] text-white">
      <TopNav />

      <section className="px-6 py-24 text-center max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
          Learn how laws are made.
          <br />
          <span className="text-[#00E5C3]">Build your own.</span>
        </h1>

        <p className="mt-6 text-white/60 max-w-xl mx-auto">
          Citizen Voice is where everyday people learn how government
          actually works, understand the laws that affect their community,
          and turn their own ideas into well-supported proposals.
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
          <h2 className="text-xl font-semibold">
            You don't have to be an elected official to change your city.
          </h2>
          <p className="mt-3 text-white/60">
            Most people never learn how a law actually gets written —
            because most sites make it feel like it's not their job. Here,
            it is. Learn the process, then build a community proposal for
            the change you want to see.
          </p>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-semibold text-center">How it works</h2>
          <div className="mt-8 grid sm:grid-cols-5 gap-4 text-sm">
            {[
              { step: "Learn", desc: "Understand how government works." },
              { step: "Track", desc: "Follow bills that affect your community." },
              { step: "Build", desc: "Develop community-backed proposals." },
              { step: "Discuss", desc: "Join moderated voice conversations." },
              { step: "Participate", desc: "Contact reps, attend meetings, organize." },
            ].map((item) => (
              <div key={item.step} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 text-center">
                <p className="text-[#00E5C3] font-medium">{item.step}</p>
                <p className="text-white/50 mt-1 text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-12 border-y border-white/10 bg-white/[0.02]">
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

      <footer className="px-6 py-10 text-center text-sm text-white/30">
        <Link href="/privacy" className="hover:text-white/60">Privacy Policy</Link>
      </footer>
    </main>
  );
}
