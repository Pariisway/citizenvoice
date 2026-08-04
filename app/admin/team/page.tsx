"use client";

// app/admin/team/page.tsx
// Grant/revoke moderator and administrator roles, and set the title/bio
// shown on their public /team profile card. Admin-only in effect —
// firestore.rules already blocks non-admins from writing role changes, so
// a moderator can view this page but their edits will just fail
// server-side; not worth hiding the page over.

import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, updateDoc, doc, getDoc } from "firebase/firestore";
import { firebaseApp } from "@/lib/firebaseClient";

interface UserRecord {
  id: string;
  role?: string;
  email?: string;
  title?: string;
  bio?: string;
  displayName: string;
}

const ROLES = ["citizen", "moderator", "community_leader", "administrator"];

export default function AdminTeamPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", bio: "" });

  async function loadUsers() {
    setLoading(true);
    const db = getFirestore(firebaseApp);
    const snap = await getDocs(collection(db, "users"));
    // Join in the public-facing display name from anonymousProfiles —
    // the users collection only tracks role/title/bio, the name people
    // actually see everywhere else lives on their public profile.
    const results = await Promise.all(
      snap.docs.map(async (d) => {
        const data = d.data();
        const profileSnap = await getDoc(doc(db, "anonymousProfiles", d.id));
        const profile = profileSnap.data();
        return {
          id: d.id,
          role: data.role,
          email: data.email,
          title: data.title,
          bio: data.bio,
          displayName: profile?.displayName ?? data.email ?? "Unnamed",
        } as UserRecord;
      })
    );
    setUsers(results);
    setLoading(false);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function changeRole(uid: string, role: string) {
    setError(null);
    try {
      const db = getFirestore(firebaseApp);
      await updateDoc(doc(db, "users", uid), { role });
      await loadUsers();
    } catch (err: any) {
      setError(
        err?.message?.includes("permission")
          ? "Only administrators can change roles."
          : err?.message ?? "Couldn't update role."
      );
    }
  }

  function startEdit(u: UserRecord) {
    setEditingId(u.id);
    setEditForm({ title: u.title ?? "", bio: u.bio ?? "" });
  }

  async function saveEdit(uid: string) {
    setError(null);
    try {
      const db = getFirestore(firebaseApp);
      await updateDoc(doc(db, "users", uid), {
        title: editForm.title.trim(),
        bio: editForm.bio.trim(),
      });
      setEditingId(null);
      await loadUsers();
    } catch (err: any) {
      setError(err?.message ?? "Couldn't save profile info.");
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold">Team</h1>
      <p className="text-white/50 mt-1">
        Grant or revoke moderator and administrator access, and set the
        title/bio shown on their public <span className="text-white/70">/team</span> profile card.
        Only administrators can make changes here.
      </p>

      {error && <p className="text-red-300 text-sm mt-4">{error}</p>}

      <div className="mt-6 space-y-2">
        {loading && <p className="text-white/40 text-sm">Loading…</p>}
        {users.map((u) => (
          <div key={u.id} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{u.displayName}</p>
                {u.email && <p className="text-xs text-white/40 truncate">{u.email}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={u.role ?? "citizen"}
                  onChange={(e) => changeRole(u.id, e.target.value)}
                  className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                {u.role && u.role !== "citizen" && (
                  <button onClick={() => startEdit(u)} className="text-sm text-[#00E5C3]/80 hover:text-[#00E5C3]">
                    {editingId === u.id ? "" : "Edit profile"}
                  </button>
                )}
              </div>
            </div>

            {editingId === u.id && (
              <div className="mt-3 space-y-2">
                <input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="Title shown on their public card — e.g. Community Moderator"
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm"
                />
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  placeholder="Short bio for their public profile page"
                  rows={2}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm"
                />
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(u.id)} className="text-sm rounded-lg bg-[#00E5C3] text-[#0E1225] px-3 py-1.5">Save</button>
                  <button onClick={() => setEditingId(null)} className="text-sm rounded-lg border border-white/15 px-3 py-1.5">Cancel</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
