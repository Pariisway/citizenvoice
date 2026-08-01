# Citizen Voice — Architecture & Data Strategy

## Why this scope, first

The original spec covers a full civic platform (voice chat, video library,
community groups, meetings, projects, admin dashboard, etc.). That's a
multi-month build. Rather than scaffold 40 shallow pages, this first pass
builds the part that makes the platform actually differentiated and useful
on day one: **address → your representatives, districts, and legislation**.
Everything else in the spec hangs off this data model, so it's the right
foundation to get right first.

## The "Who Represents Me" pipeline (free-tier)

```
User enters address or shares location
        │
        ▼
 Mapbox Geocoding API  ───────► lat/lng
   (100k free req/mo)
        │
        ▼
 Census Bureau Geocoder ──────► congressional district, state house/senate
   (FREE, unlimited,             district, county, place, school district
    no API key)                  GEOIDs
        │
        ▼
 Firestore districtLookupCache  (checked first — most addresses share a
        │                        district set, so this is what keeps you
        │  cache miss            free at real scale)
        ▼
 ┌─────────────┬──────────────────┬─────────────────────────┐
 │ Local offices│ State legislature│ Federal Congress         │
 │ (mayor, city │ via OpenStates   │ via Congress.gov         │
 │ council,     │ API (free tier)  │ (free)                   │
 │ county board,│                  │                          │
 │ school board)│                  │                          │
 │              │                  │                          │
 │ curated by   │                  │                          │
 │ YOU per city │                  │                          │
 │ in Firestore │                  │                          │
 └─────────────┴──────────────────┴─────────────────────────┘
        │
        ▼
   Result cached in Firestore, returned to user
```

### Important, non-obvious fact
**Google's Civic Information "Representatives" API shut down on April 30,
2025.** A lot of tutorials and Stack Overflow answers still reference it —
ignore them. The Census Geocoder replaces the *district-matching* half;
OpenStates + Congress.gov replace the *officeholder-name* half.

### What's genuinely free vs. what needs curation

| Data | Source | Cost | Coverage |
|---|---|---|---|
| Geocoding | Mapbox | Free up to 100k/mo | National |
| Districts (congressional, state house/senate, county, place, school) | Census Bureau Geocoder | Free, unlimited | National |
| State legislators (names, party, contact) | OpenStates API | Free tier | National, but rate-limited — cache aggressively |
| Federal legislators | Congress.gov API | Free | National |
| Mayor / city council / county board / school board | **No free national API exists** | Your labor | You (or moderators/community leaders) manually enter these per city in Firestore |
| Voting precincts | No reliable free national source | — | Sourced per-state from county election-board shapefiles if/when you need it — treat as a stretch goal, not v1 |

This is actually consistent with your city-by-city rollout plan: local office
data *has* to be curated per city anyway, so "one city at a time" isn't a
limitation, it's the natural onboarding unit.

## Firestore collections (v1 subset)

- `districtLookupCache/{districtSetKey}` — server-only cache of resolved reps per district combo
- `representatives/{id}` — curated + API-sourced officeholders (see `types/civic.ts`)
- `cities/{cityId}` — city metadata, FIPS codes, onboarding status
- `bills/{billId}` — (phase 2)
- `voiceRooms/{roomId}` — Agora room metadata (phase 2)
- `users/{uid}` — role: guest | citizen | moderator | community_leader | representative | administrator

Full rules in `firestore/firestore.rules`.

## Recommended build order (phased)

1. **Phase 1 (this drop):** Address lookup → representatives, for one pilot city/county. Manually seed `representatives` for local offices in that county.
2. **Phase 2:** Bills + plain-English AI summaries, linked to representatives via `sponsoredBillIds`.
3. **Phase 3:** Agora voice rooms, one per bill/representative/meeting.
4. **Phase 4:** Community groups, meetings, projects, video library, admin dashboard, moderation.
5. **Phase 5:** Multi-city expansion tooling (bulk city onboarding, self-serve local-office data entry for community leaders).

## Free-tier cost notes

- **Firebase Spark plan** covers Firestore, Auth, Hosting, and Cloud Messaging at low volume for free. Cloud Functions require the **Blaze (pay-as-you-go) plan**, but Blaze still has a free monthly quota — you only pay past it, and district-set caching keeps external API calls low.
- **Agora** offers ~10,000 free voice minutes/month — fine for a pilot; monitor usage per room.
- **Mapbox** free tier is per-request, not per-user, so caching geocoding results (which this design already does implicitly via the district cache) keeps you well under it.

## Pilot: St. Clair County, Illinois

Seeded via `scripts/seedStClairCounty.ts` with three verified, real records
(county board chairman, U.S. House IL-12, IL Senate District 56 — checked
against county/state government sites as of July 2026). Everything else —
the other 28 county board districts, every municipal mayor and city council
in the county (Belleville, Fairview Heights, O'Fallon, Cahokia Heights,
Collinsville, Swansea, Shiloh, etc.), and every school board — has no free
national data source and must be entered through **Admin → Representatives**
by hand. That's real, ongoing work; budget time for it before advertising
full county coverage. State House district varies by exact address within
the county (St. Clair spans several districts), so those are resolved live
per-address by the OpenStates lookup rather than pre-seeded.

## No sign-up, ad-supported model

- **Public site: zero accounts, zero paywall, including text and voice.**
  Every visitor is silently signed in with **Firebase Anonymous Auth**
  (`lib/useAnonymousIdentity.ts`) the first time they try to post or speak —
  no email, password, or visible login screen. They're asked once for a
  display name (`components/DisplayNamePrompt.tsx`), which is attached to
  everything they post. This resolves the earlier open question: guests can
  now speak in voice rooms too, as long as they've set a name.
- **Trade-off, stated plainly:** removing "registered users only" removes
  your main friction against flooding, ban evasion, and coordinated abuse —
  which matters more, not less, on a civic platform in the weeks before an
  election. Two mitigations are built in:
  - `functions/src/moderation/rateLimitGuard.ts` auto-flags any anonymous
    account posting more than 5 comments/questions in a minute and blocks
    further writes until a moderator clears it (`suspendedAuthors`
    collection, checked in `firestore.rules`).
  - Speaker tokens in `generateAgoraToken.ts` require a display name to be
    set before Agora issues a "publisher" (speaking) token — you can't
    speak with zero identity, even an anonymous one.
  - **Not yet built, worth adding before real traffic:** Firebase App Check
    (blocks scripted/bot traffic before it reaches your Cloud Functions —
    https://firebase.google.com/docs/app-check), and a staffed moderation
    queue. Automated flags only work if someone actually clears/acts on
    them, especially in the high-traffic weeks right before an election.
- **Admin dashboard is the one place that still requires real
  identity** — Google sign-in *and* an `administrator`/`moderator` role
  in `/users/{uid}`. Bootstrapped once via `setAdminRole.ts` (see comment
  header for the exact steps) — never from a public flow.

## Realistic timeline to the election

Illinois early voting/vote-by-mail opens **September 24, 2026** — about 8
weeks from today. Election Day is **November 3, 2026** — about 13 weeks
out. The full original spec (all 29 county board districts, every
municipal mayor/council in St. Clair County, every school board, community
groups, meetings/projects, a staffed moderation queue, AdSense-approved,
publicly advertised) is not realistically completed, verified, and safely
launched by one person in 8 weeks. Rather than claim it's done and have gaps
surface publicly during the highest-scrutiny window of the year, here's a
prioritized cut:

**Must have before Sept 24 (early voting):**
1. Find My Representatives working for the whole county — federal + state
   legislature resolve automatically; local offices need to be hand-entered
   (this is the actual bottleneck — budget real hours for it, see below).
2. Citizen Chat live with a real seed of videos (candidate intros, meeting
   recordings) — needed for both usefulness and AdSense review.
3. Anonymous text comments/questions on representative and bill pages,
   with the burst-guard live and at least one moderator actually watching
   the `flags` collection daily.
4. Privacy policy (`app/privacy/page.tsx`) and a basic terms/community
   guidelines page — not built yet, next logical file.
5. AdSense application submitted **early** — review can take days to weeks
   and requires a live, populated site; don't wait until October.

**Can follow after Sept 24, before Nov 3:**
6. Voice rooms (Agora) — the highest-abuse-risk feature per user; safer to
   launch it once you've seen how text moderation holds up under real
   traffic than to launch everything simultaneously.
7. Full county board (29 districts) and remaining municipalities/school
   boards — expand coverage progressively rather than blocking launch on
   100% completeness.

**Realistically Phase 5+, not this cycle:**
8. Community groups, meetings/projects hub, video library beyond Citizen
   Chat, AI legislation summaries, multi-city expansion tooling.

**The actual bottleneck is data entry, not code.** St. Clair County has
~29 county board districts plus mayors and councils in Belleville,
Fairview Heights, O'Fallon, Cahokia Heights, Collinsville, Swansea,
Shiloh, and more — that's 60–100+ individual records, each needing a name,
title, and verified contact info, and none of it has a free API. If you
want to hit real coverage by Sept 24, that data entry is the thing to
start on today, in parallel with the remaining build — not after.

## Google AdSense

- Site-wide script + `google-adsense-account` meta tag added in
  `app/layout.tsx`, using your publisher ID `ca-pub-1184595877548269`.
- `public/ads.txt` added with your authorized-seller line — **required** or
  AdSense will flag the site as unauthorized inventory and may not serve ads.
- `components/AdSlot.tsx` is a reusable ad unit — drop `<AdSlot slot="..." />`
  anywhere. You still need to create the actual ad units in your AdSense
  dashboard and swap in real slot IDs (placeholders won't serve ads).
- Ad density kept light on purpose (one slot at the top of Citizen Chat, one
  every 4 videos in the feed) — a civic-trust platform saturated with ads
  undercuts its own credibility, which matters more here than on a typical
  content site.
- AdSense review requires a live, populated site with real content and a
  privacy policy — plan to seed a reasonable number of real videos/pages
  before applying for review, not just placeholder content.

## Data integrity note (baked into the type model)

Every `Representative` record carries `lastVerifiedAt` and `dataSource`, and
every lookup response separates `representatives` (resolved) from
`unresolvedOffices` (known gaps). Never silently omit an office you couldn't
resolve — showing "we don't have verified data yet for County Board" is more
trustworthy than pretending it doesn't exist. That honesty is core to the
platform's neutrality mission.
