"use client";

// components/FeaturedVideo.tsx
// Shows the single most recent video from Citizen Chat, front and center
// on the homepage — reuses the existing `videos` collection, no new data
// model needed.

import { useEffect, useState } from "react";
import Link from "next/link";
import { getFirestore, collection, getDocs, orderBy, query, limit } from "firebase/firestore";
import { firebaseApp } from "@/lib/firebaseClient";
import type { CommunityVideo } from "@/types/civic";

export default function FeaturedVideo() {
  const [video, setVideo] = useState<CommunityVideo | null | undefined>(undefined);

  useEffect(() => {
    const db = getFirestore(firebaseApp);
    getDocs(query(collection(db, "videos"), orderBy("uploadedAt", "desc"), limit(1))).then((snap) => {
      setVideo(snap.empty ? null : ({ id: snap.docs[0].id, ...snap.docs[0].data() } as CommunityVideo));
    });
  }, []);

  return (
    <section className="px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold text-center">Watch</h2>

        {video === undefined && (
          <p className="mt-6 text-white/40 text-center text-sm">Loading…</p>
        )}

        {video === null && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-10 text-center">
            <p className="text-white/50 text-sm">New videos post on the weekly schedule below.</p>
          </div>
        )}

        {video && (
          <div className="mt-6 rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03]">
            <video
              src={video.playbackUrl}
              controls
              className="w-full aspect-video bg-black"
              preload="metadata"
            />
            <div className="px-5 py-4">
              <p className="font-medium">{video.title}</p>
              {video.description && (
                <p className="text-sm text-white/50 mt-1">{video.description}</p>
              )}
            </div>
          </div>
        )}

        <div className="mt-4 text-center">
          <Link href="/citizen-chat" className="text-sm text-[#00E5C3] hover:opacity-80">
            See all videos →
          </Link>
        </div>
      </div>
    </section>
  );
}
