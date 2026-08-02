"use client";

// app/academy/watch/page.tsx
//
// One lesson at a time, full-screen-feeling, minimal chrome — the point is
// to feel like a quick video, not a course page. Marks complete on finish.

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { firebaseApp } from "@/lib/firebaseClient";
import { useAnonymousIdentity } from "@/lib/useAnonymousIdentity";
import type { Lesson } from "@/types/academy";
import TopNav from "@/components/TopNav";

function LessonViewer() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { uid } = useAnonymousIdentity();
  const [lesson, setLesson] = useState<Lesson | null | undefined>(undefined);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!id) {
      setLesson(null);
      return;
    }
    const db = getFirestore(firebaseApp);
    getDoc(doc(db, "lessons", id)).then((snap) => {
      setLesson(snap.exists() ? ({ id: snap.id, ...snap.data() } as Lesson) : null);
    });
  }, [id]);

  async function markComplete() {
    if (!uid || !id) return;
    const db = getFirestore(firebaseApp);
    const progressRef = doc(db, "lessonProgress", uid);
    const existing = await getDoc(progressRef);
    const current: string[] = existing.exists() ? (existing.data().completedLessonIds ?? []) : [];
    if (!current.includes(id)) {
      await setDoc(
        progressRef,
        { completedLessonIds: [...current, id], updatedAt: new Date().toISOString() },
        { merge: true }
      );
    }
    setDone(true);
  }

  if (lesson === undefined) {
    return <p className="mt-10 text-white/40 text-center">Loading…</p>;
  }
  if (lesson === null) {
    return (
      <div className="mt-10 text-center">
        <p className="text-white/60">Lesson not found.</p>
        <Link href="/academy" className="text-[#00E5C3] text-sm mt-2 inline-block">
          Back to Academy
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-16">
      {lesson.videoUrl && (
        <video
          src={lesson.videoUrl}
          controls
          autoPlay
          onEnded={markComplete}
          className="w-full rounded-2xl bg-black aspect-video"
        />
      )}

      <p className={`text-xs text-white/40 ${lesson.videoUrl ? "mt-6" : ""}`}>{lesson.durationSeconds}s</p>
      <h1 className="text-2xl font-semibold mt-2">{lesson.hook}</h1>

      {!lesson.videoUrl && (
        <p className="mt-6 text-white/70 leading-relaxed text-lg">
          {lesson.cardContent}
        </p>
      )}

      {!done ? (
        <button
          onClick={markComplete}
          className="mt-8 rounded-xl bg-[#00E5C3] text-[#0E1225] font-medium px-6 py-3
                     hover:opacity-90 transition-opacity"
        >
          Mark complete
        </button>
      ) : (
        <div className="mt-8 flex items-center gap-3">
          <span className="text-[#00E5C3] text-sm">✓ Nice — that's done.</span>
          <Link
            href="/academy"
            className="rounded-xl border border-white/20 text-white px-5 py-2.5 text-sm
                       hover:border-[#00E5C3]/60 transition-colors"
          >
            Next lesson
          </Link>
        </div>
      )}
    </div>
  );
}

export default function LessonWatchPage() {
  return (
    <main className="min-h-screen bg-[#0E1225] text-white">
      <TopNav />
      <Suspense fallback={<p className="mt-10 text-white/40 text-center">Loading…</p>}>
        <LessonViewer />
      </Suspense>
    </main>
  );
}
