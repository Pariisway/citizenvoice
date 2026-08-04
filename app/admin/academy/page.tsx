"use client";

// app/admin/academy/page.tsx

import { useEffect, useState } from "react";
import {
  getFirestore, collection, addDoc, getDocs, orderBy, query, deleteDoc, doc, updateDoc,
} from "firebase/firestore";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { firebaseApp } from "@/lib/firebaseClient";
import type { Lesson } from "@/types/academy";

export default function AdminAcademyPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [title, setTitle] = useState("");
  const [hook, setHook] = useState("");
  const [duration, setDuration] = useState(60);
  const [cardContent, setCardContent] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ title: string; hook: string; durationSeconds: number; cardContent: string }>({
    title: "", hook: "", durationSeconds: 60, cardContent: "",
  });

  async function loadLessons() {
    const db = getFirestore(firebaseApp);
    const snap = await getDocs(query(collection(db, "lessons"), orderBy("order")));
    setLessons(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Lesson)));
  }

  useEffect(() => {
    loadLessons();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!hook.trim() || !title.trim()) {
      setError("Title and hook question are required.");
      return;
    }
    if (!videoFile && !cardContent.trim()) {
      setError("Add either a video or card text.");
      return;
    }

    setSaving(true);
    try {
      const db = getFirestore(firebaseApp);
      let videoUrl: string | undefined;

      if (videoFile) {
        const storage = getStorage(firebaseApp);
        const path = `academy-videos/${Date.now()}_${videoFile.name}`;
        const storageRef = ref(storage, path);
        const task = uploadBytesResumable(storageRef, videoFile);
        await new Promise<void>((resolve, reject) => {
          task.on(
            "state_changed",
            (s) => setProgress(Math.round((s.bytesTransferred / s.totalBytes) * 100)),
            reject,
            () => resolve()
          );
        });
        videoUrl = await getDownloadURL(task.snapshot.ref);
      }

      await addDoc(collection(db, "lessons"), {
        title: title.trim(),
        hook: hook.trim(),
        durationSeconds: duration,
        order: lessons.length,
        ...(videoUrl && { videoUrl }),
        ...(cardContent.trim() && { cardContent: cardContent.trim() }),
        createdAt: new Date().toISOString(),
      });

      setTitle(""); setHook(""); setCardContent(""); setVideoFile(null); setDuration(60);
      setProgress(null);
      await loadLessons();
    } catch (err: any) {
      setError(err?.message ?? "Couldn't save this lesson.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this lesson?")) return;
    const db = getFirestore(firebaseApp);
    await deleteDoc(doc(db, "lessons", id));
    await loadLessons();
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold">Civic Academy</h1>
      <p className="text-white/50 mt-1">
        Keep lessons under 90 seconds. Lead with the hook question, not the
        title — that's what shows on the card.
      </p>

      <form onSubmit={handleAdd} className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
        <label className="block">
          <span className="text-sm text-white/60">Internal title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm text-white/60">Hook question (shown on the card)</span>
          <input
            value={hook}
            onChange={(e) => setHook(e.target.value)}
            placeholder="Can ONE person change a city?"
            className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm text-white/60">Duration (seconds)</span>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            max={90}
            className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm text-white/60">Video (optional)</span>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full text-sm text-white/70"
          />
        </label>
        <label className="block">
          <span className="text-sm text-white/60">Card text (used if no video, keep it short)</span>
          <textarea
            value={cardContent}
            onChange={(e) => setCardContent(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2"
          />
        </label>

        {progress != null && (
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-[#00E5C3]" style={{ width: `${progress}%` }} />
          </div>
        )}
        {error && <p className="text-red-300 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-[#00E5C3] text-[#0E1225] font-medium px-6 py-2.5
                     hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {saving ? "Saving…" : "Add lesson"}
        </button>
      </form>

      <h2 className="mt-10 font-medium">{lessons.length} lessons</h2>
      <div className="mt-4 space-y-2">
        {lessons.map((l, i) => (
          <div key={l.id} className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
            {editingId === l.id ? (
              <div className="space-y-2">
                <input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="Internal title"
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm"
                />
                <input
                  value={editForm.hook}
                  onChange={(e) => setEditForm({ ...editForm, hook: e.target.value })}
                  placeholder="Hook question"
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm"
                />
                <input
                  type="number"
                  value={editForm.durationSeconds}
                  onChange={(e) => setEditForm({ ...editForm, durationSeconds: Number(e.target.value) })}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm"
                />
                <textarea
                  value={editForm.cardContent}
                  onChange={(e) => setEditForm({ ...editForm, cardContent: e.target.value })}
                  rows={3}
                  placeholder="Card text"
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm"
                />
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      const db = getFirestore(firebaseApp);
                      await updateDoc(doc(db, "lessons", l.id), {
                        title: editForm.title.trim(),
                        hook: editForm.hook.trim(),
                        durationSeconds: editForm.durationSeconds,
                        cardContent: editForm.cardContent.trim() || null,
                      });
                      setEditingId(null);
                      await loadLessons();
                    }}
                    className="text-sm rounded-lg bg-[#00E5C3] text-[#0E1225] px-3 py-1.5"
                  >
                    Save
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-sm rounded-lg border border-white/15 px-3 py-1.5">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/40">Lesson {i + 1} · {l.durationSeconds}s</p>
                  <p className="font-medium">{l.hook}</p>
                </div>
                <div className="flex gap-3 shrink-0">
                  <button
                    onClick={() => {
                      setEditingId(l.id);
                      setEditForm({
                        title: l.title, hook: l.hook, durationSeconds: l.durationSeconds,
                        cardContent: l.cardContent ?? "",
                      });
                    }}
                    className="text-sm text-[#00E5C3]/80 hover:text-[#00E5C3]"
                  >
                    Edit
                  </button>
                  <button onClick={() => handleDelete(l.id)} className="text-sm text-red-300/70 hover:text-red-300">
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
