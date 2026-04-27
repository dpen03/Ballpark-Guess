# Workspace

## Overview

Ballpark Predict — a kid-friendly live baseball prediction game played at MLB stadium games. Kids in the stands compete in real time by guessing each batter's outcome (single, double, triple, home run, out, walk, strikeout), per-inning runs, total score, winner, HR hitters, total walks, and total strikeouts. Powered by a React + Vite frontend and an Express API backed by PostgreSQL via Drizzle ORM.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind, shadcn/ui, wouter, framer-motion, TanStack Query
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

- `artifacts/ballpark-bingo` — React + Vite web app (Ballpark Predict). Mounted at `/`.
- `artifacts/api-server` — Express API. Mounted at `/api`.

## Domain model

- `games` — room with code, away/home team, venue, status (lobby/live/final), host player. Optionally linked to a real MLB game via `mlb_game_pk` plus cached scoreboard fields (`mlb_detailed_state`, `mlb_away_score`, `mlb_home_score`, `mlb_current_inning`, `mlb_current_half`).
- `players` — joined kids with name, avatar, score totals.
- `at_bats` — batter, inning, half, status, actual outcome. For MLB-linked games, `mlb_at_bat_index` ties each row to a play in the live feed and at-bats are auto-created/auto-resolved.
- `at_bat_predictions` — per-player prediction of an at-bat outcome.
- `player_picks` — pre-game picks (winner, finals, HR hitters, walks, K's).
- `inning_guesses` — per-inning run guesses.
- `activity_events` — feed of resolved at-bats with awarded points.

## MLB integration

- Public MLB Stats API (`https://statsapi.mlb.com`). No auth needed.
- `GET /api/mlb/schedule?date=YYYY-MM-DD` lists today's games (defaults to US/Eastern today).
- `POST /api/mlb/games/:gamePk/join` is the primary entry point. There is no "host" anymore — anyone tapping an MLB game from the home list calls this endpoint, which find-or-creates the shared room for that `gamePk` and joins the player by name (avatar is upserted on re-join).
- `GET /api/mlb/games/:gamePk/roster` returns position players for both teams, used by the picks page so HR-hitter selection is tap-from-roster instead of free-text.
- `POST /api/games/:code/sync-mlb` pulls the live feed for a linked game, creates at-bats for new plays, resolves completed plays with the mapped outcome, and updates cached scoreboard fields. The player game page polls this every 12s, so games progress on their own — there is no separate host UI.
- Outcome mapping: `single`/`double`/`triple`/`home_run`/`walk`/`intent_walk` map directly; `strikeout*` → `strikeout`; everything else with `isOut` (or any other completed AB) → `out`.

## Authentication

- **Native username + password auth** (no third-party). `users` table holds `username` (unique, lowercased), `password_hash` (scrypt via `node:crypto`), `display_name`, `avatar`. `players.user_id` is a nullable FK back to users with a `players_game_user_unique` index so each user has exactly one player row per game.
- Session is a signed cookie `bp_uid` set by `setSessionCookie()` in `artifacts/api-server/src/lib/auth.ts`, signed with `SESSION_SECRET`, 60-day max-age, `sameSite=lax`, `httpOnly`, `secure` in production. `attachUser` middleware (mounted globally in `app.ts`) populates `req.user` for all routes; `requireUser` enforces auth.
- Routes: `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `PUT /api/auth/me` (display name + avatar). All in `artifacts/api-server/src/routes/auth.ts`.
- The web app gates everything behind an `<AuthGate>` in `App.tsx` that calls `useAuth()` (`src/lib/auth.tsx`). Unauthenticated users see `/pages/auth.tsx` (sign in / sign up with avatar picker). Same-origin proxy means cookies just flow without changing `lib/api-client-react/src/custom-fetch.ts`.
- Joining games: both `POST /api/games` and the join endpoints (`POST /api/games/:code/join`, `POST /api/mlb/games/:gamePk/join`) now require auth, derive `name`+`avatar` from the authenticated user, and find-or-create the `players` row by `(gameId, userId)` so re-joining is idempotent.

## Frontend identity & local storage

- The authenticated user (`/api/auth/me`) is the source of truth for display name + avatar. The legacy `ballpark-identity` localStorage key still exists in `src/lib/identity.ts` for the avatar emoji catalog, but no longer drives identity.
- Per-game session (player UUID + game code) is still cached in `localStorage` under `ballpark-session-{code}` (see `src/lib/session.ts`) so the predict mutation can send `playerId` without an extra round trip.
- `ballpark-history` (see `src/lib/history.ts`) stores up to 50 past games per device with score, accuracy, rank, and team names — fed into the `/stats` page for "past scores" and aggregate stats.
- `ballpark-muted` toggles all sound effects (see `src/lib/sounds.ts`).

## Scoring rules

- Base points per correct pick: 1B=100, 2B=200, 3B=400, HR=600, OUT=75, BB=250, K=250 (see `artifacts/api-server/src/lib/scoring.ts`).
- **7th-inning stretch**: all points doubled when the at-bat happens in the 7th inning. Surfaced in the UI as a "Stretch 2x" badge on the scoreboard and "2x Points" pill on the at-bat header; pick buttons display the doubled value.

## Sound + animation system

- Sound effects are synthesized at runtime using Web Audio (`src/lib/sounds.ts`), no asset downloads. Hooks: `tap`, `lock`, `unlock`, `correct`, `wrong`, `countdown`, `buzzer`, `cheer`, `scoreUp`. Mute toggle on the stats page persists in localStorage.
- Per-pick countdown timer (`src/components/countdown-pill.tsx`) shows seconds remaining and ticks audibly in the final 5 seconds.
- Lock-in animation (`src/components/lock-burst.tsx`) renders a sparking ring burst over the selected pick. Picks can be changed by tapping a different outcome (calls predict again, plays unlock+lock sounds).

## Team branding

- `src/lib/teams.ts` maps all 30 MLB teams to ESPN CDN logos and primary/secondary brand colors. `src/components/team-badge.tsx` exposes `<TeamLogo>` (rounded transparent PNG) and `<TeamChip>` (color-tinted abbreviation pill). Used on home cards, scoreboard (with team-color gradient overlay), and stats page.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
