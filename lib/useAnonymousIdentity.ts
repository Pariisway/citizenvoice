// lib/useAnonymousIdentity.ts
//
// The "no sign-up" identity model: every visitor is silently signed in with
// Firebase Anonymous Auth (no email, password, or visible login screen) the
// first time they try to post a comment, ask a question, or speak in a
// voice room. They're then asked ONCE for a display name, which is stored
// locally and attached to everything they post.
//
// Why anonymous auth instead of "just a name field with no auth at all":
// a bare name field lets anyone impersonate anyone and gives moderators
// nothing to rate-limit or ban. Anonymous auth gives every device a stable
// uid behind the scenes — invisible to the user, essential for moderation —
// while still requiring zero forms, emails, or passwords.
//
// Trade-off to know about: anonymous auth is per-browser/device. Clearing
// site data or switching devices creates a new identity. That's the right
// trade for "genuinely no sign-up" — just don't expect ban evasion to be
// hard. Pair this with Firebase App Check (see ARCHITECTURE.md) to raise
// the cost of bot-driven ban evasion.
//
// Membership: `isMember` is true once this uid has been upgraded from a
// bare anonymous session to a real account (email/password or Google —
// see DisplayNamePrompt's "quick account" step, which calls
// linkWithCredential/linkWithPopup so the SAME uid carries forward, name
// and all). `user.isAnonymous` flips to false the moment that link
// succeeds. Gate member-only surfaces (voice chat, discussion, dashboard)
// on `isMember`, not just on having a display name.

"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  User,
} from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { firebaseApp } from "@/lib/firebaseClient";

const DISPLAY_NAME_KEY = "citizenVoice.displayName";

export interface AnonymousIdentity {
  uid: string | null;
  displayName: string | null;
  photoUrl: string | null;
  isMember: boolean;
  ready: boolean;
  needsName: boolean;
  setDisplayName: (name: string) => Promise<void>;
  setPhotoUrl: (url: string) => Promise<void>;
}

export function useAnonymousIdentity(): AnonymousIdentity {
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayNameState] = useState<string | null>(null);
  const [photoUrl, setPhotoUrlState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const auth = getAuth(firebaseApp);

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        // Sign in silently — no UI, no redirect, happens once per device.
        await signInAnonymously(auth);
        return; // onAuthStateChanged will fire again with the new user.
      }

      setUser(u);

      const localName = typeof window !== "undefined"
        ? window.localStorage.getItem(DISPLAY_NAME_KEY)
        : null;

      const db = getFirestore(firebaseApp);
      const profileDoc = await getDoc(doc(db, "anonymousProfiles", u.uid));
      const remotePhoto = profileDoc.data()?.photoUrl ?? null;
      // Google sign-in gives us a photo automatically; a self-uploaded one
      // (from the quick-account popup) takes priority if present.
      setPhotoUrlState(remotePhoto ?? u.photoURL ?? null);

      if (localName) {
        setDisplayNameState(localName);
      } else {
        // Fall back to Firestore in case they set a name on another session
        // of the same browser (e.g. after clearing localStorage but not
        // IndexedDB, where the Firebase Auth session persists).
        const remoteName = profileDoc.data()?.displayName ?? u.displayName ?? null;
        setDisplayNameState(remoteName);
        if (remoteName && typeof window !== "undefined") {
          window.localStorage.setItem(DISPLAY_NAME_KEY, remoteName);
        }
      }

      setReady(true);
    });

    return unsub;
  }, []);

  const setDisplayName = useCallback(async (name: string) => {
    const trimmed = name.trim().slice(0, 40);
    if (!trimmed || !user) return;

    const db = getFirestore(firebaseApp);
    await setDoc(
      doc(db, "anonymousProfiles", user.uid),
      { displayName: trimmed, updatedAt: new Date().toISOString() },
      { merge: true }
    );

    window.localStorage.setItem(DISPLAY_NAME_KEY, trimmed);
    setDisplayNameState(trimmed);
  }, [user]);

  const setPhotoUrl = useCallback(async (url: string) => {
    if (!user) return;
    const db = getFirestore(firebaseApp);
    await setDoc(
      doc(db, "anonymousProfiles", user.uid),
      { photoUrl: url, updatedAt: new Date().toISOString() },
      { merge: true }
    );
    setPhotoUrlState(url);
  }, [user]);

  return {
    uid: user?.uid ?? null,
    displayName,
    photoUrl,
    isMember: !!user && !user.isAnonymous,
    ready,
    needsName: ready && !displayName,
    setDisplayName,
    setPhotoUrl,
  };
}
