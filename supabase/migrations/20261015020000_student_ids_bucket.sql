-- Private storage for student ID photos.
-- The bucket is NOT public: photos are served only through the admin-only route /api/admin/student-id/[playerId],
-- and are deleted as soon as an admin approves or rejects the ID (or after 30 days if nobody reviews it).
-- Safe to run again.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('student-ids', 'student-ids', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
