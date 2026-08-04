"use client";

// app/community-chat/page.tsx
//
// "One big community chat room, divided into profile cards for
// communities, cities, counties." This is the directory: every
// community gets a card (name, type, live voice indicator). Tapping a
// card opens its room (text discussion + Agora voice) at
// /community-chat/room?id=<communityId>.

import { useEffect, useState } from "react";
import Link from "next/link";
import { getFirestore, collection, getDocs, query, orderBy, onSnapshot } from "firebase/firestore";
import { firebaseApp } from "@/lib/firebaseClient";
import type { Community, CommunityType } from "@/types/community";
import TopNav from "@/components/TopNav";

const TYPE_META: Record<CommunityType, { label: string; emoji: string }> = {
  county: { label: "County", emoji: "🗺️" },
  city: { label: "City", emoji: "🏘️" },
  neighborhood: { label: "Neighborhood", emoji: "🏡" },
  statewide: { label: "Statewide", emoji: "🏛️" },
};

export default function CommunityChatPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  // roomId -> live speaker count, from voiceRoomPresence
  const [liveCounts, setLiveCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const db = getFirestore(firebaseApp);
    getDocs(query(collection(db, "communities"), orderBy("name"))).then((snap) => {
      setCommunities(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Community)));
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const db = getFirestore(firebaseApp);
    // One listener for all community-room presence, rather than one
    // query per card — cheap since presence docs are small and few.
    const unsub = onSnapshot(collection(db, "voiceRoomPresence"), (snap) => {
      const counts: Record<string, number> = {};
      snap.docs.forEach((d) => {
        const data = d.data();
        if (data.roomType === "community" && data.roomId) {
          counts[data.roomId] = (counts[data.roomId] ?? 0) + 1;
        }
      });
      setLiveCounts(counts);
    });
    return unsub;
  }, []);

  return (
    <main className="min-h-screen bg-[#0E1225] text-white">
      <TopNav />
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Community Chat</h1>
        <p className="mt-2 text-white/60">
          One big room, split by community — find your city or county and
          jump into the conversation, text or voice.
        </p>

        {loading && <p className="mt-10 text-white/40 text-sm">Loading…</p>}
        {!loading && communities.length === 0 && (
          <p className="mt-10 text-white/50">
            No communities set up yet — an admin can add one from Site Control.
          </p>
        )}

        <div className="mt-8 grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {communities.map((c) => {
            const meta = TYPE_META[c.type];
            const live = liveCounts[c.id] ?? 0;
            return (
              <Link
                key={c.id}
                href={`/community-chat/room?id=${c.id}`}
                className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden
                           hover:border-[#00E5C3]/40 transition-colors block"
              >
                <div className="h-28 bg-white/5 flex items-center justify-center relative">
                  {c.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.photoUrl} alt={c.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">{meta.emoji}</span>
                  )}
                  {live > 0 && (
                    <span className="absolute top-2 right-2 text-xs rounded-full bg-[#00E5C3]/15 text-[#00E5C3] border border-[#00E5C3]/40 px-2 py-0.5 backdrop-blur">
                      ● {live} live
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-white/40 mt-0.5">{meta.label}</p>
                  {c.description && (
                    <p className="text-sm text-white/50 mt-2 line-clamp-2">{c.description}</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
