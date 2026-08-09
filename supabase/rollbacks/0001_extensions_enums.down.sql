begin;
drop type if exists public.cart_status;
drop type if exists public.legal_kind;
drop type if exists public.email_delivery_status;
drop type if exists public.order_enquiry_status;
drop type if exists public.enquiry_status;
drop type if exists public.contact_field_type;
drop type if exists public.media_status;
drop type if exists public.media_kind;
drop type if exists public.product_status;
drop type if exists public.site_revision_status;
drop type if exists public.pricing_mode;
drop type if exists public.membership_status;
drop type if exists public.tenant_role;
drop type if exists public.tenant_status;
drop schema if exists private;
-- pgcrypto and citext are intentionally retained because another schema may use them.
commit;
