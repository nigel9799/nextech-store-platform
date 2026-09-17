# Nextech simple launch

This release intentionally launches a catalogue-and-enquiry store rather than
online card checkout. Customers can browse live products, build a cart and send
the complete enquiry to Nextech through WhatsApp. No payment is taken online.

## Included

- Responsive Nextech storefront and legal pages
- Secure password-based administration
- Product and category creation, editing, visibility and removal
- Automatic slugs and display ordering
- EUR VAT-inclusive price entry
- Optional HTTPS product image links
- Essential brand, announcement and contact settings
- WhatsApp cart and contact enquiries
- Tenant-scoped RLS and role permissions

## Production services required

1. Create a hosted Supabase project.
2. Apply all migrations in `supabase/migrations` in filename order.
3. Create the Nextech tenant, verified production hostname and first owner
   membership. Never reuse the local fixture account or password.
4. Add the production environment variables to Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `APP_ENV=production`
   - `AUTH_REDIRECT_BASE_URL=https://<production-hostname>`
5. Do not configure `DEFAULT_TENANT_SLUG` in production.
6. Configure the same production hostname in `tenant_domains`, with
   `verified_at` populated only after DNS ownership is verified.
7. In Supabase Auth, add the production callback URL and invite the real owner.
8. Seed or create the initial categories and products through the admin pages.

## Safe deployment order

1. Deploy to a protected preview and add its hostname to `tenant_domains`.
2. Test owner login, category creation, product creation and WhatsApp enquiry.
3. Confirm Draft/Hidden/Archived products do not appear publicly.
4. Attach the production domain and verify DNS.
5. Update `tenant_domains` and `AUTH_REDIRECT_BASE_URL` for the production host.
6. Deploy again and perform the final public check.

## Deferred upgrades

- Card payments and order processing
- Stored customer enquiries and email delivery
- Stock quantities and inventory alerts
- Direct image uploads and transformations
- Advanced page/content editor
- MFA and production security hardening
- Analytics, promotions, discount codes and delivery calculations
