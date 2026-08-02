"use client";

// app/academy/page.tsx
//
// Short-attention-span design: every card leads with the hook question,
// not the title. Duration is always visible so nothing feels like a
// commitment. No login, no requirement to finish — Academy is optional,
// but completing it is what unlocks proposal creation later (step 3).

import { useEffect, useState } from "react";
import Link from "next/link";
import { getFirestore, collection, getDocs, orderBy, query, doc, getDoc } from "firebase/firestore";
import { firebaseApp } from "@/lib/firebaseClient";
import { useAnonymousIdentity } from "@/lib/useAnonymousIdentity";
import type { Lesson } from "@/types/academy";
import TopNav from "@/components/TopNav";

export default function AcademyPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState<string[]>([]);
  const { uid } = useAnonymousIdentity();

  useEffect(() => {
    const db = getFirestore(firebaseApp);
    getDocs(query(collection(db, "lessons"), orderBy("order"))).then((snap) => {
      setLessons(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Lesson)));
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!uid) return;
    const db = getFirestore(firebaseApp);
    getDoc(doc(db, "lessonProgress", uid)).then((snap) => {
      setCompleted(snap.exists() ? (snap.data().completedLessonIds ?? []) : []);
    });
  }, [uid]);

  const progressPct = lessons.length
    ? Math.round((completed.length / lessons.length) * 100)
    : 0;

  return (
    <main className="min-h-screen bg-[#0E1225] text-white">
      <TopNav />
      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Civic Academy</h1>
        <p className="mt-2 text-white/60">
          Short lessons on how laws actually get made — none longer than 90
          seconds. Totally optional, but finishing unlocks the ability to
          build your own community proposal.
        </p>

        {lessons.length > 0 && (
          <div className="mt-6">
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-[#00E5C3] transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-white/40">
              {completed.length} of {lessons.length} complete
            </p>
          </div>
        )}

        <div className="mt-8 space-y-3">
          {loading && <p className="text-white/40 text-sm">Loading…</p>}
          {!loading && lessons.length === 0 && (
            <p className="text-white/40 text-sm">Lessons coming soon.</p>
          )}
          {lessons.map((lesson, i) => {
            const done = completed.includes(lesson.id);
            return (
              <Link
                key={lesson.id}
                href={`/academy/watch?id=${lesson.id}`}
                className="block rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4
                           hover:border-[#00E5C3]/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-white/40">
                      Lesson {i + 1} · {lesson.durationSeconds}s
                    </p>
                    <p className="font-medium mt-1">{lesson.hook}</p>
                  </div>
                  {done && (
                    <span className="text-[#00E5C3] text-xs shrink-0 mt-0.5">✓ Done</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
