"use client";

import { useState } from "react";
import Link from "next/link";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/academy", label: "Civic Academy", icon: "📖" },
  { href: "/find-my-representatives", label: "Find My Representatives", icon: "🏛️" },
  { href: "/citizen-chat", label: "Citizen Chat", icon: "🎥" },
];

export default function TopNav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="border-b border-white/10 px-6 py-4 relative">
      <div className="max-w-5xl mx-auto grid grid-cols-[auto_1fr_auto] sm:grid-cols-3 items-center">
        <Link href="/" className="font-semibold text-lg text-white hover:text-[#00E5C3] transition-colors justify-self-start">
          Citizen Voice
        </Link>

        {/* Desktop links — centered */}
        <div className="hidden sm:flex items-center justify-center gap-8">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 text-base text-white/70 hover:text-[#00E5C3] transition-colors"
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden sm:block" />

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="sm:hidden justify-self-end text-white/70 text-xl"
          aria-label="Toggle menu"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="sm:hidden mt-4 flex flex-col gap-4 text-base">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 text-white/80 hover:text-[#00E5C3] transition-colors"
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
