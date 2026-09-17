begin;

grant insert, update, delete on public.product_categories, public.products,
  public.product_images to authenticated;
grant insert, update on public.site_settings to authenticated;

create policy product_categories_catalogue_insert
on public.product_categories for insert to authenticated
with check ((select private.has_tenant_role(
  tenant_id,
  array['owner', 'administrator', 'catalogue_manager']::public.tenant_role[]
)));

create policy product_categories_catalogue_update
on public.product_categories for update to authenticated
using ((select private.has_tenant_role(
  tenant_id,
  array['owner', 'administrator', 'catalogue_manager']::public.tenant_role[]
)))
with check ((select private.has_tenant_role(
  tenant_id,
  array['owner', 'administrator', 'catalogue_manager']::public.tenant_role[]
)));

create policy product_categories_catalogue_delete
on public.product_categories for delete to authenticated
using ((select private.has_tenant_role(
  tenant_id,
  array['owner', 'administrator', 'catalogue_manager']::public.tenant_role[]
)));

create policy products_catalogue_insert
on public.products for insert to authenticated
with check ((select private.has_tenant_role(
  tenant_id,
  array['owner', 'administrator', 'catalogue_manager']::public.tenant_role[]
)));

create policy products_catalogue_update
on public.products for update to authenticated
using ((select private.has_tenant_role(
  tenant_id,
  array['owner', 'administrator', 'catalogue_manager']::public.tenant_role[]
)))
with check ((select private.has_tenant_role(
  tenant_id,
  array['owner', 'administrator', 'catalogue_manager']::public.tenant_role[]
)));

create policy products_catalogue_delete
on public.products for delete to authenticated
using ((select private.has_tenant_role(
  tenant_id,
  array['owner', 'administrator', 'catalogue_manager']::public.tenant_role[]
)));

create policy product_images_catalogue_insert
on public.product_images for insert to authenticated
with check ((select private.has_tenant_role(
  tenant_id,
  array['owner', 'administrator', 'catalogue_manager']::public.tenant_role[]
)));

create policy product_images_catalogue_update
on public.product_images for update to authenticated
using ((select private.has_tenant_role(
  tenant_id,
  array['owner', 'administrator', 'catalogue_manager']::public.tenant_role[]
)))
with check ((select private.has_tenant_role(
  tenant_id,
  array['owner', 'administrator', 'catalogue_manager']::public.tenant_role[]
)));

create policy product_images_catalogue_delete
on public.product_images for delete to authenticated
using ((select private.has_tenant_role(
  tenant_id,
  array['owner', 'administrator', 'catalogue_manager']::public.tenant_role[]
)));

create policy site_settings_website_insert
on public.site_settings for insert to authenticated
with check ((select private.has_tenant_role(
  tenant_id,
  array['owner', 'administrator']::public.tenant_role[]
)));

create policy site_settings_website_update
on public.site_settings for update to authenticated
using ((select private.has_tenant_role(
  tenant_id,
  array['owner', 'administrator']::public.tenant_role[]
)))
with check ((select private.has_tenant_role(
  tenant_id,
  array['owner', 'administrator']::public.tenant_role[]
)));

create trigger product_categories_audit
after insert or update or delete on public.product_categories
for each row execute function private.audit_tenant_change();

create trigger products_audit
after insert or update or delete on public.products
for each row execute function private.audit_tenant_change();

comment on policy products_catalogue_insert on public.products is
  'Owners, administrators and catalogue managers may create products for their active tenant.';

commit;
