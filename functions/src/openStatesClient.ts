// functions/src/openStatesClient.ts
//
// OpenStates (https://openstates.org) publishes current state legislator
// data with a free API tier (sign up at https://open.pluralpolicy.com/).
// As of writing, the free tier is generous enough for a single-state pilot
// but rate-limited — this is why findMyRepresentatives.ts caches by
// district rather than calling this on every request.
//
// If your state legislature publishes its own open-data API (several do),
// prefer that as a primary source and use OpenStates as the fallback —
// it will usually be more current the day after a special election.

import type { DistrictSet, Representative } from "./types/civic";

const OPENSTATES_BASE_URL = "https://v3.openstates.org";

interface OpenStatesPerson {
  id: string;
  name: string;
  party: string;
  image?: string;
  current_role: {
    title: string;
    org_classification: "upper" | "lower";
    district: string;
  };
  email?: string;
  links?: { url: string }[];
  offices?: { voice?: string; address?: string }[];
}

export async function fetchStateLegislators(
  districts: DistrictSet,
  apiKey: string
): Promise<Representative[]> {
  if (!districts.state) return [];

  const results: Representative[] = [];

  for (const [chamber, districtNum] of [
    ["upper", extractDistrictNumber(districts.stateSenateDistrict)],
    ["lower", extractDistrictNumber(districts.stateHouseDistrict)],
  ] as const) {
    if (!districtNum) continue;

    const url =
      `${OPENSTATES_BASE_URL}/people?jurisdiction=${encodeURIComponent(districts.state)}` +
      `&org_classification=${chamber}&district=${encodeURIComponent(districtNum)}`;

    const res = await fetch(url, { headers: { "X-API-KEY": apiKey } });
    if (!res.ok) {
      throw new Error(`OpenStates request failed: ${res.status}`);
    }

    const data = await res.json();
    const people: OpenStatesPerson[] = data.results ?? [];

    for (const person of people) {
      results.push({
        id: `openstates_${person.id}`,
        fullName: person.name,
        photoUrl: person.image,
        officeLevel: chamber === "upper" ? "state_senate" : "state_house",
        officeTitle: chamber === "upper" ? "State Senator" : "State Representative",
        party: person.party,
        districtId: `${districts.state}-${chamber === "upper" ? "SD" : "HD"}-${districtNum}`,
        officialWebsite: person.links?.[0]?.url,
        contact: {
          email: person.email,
          phone: person.offices?.[0]?.voice,
          officeAddress: person.offices?.[0]?.address,
        },
        lastVerifiedAt: new Date().toISOString(),
        dataSource: "openstates",
      });
    }
  }

  return results;
}

// Census GEOIDs are compound (state FIPS + district code). OpenStates wants
// just the human-readable district number/name, so this strips the prefix.
function extractDistrictNumber(geoid?: string): string | undefined {
  if (!geoid) return undefined;
  // Census upper/lower district GEOIDs are typically 5 digits: 2-digit state
  // FIPS + 3-digit district code. Strip the state FIPS.
  const digits = geoid.replace(/^\d{2}/, "");
  return String(parseInt(digits, 10)); // drop leading zeros, e.g. "057" -> "57"
}
