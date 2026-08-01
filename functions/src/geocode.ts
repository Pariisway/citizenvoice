// functions/src/geocode.ts
//
// Converts a free-text address into coordinates using Mapbox Geocoding API.
// Free tier: 100,000 geocoding requests/month as of 2026 — plenty for early cities.
// Docs: https://docs.mapbox.com/api/search/geocoding/
//
// IMPORTANT: Keep the Mapbox token server-side (Cloud Function secret), not in
// client code, if you want to avoid quota abuse. Client-side "search-box" widgets
// use a public token with URL restrictions instead — see ARCHITECTURE.md.

import type { GeocodedAddress } from "./types/civic";

const MAPBOX_GEOCODE_URL =
  "https://api.mapbox.com/geocoding/v5/mapbox.places";

export async function geocodeAddress(
  rawAddress: string,
  mapboxToken: string
): Promise<GeocodedAddress> {
  if (!rawAddress || rawAddress.trim().length < 5) {
    throw new Error("Address is too short to geocode.");
  }

  const url =
    `${MAPBOX_GEOCODE_URL}/${encodeURIComponent(rawAddress)}.json` +
    `?access_token=${mapboxToken}&country=us&types=address&limit=1`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Mapbox geocoding failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const feature = data?.features?.[0];

  if (!feature) {
    throw new Error(
      "We couldn't find that address. Try including your city and state."
    );
  }

  const [longitude, latitude] = feature.center;

  return {
    formattedAddress: feature.place_name,
    latitude,
    longitude,
    mapboxPlaceId: feature.id,
  };
}

// Reverse geocode — used when the user shares device location instead of typing.
export async function reverseGeocode(
  latitude: number,
  longitude: number,
  mapboxToken: string
): Promise<GeocodedAddress> {
  const url =
    `${MAPBOX_GEOCODE_URL}/${longitude},${latitude}.json` +
    `?access_token=${mapboxToken}&types=address&limit=1`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Mapbox reverse geocoding failed: ${res.status}`);
  }

  const data = await res.json();
  const feature = data?.features?.[0];

  if (!feature) {
    throw new Error("Couldn't match that location to a street address.");
  }

  return {
    formattedAddress: feature.place_name,
    latitude,
    longitude,
    mapboxPlaceId: feature.id,
  };
}
