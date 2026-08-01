"use client";

// app/admin/videos/page.tsx
//
// Admin-only. Uploads a video file to Firebase Storage, then writes a
// metadata doc to Firestore `videos/{id}` so it shows up on /citizen-chat.
// Storage rules (storage.rules) only allow writes from signed-in
// admin/moderator accounts — enforced server-side, not just hidden in the UI.

import { useState } from "react";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { firebaseApp } from "@/lib/firebaseClient";
import type { VideoCategory } from "@/types/civic";

const CATEGORIES: { value: VideoCategory; label: string }[] = [
  { value: "meeting_recording", label: "Meeting Recording" },
  { value: "candidate_interview", label: "Candidate Interview" },
  { value: "town_hall", label: "Town Hall" },
  { value: "explainer", label: "Civic Explainer" },
  { value: "debate", label: "Debate" },
  { value: "community_update", label: "Community Update" },
];

export default function AdminVideosPage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<VideoCategory>("meeting_recording");
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDone(false);

    const auth = getAuth(firebaseApp);
    const user = auth.currentUser;
    if (!user) {
      setError("You must be signed in.");
      return;
    }
    if (!file || !title.trim()) {
      setError("A file and title are required.");
      return;
    }

    const storage = getStorage(firebaseApp);
    const storagePath = `community-videos/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        setProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
      },
      (err) => setError(err.message),
      async () => {
        const playbackUrl = await getDownloadURL(uploadTask.snapshot.ref);
        const db = getFirestore(firebaseApp);

        await addDoc(collection(db, "videos"), {
          title: title.trim(),
          description: description.trim() || null,
          category,
          storagePath,
          playbackUrl,
          uploadedByUid: user.uid,
          uploadedAt: new Date().toISOString(),
        });

        setDone(true);
        setProgress(null);
        setFile(null);
        setTitle("");
        setDescription("");
      }
    );
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold">Upload a video</h1>
      <p className="text-white/50 mt-1">
        Published immediately to the Citizen Chat community page.
      </p>

      <form onSubmit={handleUpload} className="mt-8 space-y-4">
        <div>
          <label className="text-sm text-white/60">Video file</label>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full text-sm text-white/70"
          />
        </div>

        <div>
          <label className="text-sm text-white/60">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2"
          />
        </div>

        <div>
          <label className="text-sm text-white/60">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2"
          />
        </div>

        <div>
          <label className="text-sm text-white/60">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as VideoCategory)}
            className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="rounded-xl bg-[#00E5C3] text-[#0E1225] font-medium px-6 py-3
                     hover:opacity-90 transition-opacity"
        >
          Upload
        </button>

        {progress != null && (
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-[#00E5C3] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {error && <p className="text-red-300 text-sm">{error}</p>}
        {done && <p className="text-[#00E5C3] text-sm">Video published.</p>}
      </form>
    </div>
  );
}
