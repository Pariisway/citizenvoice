"use client";

// components/ProposalVoiceRoom.tsx
//
// Each proposal gets its own dedicated Agora channel (proposalId is the
// channel name). Agora alone doesn't give us a clean "list of display
// names currently in the room" — presence is tracked separately in
// Firestore (voiceRoomPresence/{proposalId}_{uid}), written on join,
// removed on leave/unmount. That's the "list of names of current users"
// requirement, done the simple way rather than reaching for Agora RTM.

import { useEffect, useRef, useState } from "react";
import {
  getFirestore, doc, setDoc, deleteDoc, collection, query, where, onSnapshot,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { firebaseApp } from "@/lib/firebaseClient";
import { useAnonymousIdentity } from "@/lib/useAnonymousIdentity";
import DisplayNamePrompt from "@/components/DisplayNamePrompt";
import MicPermissionGate from "@/components/MicPermissionGate";
import QuickAccountPrompt from "@/components/QuickAccountPrompt";

interface Participant {
  uid: string;
  displayName: string;
}

export default function ProposalVoiceRoom({ proposalId }: { proposalId: string }) {
  const { uid, displayName, needsName, isMember } = useAnonymousIdentity();
  const [joined, setJoined] = useState(false);
  const [muted, setMuted] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showJoinPrompt, setShowJoinPrompt] = useState(false);
  const [showQuickAccount, setShowQuickAccount] = useState(false);

  const clientRef = useRef<any>(null);
  const micTrackRef = useRef<any>(null);
  const channelName = `proposal-${proposalId}`;

  // Live participant list, regardless of whether *this* visitor has joined —
  // people should be able to see who's talking before deciding to join.
  useEffect(() => {
    const db = getFirestore(firebaseApp);
    const q = query(collection(db, "voiceRoomPresence"), where("proposalId", "==", proposalId));
    const unsub = onSnapshot(q, (snap) => {
      setParticipants(snap.docs.map((d) => d.data() as Participant));
    });
    return unsub;
  }, [proposalId]);

  async function removePresence() {
    if (!uid) return;
    const db = getFirestore(firebaseApp);
    await deleteDoc(doc(db, "voiceRoomPresence", `${proposalId}_${uid}`)).catch(() => {});
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
      await client.join(data.appId, channelName, data.token, null);

      const micTrack = await SDK.createMicrophoneAudioTrack();
      micTrackRef.current = micTrack;
      await client.publish([micTrack]);

      const db = getFirestore(firebaseApp);
      await setDoc(doc(db, "voiceRoomPresence", `${proposalId}_${uid}`), {
        proposalId,
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
        <p className="text-sm font-medium text-white/80">🎙️ Live Discussion</p>
        {joined && <span className="text-xs text-[#00E5C3]">● connected</span>}
      </div>

      {participants.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {participants.map((p) => (
            <span key={p.uid} className="text-xs rounded-full bg-white/10 px-2.5 py-1 text-white/70">
              {p.displayName}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-white/40">No one's here yet.</p>
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

      {!joined && showJoinPrompt && !needsName && !isMember && (
        <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <p className="text-sm text-white/70">Voice chat is a member feature.</p>
          <button
            onClick={() => setShowQuickAccount(true)}
            className="mt-2 rounded-lg bg-[#00E5C3] text-[#0E1225] font-medium px-4 py-2 text-sm hover:opacity-90 transition-opacity"
          >
            Create a free account
          </button>
        </div>
      )}

      {!joined && showJoinPrompt && !needsName && isMember && (
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

      <QuickAccountPrompt open={showQuickAccount} onClose={() => setShowQuickAccount(false)} />
    </div>
  );
}
