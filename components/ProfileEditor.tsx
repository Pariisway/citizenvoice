"use client";

// components/ProfileEditor.tsx
//
// Unlike DisplayNamePrompt (which only shows once, before a name is
// set), this is always available on the dashboard so members can change
// their name or photo whenever they want.

import { useState } from "react";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { firebaseApp } from "@/lib/firebaseClient";
import { useAnonymousIdentity } from "@/lib/useAnonymousIdentity";

export default function ProfileEditor() {
  const { uid, displayName, photoUrl, setDisplayName, setPhotoUrl } = useAnonymousIdentity();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(displayName ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePhotoChange(file: File | null) {
    if (!file || !uid) return;
    setUploading(true);
    setError(null);
    try {
      const storage = getStorage(firebaseApp);
      const path = `profile-photos/${uid}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, path);
      const task = uploadBytesResumable(storageRef, file);
      await new Promise<void>((resolve, reject) => {
        task.on("state_changed", undefined, reject, () => resolve());
      });
      const url = await getDownloadURL(task.snapshot.ref);
      await setPhotoUrl(url);
    } catch (err: any) {
      setError(err?.message ?? "Couldn't upload that photo — try a smaller image.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveName() {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await setDisplayName(name);
      setEditing(false);
    } catch (err: any) {
      setError(err?.message ?? "Couldn't save your name.");
    } finally {
      setSaving(false);
    }
  }

  const initial = displayName?.trim()?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-5">
      <p className="text-sm text-white/50">Your Profile</p>
      <div className="mt-3 flex items-center gap-4">
        <div className="relative shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {photoUrl ? (
            <img src={photoUrl} alt={displayName ?? "Profile"} className="w-14 h-14 rounded-full object-cover border border-white/10" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-lg font-semibold text-white/60">
              {initial}
            </div>
          )}
          <label className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#00E5C3] text-[#0E1225] text-xs flex items-center justify-center cursor-pointer">
            {uploading ? "…" : "✎"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
                className="flex-1 min-w-0 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm"
                autoFocus
              />
              <button
                onClick={handleSaveName}
                disabled={saving || !name.trim()}
                className="text-xs rounded-lg bg-[#00E5C3] text-[#0E1225] font-medium px-3 py-1.5 disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => { setEditing(false); setName(displayName ?? ""); }}
                className="text-xs rounded-lg border border-white/15 px-3 py-1.5"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">{displayName ?? "Unnamed"}</p>
              <button
                onClick={() => setEditing(true)}
                className="text-xs text-[#00E5C3]/80 hover:text-[#00E5C3] shrink-0"
              >
                Edit name
              </button>
            </div>
          )}
        </div>
      </div>
      {error && <p className="mt-2 text-red-300 text-xs">{error}</p>}
    </div>
  );
}
