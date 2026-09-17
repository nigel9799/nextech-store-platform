begin;

drop trigger if exists products_audit on public.products;
drop trigger if exists product_categories_audit on public.product_categories;

drop policy if exists site_settings_website_update on public.site_settings;
drop policy if exists site_settings_website_insert on public.site_settings;
drop policy if exists product_images_catalogue_delete on public.product_images;
drop policy if exists product_images_catalogue_update on public.product_images;
drop policy if exists product_images_catalogue_insert on public.product_images;
drop policy if exists products_catalogue_delete on public.products;
drop policy if exists products_catalogue_update on public.products;
drop policy if exists products_catalogue_insert on public.products;
drop policy if exists product_categories_catalogue_delete on public.product_categories;
drop policy if exists product_categories_catalogue_update on public.product_categories;
drop policy if exists product_categories_catalogue_insert on public.product_categories;

revoke insert, update on public.site_settings from authenticated;
revoke insert, update, delete on public.product_images, public.products,
  public.product_categories from authenticated;

commit;
