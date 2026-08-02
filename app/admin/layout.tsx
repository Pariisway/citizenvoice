"use client";

// app/admin/layout.tsx
//
// Wraps every /admin/* page. Public users hit a plain sign-in prompt here —
// this is the ONLY part of the site that ever asks anyone to sign in.

import { useState } from "react";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { firebaseApp } from "@/lib/firebaseClient";
import { useAdminAuth } from "@/lib/useAdminAuth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const authState = useAdminAuth();
  const [signingIn, setSigningIn] = useState(false);

  async function handleSignIn() {
    setSigningIn(true);
    try {
      await signInWithPopup(getAuth(firebaseApp), new GoogleAuthProvider());
    } finally {
      setSigningIn(false);
    }
  }

  async function handleSignOut() {
    await signOut(getAuth(firebaseApp));
  }

  if (authState.status === "loading") {
    return <CenteredMessage>Loading…</CenteredMessage>;
  }

  if (authState.status === "signed_out") {
    return (
      <CenteredMessage>
        <p className="mb-4 text-white/70">Admin access required.</p>
        <button
          onClick={handleSignIn}
          disabled={signingIn}
          className="rounded-xl bg-[#00E5C3] text-[#0E1225] font-medium px-6 py-3
                     hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {signingIn ? "Signing in…" : "Sign in with Google"}
        </button>
      </CenteredMessage>
    );
  }

  if (authState.status === "forbidden") {
    return (
      <CenteredMessage>
        <p className="text-white/70">
          Your account ({authState.user.email}) doesn't have admin access.
          Ask an existing administrator to grant your role.
        </p>
        <button
          onClick={handleSignOut}
          className="mt-4 text-sm text-white/50 hover:text-white/80 underline"
        >
          Sign out
        </button>
      </CenteredMessage>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E1225] text-white">
      <nav className="border-b border-white/10 px-6 py-4 flex gap-6 text-sm items-center">
        <a href="/admin" className="text-white/70 hover:text-[#00E5C3]">Dashboard</a>
        <a href="/admin/videos" className="text-white/70 hover:text-[#00E5C3]">Videos</a>
        <a href="/admin/homepage" className="text-white/70 hover:text-[#00E5C3]">Homepage</a>
        <a href="/admin/academy" className="text-white/70 hover:text-[#00E5C3]">Academy</a>
        <a href="/admin/representatives" className="text-white/70 hover:text-[#00E5C3]">Representatives</a>
        <a href="/admin/flags" className="text-white/70 hover:text-[#00E5C3]">Flags</a>
        <a href="/admin/team" className="text-white/70 hover:text-[#00E5C3]">Team</a>
        <span className="ml-auto text-white/40">{authState.role}</span>
        <button
          onClick={handleSignOut}
          className="text-white/50 hover:text-white/80 underline"
        >
          Sign out
        </button>
      </nav>
      <div className="px-6 py-10">{children}</div>
    </div>
  );
}

function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0E1225] text-white flex items-center justify-center px-6">
      <div className="text-center max-w-sm">{children}</div>
    </div>
  );
}
