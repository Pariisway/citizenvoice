"use client";

import Link from "next/link";
import TopNav from "@/components/TopNav";

export default function WizardSuccessPage() {
  return (
    <main className="min-h-screen bg-[#0E1225] text-white">
      <TopNav />
      <div className="max-w-md mx-auto px-6 py-16 text-center">
        <p className="text-4xl">🎉</p>
        <h1 className="text-2xl font-semibold mt-4">Submitted</h1>
        <p className="mt-3 text-white/60">
          Your proposal is with our team for a quick review. Once approved,
          it'll go live on the Community Billboard.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded-xl bg-[#00E5C3] text-[#0E1225] font-medium px-6 py-3
                     hover:opacity-90 transition-opacity"
        >
          Back to Dashboard
        </Link>
      </div>
    </main>
  );
}
