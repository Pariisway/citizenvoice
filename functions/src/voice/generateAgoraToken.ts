// functions/src/voice/generateAgoraToken.ts
//
// Agora requires a signed token per user per channel (never expose your
// Agora App Certificate to the client). This function mints one for
// whoever calls it — Community Chat rooms are open to everyone; bill
// (proposal) rooms require membership (an anonymous session upgraded to
// a real account — see QuickAccountPrompt.tsx).
//
// Speaking vs. listening is controlled by Agora `role`. Moderators can
// still mute/kick via Agora's RTM channel + the `voiceRooms` Firestore
// doc's moderator controls.

import * as functions from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import pkg from "agora-access-token";
import { enforceRateLimit } from "../moderation/enforceRateLimit";
const { RtcTokenBuilder, RtcRole } = pkg;

if (!getApps().length) {
  initializeApp();
}
const db = getFirestore();

const AGORA_APP_ID = defineSecret("AGORA_APP_ID");
const AGORA_APP_CERTIFICATE = defineSecret("AGORA_APP_CERTIFICATE");

const TOKEN_TTL_SECONDS = 60 * 60; // 1 hour — client re-requests on expiry

interface TokenRequest {
  channelName: string; // e.g. voice room id, "hb245-discussion"
  role: "speaker" | "listener";
}

export const generateAgoraToken = functions.onCall(
  { secrets: [AGORA_APP_ID, AGORA_APP_CERTIFICATE] },
  async (request) => {
    if (!request.auth) {
      // Anonymous auth still populates request.auth — this only blocks
      // truly unauthenticated calls (e.g. a raw curl with no Firebase token).
      throw new functions.HttpsError("unauthenticated", "Sign-in required.");
    }

    // Bill/proposal voice rooms are member-only; Community Chat voice
    // rooms (channelName starting "community-") stay open to everyone —
    // only the discussion around actual proposals requires an account.
    // See ProposalVoiceRoom.tsx vs CommunityVoiceRoom.tsx.
    const { channelName, role } = request.data as TokenRequest;
    if (!channelName) {
      throw new functions.HttpsError("invalid-argument", "channelName is required.");
    }

    // 60 token requests/hour per identity — generous for someone
    // legitimately hopping between rooms, a real wall against a script
    // hammering this endpoint (each call touches Agora's API, so this
    // matters for cost too, not just abuse).
    await enforceRateLimit(request.auth.uid, "generateAgoraToken", 60, 60 * 60 * 1000);

    if (
      channelName.startsWith("proposal-") &&
      request.auth.token.firebase?.sign_in_provider === "anonymous"
    ) {
      throw new functions.HttpsError(
        "permission-denied",
        "Create a free account to join bill discussions."
      );
    }

    // Require a display name before granting a speaker token — keeps voice
    // rooms from filling with unaccountable speakers.
    if (role === "speaker") {
      const profile = await db.collection("anonymousProfiles").doc(request.auth.uid).get();
      if (!profile.exists || !profile.data()?.displayName) {
        throw new functions.HttpsError(
          "failed-precondition",
          "Set a display name before speaking."
        );
      }
    }

    const expireAt = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
    const agoraRole = role === "speaker" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

    // Use a numeric-hash of the Firebase uid as the Agora account UID, or
    // 0 to let Agora assign one — using 0 here to avoid a collision-prone
    // hash function in this starter.
    const token = RtcTokenBuilder.buildTokenWithUid(
      AGORA_APP_ID.value(),
      AGORA_APP_CERTIFICATE.value(),
      channelName,
      0,
      agoraRole,
      expireAt
    );

    return { token, appId: AGORA_APP_ID.value(), expireAt, role };
  }
);
