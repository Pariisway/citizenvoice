"use client";

// app/representatives/page.tsx
//
// Was a dynamic /representatives/[id] route; static export can't
// pre-build a page per representative ID (new ones get added constantly
// through the admin dashboard, long after `next build` runs), so this is
// a query-string route instead: /representatives?id=xyz. Same
// functionality, just resolved client-side instead of at build time.

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { firebaseApp } from "@/lib/firebaseClient";
import type { Representative } from "@/types/civic";
import TopNav from "@/components/TopNav";

function RepresentativeProfile() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [rep, setRep] = useState<Representative | null | undefined>(undefined);

  useEffect(() => {
    if (!id) {
      setRep(null);
      return;
    }
    const db = getFirestore(firebaseApp);
    getDoc(doc(db, "representatives", id)).then((snap) => {
      setRep(snap.exists() ? ({ id: snap.id, ...snap.data() } as Representative) : null);
    });
  }, [id]);

  if (rep === undefined) {
    return <p className="mt-10 text-white/40 text-center">Loading…</p>;
  }

  if (rep === null) {
    return (
      <p className="mt-10 text-white/60 text-center">
        We couldn't find that representative.
      </p>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <div className="flex items-center gap-5">
        {rep.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={rep.photoUrl}
            alt={rep.fullName}
            className="w-20 h-20 rounded-full object-cover"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-white/10" />
        )}
        <div>
          <h1 className="text-2xl font-semibold">{rep.fullName}</h1>
          <p className="text-white/60">{rep.officeTitle}</p>
        </div>
      </div>

      {rep.bio && (
        <p className="mt-6 text-white/70 leading-relaxed">{rep.bio}</p>
      )}

      <div className="mt-8 grid sm:grid-cols-2 gap-3">
        {rep.contact?.phone && <InfoRow label="Phone" value={rep.contact.phone} />}
        {rep.contact?.email && <InfoRow label="Email" value={rep.contact.email} />}
        {rep.contact?.officeAddress && (
          <InfoRow label="Office" value={rep.contact.officeAddress} />
        )}
        {rep.termStart && (
          <InfoRow
            label="Term"
            value={`${rep.termStart}${rep.termEnd ? ` – ${rep.termEnd}` : ""}`}
          />
        )}
      </div>

      {rep.committees && rep.committees.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-medium text-white/60">Committee Assignments</h2>
          <ul className="mt-2 space-y-1 text-white/80">
            {rep.committees.map((c) => <li key={c}>{c}</li>)}
          </ul>
        </div>
      )}

      {rep.officialWebsite && (
        <a
          href={rep.officialWebsite}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-block rounded-xl border border-white/20 text-white px-6 py-3
                     hover:border-[#00E5C3]/60 transition-colors"
        >
          Official Website
        </a>
      )}

      {rep.lastVerifiedAt && (
        <p className="mt-10 text-xs text-white/30">
          Last verified {new Date(rep.lastVerifiedAt).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <p className="text-xs text-white/40">{label}</p>
      <p className="text-sm mt-0.5">{value}</p>
    </div>
  );
}

export default function RepresentativeProfilePage() {
  return (
    <main className="min-h-screen bg-[#0E1225] text-white">
      <TopNav />
      {/* useSearchParams requires a Suspense boundary even in client
          components — Next.js's static-export prerender needs this to
          avoid an error at build time. */}
      <Suspense fallback={<p className="mt-10 text-white/40 text-center">Loading…</p>}>
        <RepresentativeProfile />
      </Suspense>
    </main>
  );
}
