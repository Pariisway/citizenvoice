"use client";

// app/team/page.tsx
// Public directory of moderators/community leaders/administrators —
// lets visitors put a face to who's running Citizen Voice.

import TopNav from "@/components/TopNav";
import { TeamCard, useTeamMembers } from "@/components/TeamCards";

export default function TeamPage() {
  const members = useTeamMembers();

  return (
    <main className="min-h-screen bg-[#0E1225] text-white">
      <TopNav />
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Meet the Team</h1>
        <p className="mt-2 text-white/60">
          The moderators, community leaders, and administrators who keep Citizen Voice running.
        </p>

        {members === null && <p className="mt-10 text-white/40 text-sm">Loading…</p>}
        {members !== null && members.length === 0 && (
          <p className="mt-10 text-white/50">No team members listed yet.</p>
        )}

        <div className="mt-8 grid sm:grid-cols-2 gap-3">
          {members?.map((m) => <TeamCard key={m.uid} member={m} />)}
        </div>
      </div>
    </main>
  );
}
