begin;
drop policy if exists build_images_public_read on storage.objects;
delete from storage.objects where bucket_id = 'build-images';
delete from storage.buckets where id = 'build-images';
commit;
