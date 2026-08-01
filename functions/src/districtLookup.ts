// functions/src/districtLookup.ts
//
// Resolves congressional district, state house/senate districts, county,
// and place using the US Census Bureau Geocoder — free, no API key,
// no rate limit posted (be a good citizen: cache results in Firestore).
// Docs: https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.html
//
// Note: Google's old "Representatives API" is shut down (April 2025). This
// Census endpoint replaces the *district-matching* half of what that API did.
// It does NOT return names of officeholders — see representativeLookup.ts.

import type { DistrictSet } from "./types/civic";

const CENSUS_GEOCODER_URL =
  "https://geocoding.geo.census.gov/geocoder/geographies/coordinates";

interface CensusGeography {
  GEOID: string;
  NAME: string;
  STATE?: string;
  BASENAME?: string;
}

interface CensusResponse {
  result?: {
    geographies?: {
      "States"?: CensusGeography[];
      "Counties"?: CensusGeography[];
      "Incorporated Places"?: CensusGeography[];
      "County Subdivisions"?: CensusGeography[];
      "119th Congressional Districts"?: CensusGeography[];
      "State Legislative Districts - Upper"?: CensusGeography[];
      "State Legislative Districts - Lower"?: CensusGeography[];
      "Unified School Districts"?: CensusGeography[];
      "Elementary School Districts"?: CensusGeography[];
      "Secondary School Districts"?: CensusGeography[];
    };
  };
}

export async function lookupDistrictsByCoordinates(
  latitude: number,
  longitude: number
): Promise<DistrictSet> {
  const params = new URLSearchParams({
    x: String(longitude),
    y: String(latitude),
    benchmark: "Public_AR_Current",
    vintage: "Current_Current",
    format: "json",
  });

  const res = await fetch(`${CENSUS_GEOCODER_URL}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Census geocoder failed: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as CensusResponse;
  const geo = data.result?.geographies;

  if (!geo) {
    throw new Error("Census geocoder returned no geography data for this location.");
  }

  const state = geo["States"]?.[0];
  const county = geo["Counties"]?.[0];
  const place = geo["Incorporated Places"]?.[0] ?? geo["County Subdivisions"]?.[0];
  // Congress number changes — "119th" is current as of the 2024 election cycle.
  // Bump this key when the new Congress is sworn in (odd years).
  const congressional = geo["119th Congressional Districts"]?.[0];
  const stateSenate = geo["State Legislative Districts - Upper"]?.[0];
  const stateHouse = geo["State Legislative Districts - Lower"]?.[0];
  const schoolUnified = geo["Unified School Districts"]?.[0];
  const schoolElementary = geo["Elementary School Districts"]?.[0];
  const schoolSecondary = geo["Secondary School Districts"]?.[0];

  return {
    state: state?.NAME ?? "",
    stateFips: state?.GEOID ?? "",
    countyName: county?.NAME,
    countyFips: county?.GEOID,
    placeName: place?.NAME ?? place?.BASENAME,
    placeFips: place?.GEOID,
    congressionalDistrict: congressional?.GEOID,
    stateSenateDistrict: stateSenate?.GEOID,
    stateHouseDistrict: stateHouse?.GEOID,
    schoolDistrictUnified: schoolUnified?.NAME,
    schoolDistrictElementary: schoolElementary?.NAME,
    schoolDistrictSecondary: schoolSecondary?.NAME,
    // Voting precincts are NOT part of Census TIGER data in most states and
    // have no free national API. Realistically sourced from state/county
    // election-board shapefiles you ingest manually per state. Left undefined
    // here on purpose rather than guessed.
    votingPrecinct: undefined,
  };
}
