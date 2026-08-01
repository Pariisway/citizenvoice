// functions/src/findMyRepresentatives.ts
//
// The core "Who Represents Me" feature.
//
// Flow:
//   1. Geocode the address (Mapbox)              -> lat/lng
//   2. Resolve districts from lat/lng (Census)    -> district GEOIDs
//   3. Look up representatives for those districts, in priority order:
//        a. Firestore cache (curated + previously resolved — fastest, free)
//        b. OpenStates API for state house/senate  (free tier)
//        c. Congress.gov API for US House/Senate   (free)
//        d. Anything left (mayor, county board, school board) is flagged
//           as "unresolved" — these must be curated per-city by admins,
//           since no free national dataset covers local offices.
//   4. Cache the result in Firestore, keyed by district IDs, so the next
//      person on the same street doesn't re-hit external APIs.
//
// This function is a Firebase Callable Function so it can be invoked
// directly from the Next.js client with auth context, without exposing
// API keys to the browser.

import * as functions from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { geocodeAddress, reverseGeocode } from "./geocode";
import { lookupDistrictsByCoordinates } from "./districtLookup";
import { fetchStateLegislators } from "./openStatesClient";
import { fetchFederalLegislators } from "./congressGovClient";
import type {
  Representative,
  RepresentativeLookupResult,
  OfficeLevel,
} from "./types/civic";

if (!getApps().length) {
  initializeApp();
}
const db = getFirestore();

const MAPBOX_TOKEN = defineSecret("MAPBOX_SERVER_TOKEN");
const OPENSTATES_API_KEY = defineSecret("OPENSTATES_API_KEY");
const CONGRESS_GOV_API_KEY = defineSecret("CONGRESS_GOV_API_KEY");

interface FindRepsRequest {
  address?: string;
  latitude?: number;
  longitude?: number;
}

const DISTRICT_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export const findMyRepresentatives = functions.onCall(
  {
    secrets: [MAPBOX_TOKEN, OPENSTATES_API_KEY, CONGRESS_GOV_API_KEY],
    // Anonymous users are allowed to use this — it's core to the platform's
    // "no login required to learn who represents you" mission.
    cors: true,
  },
  async (request): Promise<RepresentativeLookupResult> => {
    const body = request.data as FindRepsRequest;

    // --- Step 1: Geocode -------------------------------------------------
    const address =
      body.latitude != null && body.longitude != null
        ? await reverseGeocode(body.latitude, body.longitude, MAPBOX_TOKEN.value())
        : await geocodeAddress(body.address ?? "", MAPBOX_TOKEN.value());

    // --- Step 2: Districts (Census, free, cached by district set) -------
    const districts = await lookupDistrictsByCoordinates(
      address.latitude,
      address.longitude
    );

    const cacheKey = buildDistrictCacheKey(districts);
    const cacheRef = db.collection("districtLookupCache").doc(cacheKey);
    const cached = await cacheRef.get();

    if (cached.exists) {
      const cachedData = cached.data()!;
      const cachedAt = new Date(cachedData.cachedAt).getTime();
      if (Date.now() - cachedAt < DISTRICT_CACHE_TTL_MS) {
        return {
          address,
          districts,
          representatives: cachedData.representatives,
          unresolvedOffices: cachedData.unresolvedOffices,
          cachedAt: cachedData.cachedAt,
        };
      }
    }

    // --- Step 3: Resolve representatives ---------------------------------
    const representatives: Representative[] = [];
    const unresolvedOffices: OfficeLevel[] = [];

    // 3a. Local offices (mayor, city council, county board, school board):
    // always sourced from our own curated Firestore data, keyed by placeFips.
    const localReps = await fetchCuratedLocalRepresentatives(districts.placeFips, districts.countyFips);
    representatives.push(...localReps.found);
    unresolvedOffices.push(...localReps.missing);

    // 3b. State legislature via OpenStates (free tier — cache aggressively).
    try {
      const stateReps = await fetchStateLegislators(
        districts,
        OPENSTATES_API_KEY.value()
      );
      representatives.push(...stateReps);
    } catch (err) {
      logger.warn("OpenStates lookup failed", err);
      unresolvedOffices.push("state_senate", "state_house");
    }

    // 3c. Federal Congress via Congress.gov (free).
    try {
      const federalReps = await fetchFederalLegislators(
        districts,
        CONGRESS_GOV_API_KEY.value()
      );
      representatives.push(...federalReps);
    } catch (err) {
      logger.warn("Congress.gov lookup failed", err);
      unresolvedOffices.push("federal_house", "federal_senate");
    }

    const result: RepresentativeLookupResult = {
      address,
      districts,
      representatives,
      unresolvedOffices,
      cachedAt: new Date().toISOString(),
    };

    // --- Step 4: Cache by district set, not by exact address -------------
    // Many addresses share the same district set, so caching here (rather
    // than per-address) is what keeps this free at scale.
    await cacheRef.set({
      representatives,
      unresolvedOffices,
      cachedAt: result.cachedAt,
    });

    return result;
  }
);

function buildDistrictCacheKey(districts: RepresentativeLookupResult["districts"]): string {
  return [
    districts.congressionalDistrict ?? "none",
    districts.stateSenateDistrict ?? "none",
    districts.stateHouseDistrict ?? "none",
    districts.placeFips ?? "none",
    districts.countyFips ?? "none",
  ].join("_");
}

async function fetchCuratedLocalRepresentatives(
  placeFips?: string,
  countyFips?: string
): Promise<{ found: Representative[]; missing: OfficeLevel[] }> {
  const found: Representative[] = [];
  const missing: OfficeLevel[] = [];

  if (placeFips) {
    const snap = await db
      .collection("representatives")
      .where("cityFips", "==", placeFips)
      .where("officeLevel", "in", ["mayor", "city_council", "school_board", "township"])
      .get();
    snap.forEach((doc: QueryDocumentSnapshot) => found.push({ id: doc.id, ...doc.data() } as Representative));
  }

  if (countyFips) {
    const snap = await db
      .collection("representatives")
      .where("countyFips", "==", countyFips)
      .where("officeLevel", "==", "county_board")
      .get();
    snap.forEach((doc: QueryDocumentSnapshot) => found.push({ id: doc.id, ...doc.data() } as Representative));
  }

  const resolvedLevels = new Set(found.map((r) => r.officeLevel));
  (["mayor", "city_council", "county_board", "school_board"] as OfficeLevel[]).forEach(
    (level) => {
      if (!resolvedLevels.has(level)) missing.push(level);
    }
  );

  return { found, missing };
}
