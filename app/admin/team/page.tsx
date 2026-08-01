"use client";

// app/admin/team/page.tsx
// Grant/revoke moderator and administrator roles. Admin-only in effect —
// firestore.rules already blocks non-admins from writing role changes, so
// a moderator can view this page but their role edits will just fail
// server-side; not worth hiding the page over.

import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { firebaseApp } from "@/lib/firebaseClient";

interface UserRecord {
  id: string;
  role?: string;
  email?: string;
}

const ROLES = ["citizen", "moderator", "community_leader", "administrator"];

export default function AdminTeamPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadUsers() {
    setLoading(true);
    const db = getFirestore(firebaseApp);
    const snap = await getDocs(collection(db, "users"));
    setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserRecord)));
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

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold">Team</h1>
      <p className="text-white/50 mt-1">
        Grant or revoke moderator and administrator access. Only
        administrators can make changes here.
      </p>

      {error && <p className="text-red-300 text-sm mt-4">{error}</p>}

      <div className="mt-6 space-y-2">
        {loading && <p className="text-white/40 text-sm">Loading…</p>}
        {users.map((u) => (
          <div key={u.id} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm">{u.email ?? u.id}</p>
              <p className="text-xs text-white/40">{u.id}</p>
            </div>
            <select
              value={u.role ?? "citizen"}
              onChange={(e) => changeRole(u.id, e.target.value)}
              className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
