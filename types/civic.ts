// types/civic.ts
// Shared types for the "Who Represents Me" feature and general civic data model.

export interface GeocodedAddress {
  formattedAddress: string;
  latitude: number;
  longitude: number;
  // Mapbox-specific context, kept for debugging / re-geocoding
  mapboxPlaceId?: string;
}

export interface DistrictSet {
  state: string;              // e.g. "IL"
  stateFips: string;          // e.g. "17"
  countyName?: string;        // e.g. "St. Clair County"
  countyFips?: string;        // e.g. "163"
  placeName?: string;         // City/township, e.g. "Fairview Heights"
  placeFips?: string;
  congressionalDistrict?: string;   // e.g. "IL-12"
  stateSenateDistrict?: string;     // e.g. "57"
  stateHouseDistrict?: string;      // e.g. "114"
  schoolDistrictUnified?: string;
  schoolDistrictElementary?: string;
  schoolDistrictSecondary?: string;
  votingPrecinct?: string;    // Rarely available — see note in ARCHITECTURE.md
}

export type OfficeLevel =
  | "federal_senate"
  | "federal_house"
  | "state_senate"
  | "state_house"
  | "governor"
  | "mayor"
  | "city_council"
  | "county_board"
  | "school_board"
  | "township"
  | "judicial"
  | "other_local";

export interface Representative {
  id: string;                 // Firestore doc id
  fullName: string;
  photoUrl?: string;
  officeLevel: OfficeLevel;
  officeTitle: string;        // "State Representative", "Mayor", etc.
  party?: string;              // Stored, but never surfaced with editorial framing
  districtId?: string;         // Links to a district doc, e.g. "IL-HD-114"
  cityId?: string;             // For local offices, links to /cities/{cityId}
  termStart?: string;          // ISO date
  termEnd?: string;
  bio?: string;
  committees?: string[];
  officialWebsite?: string;
  contact?: {
    phone?: string;
    email?: string;
    officeAddress?: string;
  };
  socialMedia?: Record<string, string>;
  sponsoredBillIds?: string[];
  attendanceRecordUrl?: string;
  lastVerifiedAt?: string;     // Data-quality timestamp — show this in the UI
  dataSource: "openstates" | "congress_gov" | "manual_curation";
}

export type VideoCategory =
  | "meeting_recording"
  | "candidate_interview"
  | "town_hall"
  | "explainer"
  | "debate"
  | "community_update";

export interface CommunityVideo {
  id: string;
  title: string;
  description?: string;
  category: VideoCategory;
  storagePath: string;      // Firebase Storage path
  playbackUrl: string;      // Public download URL, resolved at upload time
  thumbnailUrl?: string;
  durationSeconds?: number;
  relatedRepresentativeId?: string;
  relatedBillId?: string;
  uploadedByUid: string;
  uploadedAt: string;       // ISO date
}

export interface RepresentativeLookupResult {
  address: GeocodedAddress;
  districts: DistrictSet;
  representatives: Representative[];
  // Which offices we could NOT resolve automatically, so the UI can be honest
  // about gaps instead of silently omitting them.
  unresolvedOffices: OfficeLevel[];
  cachedAt: string;
}
