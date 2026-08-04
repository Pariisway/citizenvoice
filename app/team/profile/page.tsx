"use client";

// app/team/profile/page.tsx
// Query-string route (static export) — detail view for one team member.

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { firebaseApp } from "@/lib/firebaseClient";
import TopNav from "@/components/TopNav";
import type { TeamMember } from "@/components/TeamCards";

const ROLE_LABEL: Record<string, string> = {
  administrator: "Administrator",
  moderator: "Moderator",
  community_leader: "Community Leader",
};

function TeamProfile() {
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid");
  const [member, setMember] = useState<TeamMember | null | undefined>(undefined);

  useEffect(() => {
    if (!uid) { setMember(null); return; }
    const db = getFirestore(firebaseApp);
    (async () => {
      const [userSnap, profileSnap] = await Promise.all([
        getDoc(doc(db, "users", uid)),
        getDoc(doc(db, "anonymousProfiles", uid)),
      ]);
      if (!userSnap.exists()) { setMember(null); return; }
      const data = userSnap.data();
      const profile = profileSnap.data();
      setMember({
        uid,
        role: data.role,
        title: data.title,
        bio: data.bio,
        displayName: profile?.displayName ?? "Team Member",
        photoUrl: profile?.photoUrl,
      });
    })();
  }, [uid]);

  if (member === undefined) return <p className="mt-10 text-white/40 text-center">Loading…</p>;
  if (member === null) return <p className="mt-10 text-white/60 text-center">This profile isn't available.</p>;

  const initial = member.displayName.trim()[0]?.toUpperCase() ?? "?";

  return (
    <div className="max-w-xl mx-auto px-6 py-16 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {member.photoUrl ? (
        <img src={member.photoUrl} alt={member.displayName} className="w-24 h-24 mx-auto rounded-full object-cover border border-white/10" />
      ) : (
        <div className="w-24 h-24 mx-auto rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-2xl font-semibold text-white/60">
          {initial}
        </div>
      )}
      <h1 className="mt-4 text-2xl font-semibold">{member.displayName}</h1>
      <p className="mt-1 text-[#00E5C3]">{member.title || ROLE_LABEL[member.role] || member.role}</p>
      {member.bio && <p className="mt-4 text-white/60 leading-relaxed">{member.bio}</p>}
    </div>
  );
}

export default function TeamProfilePage() {
  return (
    <main className="min-h-screen bg-[#0E1225] text-white">
      <TopNav />
      <Suspense fallback={<p className="mt-10 text-white/40 text-center">Loading…</p>}>
        <TeamProfile />
      </Suspense>
    </main>
  );
}
