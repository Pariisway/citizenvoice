"use client";

// components/TeamCards.tsx
//
// Shows the site's staff (moderators, community leaders, administrators)
// as clickable profile cards — on the full /team directory and as a
// preview section on every member's dashboard, so people can put a face
// to who's actually running things.
//
// `users/{uid}` holds role/title/bio (staff-only — regular members never
// get a `users` doc, only an `anonymousProfiles` doc). `anonymousProfiles`
// holds the public-facing name/photo shared with the rest of the site —
// joined in here by uid so a staffer's team card matches how they show
// up everywhere else they post.

import { useEffect, useState } from "react";
import Link from "next/link";
import { getFirestore, collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { firebaseApp } from "@/lib/firebaseClient";

export interface TeamMember {
  uid: string;
  role: string;
  title?: string;
  bio?: string;
  displayName: string;
  photoUrl?: string;
}

const ROLE_LABEL: Record<string, string> = {
  administrator: "Administrator",
  moderator: "Moderator",
  community_leader: "Community Leader",
};

export function useTeamMembers() {
  const [members, setMembers] = useState<TeamMember[] | null>(null);

  useEffect(() => {
    const db = getFirestore(firebaseApp);
    (async () => {
      const snap = await getDocs(
        query(collection(db, "users"), where("role", "in", ["administrator", "moderator", "community_leader"]))
      );
      const results = await Promise.all(
        snap.docs.map(async (d) => {
          const data = d.data();
          const profileSnap = await getDoc(doc(db, "anonymousProfiles", d.id));
          const profile = profileSnap.data();
          return {
            uid: d.id,
            role: data.role,
            title: data.title,
            bio: data.bio,
            displayName: profile?.displayName ?? data.email?.split("@")[0] ?? "Team Member",
            photoUrl: profile?.photoUrl,
          } as TeamMember;
        })
      );
      setMembers(results);
    })();
  }, []);

  return members;
}

export function TeamCard({ member, size = "md" }: { member: TeamMember; size?: "sm" | "md" }) {
  const dims = size === "sm" ? "w-16 h-16 text-lg" : "w-20 h-20 text-2xl";
  const initial = member.displayName.trim()[0]?.toUpperCase() ?? "?";

  return (
    <Link
      href={`/team/profile?uid=${member.uid}`}
      className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 flex items-center gap-3
                 hover:border-[#00E5C3]/40 transition-colors"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {member.photoUrl ? (
        <img src={member.photoUrl} alt={member.displayName} className={`${dims} rounded-full object-cover border border-white/10 shrink-0`} />
      ) : (
        <div className={`${dims} rounded-full bg-white/10 border border-white/10 flex items-center justify-center font-semibold text-white/60 shrink-0`}>
          {initial}
        </div>
      )}
      <div className="min-w-0">
        <p className="font-semibold text-base truncate">{member.displayName}</p>
        <p className="text-xs text-[#00E5C3]/80 mt-0.5">{member.title || ROLE_LABEL[member.role] || member.role}</p>
      </div>
    </Link>
  );
}
