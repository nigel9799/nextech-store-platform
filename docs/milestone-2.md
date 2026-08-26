# Milestone 2: tenant resolution and secure administration

## Delivered

- Normalized hostname resolution with verified-domain lookup and an explicit local/test tenant fallback. Production cannot use the fallback.
- Supabase SSR cookie refresh in `proxy.ts`, server-verified users, uncached admin routes, and fail-closed tenant handling.
- Invitation-only email/password accounts, password recovery, invite confirmation, password setup, logout, and generic anti-enumeration messages.
- Secure password-only authentication for invited administrator accounts. MFA is intentionally deferred during development.
- Owner, administrator, catalogue manager, and enquiries agent permission mapping.
- Owner-only invitations, role changes, suspension/reactivation, second-owner protection, and immediate revocation.
- Tenant-neutral profile creation and immutable redacted audit records for membership/domain changes.
- Reference-style responsive admin login, 245px desktop sidebar, compact tablet/mobile navigation, and square dense controls.

## Local-only test accounts

Run `npm run db:start`, `npm run db:reset`, then `npm run auth:local:setup`.

- Owner: `owner@local.nextech.test`
- Password: `Nextech-local-test-2026!`
- Recovery owner: `recovery-owner@local.nextech.test`
- Mailpit/Inbucket: `http://127.0.0.1:54324`

These fixtures are deliberately synthetic, are created only through a loopback Supabase URL, and must never be used outside local testing.

## Security behavior

- Public signup is disabled; the UI has no registration route.
- `getUser()` verifies identity server-side. Editable user metadata never grants a role.
- Admin context resolves the tenant independently of browser input, then checks the database membership on every request.
- Password-authenticated sessions remain subject to tenant-scoped RLS, active membership checks, and least-privilege role permissions on every protected request and mutation.
- Suspending a membership makes authorization helpers fail immediately; the next protected request signs the browser session out.
- The final active owner cannot be suspended or demoted.
- Service-role use is limited to server-only tenant resolution, Auth invitations/user lookup, and self-activation of a verified invited membership.

## Owner inputs needed later

- Initial owner and separate recovery-owner email addresses.
- Staff email addresses and approved roles.
- Staging and production admin/domain hostnames and redirect URLs.
- Resend-backed Supabase Auth SMTP and reviewed invitation/recovery wording.
- A production authentication review. MFA is deferred because it disrupted development testing, but must be reconsidered, threat-modelled, and explicitly approved before production launch.

No production account, database, deployment, service, or domain is configured by this milestone.
