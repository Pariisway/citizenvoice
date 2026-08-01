import Link from "next/link";
import AdSlot from "@/components/AdSlot";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0E1225] text-white">
      <section className="px-6 py-24 text-center max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
          Know Your Government.
          <br />
          Understand Your Laws.
          <br />
          <span className="text-[#00E5C3]">Strengthen Your Community.</span>
        </h1>

        <p className="mt-6 text-white/60 max-w-xl mx-auto">
          We help citizens understand local government through transparency,
          education, and respectful conversations.
        </p>

        <div className="mt-10 flex flex-wrap gap-3 justify-center">
          <Link
            href="/find-my-representatives"
            className="rounded-xl bg-[#00E5C3] text-[#0E1225] font-medium px-6 py-3
                       hover:opacity-90 transition-opacity"
          >
            Find My Representatives
          </Link>
          <Link
            href="/citizen-chat"
            className="rounded-xl border border-white/20 text-white px-6 py-3
                       hover:border-[#00E5C3]/60 transition-colors"
          >
            Citizen Chat
          </Link>
        </div>
      </section>

      <div className="px-6 max-w-2xl mx-auto">
        <AdSlot slot="home-mid" />
      </div>

      <footer className="px-6 py-10 text-center text-sm text-white/30">
        <Link href="/privacy" className="hover:text-white/60">Privacy Policy</Link>
      </footer>
    </main>
  );
}
