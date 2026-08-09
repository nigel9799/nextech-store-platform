begin;

create extension if not exists pgcrypto with schema extensions;
create extension if not exists citext with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.tenant_status as enum ('onboarding', 'active', 'suspended');
create type public.tenant_role as enum ('owner', 'administrator', 'catalogue_manager', 'enquiries_agent');
create type public.membership_status as enum ('invited', 'active', 'suspended');
create type public.pricing_mode as enum ('vat_inclusive', 'vat_exclusive');
create type public.site_revision_status as enum ('draft', 'published', 'superseded');
create type public.product_status as enum ('draft', 'live', 'hidden', 'archived');
create type public.media_kind as enum ('image', 'video');
create type public.media_status as enum ('draft', 'validated', 'published', 'rejected');
create type public.contact_field_type as enum ('short_text', 'multiline_text', 'email', 'phone', 'number', 'dropdown');
create type public.enquiry_status as enum ('new', 'contacted', 'closed');
create type public.order_enquiry_status as enum ('new', 'contacted', 'quoted', 'closed');
create type public.email_delivery_status as enum ('queued', 'provider_accepted', 'delivered', 'bounced', 'complained', 'failed');
create type public.legal_kind as enum ('privacy', 'terms', 'delivery_returns');
create type public.cart_status as enum ('active', 'submitted', 'expired');

comment on schema private is 'Non-exposed authorization and operational helpers.';
comment on type public.pricing_mode is 'Whether catalogue prices include VAT before any future order calculation.';

commit;
