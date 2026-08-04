"use client";

// app/admin/communities/page.tsx
// Create and manage the community/city/county chat rooms shown at
// /community-chat — displayed here the same way they show up there
// (billboard-style photo cards) so it's obvious what you're building.

import { useEffect, useState } from "react";
import {
  getFirestore, collection, addDoc, getDocs, orderBy, query, deleteDoc, doc, updateDoc,
} from "firebase/firestore";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { firebaseApp } from "@/lib/firebaseClient";
import type { Community, CommunityType } from "@/types/community";

const TYPES: { value: CommunityType; label: string }[] = [
  { value: "county", label: "County" },
  { value: "city", label: "City" },
  { value: "neighborhood", label: "Neighborhood" },
  { value: "statewide", label: "Statewide" },
];
const TYPE_EMOJI: Record<CommunityType, string> = {
  county: "🗺️", city: "🏘️", neighborhood: "🏡", statewide: "🏛️",
};

const emptyForm = { name: "", type: "city" as CommunityType, description: "" };

export default function AdminCommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);

  async function load() {
    const db = getFirestore(firebaseApp);
    const snap = await getDocs(query(collection(db, "communities"), orderBy("name")));
    setCommunities(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Community)));
  }

  useEffect(() => { load(); }, []);

  async function uploadPhoto(file: File): Promise<string> {
    const storage = getStorage(firebaseApp);
    const path = `community-photos/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, path);
    const task = uploadBytesResumable(storageRef, file);
    await new Promise<void>((resolve, reject) => {
      task.on("state_changed", undefined, reject, () => resolve());
    });
    return getDownloadURL(task.snapshot.ref);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) { setError("Name is required."); return; }
    setSaving(true);
    try {
      const photoUrl = photoFile ? await uploadPhoto(photoFile) : "";
      const db = getFirestore(firebaseApp);
      await addDoc(collection(db, "communities"), {
        name: form.name.trim(),
        type: form.type,
        description: form.description.trim(),
        photoUrl,
        createdAt: new Date().toISOString(),
      });
      setForm(emptyForm);
      setPhotoFile(null);
      await load();
    } catch (err: any) {
      setError(err?.message ?? "Couldn't create the room.");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(c: Community) {
    setEditingId(c.id);
    setEditForm({ name: c.name, type: c.type, description: c.description ?? "" });
    setEditPhotoFile(null);
  }

  async function saveEdit(id: string) {
    const db = getFirestore(firebaseApp);
    const updates: Record<string, string> = {
      name: editForm.name.trim(),
      type: editForm.type,
      description: editForm.description.trim(),
    };
    if (editPhotoFile) {
      updates.photoUrl = await uploadPhoto(editPhotoFile);
    }
    await updateDoc(doc(db, "communities", id), updates);
    setEditingId(null);
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this chat room? Its message history stays in the database but won't be reachable from the directory.")) return;
    const db = getFirestore(firebaseApp);
    await deleteDoc(doc(db, "communities", id));
    await load();
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold">Chat Rooms</h1>
      <p className="text-white/50 mt-1">
        Create the cities, counties, and neighborhoods that show up as cards on Community Chat.
      </p>

      <form onSubmit={handleCreate} className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
        <div className="flex gap-2">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Name — e.g. Fairview Heights"
            className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm"
          />
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as CommunityType })}
            className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm"
          >
            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Short description (optional)"
          rows={2}
          className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm"
        />
        <div>
          <p className="text-xs text-white/40 mb-1.5">Cover photo (optional)</p>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-white/70"
          />
        </div>
        {error && <p className="text-red-300 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[#00E5C3] text-[#0E1225] font-medium px-4 py-2 text-sm disabled:opacity-50"
        >
          {saving ? "Creating…" : "Create chat room"}
        </button>
      </form>

      <div className="mt-8 grid sm:grid-cols-2 gap-4">
        {communities.map((c) => (
          <div key={c.id} className="rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03]">
            {editingId === c.id ? (
              <div className="p-4 space-y-2">
                <div className="flex gap-2">
                  <input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm"
                  />
                  <select
                    value={editForm.type}
                    onChange={(e) => setEditForm({ ...editForm, type: e.target.value as CommunityType })}
                    className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm"
                  >
                    {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditPhotoFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-xs text-white/60"
                />
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(c.id)} className="text-sm rounded-lg bg-[#00E5C3] text-[#0E1225] px-3 py-1.5">Save</button>
                  <button onClick={() => setEditingId(null)} className="text-sm rounded-lg border border-white/15 px-3 py-1.5">Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="h-28 bg-white/5 flex items-center justify-center">
                  {c.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.photoUrl} alt={c.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">{TYPE_EMOJI[c.type]}</span>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-white/40 mt-0.5">{TYPES.find((t) => t.value === c.type)?.label}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <button onClick={() => startEdit(c)} className="text-sm text-[#00E5C3]/80 hover:text-[#00E5C3]">Edit</button>
                      <button onClick={() => handleDelete(c.id)} className="text-sm text-red-300/80 hover:text-red-300">Delete</button>
                    </div>
                  </div>
                  {c.description && <p className="text-sm text-white/60 mt-2">{c.description}</p>}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
