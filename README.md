# Nextech Store Platform

Launch-ready catalogue and enquiry store for Nextech Malta. The application includes a responsive storefront, tenant-scoped administration, product and category management, essential brand settings and WhatsApp-based cart enquiries. Online payment is intentionally deferred.

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

For the admin login, create the clearly labelled local-only fixture accounts and `.env.local` after Supabase starts:

```powershell
npm run db:reset
npm run auth:local:setup
```

This creates no remote account. The local owner is `owner@local.nextech.test` with password `Nextech-local-test-2026!`. Local captured invitation and recovery emails are available at [http://127.0.0.1:54324](http://127.0.0.1:54324).

## Run

```powershell
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Open [http://127.0.0.1:3000/admin/login](http://127.0.0.1:3000/admin/login) to test administration after local Auth setup.

Catalogue administration is available at:

- `/admin/catalogue/products`
- `/admin/catalogue/categories`
- `/admin/settings`

See [`docs/simple-launch.md`](docs/simple-launch.md) for the production launch checklist.

## Verify

```powershell
npm run verify
npm run test:e2e
npm run db:start
npm run db:reset
npm run test:db
npm run test:e2e:auth
```

`npm run verify` checks formatting, lint, TypeScript, unit tests, migration structure/RLS declarations, secret boundaries, and the production build. Database tests require Docker because Supabase runs Postgres locally in containers.

## Database workflow

- Forward migrations live in `supabase/migrations` and are applied in filename order.
- Rehearsal rollback SQL lives in `supabase/rollbacks` and is never applied automatically in production.
- pgTAP tests live in `supabase/tests`.
- Schema changes must be made through versioned migrations, not dashboard-only edits.

The local fixture script refuses non-local Supabase URLs. No workflow in Milestone 2 creates or modifies a remote Supabase, Vercel, DNS, Resend, Turnstile, or production resource.

## Production inputs still required

Before a later staging/production milestone, the owner must provide the initial owner and recovery-owner email addresses, staff invitations and roles, approved admin/staging domains, Auth redirect URLs, and Resend-backed Supabase Auth SMTP. Never reuse the local fixture emails or passwords.

MFA remains deferred for the simple launch and should be enabled as the first security upgrade after the initial production release. Use a unique strong owner password and do not reuse the local fixture credentials.
