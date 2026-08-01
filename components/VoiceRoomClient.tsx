"use client";

// components/VoiceRoomClient.tsx
//
// Ties together the three things that must happen in order before anyone
// speaks in a voice room:
//   1. Anonymous identity + display name (useAnonymousIdentity)
//   2. Explicit mic permission (MicPermissionGate)
//   3. Agora join, using a token minted by generateAgoraToken.ts — the
//      Agora App Certificate never touches the browser.
//
// Requires: npm install agora-rtc-sdk-ng

import { useEffect, useRef, useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { firebaseApp } from "@/lib/firebaseClient";
import { useAnonymousIdentity } from "@/lib/useAnonymousIdentity";
import DisplayNamePrompt from "@/components/DisplayNamePrompt";
import MicPermissionGate from "@/components/MicPermissionGate";
import type AgoraRTC from "agora-rtc-sdk-ng";

interface TokenResponse {
  token: string;
  appId: string;
  expireAt: number;
  role: "speaker" | "listener";
}

export default function VoiceRoomClient({ channelName }: { channelName: string }) {
  const { displayName, needsName } = useAnonymousIdentity();
  const [joined, setJoined] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<ReturnType<typeof AgoraRTC.createClient> | null>(null);
  const localTrackRef = useRef<any>(null);

  async function joinAsListener() {
    setError(null);
    try {
      const { default: SDK } = await import("agora-rtc-sdk-ng");
      const functions = getFunctions(firebaseApp);
      const getToken = httpsCallable<{ channelName: string; role: string }, TokenResponse>(
        functions,
        "generateAgoraToken"
      );
      const { data } = await getToken({ channelName, role: "listener" });

      const client = SDK.createClient({ mode: "rtc", codec: "vp8" });
      clientRef.current = client;
      await client.join(data.appId, channelName, data.token, null);
      setJoined(true);
    } catch (err: any) {
      setError(err?.message ?? "Couldn't join the room.");
    }
  }

  async function becomeSpeaker(stream: MediaStream) {
    // Stop the raw getUserMedia stream from MicPermissionGate — it only
    // existed to trigger and confirm the permission prompt. Agora manages
    // its own microphone track independently below.
    stream.getTracks().forEach((t) => t.stop());

    setError(null);
    try {
      const { default: SDK } = await import("agora-rtc-sdk-ng");
      const functions = getFunctions(firebaseApp);
      const getToken = httpsCallable<{ channelName: string; role: string }, TokenResponse>(
        functions,
        "generateAgoraToken"
      );
      const { data } = await getToken({ channelName, role: "speaker" });

      let client = clientRef.current;
      if (!client) {
        client = SDK.createClient({ mode: "rtc", codec: "vp8" });
        clientRef.current = client;
        await client.join(data.appId, channelName, data.token, null);
      }

      const micTrack = await SDK.createMicrophoneAudioTrack();
      localTrackRef.current = micTrack;
      await client.publish([micTrack]);
      setSpeaking(true);
      setJoined(true);
    } catch (err: any) {
      setError(err?.message ?? "Couldn't enable your microphone.");
    }
  }

  useEffect(() => {
    return () => {
      localTrackRef.current?.close();
      clientRef.current?.leave();
    };
  }, []);

  return (
    <div className="space-y-4">
      {needsName && <DisplayNamePrompt />}

      {!joined && !needsName && (
        <button
          onClick={joinAsListener}
          className="rounded-xl border border-white/20 text-white px-6 py-3 hover:border-[#00E5C3]/60 transition-colors"
        >
          Listen to this room
        </button>
      )}

      {joined && !speaking && !needsName && (
        <MicPermissionGate onGranted={becomeSpeaker} />
      )}

      {speaking && (
        <p className="text-sm text-[#00E5C3]">
          You're live as <span className="font-medium">{displayName}</span>.
        </p>
      )}

      {error && (
        <p className="text-sm text-red-300">{error}</p>
      )}
    </div>
  );
}
