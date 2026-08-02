"use client";

import { useState } from "react";
import Link from "next/link";

const LINKS = [
  { href: "/academy", label: "Civic Academy" },
  { href: "/find-my-representatives", label: "Find My Representatives" },
  { href: "/citizen-chat", label: "Citizen Chat" },
];

export default function TopNav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="border-b border-white/10 px-6 py-4 relative">
      <div className="max-w-5xl mx-auto flex items-center gap-6 text-sm">
        <Link href="/" className="font-medium text-white hover:text-[#00E5C3] transition-colors">
          Citizen Voice
        </Link>

        {/* Desktop links */}
        <div className="hidden sm:flex items-center gap-6">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-white/60 hover:text-[#00E5C3] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <Link
          href="/privacy"
          className="hidden sm:block ml-auto text-white/40 hover:text-white/70 transition-colors"
        >
          Privacy
        </Link>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="sm:hidden ml-auto text-white/70"
          aria-label="Toggle menu"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="sm:hidden mt-4 flex flex-col gap-4 text-sm">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-white/70 hover:text-[#00E5C3] transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/privacy"
            onClick={() => setOpen(false)}
            className="text-white/40 hover:text-white/70 transition-colors"
          >
            Privacy
          </Link>
        </div>
      )}
    </nav>
  );
}
