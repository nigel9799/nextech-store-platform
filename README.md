# Nextech Store Platform

Production foundation for Nextech Malta's runtime-ready white-label storefront. Milestone 1 establishes the standard Next.js/Vercel application, design tokens, local Supabase schema and RLS baseline, CI, and test harness. Storefront, authentication, admin, catalogue, and enquiry behavior intentionally remain outside this milestone.

## Requirements

- Node.js 24.x LTS
- npm 11 or newer
- Docker Desktop for the local Supabase stack and pgTAP database tests

## Configure

Copy `.env.example` to `.env.local` and replace the local Supabase public values after starting Supabase. Do not put a service-role key in any `NEXT_PUBLIC_` variable.

```powershell
Copy-Item .env.example .env.local
npm run db:start
```

Use the API URL and publishable key printed by `supabase start`. The Milestone 1 page does not query Supabase, so it can also be viewed before local database configuration.

## Run

```powershell
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Verify

```powershell
npm run verify
npm run test:e2e
npm run db:start
npm run db:reset
npm run test:db
```

`npm run verify` checks formatting, lint, TypeScript, unit tests, migration structure/RLS declarations, secret boundaries, and the production build. Database tests require Docker because Supabase runs Postgres locally in containers.

## Database workflow

- Forward migrations live in `supabase/migrations` and are applied in filename order.
- Rehearsal rollback SQL lives in `supabase/rollbacks` and is never applied automatically in production.
- pgTAP tests live in `supabase/tests`.
- Schema changes must be made through versioned migrations, not dashboard-only edits.

Milestone 1 does not create or modify any remote Supabase, Vercel, DNS, Resend, Turnstile, or production resource.
