"use client";

// components/QuickAccountPrompt.tsx
//
// Two related flows in one modal:
//
//   1. "Create account" (default) — upgrades the CURRENT anonymous
//      session into a real account via linkWithCredential/linkWithPopup,
//      so the same uid carries forward. Everything already posted under
//      this session stays theirs. Collects a display name here too,
//      since member-only surfaces (bill discussion, voice) no longer
//      have a separate "pick a name" step — only members reach them.
//
//   2. "Sign in" — for someone who already has an account (e.g. after
//      using the Sign Out button on the dashboard) and is back on a
//      fresh anonymous session. This SWITCHES the session to their
//      existing account with signInWithEmailAndPassword/signInWithPopup
//      rather than linking.
//
// After success, the page does a hard reload — simplest reliable way to
// make sure every hook reading `isMember`/`displayName` picks up the
// change, rather than chasing whether onAuthStateChanged reliably
// re-fires after linking in every browser.

import { useState } from "react";
import {
  getAuth, EmailAuthProvider, GoogleAuthProvider, linkWithCredential, linkWithPopup,
  signInWithEmailAndPassword, signInWithPopup,
} from "firebase/auth";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { firebaseApp } from "@/lib/firebaseClient";

type Mode = "choice" | "email" | "signin";

export default function QuickAccountPrompt({
  open, onClose, initialMode = "choice",
}: {
  open: boolean;
  onClose: () => void;
  initialMode?: Mode;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function saveNameAndPhoto(uid: string) {
    const db = getFirestore(firebaseApp);
    const updates: Record<string, string> = {};
    if (name.trim()) updates.displayName = name.trim();

    if (photoFile) {
      const storage = getStorage(firebaseApp);
      const path = `profile-photos/${uid}/${Date.now()}_${photoFile.name}`;
      const storageRef = ref(storage, path);
      const task = uploadBytesResumable(storageRef, photoFile);
      await new Promise<void>((resolve, reject) => {
        task.on("state_changed", undefined, reject, () => resolve());
      });
      updates.photoUrl = await getDownloadURL(task.snapshot.ref);
    }

    if (Object.keys(updates).length > 0) {
      await setDoc(doc(db, "anonymousProfiles", uid), updates, { merge: true });
      if (updates.displayName && typeof window !== "undefined") {
        window.localStorage.setItem("citizenVoice.displayName", updates.displayName);
      }
    }
  }

  async function handleGoogle() {
    setError(null);
    setSubmitting(true);
    try {
      const auth = getAuth(firebaseApp);
      if (!auth.currentUser) throw new Error("Not signed in yet — try again in a moment.");
      const result = await linkWithPopup(auth.currentUser, new GoogleAuthProvider());
      // Google already gives us a name/photo — only fall back to what
      // was typed here if Google didn't provide one.
      const db = getFirestore(firebaseApp);
      await setDoc(
        doc(db, "anonymousProfiles", result.user.uid),
        {
          displayName: result.user.displayName ?? name.trim() ?? undefined,
          photoUrl: result.user.photoURL ?? undefined,
        },
        { merge: true }
      );
      window.location.reload();
    } catch (err: any) {
      setError(friendlyError(err));
      setSubmitting(false);
    }
  }

  async function handleEmailSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError("Enter a name to post and speak under."); return; }
    if (!email.trim() || password.length < 6) {
      setError("Enter an email and a password with at least 6 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const auth = getAuth(firebaseApp);
      if (!auth.currentUser) throw new Error("Not signed in yet — try again in a moment.");
      const credential = EmailAuthProvider.credential(email.trim(), password);
      await linkWithCredential(auth.currentUser, credential);
      await saveNameAndPhoto(auth.currentUser.uid);
      window.location.reload();
    } catch (err: any) {
      setError(friendlyError(err));
      setSubmitting(false);
    }
  }

  async function handleSignInGoogle() {
    setError(null);
    setSubmitting(true);
    try {
      const auth = getAuth(firebaseApp);
      // A real sign-in, not a link — this switches the session to the
      // existing account, replacing whatever anonymous session was active.
      await signInWithPopup(auth, new GoogleAuthProvider());
      window.location.reload();
    } catch (err: any) {
      setError(friendlyError(err));
      setSubmitting(false);
    }
  }

  async function handleSignInEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) { setError("Enter your email and password."); return; }
    setSubmitting(true);
    try {
      const auth = getAuth(firebaseApp);
      await signInWithEmailAndPassword(auth, email.trim(), password);
      window.location.reload();
    } catch (err: any) {
      setError(friendlyError(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl bg-[#151a33] border border-white/10 p-6">
        {mode === "choice" && (
          <>
            <h2 className="text-lg font-semibold">Create a free account?</h2>
            <p className="mt-1.5 text-sm text-white/50">
              Takes 10 seconds. Keeps everything you've already posted under your name,
              and unlocks your dashboard, bill discussions, and voice chat on bills.
            </p>

            {error && <p className="mt-3 text-red-300 text-xs">{error}</p>}

            <button
              onClick={handleGoogle}
              disabled={submitting}
              className="mt-5 w-full rounded-xl bg-white text-[#151a33] font-medium px-4 py-3 text-sm
                         hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Continue with Google
            </button>
            <button
              onClick={() => setMode("email")}
              disabled={submitting}
              className="mt-2 w-full rounded-xl border border-white/20 px-4 py-3 text-sm
                         hover:border-[#00E5C3]/50 transition-colors disabled:opacity-50"
            >
              Use email instead
            </button>
            <button
              onClick={() => setMode("signin")}
              disabled={submitting}
              className="mt-4 w-full text-center text-xs text-white/50 hover:text-white/70"
            >
              Already have an account? Sign in
            </button>
            <button
              onClick={onClose}
              className="mt-2 w-full text-center text-xs text-white/40 hover:text-white/60"
            >
              Maybe later
            </button>
          </>
        )}

        {mode === "email" && (
          <form onSubmit={handleEmailSignup}>
            <h2 className="text-lg font-semibold">Create your account</h2>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              placeholder="Name you'll post and speak under"
              className="mt-4 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm"
              autoFocus
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="mt-2 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (6+ characters)"
              className="mt-2 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm"
            />
            <div className="mt-3">
              <p className="text-xs text-white/40 mb-1.5">Profile picture (optional)</p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                className="block w-full text-xs text-white/60"
              />
            </div>

            {error && <p className="mt-3 text-red-300 text-xs">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="mt-5 w-full rounded-xl bg-[#00E5C3] text-[#0E1225] font-medium px-4 py-3 text-sm
                         hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? "Creating account…" : "Create Account"}
            </button>
            <button
              type="button"
              onClick={() => setMode("choice")}
              disabled={submitting}
              className="mt-2 w-full text-center text-xs text-white/40 hover:text-white/60"
            >
              ← Back
            </button>
          </form>
        )}

        {mode === "signin" && (
          <form onSubmit={handleSignInEmail}>
            <h2 className="text-lg font-semibold">Sign in</h2>
            <p className="mt-1.5 text-sm text-white/50">
              Back with an existing account.
            </p>

            <button
              type="button"
              onClick={handleSignInGoogle}
              disabled={submitting}
              className="mt-4 w-full rounded-xl bg-white text-[#151a33] font-medium px-4 py-3 text-sm
                         hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Continue with Google
            </button>

            <div className="mt-3 flex items-center gap-2 text-xs text-white/30">
              <div className="flex-1 h-px bg-white/10" /> or <div className="flex-1 h-px bg-white/10" />
            </div>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="mt-3 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="mt-2 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm"
            />

            {error && <p className="mt-3 text-red-300 text-xs">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="mt-4 w-full rounded-xl bg-[#00E5C3] text-[#0E1225] font-medium px-4 py-3 text-sm
                         hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? "Signing in…" : "Sign In"}
            </button>
            <button
              type="button"
              onClick={() => setMode("choice")}
              disabled={submitting}
              className="mt-2 w-full text-center text-xs text-white/40 hover:text-white/60"
            >
              ← Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function friendlyError(err: any): string {
  const code = err?.code ?? "";
  if (code === "auth/email-already-in-use") return "That email's already in use — try signing in instead.";
  if (code === "auth/invalid-email") return "That doesn't look like a valid email.";
  if (code === "auth/weak-password") return "Choose a stronger password (6+ characters).";
  if (code === "auth/popup-closed-by-user") return "Google sign-in was closed before finishing.";
  if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
    return "That email and password don't match an account.";
  }
  if (code === "auth/credential-already-in-use") {
    return "That Google account is already registered — try Sign In instead.";
  }
  return err?.message ?? "Something went wrong — try again.";
}
