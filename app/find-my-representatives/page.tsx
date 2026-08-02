"use client";

// app/find-my-representatives/page.tsx
//
// The flagship feature: type an address (or share location) and immediately
// see every office that represents you, from U.S. Senator down to school
// board — with an honest note about which offices we couldn't resolve yet.

import { useState } from "react";
import Link from "next/link";
import { getFunctions, httpsCallable } from "firebase/functions";
import { firebaseApp } from "@/lib/firebaseClient";
import type { RepresentativeLookupResult, OfficeLevel } from "@/types/civic";
import TopNav from "@/components/TopNav";

const OFFICE_LABELS: Record<OfficeLevel, string> = {
  federal_senate: "U.S. Senate",
  federal_house: "U.S. House",
  state_senate: "State Senate",
  state_house: "State House",
  governor: "Governor",
  mayor: "Mayor",
  city_council: "City Council",
  county_board: "County Board",
  school_board: "School Board",
  township: "Township",
  judicial: "Judicial",
  other_local: "Local Office",
};

export default function FindMyRepresentativesPage() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RepresentativeLookupResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const functions = getFunctions(firebaseApp);
      const findMyReps = httpsCallable(functions, "findMyRepresentatives");
      const response = await findMyReps({ address });
      setResult(response.data as RepresentativeLookupResult);
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      setError("Location sharing isn't supported on this browser.");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const functions = getFunctions(firebaseApp);
          const findMyReps = httpsCallable(functions, "findMyRepresentatives");
          const response = await findMyReps({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setResult(response.data as RepresentativeLookupResult);
        } catch (err: any) {
          setError(err?.message ?? "Something went wrong. Please try again.");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError("We couldn't access your location. Try entering your address instead.");
        setLoading(false);
      }
    );
  }

  return (
    <main className="min-h-screen bg-[#0E1225] text-white">
      <TopNav />
      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          These are the people who represent{" "}
          <span className="text-[#00E5C3]">you</span>.
        </h1>
        <p className="mt-3 text-white/60">
          Most people don't know who their state representative or state
          senator is. Enter your address and we'll show you — from Congress
          down to your school board.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Main St, Fairview Heights, IL"
            className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-3
                       text-white placeholder-white/30 outline-none
                       focus:border-[#00E5C3]/60 transition-colors"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-[#00E5C3] text-[#0E1225] font-medium px-6 py-3
                       hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {loading ? "Looking up…" : "Find My Representatives"}
          </button>
        </form>

        <button
          onClick={handleUseMyLocation}
          disabled={loading}
          className="mt-3 text-sm text-white/50 hover:text-[#00E5C3] transition-colors"
        >
          or use my current location
        </button>

        {error && (
          <div className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-red-200 text-sm">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-10 space-y-4">
            <p className="text-sm text-white/50">{result.address.formattedAddress}</p>

            {result.representatives.length === 0 && (
              <p className="text-white/60">
                We couldn't automatically match any representatives yet for
                this address — this city may not be onboarded. You can still
                browse general civic education content.
              </p>
            )}

            {result.representatives.map((rep) => {
              // Only manually-curated local officials have a real Firestore
              // doc to link to — state/federal reps resolved live from
              // OpenStates/Congress.gov use synthetic IDs with no backing
              // page, so those link straight to their official site instead.
              const card = (
                <div
                  className="rounded-2xl border border-white/10 bg-white/[0.03]
                             backdrop-blur-sm px-5 py-4 flex items-center gap-4
                             hover:border-[#00E5C3]/40 transition-colors"
                >
                  {rep.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={rep.photoUrl}
                      alt={rep.fullName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-white/10" />
                  )}
                  <div>
                    <p className="font-medium">{rep.fullName}</p>
                    <p className="text-sm text-white/50">
                      {OFFICE_LABELS[rep.officeLevel]} · {rep.officeTitle}
                    </p>
                  </div>
                </div>
              );

              if (rep.dataSource === "manual_curation") {
                return (
                  <Link key={rep.id} href={`/representatives?id=${rep.id}`}>
                    {card}
                  </Link>
                );
              }
              if (rep.officialWebsite) {
                return (
                  <a key={rep.id} href={rep.officialWebsite} target="_blank" rel="noopener noreferrer">
                    {card}
                  </a>
                );
              }
              return <div key={rep.id}>{card}</div>;
            })}

            {result.unresolvedOffices.length > 0 && (
              <div className="mt-6 rounded-xl border border-white/10 px-4 py-3 text-sm text-white/40">
                We don't have verified data yet for:{" "}
                {result.unresolvedOffices.map((o) => OFFICE_LABELS[o]).join(", ")}.
                We're working on adding it.
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
