# Nearby — housing through people you trust

The pitch: word-of-mouth roommate/apartment matching (three friends who don't
know each other but would all get along, "my friend has a spare room," etc.)
already works, but it doesn't scale past one well-connected person's memory.
Nearby turns that into a private, ranked feed — housing needs and room offers
are only ever surfaced to people within a few degrees of separation in your
actual social graph, with mutual-connection context ("connected via Nathyn")
and vouches as trust signals, instead of a public Marketplace-style wall of
strangers.

## How the core mechanic works

1. A user privately states what they need (budget, move-in timeline, urgency,
   room type) or what they have (a room to fill).
2. The app builds a trust graph from accepted connections between users.
3. For any pair of users, it computes **degrees of separation** via BFS over
   that graph, capped at 3 hops.
4. A candidate is only ever surfaced if:
   - they're reachable within that cap, **and**
   - the viewer's distance to them is within *their own* visibility setting
     (each need/offer has a privacy dial: direct connections only / friends
     of friends / up to 3 degrees).
5. Surfaced candidates are ranked by a blended score: budget overlap,
   location overlap, move-in timeline proximity, room-type compatibility, and
   a trust component (closer connections and vouches score higher).

Two people with identical stats are treated completely differently depending
on whether there's a path between them — a stranger with a perfect budget
match never appears; a friend-of-a-friend with a worse match still does,
credited to whoever connects you. That's the whole point.

This logic lives in `packages/shared` (`graph.ts` for the BFS,
`matching.ts` for scoring) and is covered by unit tests that encode the
"three friends who don't know each other" scenario directly.

## Structure

Monorepo (npm workspaces):

```
apps/
  web/      Next.js 14 (App Router) — web UI + the REST API both clients use
  mobile/   Expo (React Native + Expo Router) — mobile UI, same API
packages/
  db/       Prisma schema (SQLite for dev; swap to Postgres for prod) + seed
  shared/   Degree-of-separation graph + matching/scoring engine, with tests
```

The web app *is* the backend — `apps/web/app/api/**/route.ts` are the REST
endpoints. The mobile app is a pure API client with no server of its own.
Auth: signup/login return a JWT both as an httpOnly cookie (web) and in the
JSON body (`token`) for the mobile app to store in `SecureStore` and send as
`Authorization: Bearer <token>`.

## Data model

- `User` — account info.
- `ConnectionRequest` — an edge in the trust graph (`PENDING` until the
  recipient accepts, then `ACCEPTED`).
- `HousingNeed` — "I'm looking for a place," with a `visibility` field
  controlling max degrees of separation.
- `HousingOffer` — "I have a room," mirrors `HousingNeed`.
- `Vouch` — a trust signal one direct connection leaves for another.
- `MatchAction` — records "interested" / "passed" so the feed doesn't repeat
  itself.

SQLite has no native enum support, so status/type fields (`urgency`,
`roomType`, connection `status`, etc.) are plain strings validated at the
application layer — see the comments above each model in
`packages/db/prisma/schema.prisma` for the allowed values.

## Running it locally

```bash
npm install

# set up the database (SQLite file, seeded with a demo network)
npm run db:generate
npm run db:push
npm run db:seed

# web app + API, http://localhost:3000
npm run dev:web

# mobile app (Expo)
npm run dev:mobile
```

First copy `apps/web/.env.example` to `apps/web/.env.local` (and
`packages/db/.env.example` to `packages/db/.env`) — neither is committed since
`.env*` files are gitignored. Copy `apps/mobile/.env.example` to
`apps/mobile/.env` too if you need to point the mobile app at a non-default
API URL (e.g. `http://10.0.2.2:3000` for the Android emulator, or your
machine's LAN IP for a physical device).

### Try the demo network

The seed script creates a small graph that mirrors the pitch exactly: **Nathyn**
knows **Alice**, **Bob**, **Cara**, and **Dana**, but Alice/Bob/Cara don't know
each other, and **Dana** has a room to offer. **Erin** and **Frank** are thrown
in with matching stats but zero connections, to prove they never show up.

All demo accounts use password `password123`. Log in as `alice@example.com`
and her match feed shows Bob, Cara, and Dana's room — each one "connected via
Nathyn" — while Erin and Frank, despite fitting her budget just as well, never
appear.

Run `npm test` to run the matching engine's unit tests directly (no server
needed).

## What's deliberately out of scope for this MVP

- **Real social-graph import.** Connections are added by email today (like a
  friend request). Real contact-list / social-account linking (so the graph
  seeds itself instead of everyone re-adding each other) is the natural next
  step, and is where "friend of a friend" scale actually comes from.
- **Messaging.** Once two people mark mutual interest, there's no in-app chat
  yet — that's the obvious next feature.
- **Push notifications** for new matches, incoming connection requests, etc.
- **Postgres in production.** The Prisma schema is written to swap the
  `datasource` provider with no model changes needed.
