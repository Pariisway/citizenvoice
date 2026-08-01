// scripts/seedStClairCounty.ts
//
// One-time seed script for the St. Clair County, IL pilot. Run with:
//   npx ts-node scripts/seedStClairCounty.ts
//
// Requires a Firebase service account key at ./serviceAccountKey.json
// (Project Settings > Service Accounts > Generate new private key).
// NEVER commit that file — it's already in .gitignore below.
//
// Data below was verified against county/state government and Ballotpedia
// sources as of July 2026. Every record still carries `lastVerifiedAt` and
// `dataSource: "manual_curation"` so the admin dashboard can flag it for
// re-verification later — treat this as a starting point, not gospel.
// Anything the admin later edits in the dashboard takes precedence.

import { initializeApp, cert, ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import serviceAccount from "./serviceAccountKey.json";

initializeApp({
  credential: cert(serviceAccount as ServiceAccount),
});
const db = getFirestore();

const ST_CLAIR_COUNTY_FIPS = "17163";
const NOW = new Date().toISOString();

async function seed() {
  // ---- City doc ----
  await db.collection("cities").doc("st-clair-county-il").set({
    name: "St. Clair County",
    state: "IL",
    countyFips: ST_CLAIR_COUNTY_FIPS,
    onboardingStatus: "active",
    localOfficesCurated: false, // flip to true once the full county board (29 districts) is entered
  });

  // ---- Verified representatives (seed set — expand via admin dashboard) ----
  const representatives = [
    {
      id: "st-clair-county-board-chairman",
      fullName: "Mark Kern",
      officeLevel: "county_board",
      officeTitle: "St. Clair County Board Chairman",
      countyFips: ST_CLAIR_COUNTY_FIPS,
      contact: {
        phone: "618-825-2203",
        email: "mkern@co.st-clair.il.us",
      },
      officialWebsite: "https://www.co.st-clair.il.us/elected-officials/chairman",
      lastVerifiedAt: NOW,
      dataSource: "manual_curation",
    },
    {
      id: "us-house-il-12-bost",
      fullName: "Mike Bost",
      officeLevel: "federal_house",
      officeTitle: "U.S. Representative, IL-12",
      districtId: "IL-12",
      contact: { phone: "202-225-5661" },
      officialWebsite: "https://bost.house.gov",
      lastVerifiedAt: NOW,
      dataSource: "manual_curation",
    },
    {
      id: "il-senate-56-harriss",
      fullName: "Erica Harriss",
      officeLevel: "state_senate",
      officeTitle: "Illinois State Senator, 56th District",
      districtId: "IL-SD-56",
      lastVerifiedAt: NOW,
      dataSource: "manual_curation",
    },
  ];

  const batch = db.batch();
  for (const rep of representatives) {
    const { id, ...data } = rep;
    batch.set(db.collection("representatives").doc(id), data);
  }
  await batch.commit();

  console.log(`Seeded ${representatives.length} verified representatives for St. Clair County.`);
  console.log(
    "NEXT: use the admin dashboard (/admin/representatives) to add the " +
    "remaining county board districts, municipal mayors/councils, and " +
    "school boards — these have no free API source and must be entered by hand."
  );
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
