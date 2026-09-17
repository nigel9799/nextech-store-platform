begin;

-- Reconcile the least-privilege server grants used by the storefront and
-- administration service. These grants are intentionally repeated here so an
-- environment restored from a partial migration history reaches the same
-- permissions as a clean installation.
grant select, insert, update, delete
  on public.tenants, public.tenant_domains, public.profiles,
  public.tenant_users, public.audit_logs
  to service_role;

grant select, insert, update, delete
  on public.site_settings, public.navigation_items, public.content_sections,
  public.legal_pages, public.product_categories, public.products,
  public.product_images
  to service_role;

grant usage, select on sequence public.audit_logs_id_seq to service_role;

commit;
