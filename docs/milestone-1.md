# Milestone 1 completion and migration notes

## Delivered

- Standard Next.js App Router project for Vercel; the vinext/Vite/Cloudflare demo runtime was not imported.
- Approved Nextech colour, grid, hero proportions, typography variables, 900px/580px breakpoints, square controls, focus treatment, and reduced-motion baseline.
- Browser, server-session, and service-role Supabase client boundaries.
- Local Supabase configuration with public signup disabled.
- Foundation enums, tenant identity tables, indexes, constraints, update triggers, forced RLS, private authorization helpers, and baseline policies.
- Rehearsal rollback SQL for every migration.
- Unit, browser, static migration, client-secret, and pgTAP test harnesses.
- CI workflow and repository-level implementation/security rules.

## Migration order

1. `0001_extensions_enums.sql` creates extensions, the private schema, roles, and lifecycle enums.
2. `0002_tenancy_identity.sql` creates tenants, domains, profiles, memberships, audit logs, constraints, indexes, triggers, grants, and forced RLS.
3. `0003_rls_helpers.sql` creates private membership/role helpers and baseline select/self-profile policies.

Rollback scripts must be rehearsed only against an expendable local database. Production schema rollback will use a reviewed forward fix or a confirmed backup restore rather than blindly running destructive down SQL.

## Manual QA

1. Run `npm run dev` and open the root page at 1440px, 900px, and 390px widths.
2. Confirm the dark technical foundation, teal `#2590a4`, CSS PC tower, grid, readable focus ring, and responsive stacking.
3. Confirm the page describes only Milestone 1 and exposes no admin login, cart, checkout, or demo credentials.
4. Inspect the browser bundle/source and confirm no service-role key or real secret exists.
5. With Docker Desktop running, run `npm run db:start`, `npm run db:reset`, and `npm run test:db`.
6. Confirm Supabase Studio shows RLS enabled and forced for all five public foundation tables.

## Deferred by design

Tenant routing, Auth UI/MFA, storefront data, catalogue/admin CRUD, cart, enquiries, email, media upload, publishing, staging, and production remain later milestones.
