# Example Firestore Documents

## `representatives/{id}` — curated local office example

```json
{
  "fullName": "Jane Doe",
  "officeLevel": "mayor",
  "officeTitle": "Mayor",
  "cityFips": "1725274",
  "termStart": "2025-05-01",
  "termEnd": "2029-04-30",
  "bio": "Two-term city council member before being elected mayor in 2025.",
  "committees": [],
  "officialWebsite": "https://www.example-city.gov/mayor",
  "contact": {
    "phone": "618-555-0100",
    "email": "mayor@example-city.gov",
    "officeAddress": "10025 Bunkum Rd, Fairview Heights, IL 62208"
  },
  "socialMedia": { "twitter": "@mayorjanedoe" },
  "lastVerifiedAt": "2026-06-01T00:00:00.000Z",
  "dataSource": "manual_curation"
}
```

## `representatives/{id}` — API-sourced state legislator example

```json
{
  "fullName": "John Smith",
  "officeLevel": "state_house",
  "officeTitle": "State Representative",
  "party": "—",
  "districtId": "IL-HD-114",
  "officialWebsite": "https://ilga.gov/house/rep.asp?MemberID=1234",
  "contact": { "email": "repsmith@ilga.gov" },
  "lastVerifiedAt": "2026-07-30T00:00:00.000Z",
  "dataSource": "openstates"
}
```

## `cities/{cityId}`

```json
{
  "name": "Fairview Heights",
  "state": "IL",
  "countyFips": "17163",
  "placeFips": "1725274",
  "onboardingStatus": "active",
  "localOfficesCurated": true
}
```

## `districtLookupCache/{districtSetKey}`

Server-only. Key format: `{congressionalDistrict}_{stateSenateDistrict}_{stateHouseDistrict}_{placeFips}_{countyFips}`.

```json
{
  "representatives": [ /* array of Representative objects, denormalized */ ],
  "unresolvedOffices": ["county_board"],
  "cachedAt": "2026-07-31T12:00:00.000Z"
}
```
