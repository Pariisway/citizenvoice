"use client";

// components/QuickAccountPrompt.tsx
//
// Offers to upgrade the current anonymous session into a real account —
// email/password or Google — using linkWithCredential/linkWithPopup so
// the SAME Firebase uid carries forward. That matters: it's what makes
// this a true upgrade rather than a fresh signup. Every proposal,
// comment, and vote already tied to this uid stays theirs.
//
// Shown two ways:
//   1. Once, automatically, right after someone sets their display name
//      for the first time (see DisplayNamePrompt's onReady).
//   2. On demand, wherever a member-only action is blocked (voice chat,
//      posting, dashboard) — those spots render a small "Create a free
//      account" button that opens this same modal.
//
// After a successful link, the page does a hard reload. This is the
// simplest reliable way to make sure every hook reading `isMember`
// picks up the change — cheaper to reason about than chasing whether
// onAuthStateChanged reliably re-fires after linking in every browser.

import { useState } from "react";
import {
  getAuth, EmailAuthProvider, GoogleAuthProvider, linkWithCredential, linkWithPopup,
  updateProfile,
} from "firebase/auth";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { firebaseApp } from "@/lib/firebaseClient";

export default function QuickAccountPrompt({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<"choice" | "email">("choice");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function finishWithPhoto(uid: string) {
    if (!photoFile) return;
    const storage = getStorage(firebaseApp);
    const path = `profile-photos/${uid}/${Date.now()}_${photoFile.name}`;
    const storageRef = ref(storage, path);
    const task = uploadBytesResumable(storageRef, photoFile);
    await new Promise<void>((resolve, reject) => {
      task.on("state_changed", undefined, reject, () => resolve());
    });
    const url = await getDownloadURL(task.snapshot.ref);
    const db = getFirestore(firebaseApp);
    await setDoc(doc(db, "anonymousProfiles", uid), { photoUrl: url }, { merge: true });
  }

  async function handleGoogle() {
    setError(null);
    setSubmitting(true);
    try {
      const auth = getAuth(firebaseApp);
      if (!auth.currentUser) throw new Error("Not signed in yet — try again in a moment.");
      await linkWithPopup(auth.currentUser, new GoogleAuthProvider());
      window.location.reload();
    } catch (err: any) {
      setError(friendlyError(err));
      setSubmitting(false);
    }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
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
      if (photoFile) {
        await finishWithPhoto(auth.currentUser.uid);
      }
      window.location.reload();
    } catch (err: any) {
      setError(friendlyError(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl bg-[#151a33] border border-white/10 p-6">
        {mode === "choice" ? (
          <>
            <h2 className="text-lg font-semibold">Create a free account?</h2>
            <p className="mt-1.5 text-sm text-white/50">
              Takes 10 seconds. Keeps everything you've already posted under your name,
              and unlocks your dashboard, voice chat, and discussions.
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
              onClick={onClose}
              className="mt-4 w-full text-center text-xs text-white/40 hover:text-white/60"
            >
              Maybe later
            </button>
          </>
        ) : (
          <form onSubmit={handleEmail}>
            <h2 className="text-lg font-semibold">Create your account</h2>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="mt-4 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm"
              autoFocus
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
  return err?.message ?? "Something went wrong — try again.";
}
