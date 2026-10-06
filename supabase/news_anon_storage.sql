-- Allow booth file uploads without Auth (matches news_anon_write.sql).
-- Run after news_attachments.sql (bucket must exist).
-- Tighten later: drop anon policies and keep authenticated-only.

-- Ensure bucket exists
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'booth-news',
  'booth-news',
  false,
  10485760,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/png',
    'image/jpeg',
    'image/webp'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "booth_news_select" on storage.objects;
drop policy if exists "booth_news_insert" on storage.objects;
drop policy if exists "booth_news_update" on storage.objects;
drop policy if exists "booth_news_delete" on storage.objects;

create policy "booth_news_select" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'booth-news');

create policy "booth_news_insert" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'booth-news');

create policy "booth_news_update" on storage.objects
  for update to anon, authenticated
  using (bucket_id = 'booth-news')
  with check (bucket_id = 'booth-news');

create policy "booth_news_delete" on storage.objects
  for delete to anon, authenticated
  using (bucket_id = 'booth-news');
