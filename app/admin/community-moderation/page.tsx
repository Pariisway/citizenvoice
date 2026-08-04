"use client";

// app/admin/community-moderation/page.tsx
// Pick a room, review/delete its messages, and remove anyone from its
// live voice room. Removing someone from voice deletes their presence
// doc (immediate, permitted for moderators+ — see firestore.rules) which
// drops them from the visible participant list and live count; it does
// NOT forcibly cut their Agora audio stream mid-call, since that needs
// an RTM "kick" signal we haven't wired up yet. For now, treat this as
// "remove them from the room's public listing," not a hard disconnect —
// worth building the RTM kick if abuse turns out to be a real problem.

import { useEffect, useState } from "react";
import {
  getFirestore, collection, getDocs, query, orderBy, where, deleteDoc, doc, onSnapshot,
} from "firebase/firestore";
import { firebaseApp } from "@/lib/firebaseClient";
import type { Community } from "@/types/community";
import type { CommunityMessage } from "@/types/community";

interface Presence {
  id: string;
  uid: string;
  displayName: string;
}

export default function CommunityModerationPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [presence, setPresence] = useState<Presence[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    const db = getFirestore(firebaseApp);
    getDocs(query(collection(db, "communities"), orderBy("name"))).then((snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Community));
      setCommunities(list);
      if (list.length > 0) setSelectedId(list[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoadingMessages(true);
    const db = getFirestore(firebaseApp);

    getDocs(
      query(collection(db, "communityMessages"), where("communityId", "==", selectedId), orderBy("createdAt", "asc"))
    ).then((snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CommunityMessage));
      setMessages(list.reverse()); // newest first, without needing a second composite index
      setLoadingMessages(false);
    });

    const unsub = onSnapshot(
      query(collection(db, "voiceRoomPresence"), where("roomId", "==", selectedId), where("roomType", "==", "community")),
      (snap) => {
        setPresence(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Presence)));
      }
    );
    return unsub;
  }, [selectedId]);

  async function handleDeleteMessage(id: string) {
    const db = getFirestore(firebaseApp);
    await deleteDoc(doc(db, "communityMessages", id));
    setMessages((ms) => ms.filter((m) => m.id !== id));
  }

  async function handleRemoveFromRoom(presenceId: string) {
    const db = getFirestore(firebaseApp);
    await deleteDoc(doc(db, "voiceRoomPresence", presenceId));
  }

  const selected = communities.find((c) => c.id === selectedId);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold">Community Moderation</h1>
      <p className="text-white/50 mt-1">
        Review messages and manage who's in a room's live voice chat.
      </p>

      {communities.length === 0 ? (
        <p className="mt-6 text-white/50 text-sm">
          No chat rooms yet — create one under <span className="text-white/70">Chat Rooms</span> first.
        </p>
      ) : (
        <>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="mt-6 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm"
          >
            {communities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <div className="mt-6">
            <p className="text-sm font-medium text-white/80">
              🎙️ Live in {selected?.name} ({presence.length})
            </p>
            {presence.length === 0 ? (
              <p className="mt-2 text-xs text-white/40">No one's in voice chat right now.</p>
            ) : (
              <div className="mt-2 space-y-1.5">
                {presence.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg bg-white/[0.03] border border-white/10 px-3 py-2">
                    <span className="text-sm">{p.displayName}</span>
                    <button
                      onClick={() => handleRemoveFromRoom(p.id)}
                      className="text-xs text-red-300/80 hover:text-red-300"
                    >
                      Remove from room
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8">
            <p className="text-sm font-medium text-white/80">💬 Messages</p>
            {loadingMessages && <p className="mt-2 text-white/40 text-sm">Loading…</p>}
            {!loadingMessages && messages.length === 0 && (
              <p className="mt-2 text-xs text-white/40">No messages in this room yet.</p>
            )}
            <div className="mt-2 space-y-1.5 max-h-[32rem] overflow-y-auto">
              {messages.map((m) => (
                <div key={m.id} className="rounded-lg bg-white/[0.03] border border-white/10 px-3 py-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-white/40">{m.authorName}</p>
                      <p className="text-sm text-white/80 mt-0.5">{m.text}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteMessage(m.id)}
                      className="text-xs text-red-300/80 hover:text-red-300 shrink-0"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
