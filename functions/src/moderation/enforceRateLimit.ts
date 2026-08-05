// functions/src/moderation/enforceRateLimit.ts
//
// Shared sliding-window rate limiter for callable functions. Each
// (uid, action) pair gets one doc in `rateLimits`; a transaction resets
// the window once it's expired, or rejects the call once the count hits
// the limit within the current window. Admin-SDK only — nothing in
// firestore.rules needs to touch this collection since clients never
// read or write it directly.
//
// This is deliberately simple (fixed window, not a rolling one) — good
// enough to stop scripted abuse without needing a separate rate-limiting
// service. If this site gets attacked seriously, this is a floor to
// build on, not a ceiling.

import * as functions from "firebase-functions/v2/https";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp();
}
const db = getFirestore();

export async function enforceRateLimit(
  uid: string,
  action: string,
  maxCalls: number,
  windowMs: number
): Promise<void> {
  const ref = db.collection("rateLimits").doc(`${uid}_${action}`);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const now = Date.now();
    const data = snap.exists ? (snap.data() as { windowStart: number; count: number }) : null;

    if (!data || now - data.windowStart > windowMs) {
      // First call, or the previous window has expired — start fresh.
      tx.set(ref, { windowStart: now, count: 1 });
      return;
    }

    if (data.count >= maxCalls) {
      throw new functions.HttpsError(
        "resource-exhausted",
        "You're doing that a bit too fast — try again in a few minutes."
      );
    }

    tx.set(ref, { windowStart: data.windowStart, count: data.count + 1 });
  });
}
