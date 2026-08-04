"use client";

// app/community-chat/room/page.tsx
// Query-string route (static export can't pre-build a page per community
// ID) — same pattern as /billboard/proposal.

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  getFirestore, doc, getDoc, collection, query, where, orderBy, onSnapshot, addDoc,
} from "firebase/firestore";
import { firebaseApp } from "@/lib/firebaseClient";
import { useAnonymousIdentity } from "@/lib/useAnonymousIdentity";
import type { Community, CommunityMessage } from "@/types/community";
import TopNav from "@/components/TopNav";
import DisplayNamePrompt from "@/components/DisplayNamePrompt";
import CommunityVoiceRoom from "@/components/CommunityVoiceRoom";

// Community Chat is open to everyone — the only requirement to post or
// speak is a display name, same as before. Bill discussion (see
// /billboard/proposal) is the one that's member-only.
function CommunityRoom() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { uid, displayName, needsName } = useAnonymousIdentity();

  const [community, setCommunity] = useState<Community | null | undefined>(undefined);
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [messageText, setMessageText] = useState("");

  useEffect(() => {
    if (!id) { setCommunity(null); return; }
    const db = getFirestore(firebaseApp);
    getDoc(doc(db, "communities", id)).then((snap) => {
      setCommunity(snap.exists() ? ({ id: snap.id, ...snap.data() } as Community) : null);
    });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const db = getFirestore(firebaseApp);
    const q = query(
      collection(db, "communityMessages"),
      where("communityId", "==", id),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as CommunityMessage)));
    });
    return unsub;
  }, [id]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!messageText.trim() || !uid || !id) return;
    const db = getFirestore(firebaseApp);
    await addDoc(collection(db, "communityMessages"), {
      communityId: id,
      authorId: uid,
      authorName: displayName ?? "Anonymous",
      text: messageText.trim(),
      createdAt: new Date().toISOString(),
    });
    setMessageText("");
  }

  if (community === undefined) return <p className="mt-10 text-white/40 text-center">Loading…</p>;
  if (community === null) return <p className="mt-10 text-white/60 text-center">Community not found.</p>;

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-2xl font-semibold">{community.name}</h1>
      {community.description && <p className="text-white/50 mt-1">{community.description}</p>}

      <div className="mt-6">
        <CommunityVoiceRoom communityId={community.id} communityName={community.name} />
      </div>

      <div className="mt-10">
        <h2 className="font-medium">Discussion</h2>
        <div className="mt-3 space-y-3 max-h-[28rem] overflow-y-auto">
          {messages.length === 0 && (
            <p className="text-white/40 text-sm">No messages yet — start the conversation.</p>
          )}
          {messages.map((m) => (
            <div key={m.id} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <p className="text-xs text-white/40">{m.authorName}</p>
              <p className="text-sm text-white/80 mt-1">{m.text}</p>
            </div>
          ))}
        </div>

        {needsName ? (
          <div className="mt-4"><DisplayNamePrompt /></div>
        ) : (
          <form onSubmit={handleSend} className="mt-4 flex gap-2">
            <input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder={`Message ${community.name}…`}
              className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-lg bg-[#00E5C3] text-[#0E1225] font-medium px-4 py-2 text-sm"
            >
              Send
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function CommunityRoomPage() {
  return (
    <main className="min-h-screen bg-[#0E1225] text-white">
      <TopNav />
      <Suspense fallback={<p className="mt-10 text-white/40 text-center">Loading…</p>}>
        <CommunityRoom />
      </Suspense>
    </main>
  );
}
