begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'build-images',
  'build-images',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists build_images_public_read on storage.objects;
create policy build_images_public_read
on storage.objects for select
to public
using (bucket_id = 'build-images');

comment on policy build_images_public_read on storage.objects is
  'Completed-build imagery is publicly readable; writes are performed only by authenticated server-side admin actions.';

commit;
