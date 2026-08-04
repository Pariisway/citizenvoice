"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/billboard", label: "Billboard", icon: "📜" },
  { href: "/community-chat", label: "Community", icon: "💬" },
  { href: "/academy", label: "Academy", icon: "📖" },
  { href: "/find-my-representatives", label: "Find Reps", icon: "🏛️" },
  { href: "/dashboard", label: "Dashboard", icon: "👤" },
];

export default function TopNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="border-b border-white/10 px-6 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-center">
        {/* Desktop links */}
        <div className="hidden sm:flex items-center gap-1 rounded-full bg-white/[0.03] border border-white/10 px-1.5 py-1.5">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
                  active
                    ? "bg-[#00E5C3] text-[#0E1225]"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <span className="text-base">{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="sm:hidden ml-auto text-white/70 text-xl"
          aria-label="Toggle menu"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="sm:hidden mt-4 flex flex-col gap-1">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-base transition-colors ${
                  active ? "bg-[#00E5C3] text-[#0E1225] font-medium" : "text-white/80 hover:bg-white/5"
                }`}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
