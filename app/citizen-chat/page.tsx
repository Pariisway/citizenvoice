"use client";

// app/citizen-chat/page.tsx
//
// Public, read-only, no sign-in required. Fetches client-side — static
// export has no server to run per-request fetches on, so this can't be an
// async server component anymore (that would only ever show whatever
// videos existed at `next build` time, permanently stale).

import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, orderBy, query } from "firebase/firestore";
import { firebaseApp } from "@/lib/firebaseClient";
import type { CommunityVideo } from "@/types/civic";
import AdSlot from "@/components/AdSlot";
import TopNav from "@/components/TopNav";
import WeeklyRhythm from "@/components/WeeklyRhythm";
import VideoPlayer from "@/components/VideoPlayer";

export default function CitizenChatPage() {
  const [videos, setVideos] = useState<CommunityVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getFirestore(firebaseApp);
    getDocs(query(collection(db, "videos"), orderBy("uploadedAt", "desc"))).then((snap) => {
      setVideos(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as CommunityVideo)));
      setLoading(false);
    });
  }, []);

  return (
    <main className="min-h-screen bg-[#0E1225] text-white">
      <TopNav />
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Citizen Chat</h1>
        <p className="mt-2 text-white/60">
          Meeting recordings, candidate interviews, and community updates —
          free to watch, no account needed.
        </p>

        <AdSlot slot="citizen-chat-top" className="mt-8" />

        {loading ? (
          <p className="mt-10 text-white/40">Loading…</p>
        ) : videos.length === 0 ? (
          <p className="mt-10 text-white/50">
            Nothing posted yet — new content goes up on the weekly schedule
            below.
          </p>
        ) : (
          <div className="mt-10 grid sm:grid-cols-2 gap-6">
            {videos.map((video, i) => (
              <div key={video.id}>
                <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03]">
                  <VideoPlayer video={video} />
                  <div className="px-4 py-3">
                    <p className="font-medium">{video.title}</p>
                    {video.description && (
                      <p className="text-sm text-white/50 mt-1">{video.description}</p>
                    )}
                  </div>
                </div>
                {/* Native, in-feed ad every 4 videos — keeps ad density reasonable */}
                {(i + 1) % 4 === 0 && <AdSlot slot="citizen-chat-feed" className="mt-6" />}
              </div>
            ))}
          </div>
        )}
      </div>

      <WeeklyRhythm />
    </main>
  );
}
