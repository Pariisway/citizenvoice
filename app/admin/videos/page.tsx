"use client";

// app/admin/videos/page.tsx

import { useEffect, useState } from "react";
import {
  getFirestore, collection, addDoc, getDocs, orderBy, query, deleteDoc, doc, updateDoc,
} from "firebase/firestore";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { firebaseApp } from "@/lib/firebaseClient";
import { extractYouTubeId } from "@/lib/youtube";
import type { VideoCategory, CommunityVideo } from "@/types/civic";

const CATEGORIES: { value: VideoCategory; label: string }[] = [
  { value: "meeting_recording", label: "Meeting Recording" },
  { value: "candidate_interview", label: "Candidate Interview" },
  { value: "town_hall", label: "Town Hall" },
  { value: "explainer", label: "Civic Explainer" },
  { value: "debate", label: "Debate" },
  { value: "community_update", label: "Community Update" },
];

const emptyForm = {
  title: "",
  description: "",
  category: "meeting_recording" as VideoCategory,
  sourceType: "upload" as "upload" | "youtube",
  youtubeUrl: "",
};

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<CommunityVideo[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ title: string; description: string; category: VideoCategory }>({
    title: "", description: "", category: "meeting_recording",
  });

  async function loadVideos() {
    const db = getFirestore(firebaseApp);
    const snap = await getDocs(query(collection(db, "videos"), orderBy("uploadedAt", "desc")));
    setVideos(snap.docs.map((d) => ({ id: d.id, ...d.data() } as CommunityVideo)));
  }

  useEffect(() => { loadVideos(); }, []);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const auth = getAuth(firebaseApp);
    const user = auth.currentUser;
    if (!user) { setError("You must be signed in."); return; }
    if (!form.title.trim()) { setError("Title is required."); return; }

    setSaving(true);
    try {
      const db = getFirestore(firebaseApp);

      if (form.sourceType === "youtube") {
        const youtubeId = extractYouTubeId(form.youtubeUrl.trim());
        if (!youtubeId) {
          setError("Couldn't read a video ID from that YouTube link.");
          setSaving(false);
          return;
        }
        await addDoc(collection(db, "videos"), {
          title: form.title.trim(),
          description: form.description.trim() || null,
          category: form.category,
          videoType: "youtube",
          youtubeId,
          playbackUrl: form.youtubeUrl.trim(),
          uploadedByUid: user.uid,
          uploadedAt: new Date().toISOString(),
        });
      } else {
        if (!file) { setError("Choose a video file, or switch to a YouTube link."); setSaving(false); return; }
        const storage = getStorage(firebaseApp);
        const storagePath = `community-videos/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, storagePath);
        const uploadTask = uploadBytesResumable(storageRef, file);

        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snap) => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
            reject,
            () => resolve()
          );
        });
        const playbackUrl = await getDownloadURL(uploadTask.snapshot.ref);

        await addDoc(collection(db, "videos"), {
          title: form.title.trim(),
          description: form.description.trim() || null,
          category: form.category,
          videoType: "upload",
          storagePath,
          playbackUrl,
          uploadedByUid: user.uid,
          uploadedAt: new Date().toISOString(),
        });
      }

      setForm(emptyForm);
      setFile(null);
      setProgress(null);
      await loadVideos();
    } catch (err: any) {
      setError(err?.message ?? "Couldn't save this video.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this video?")) return;
    const db = getFirestore(firebaseApp);
    await deleteDoc(doc(db, "videos", id));
    await loadVideos();
  }

  function startEdit(v: CommunityVideo) {
    setEditingId(v.id);
    setEditForm({ title: v.title, description: v.description ?? "", category: v.category });
  }

  async function saveEdit(id: string) {
    const db = getFirestore(firebaseApp);
    await updateDoc(doc(db, "videos", id), {
      title: editForm.title.trim(),
      description: editForm.description.trim() || null,
      category: editForm.category,
    });
    setEditingId(null);
    await loadVideos();
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold">Videos</h1>
      <p className="text-white/50 mt-1">
        Upload a file, or paste a YouTube link — either shows up on Citizen Chat.
      </p>

      <form onSubmit={handleUpload} className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setForm({ ...form, sourceType: "upload" })}
            className={`text-sm rounded-lg px-4 py-2 ${form.sourceType === "upload" ? "bg-[#00E5C3] text-[#0E1225]" : "border border-white/15 text-white/70"}`}
          >
            Upload file
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...form, sourceType: "youtube" })}
            className={`text-sm rounded-lg px-4 py-2 ${form.sourceType === "youtube" ? "bg-[#00E5C3] text-[#0E1225]" : "border border-white/15 text-white/70"}`}
          >
            YouTube link
          </button>
        </div>

        {form.sourceType === "upload" ? (
          <div>
            <label className="text-sm text-white/60">Video file</label>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-1 block w-full text-sm text-white/70"
            />
          </div>
        ) : (
          <div>
            <label className="text-sm text-white/60">YouTube URL</label>
            <input
              type="text"
              value={form.youtubeUrl}
              onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=..."
              className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2"
            />
          </div>
        )}

        <div>
          <label className="text-sm text-white/60">Title</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm text-white/60">Description (optional)</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm text-white/60">Category</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as VideoCategory })}
            className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2"
          >
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-[#00E5C3] text-[#0E1225] font-medium px-6 py-3
                     hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {saving ? "Saving…" : "Add Video"}
        </button>

        {progress != null && (
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-[#00E5C3] transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
        {error && <p className="text-red-300 text-sm">{error}</p>}
      </form>

      <h2 className="mt-10 font-medium">{videos.length} videos</h2>
      <div className="mt-4 space-y-3">
        {videos.map((v) => (
          <div key={v.id} className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
            {editingId === v.id ? (
              <div className="space-y-2">
                <input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm"
                />
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm"
                />
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value as VideoCategory })}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm"
                >
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(v.id)} className="text-sm rounded-lg bg-[#00E5C3] text-[#0E1225] px-3 py-1.5">Save</button>
                  <button onClick={() => setEditingId(null)} className="text-sm rounded-lg border border-white/15 px-3 py-1.5">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{v.title}</p>
                  <p className="text-xs text-white/40 mt-0.5">
                    {v.videoType === "youtube" ? "YouTube" : "Uploaded"}
                  </p>
                </div>
                <div className="flex gap-3 shrink-0">
                  <button onClick={() => startEdit(v)} className="text-sm text-[#00E5C3]/80 hover:text-[#00E5C3]">Edit</button>
                  <button onClick={() => handleDelete(v.id)} className="text-sm text-red-300/70 hover:text-red-300">Remove</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
