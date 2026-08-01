// lib/useAdminAuth.ts
//
// Gate for /admin routes. Public visitors never need to sign in to browse
// the site — this hook only matters inside /admin.

"use client";

import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { firebaseApp } from "@/lib/firebaseClient";

export type AdminAuthState =
  | { status: "loading" }
  | { status: "signed_out" }
  | { status: "forbidden"; user: User }
  | { status: "authorized"; user: User; role: "administrator" | "moderator" };

export function useAdminAuth(): AdminAuthState {
  const [state, setState] = useState<AdminAuthState>({ status: "loading" });

  useEffect(() => {
    const auth = getAuth(firebaseApp);
    const db = getFirestore(firebaseApp);

    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ status: "signed_out" });
        return;
      }

      const userDoc = await getDoc(doc(db, "users", user.uid));
      const role = userDoc.data()?.role;

      if (role === "administrator" || role === "moderator") {
        setState({ status: "authorized", user, role });
      } else {
        setState({ status: "forbidden", user });
      }
    });
  }, []);

  return state;
}
