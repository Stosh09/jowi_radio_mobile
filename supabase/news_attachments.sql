-- JOWI 98.1 FM — news bulletin attachments (run after base schema.sql)
-- Supabase SQL Editor → paste → Run

alter table public.news_bulletins
  add column if not exists attachment_path text,
  add column if not exists attachment_name text,
  add column if not exists attachment_mime text;

-- Private booth documents (authenticated presenters only)
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
  for select to authenticated
  using (bucket_id = 'booth-news');

create policy "booth_news_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'booth-news');

create policy "booth_news_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'booth-news')
  with check (bucket_id = 'booth-news');

create policy "booth_news_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'booth-news');
