-- =========================================================
-- RentoRide — Storage Buckets Setup
-- Run AFTER 001_schema.sql
-- =========================================================

-- vehicle-photos: PUBLIC bucket — anyone can view (needed for bikes.html
-- image tags to render without auth), only the uploading owner can write.
insert into storage.buckets (id, name, public)
values ('vehicle-photos', 'vehicle-photos', true)
on conflict (id) do nothing;

-- owner-documents: PRIVATE bucket — RC/insurance/ID proof. Never public.
-- Only the owner who uploaded it and admins can read; nobody else.
insert into storage.buckets (id, name, public)
values ('owner-documents', 'owner-documents', false)
on conflict (id) do nothing;


-- ---------------------------------------------------------
-- vehicle-photos policies
-- ---------------------------------------------------------

drop policy if exists "vehicle_photos_public_read" on storage.objects;
create policy "vehicle_photos_public_read" on storage.objects
  for select using (bucket_id = 'vehicle-photos');

drop policy if exists "vehicle_photos_owner_write" on storage.objects;
create policy "vehicle_photos_owner_write" on storage.objects
  for insert with check (
    bucket_id = 'vehicle-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "vehicle_photos_owner_delete" on storage.objects;
create policy "vehicle_photos_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'vehicle-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );


-- ---------------------------------------------------------
-- owner-documents policies — owner + admin only, never public
-- ---------------------------------------------------------

drop policy if exists "owner_documents_owner_read" on storage.objects;
create policy "owner_documents_owner_read" on storage.objects
  for select using (
    bucket_id = 'owner-documents'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or is_admin()
    )
  );

drop policy if exists "owner_documents_owner_write" on storage.objects;
create policy "owner_documents_owner_write" on storage.objects
  for insert with check (
    bucket_id = 'owner-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Uploads are organized as: {bucket}/{owner_id}/{timestamp}_{filename}
-- which is exactly what list-vehicle.js's uploadFile() produces —
-- the foldername(name))[1] check above relies on that convention.
