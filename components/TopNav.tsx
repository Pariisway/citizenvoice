import Link from "next/link";

export default function TopNav() {
  return (
    <nav className="border-b border-white/10 px-6 py-4">
      <div className="max-w-5xl mx-auto flex items-center gap-6 text-sm">
        <Link href="/" className="font-medium text-white hover:text-[#00E5C3] transition-colors">
          Citizen Voice
        </Link>
        <Link href="/find-my-representatives" className="text-white/60 hover:text-[#00E5C3] transition-colors">
          Find My Representatives
        </Link>
        <Link href="/citizen-chat" className="text-white/60 hover:text-[#00E5C3] transition-colors">
          Citizen Chat
        </Link>
        <Link href="/privacy" className="ml-auto text-white/40 hover:text-white/70 transition-colors">
          Privacy
        </Link>
      </div>
    </nav>
  );
}
