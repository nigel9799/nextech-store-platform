# Nextech Store Platform Agent Rules

## Scope and architecture

- Use standard Next.js App Router, TypeScript, Tailwind CSS, Supabase, Resend, and Vercel.
- Use Server Components by default and Client Components only for interaction.
- Resolve tenant context from a verified hostname. Never trust `tenant_id` from client input.
- Keep database, email, privileged Auth, secrets, and service-role code server-only.
- Access tenant data through tenant-aware server repositories and validated domain commands.
- Do not add a payment provider, checkout, payment route, payment table, or Stripe dependency without a separately approved milestone.

## Data and security

- Every tenant-owned record must contain `tenant_id`, including child records.
- Enable and force RLS in the same migration that creates an exposed table.
- Add positive same-tenant and negative cross-tenant/wrong-role/anonymous tests with every policy.
- Normal admin writes use the authenticated Supabase client. Service-role use must be isolated, justified, and independently tenant-scoped.
- Validate and authorize every Server Action and Route Handler; never rely on UI visibility for authorization.
- MFA/AAL2 is temporarily deferred for development. Reconsider and explicitly approve it as a security feature before production launch; do not enable or require it in the current milestone.
- Store money as integer minor units and VAT rates as basis points. Nextech catalogue prices are VAT-inclusive final retail prices.
- Never store business data in `localStorage` or expose secrets through `NEXT_PUBLIC_` variables.
- Do not store or render unrestricted HTML. Validate links and uploaded MIME type, extension, and size.
- Redact secrets and customer PII from logs and audit metadata.
- Schema changes are migrations. Do not make untracked remote dashboard schema changes.

## Design and accessibility

- Preserve the approved premium dark technical Nextech design and `#2590a4` primary colour.
- Preserve the reference breakpoints at approximately 900px, 700px, 600px, and 580px where applicable.
- Build responsive components from the reference source; never use screenshots as page implementations.
- Maintain accessible labels, keyboard controls, focus states, contrast, error messages, and reduced-motion behavior.

## Testing and delivery

- Add tests with every migration, RLS policy, role, mutation, and public endpoint.
- Before handoff, run format check, lint, typecheck, unit tests, migration checks, secret checks, database tests when Docker is available, end-to-end tests, and a production build.
- Keep local, staging, and production data and secrets isolated.
- Never configure a production service or connect the Nextech production domain without explicit approval after staging acceptance.
- Implement one approved milestone at a time and stop at its completion gate.
