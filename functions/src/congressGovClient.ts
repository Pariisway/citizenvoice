// functions/src/congressGovClient.ts
//
// Congress.gov offers a free public API for federal legislators.
// Get a key at https://api.congress.gov/sign-up/
//
// The member endpoint is easiest to query by state + district. Senators
// don't have a "district," so they're fetched by state alone.

import type { DistrictSet, Representative } from "./types/civic";

const CONGRESS_GOV_BASE_URL = "https://api.congress.gov/v3";

interface CongressMember {
  bioguideId: string;
  name: string;
  partyName?: string;
  state: string;
  district?: number;
  terms?: { item: { chamber: string }[] };
  depiction?: { imageUrl?: string };
  officialWebsiteUrl?: string;
}

export async function fetchFederalLegislators(
  districts: DistrictSet,
  apiKey: string
): Promise<Representative[]> {
  if (!districts.state) return [];

  const results: Representative[] = [];
  const stateAbbr = districts.state;

  // Current members for the state — filtered client-side, since the API's
  // district filter is inconsistent across states with at-large seats.
  const url = `${CONGRESS_GOV_BASE_URL}/member?currentMember=true&limit=250&api_key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Congress.gov request failed: ${res.status}`);
  }

  const data = await res.json();
  const members: CongressMember[] = data.members ?? [];

  const districtNumber = districts.congressionalDistrict
    ? parseInt(districts.congressionalDistrict.replace(/^\d{2}/, ""), 10)
    : undefined;

  for (const member of members) {
    if (member.state !== stateAbbr) continue;

    const chamber = member.terms?.item?.[0]?.chamber;
    const isSenate = chamber === "Senate";
    const isMatchingHouseSeat =
      chamber === "House of Representatives" && member.district === districtNumber;

    if (!isSenate && !isMatchingHouseSeat) continue;

    results.push({
      id: `congress_${member.bioguideId}`,
      fullName: member.name,
      photoUrl: member.depiction?.imageUrl,
      officeLevel: isSenate ? "federal_senate" : "federal_house",
      officeTitle: isSenate ? "U.S. Senator" : "U.S. Representative",
      party: member.partyName,
      districtId: isSenate ? `${stateAbbr}-SEN` : `${stateAbbr}-${districtNumber}`,
      officialWebsite: member.officialWebsiteUrl,
      lastVerifiedAt: new Date().toISOString(),
      dataSource: "congress_gov",
    });
  }

  return results;
}
