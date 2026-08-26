# Milestone 3 — Public storefront

Milestone 3 adds the tenant-aware Nextech public storefront: the approved dark technical hero, announcement banner, responsive navigation, compact catalogue with the approved categories, development seed catalogue, custom-build/contact presentation, services, footer, and legal routes.

Catalogue and content schema is server-owned and protected by forced RLS. The storefront repository resolves tenant context from the verified request hostname and reads through a server-only service client. Development seed rows are local-only fixtures and must be replaced with reviewed production content later.

The cart and contact form are intentionally presentational in this milestone. They do not persist business data, send email, create enquiries, or manage orders; those are Milestone 5 concerns. Product/category administration is deferred to Milestone 4.

Password-only authentication remains the local development mode. MFA/AAL2 is deliberately deferred and must be reconsidered and explicitly approved as a production security feature before launch.
