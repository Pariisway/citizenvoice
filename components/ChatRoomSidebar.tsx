"use client";

// components/ChatRoomSidebar.tsx
//
// A persistent way to see what's happening in Community Chat without
// leaving whatever page you're on. Fixed to the right side, under the
// header. Only shows on wide viewports (xl and up) — there's no room for
// a floating column without overlapping content on anything narrower,
// and a fixed sidebar on mobile would cover half the screen.

import { useEffect, useState } from "react";
import Link from "next/link";
import { getFirestore, collection, getDocs, query, orderBy, onSnapshot } from "firebase/firestore";
import { firebaseApp } from "@/lib/firebaseClient";
import type { Community, CommunityType } from "@/types/community";

const TYPE_EMOJI: Record<CommunityType, string> = {
  county: "🗺️", city: "🏘️", neighborhood: "🏡", statewide: "🏛️",
};

export default function ChatRoomSidebar() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [liveCounts, setLiveCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const db = getFirestore(firebaseApp);
    getDocs(query(collection(db, "communities"), orderBy("name"))).then((snap) => {
      setCommunities(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Community)));
    });
  }, []);

  useEffect(() => {
    const db = getFirestore(firebaseApp);
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

  if (communities.length === 0) return null;

  // Live rooms first, then the rest, capped so the box stays a fixed size.
  const sorted = [...communities].sort((a, b) => (liveCounts[b.id] ?? 0) - (liveCounts[a.id] ?? 0));
  const shown = sorted.slice(0, 8);

  return (
    <aside className="hidden xl:block fixed top-20 right-6 w-64 z-40">
      <div className="rounded-2xl border border-white/10 bg-[#0E1225]/95 backdrop-blur px-4 py-4 max-h-[70vh] flex flex-col">
        <div className="flex items-center justify-between shrink-0">
          <p className="text-sm font-medium text-white/80">💬 Chat Rooms</p>
          <Link href="/community-chat" className="text-xs text-[#00E5C3]/80 hover:text-[#00E5C3]">
            See all
          </Link>
        </div>
        <div className="mt-3 space-y-1.5 overflow-y-auto">
          {shown.map((c) => {
            const live = liveCounts[c.id] ?? 0;
            return (
              <Link
                key={c.id}
                href={`/community-chat/room?id=${c.id}`}
                className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-white/5 transition-colors"
              >
                <span className="text-base shrink-0">{TYPE_EMOJI[c.type]}</span>
                <span className="text-sm truncate flex-1">{c.name}</span>
                {live > 0 && (
                  <span className="text-[10px] rounded-full bg-[#00E5C3]/15 text-[#00E5C3] border border-[#00E5C3]/40 px-1.5 py-0.5 shrink-0">
                    ● {live}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
