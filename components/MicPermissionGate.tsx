"use client";

// components/MicPermissionGate.tsx
//
// Requests microphone access via getUserMedia BEFORE any Agora client is
// created or joined. Never call AgoraRTC.createClient()/join() without
// this gate — Agora will silently give you a muted/broken audio track if
// mic permission isn't actually granted, which is a much worse user
// experience than an explicit "we need mic access" prompt.
//
// Usage:
//   <MicPermissionGate onGranted={() => joinVoiceRoom(channelName)}>
//     {(state) => state === "granted" ? <LiveVoiceRoomUI /> : null}
//   </MicPermissionGate>

import { useState, useCallback, ReactNode } from "react";

export type MicPermissionState =
  | "idle"
  | "requesting"
  | "granted"
  | "denied"
  | "unsupported";

export default function MicPermissionGate({
  onGranted,
  children,
}: {
  onGranted?: (stream: MediaStream) => void;
  children?: (state: MicPermissionState) => ReactNode;
}) {
  const [state, setState] = useState<MicPermissionState>("idle");

  const requestMic = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setState("unsupported");
      return;
    }

    setState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setState("granted");
      onGranted?.(stream);
      // Note: Agora's own SDK (AgoraRTC.createMicrophoneAudioTrack) will
      // request the mic again internally — that's fine and expected, it
      // reuses the OS-level permission grant. This gate exists so YOUR UI
      // can show a clear "why we're asking" moment first, rather than a
      // bare, unexplained browser permission popup.
    } catch (err) {
      setState("denied");
    }
  }, [onGranted]);

  if (state === "granted") {
    return <>{children?.(state)}</>;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-8 text-center max-w-sm mx-auto">
      {state === "idle" && (
        <>
          <p className="text-white/80 font-medium">Join with your voice</p>
          <p className="text-sm text-white/50 mt-2">
            To speak in this room, we need permission to use your
            microphone. You'll stay muted until you choose to speak, and
            you can leave the room at any time.
          </p>
          <button
            onClick={requestMic}
            className="mt-5 rounded-xl bg-[#00E5C3] text-[#0E1225] font-medium px-6 py-3
                       hover:opacity-90 transition-opacity"
          >
            Allow microphone access
          </button>
        </>
      )}

      {state === "requesting" && (
        <p className="text-white/60 text-sm">Waiting for permission…</p>
      )}

      {state === "denied" && (
        <>
          <p className="text-white/80 font-medium">Microphone access denied</p>
          <p className="text-sm text-white/50 mt-2">
            You can still listen to this room. To speak, allow microphone
            access in your browser's site settings (usually the lock icon
            in the address bar), then try again.
          </p>
          <button
            onClick={requestMic}
            className="mt-5 rounded-xl border border-white/20 text-white px-6 py-3
                       hover:border-[#00E5C3]/60 transition-colors"
          >
            Try again
          </button>
        </>
      )}

      {state === "unsupported" && (
        <p className="text-white/60 text-sm">
          Your browser doesn't support microphone access. You can still
          listen and use text comments.
        </p>
      )}
    </div>
  );
}
