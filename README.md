# Citizen Voice

Know Your Representatives. Understand the Laws. Shape Your Community.

## Quick start (fresh unzip)

```bash
npm install
cd functions && npm install && cd ..
npm run dev
```

Visit http://localhost:3000 — the site will load, but "Find My
Representatives," Citizen Chat, and the admin dashboard need Firebase wired
up first (see below) before they do anything.

## Full setup

See `DEPLOYMENT.md` for the complete sequence: Blaze plan upgrade, API
secrets, Firestore/Storage rules deploy, Cloud Functions deploy, App Hosting
setup, admin bootstrap, and seeding St. Clair County data.

See `ARCHITECTURE.md` for how the whole system fits together, what's free
vs. paid, and the prioritized roadmap toward the November election.

## Before you deploy anywhere

- Fill in `lib/firebaseClient.ts`'s config with your project's values (or
  set the `NEXT_PUBLIC_FIREBASE_*` env vars it reads from).
- Set every secret listed in `DEPLOYMENT.md` (`firebase functions:secrets:set ...`)
  before deploying functions — they'll fail at runtime without them.
- Never commit `functions/serviceAccountKey.json` if you generate one for
  the seed script — it's already in `.gitignore`.
