// app/citizen-chat/page.tsx
//
// Public, read-only. No sign-in required — matches the "no sign-up" model.
// Server component: fetches videos directly from Firestore at request time.

import { getFirestore, collection, getDocs, orderBy, query } from "firebase/firestore";
import { firebaseApp } from "@/lib/firebaseClient";
import type { CommunityVideo } from "@/types/civic";
import AdSlot from "@/components/AdSlot";

async function getVideos(): Promise<CommunityVideo[]> {
  const db = getFirestore(firebaseApp);
  const snap = await getDocs(query(collection(db, "videos"), orderBy("uploadedAt", "desc")));
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as CommunityVideo));
}

export default async function CitizenChatPage() {
  const videos = await getVideos();

  return (
    <main className="min-h-screen bg-[#0E1225] text-white px-6 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-semibold tracking-tight">Citizen Chat</h1>
        <p className="mt-2 text-white/60">
          Meeting recordings, candidate interviews, and community updates —
          free to watch, no account needed.
        </p>

        <AdSlot slot="citizen-chat-top" className="mt-8" />

        {videos.length === 0 ? (
          <p className="mt-10 text-white/50">No videos yet — check back soon.</p>
        ) : (
          <div className="mt-10 grid sm:grid-cols-2 gap-6">
            {videos.map((video, i) => (
              <div key={video.id}>
                <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03]">
                  <video
                    src={video.playbackUrl}
                    controls
                    className="w-full aspect-video bg-black"
                    preload="metadata"
                  />
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
    </main>
  );
}
