# Going All-Firebase: What You Need + Setup Commands

## What you need enabled (you have Firestore, Auth, Storage already)

| Product | Why | Plan required |
|---|---|---|
| Firestore | All app data | Spark (free) is fine at low volume |
| Authentication | Anonymous auth (silent) + Google sign-in (admin only) | Spark is fine |
| Storage | Video/photo uploads | Spark is fine at low volume |
| **Cloud Functions** | `findMyRepresentatives`, `generateAgoraToken`, `setAdminRole`, moderation triggers | **Requires Blaze** (pay-as-you-go). Still has a free monthly quota — you only pay past it. Needed because these functions make outbound calls to Mapbox/Census/OpenStates/Congress.gov/Agora, which the Spark plan blocks. |
| **App Hosting** | Hosts the Next.js frontend itself, with SSR | Requires Blaze |
| Secret Manager (via Firebase secrets) | Stores your Mapbox/OpenStates/Congress.gov/Agora keys server-side | Included once on Blaze |

**Bottom line: you need to upgrade to Blaze.** There's no way to run Cloud Functions or App Hosting on Spark. Blaze has a real free tier underneath it (2M function invocations/month, etc.) — you will very likely pay $0 at pilot scale, but the plan itself must be Blaze. Upgrade at:
`https://console.firebase.google.com/project/citizen-voice-talk/usage/details`

## Setup commands, in order

```bash
# 1. Upgrade to Blaze first (console link above — CLI can't do this step)

# 2. From inside ~/citizenvoice after the reorg script:
firebase login
firebase use citizen-voice-talk

# 3. Install functions dependencies
cd functions
npm init -y
npm install firebase-admin firebase-functions agora-access-token
npm install -D typescript @types/node
cd ..

# 4. Set your API keys as Firebase secrets (never in .env, never committed)
firebase functions:secrets:set MAPBOX_SERVER_TOKEN
firebase functions:secrets:set OPENSTATES_API_KEY
firebase functions:secrets:set CONGRESS_GOV_API_KEY
firebase functions:secrets:set AGORA_APP_ID
firebase functions:secrets:set AGORA_APP_CERTIFICATE
firebase functions:secrets:set ADMIN_SETUP_SECRET   # your own one-time value

# 5. Deploy Firestore rules, indexes, and Storage rules
firebase deploy --only firestore:rules,firestore:indexes,storage

# 6. Deploy Cloud Functions
firebase deploy --only functions

# 7. Set up App Hosting for the Next.js frontend (GA, replaces the old
#    static-export hosting flow — this is the currently-recommended path
#    for SSR frameworks)
firebase init apphosting
firebase apphosting:backends:create --project citizen-voice-talk
# Follow the prompts to connect your GitHub repo — App Hosting deploys
# automatically on push once connected.
```

## After first deploy: bootstrap your admin account

1. Visit your deployed site, click anything that triggers sign-in inside
   `/admin` (or just go to `/admin` and click "Sign in with Google").
2. This creates your Firebase Auth user with a default `citizen` role.
3. Grant yourself admin (run once, from your machine — never from the browser):
   ```bash
   # Get your uid from Firebase Console > Authentication > Users
   curl -X POST \
     https://us-central1-citizen-voice-talk.cloudfunctions.net/setAdminRole \
     -H "Content-Type: application/json" \
     -d '{"data": {"uid": "YOUR_UID_HERE", "setupSecret": "YOUR_ADMIN_SETUP_SECRET"}}'
   ```
4. Refresh `/admin` — you should now see the dashboard.

## Seed St. Clair County data

```bash
cd scripts
# Download a service account key first: Firebase Console > Project Settings
# > Service Accounts > Generate new private key > save as serviceAccountKey.json
# in this scripts/ folder. Add it to .gitignore immediately.
npm install firebase-admin
npx ts-node seedStClairCounty.ts
```
