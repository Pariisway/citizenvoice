"use client";

// components/CommunityVoiceRoom.tsx
//
// Same pattern as ProposalVoiceRoom.tsx, generalized to any room id —
// used for Community Chat (per city/county/neighborhood) instead of a
// per-proposal room. Each community gets its own Agora channel
// (`community-{communityId}`). Presence docs are written to the same
// voiceRoomPresence collection as proposal rooms, just tagged
// roomType: "community" and queried by roomId instead of proposalId —
// see firestore.rules, which doesn't need to distinguish the two since
// it only ever checks uid ownership.

import { useEffect, useRef, useState } from "react";
import {
  getFirestore, doc, setDoc, deleteDoc, collection, query, where, onSnapshot,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { firebaseApp } from "@/lib/firebaseClient";
import { useAnonymousIdentity } from "@/lib/useAnonymousIdentity";
import DisplayNamePrompt from "@/components/DisplayNamePrompt";
import MicPermissionGate from "@/components/MicPermissionGate";

interface Participant {
  uid: string;
  displayName: string;
}

// Community Chat voice rooms are open to everyone, no account required —
// only bill/proposal voice rooms (ProposalVoiceRoom.tsx) are member-only.
export default function CommunityVoiceRoom({ communityId, communityName }: { communityId: string; communityName: string }) {
  const { uid, displayName, needsName } = useAnonymousIdentity();
  const [joined, setJoined] = useState(false);
  const [muted, setMuted] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showJoinPrompt, setShowJoinPrompt] = useState(false);

  const clientRef = useRef<any>(null);
  const micTrackRef = useRef<any>(null);
  const channelName = `community-${communityId}`;
  const presenceDocId = `community_${communityId}_${uid}`;

  useEffect(() => {
    const db = getFirestore(firebaseApp);
    const q = query(
      collection(db, "voiceRoomPresence"),
      where("roomId", "==", communityId),
      where("roomType", "==", "community")
    );
    const unsub = onSnapshot(q, (snap) => {
      setParticipants(snap.docs.map((d) => d.data() as Participant));
    });
    return unsub;
  }, [communityId]);

  async function removePresence() {
    if (!uid) return;
    const db = getFirestore(firebaseApp);
    await deleteDoc(doc(db, "voiceRoomPresence", presenceDocId)).catch(() => {});
  }

  async function handleMicGranted(stream: MediaStream) {
    stream.getTracks().forEach((t) => t.stop()); // was only for the permission prompt
    setError(null);
    try {
      const { default: SDK } = await import("agora-rtc-sdk-ng");
      const functions = getFunctions(firebaseApp);
      const getToken = httpsCallable(functions, "generateAgoraToken");
      const { data } = (await getToken({ channelName, role: "speaker" })) as {
        data: { token: string; appId: string };
      };

      const client = SDK.createClient({ mode: "rtc", codec: "vp8" });
      clientRef.current = client;

      // Same fix as ProposalVoiceRoom.tsx — subscribe to remote audio and
      // play it. Publishing your own track alone gives you no sound.
      client.on("user-published", async (user: any, mediaType: "audio" | "video") => {
        await client.subscribe(user, mediaType);
        if (mediaType === "audio") {
          user.audioTrack?.play();
        }
      });
      client.on("user-unpublished", () => {});

      await client.join(data.appId, channelName, data.token, null);

      const micTrack = await SDK.createMicrophoneAudioTrack();
      micTrackRef.current = micTrack;
      await client.publish([micTrack]);

      const db = getFirestore(firebaseApp);
      await setDoc(doc(db, "voiceRoomPresence", presenceDocId), {
        roomId: communityId,
        roomType: "community",
        uid,
        displayName: displayName ?? "Anonymous",
        joinedAt: new Date().toISOString(),
      });

      setJoined(true);
      setShowJoinPrompt(false);
    } catch (err: any) {
      setError(err?.message ?? "Couldn't join the voice room.");
    }
  }

  function toggleMute() {
    if (!micTrackRef.current) return;
    const next = !muted;
    micTrackRef.current.setEnabled(!next);
    setMuted(next);
  }

  async function leaveRoom() {
    micTrackRef.current?.close();
    await clientRef.current?.leave().catch(() => {});
    await removePresence();
    setJoined(false);
    setMuted(false);
  }

  useEffect(() => {
    // Leave cleanly if the visitor navigates away without clicking Leave.
    return () => {
      micTrackRef.current?.close();
      clientRef.current?.leave().catch(() => {});
      removePresence();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-white/80">🎙️ {communityName} — Live Voice Chat</p>
        {joined && <span className="text-xs text-[#00E5C3]">● connected</span>}
      </div>

      {participants.length > 0 ? (
        <div className="mt-2 max-h-32 overflow-y-auto flex flex-wrap gap-1.5 content-start">
          {participants.map((p) => (
            <span key={p.uid} className="text-xs rounded-full bg-white/10 px-2.5 py-1 text-white/70">
              {p.displayName}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-white/40">No one's talking yet — be the first.</p>
      )}

      {error && <p className="mt-3 text-red-300 text-xs">{error}</p>}

      {!joined && !showJoinPrompt && (
        <button
          onClick={() => setShowJoinPrompt(true)}
          className="mt-3 rounded-xl bg-[#00E5C3] text-[#0E1225] font-medium px-4 py-2 text-sm
                     hover:opacity-90 transition-opacity"
        >
          Join Voice Chat
        </button>
      )}

      {!joined && showJoinPrompt && needsName && (
        <div className="mt-3"><DisplayNamePrompt onReady={() => {}} /></div>
      )}

      {!joined && showJoinPrompt && !needsName && (
        <div className="mt-3"><MicPermissionGate onGranted={handleMicGranted} /></div>
      )}

      {joined && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={toggleMute}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm hover:border-[#00E5C3]/50 transition-colors"
          >
            {muted ? "🔇 Unmute" : "🎤 Mute"}
          </button>
          <button
            onClick={leaveRoom}
            className="rounded-lg border border-red-400/30 text-red-300 px-4 py-2 text-sm hover:border-red-400/60 transition-colors"
          >
            Leave
          </button>
        </div>
      )}

    </div>
  );
}
