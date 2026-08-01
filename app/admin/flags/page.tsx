"use client";

// app/admin/flags/page.tsx
// Moderation queue - both auto-flagged (burst posting) and user-reported content.

import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, orderBy, query, updateDoc, doc } from "firebase/firestore";
import { firebaseApp } from "@/lib/firebaseClient";

interface Flag {
  id: string;
  type: string;
  authorId?: string;
  count?: number;
  createdAt: string;
  status: "open" | "resolved";
}

export default function AdminFlagsPage() {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadFlags() {
    setLoading(true);
    const db = getFirestore(firebaseApp);
    const snap = await getDocs(query(collection(db, "flags"), orderBy("createdAt", "desc")));
    setFlags(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Flag)));
    setLoading(false);
  }

  useEffect(() => {
    loadFlags();
  }, []);

  async function resolve(id: string) {
    const db = getFirestore(firebaseApp);
    await updateDoc(doc(db, "flags", id), { status: "resolved" });
    await loadFlags();
  }

  const open = flags.filter((f) => f.status !== "resolved");
  const resolved = flags.filter((f) => f.status === "resolved");

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold">Flags</h1>
      <p className="text-white/50 mt-1">
        Auto-flagged burst posting and reported content. Check this
        regularly — automated detection only helps if someone acts on it,
        especially in high-traffic weeks before the election.
      </p>

      <h2 className="mt-8 font-medium">{loading ? "Loading…" : `${open.length} open`}</h2>
      <div className="mt-3 space-y-2">
        {open.map((flag) => (
          <div key={flag.id} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{flag.type}</p>
              <p className="text-xs text-white/40 mt-0.5">
                {flag.authorId && `author: ${flag.authorId} · `}
                {flag.count && `${flag.count} posts · `}
                {new Date(flag.createdAt).toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => resolve(flag.id)}
              className="text-sm rounded-lg bg-[#00E5C3] text-[#0E1225] font-medium px-4 py-1.5"
            >
              Resolve
            </button>
          </div>
        ))}
        {!loading && open.length === 0 && (
          <p className="text-white/40 text-sm">Nothing open right now.</p>
        )}
      </div>

      {resolved.length > 0 && (
        <>
          <h2 className="mt-8 font-medium text-white/50">{resolved.length} resolved</h2>
          <div className="mt-3 space-y-2 opacity-50">
            {resolved.map((flag) => (
              <div key={flag.id} className="rounded-xl border border-white/5 px-4 py-2 text-sm">
                {flag.type} — {new Date(flag.createdAt).toLocaleString()}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
