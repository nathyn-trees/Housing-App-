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
   location overlap, move-in timeline proximity, room-type compatibility,
   lifestyle compatibility, and a trust component (closer connections and
   vouches score higher).

Two people with identical stats are treated completely differently depending
on whether there's a path between them — a stranger with a perfect budget
match never appears; a friend-of-a-friend with a worse match still does,
credited to whoever connects you. That's the whole point.

This logic lives in `packages/shared` (`graph.ts` for the BFS,
`matching.ts` for scoring) and is covered by unit tests that encode the
"three friends who don't know each other" scenario directly.

The match feed (`/matches`) is a grid, not a swipe deck. With a pool this
small — dozens of people within your network, not an endless stream of
strangers — a swipe interaction encourages passing on a legitimately good,
vouched-for match on the "maybe the next one's better" instinct. A grid lets
you compare several at once, including the score breakdown (budget/area/
timing/lifestyle/trust) as small bars on each card, before acting on any of
them.

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
- `LifestyleProfile` — optional personal compatibility traits (cleanliness,
  how often you're home, how often you host, introvert/extrovert), one per
  user rather than per listing, since they don't change per search. A missing
  profile scores as neutral rather than penalizing the match — see
  `lifestyleScore` in `packages/shared/src/matching.ts`.

Every `User` also has a unique `inviteCode` (personal link at `/invite/{code}`)
and an optional `invitedById`. Signing up through someone's link auto-creates
an **ACCEPTED** `ConnectionRequest` between them — no request/accept step —
because handing someone your link is you vouching for them into the graph
directly. This is the intended growth loop: instead of dropping a group of
friends into a chat and hoping they sort out who's looking for what, you send
each of them your link and the app builds the graph (and shows them each
other, and anyone else in your network) automatically.

SQLite has no native enum support, so status/type fields (`urgency`,
`roomType`, connection `status`, etc.) are plain strings validated at the
application layer — see the comments above each model in
`packages/db/prisma/schema.prisma` for the allowed values.

## Trust & safety, and the rest of a real app

Beyond the core matching mechanic, this covers the baseline a housing app
needs before real strangers-of-friends use it:

- **Messaging.** Unlocked once two people are either an accepted connection
  or have *mutually* marked each other "interested" on the match feed — see
  `canMessage` in `apps/web/lib/messages.ts`. One-sided interest doesn't
  unlock it. Polling-based (no websockets), at `/messages`.
- **Mark as found/paused.** A need or offer can be set to `PAUSED` or `FOUND`
  (Onboarding / List a room pages), which immediately removes it from
  everyone's match feed — the schema always had this status field, but
  nothing let you change it until now.
- **Report and block.** Any profile has Report (goes to a minimal admin
  queue at `/admin/reports`, gated by the `ADMIN_EMAIL` env var) and Block
  (symmetric — you disappear from each other's matches, messaging, and
  profile pages, and any existing connection is severed).
- **Password reset and email verification.** Token-based, single-use,
  expiring. There's no real email provider wired up — `apps/web/lib/mailer.ts`
  just logs the link server-side — swap that one function for
  Resend/SES/Postmark/etc before real users need it. Email verification is a
  non-blocking nudge (a dismissible banner + resend button), not a signup
  gate.
- **Account deletion.** `/account` — requires re-entering your password,
  cascades through your need/offer/lifestyle/connections/messages/vouches
  via the `onDelete: Cascade` rules in `schema.prisma`. Deleting an inviter
  sets their invitees' `invitedById` to null instead of cascading (so
  deleting one account doesn't wipe out everyone they invited).
- **Terms of Service / Privacy Policy.** `/terms` and `/privacy` are
  explicitly labeled placeholders — standard MVP boilerplate, not reviewed by
  a lawyer. Signup requires checking a box agreeing to them, and records
  `termsAcceptedAt`, but the content itself needs real legal review before
  onboarding anyone who isn't testing the product for you. Also worth
  knowing: roommate-matching has a narrower Fair Housing carve-out than
  landlord listings in the U.S. — that carve-out disappears if this ever
  grows into people posting actual landlord units.
- **Rate limiting.** A minimal in-memory limiter (`apps/web/lib/rateLimit.ts`)
  on login, signup, password reset, and reporting. Good enough for a
  single-process deployment; a real multi-instance deployment needs a shared
  store (Redis) instead.
- **JWT secret.** `apps/web/lib/auth.ts` refuses to start in production
  without an explicit `JWT_SECRET` — no more falling back to the checked-in
  dev default.

Mobile gets full parity on messaging and a profile screen (with vouch/
report/block), since those are safety-relevant. Password reset and email
verification open the web pages in the device browser instead of
duplicating native screens — a normal pattern, not a shortcut that drops
functionality.

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
`.env*` files are gitignored. `apps/web/.env.example` also has `APP_URL`
(used to build the links in password-reset/verification emails) and
`ADMIN_EMAIL` (whoever's email matches this sees the "Admin" nav link and
`/admin/reports`). Copy `apps/mobile/.env.example` to `apps/mobile/.env` too
if you need to point the mobile app at a non-default API URL (e.g.
`http://10.0.2.2:3000` for the Android emulator, or your machine's LAN IP for
a physical device).

### Try the demo network

The seed script creates a small graph that mirrors the pitch exactly: **Nathyn**
knows **Alice**, **Bob**, **Cara**, and **Dana**, but Alice/Bob/Cara don't know
each other, and **Dana** has a room to offer. **Erin** and **Frank** are thrown
in with matching stats but zero connections, to prove they never show up.

All demo accounts use password `password123`. Log in as `alice@example.com`
and her match feed shows Bob, Cara, and Dana's room — each one "connected via
Nathyn" — while Erin and Frank, despite fitting her budget just as well, never
appear.

Alice, Bob, Cara, and Dana were all seeded as if they'd signed up through
Nathyn's invite link — check the seed script's console output for that link,
visit it, and sign up as a new person to see the same thing happen live: an
instant connection to Nathyn and immediate visibility into everyone else in
his network, no manual "add connection" step required. On the running app,
any logged-in user's own link is on the Connections page ("Invite someone
directly").

Alice and Cara also have identical seeded lifestyle profiles (tidy, home a
lot, keep to themselves) while Bob's is the opposite on every axis — despite
Bob's budget/timing overlapping reasonably with Alice's. Her match grid at
`/matches` shows this directly: Cara's lifestyle bar is full, Bob's is mostly
empty, and Cara outranks him even though a budget-only comparison wouldn't
have made that obvious.

Run `npm test` to run the matching engine's unit tests directly (no server
needed).

## What's deliberately out of scope for this MVP

- **Real social-graph import.** Connections are added by email today (like a
  friend request). Real contact-list / social-account linking (so the graph
  seeds itself instead of everyone re-adding each other) is the natural next
  step, and is where "friend of a friend" scale actually comes from.
- **Push notifications** for new matches, messages, incoming connection
  requests, etc. — right now you only find out by opening the app.
- **A real email provider and multi-admin moderation tooling.** The mailer
  and admin gate here are both intentionally minimal stand-ins (see above),
  not things to launch on as-is.
- **Postgres in production.** The Prisma schema is written to swap the
  `datasource` provider with no model changes needed.
