// functions/src/admin/setAdminRole.ts
//
// Since the public site has NO sign-up flow, there also needs to be a
// deliberate, non-public way to create your first admin account. This
// function does that: it grants the "administrator" role to a Firebase Auth
// user, but only if the caller supplies a one-time setup secret you generate
// yourself and store as a Firebase secret — never exposed to the browser.
//
// One-time setup:
//   1. Sign in once on the site with Google/email (creates a Firebase Auth
//      user + a /users/{uid} doc with the default "citizen" role).
//   2. Set the secret:  firebase functions:secrets:set ADMIN_SETUP_SECRET
//   3. Call this function once (e.g. via a small local script or curl) with
//      your uid and that secret.
//   4. Rotate/delete the secret afterward if you want to lock the door.
//
// After that, ALL further admin/moderator role grants go through the admin
// dashboard (grantRole.ts), gated by isAdmin() in firestore.rules — not
// through this function again.

import * as functions from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp();
}
const db = getFirestore();

const ADMIN_SETUP_SECRET = defineSecret("ADMIN_SETUP_SECRET");

interface SetAdminRoleRequest {
  uid: string;
  setupSecret: string;
}

export const setAdminRole = functions.onCall(
  { secrets: [ADMIN_SETUP_SECRET] },
  async (request) => {
    const { uid, setupSecret } = request.data as SetAdminRoleRequest;

    if (setupSecret !== ADMIN_SETUP_SECRET.value()) {
      throw new functions.HttpsError("permission-denied", "Invalid setup secret.");
    }

    if (!uid) {
      throw new functions.HttpsError("invalid-argument", "uid is required.");
    }

    await db.collection("users").doc(uid).set(
      { role: "administrator" },
      { merge: true }
    );

    return { success: true, uid, role: "administrator" };
  }
);
