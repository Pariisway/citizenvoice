"use client";

// lib/useAcademyCompletion.ts
// Shared between /academy and /build-a-bill so the "did they finish?"
// check is defined once, not duplicated.

import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, doc, getDoc } from "firebase/firestore";
import { firebaseApp } from "@/lib/firebaseClient";
import { useAnonymousIdentity } from "@/lib/useAnonymousIdentity";

export function useAcademyCompletion() {
  const { uid } = useAnonymousIdentity();
  const [totalLessons, setTotalLessons] = useState<number | null>(null);
  const [completedCount, setCompletedCount] = useState<number | null>(null);

  useEffect(() => {
    const db = getFirestore(firebaseApp);
    getDocs(collection(db, "lessons")).then((snap) => setTotalLessons(snap.size));
  }, []);

  useEffect(() => {
    if (!uid) return;
    const db = getFirestore(firebaseApp);
    getDoc(doc(db, "lessonProgress", uid)).then((snap) => {
      setCompletedCount(snap.exists() ? (snap.data().completedLessonIds?.length ?? 0) : 0);
    });
  }, [uid]);

  const loading = totalLessons === null || completedCount === null;
  const isComplete = !loading && totalLessons! > 0 && completedCount! >= totalLessons!;

  return { loading, totalLessons, completedCount, isComplete };
}
