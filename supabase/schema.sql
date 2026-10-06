-- JOWI 98.1 FM — Interact + Booth foundation
-- Run in Supabase Dashboard → SQL Editor → New query → Run
-- Re-run safe for most objects; realtime publication lines may warn if already added.

-- Messages (shoutouts & song requests)
create table if not exists public.interaction_messages (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('shoutout', 'request')),
  name text not null default 'Listener',
  body text not null,
  song text,
  highlighted boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists interaction_messages_created_at_idx
  on public.interaction_messages (created_at desc);

-- Polls
create table if not exists public.polls (
  id text primary key,
  question text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.poll_options (
  id text primary key,
  poll_id text not null references public.polls (id) on delete cascade,
  label text not null,
  sort_order int not null default 0
);

create table if not exists public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id text not null references public.polls (id) on delete cascade,
  option_id text not null references public.poll_options (id) on delete cascade,
  voter_key text not null,
  created_at timestamptz not null default now(),
  unique (poll_id, voter_key)
);

create index if not exists poll_votes_poll_id_idx on public.poll_votes (poll_id);

-- Seed the current home poll (fallback until booth publishes another)
insert into public.polls (id, question, active)
values (
  'poll-weekend',
  'What should we play more of this weekend?',
  true
)
on conflict (id) do update
set question = excluded.question, active = excluded.active;

insert into public.poll_options (id, poll_id, label, sort_order) values
  ('afrobeats', 'poll-weekend', 'Afrobeats', 1),
  ('gospel', 'poll-weekend', 'Gospel', 2),
  ('gengetone', 'poll-weekend', 'Gengetone', 3),
  ('rnb', 'poll-weekend', 'R&B / Slow jams', 4)
on conflict (id) do update
set label = excluded.label, sort_order = excluded.sort_order;

-- ---------------------------------------------------------------------------
-- News bulletins (booth-only — never shown on public listener pages)
-- ---------------------------------------------------------------------------
create table if not exists public.news_bulletins (
  id uuid primary key default gen_random_uuid(),
  headline text not null,
  summary text not null default '',
  body text not null,
  category text not null check (
    category in ('Breaking', 'Community', 'Sports', 'Weather', 'Bulletin')
  ),
  status text not null default 'live' check (status in ('draft', 'live', 'archived')),
  priority int not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  attachment_path text,
  attachment_name text,
  attachment_mime text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Existing projects: add attachment columns if the table already existed
alter table public.news_bulletins
  add column if not exists attachment_path text,
  add column if not exists attachment_name text,
  add column if not exists attachment_mime text;

create index if not exists news_bulletins_status_updated_idx
  on public.news_bulletins (status, updated_at desc);

-- No demo seed bulletins — add real copy from the booth News desk.

-- ---------------------------------------------------------------------------
-- Row Level Security (Phase 4 hardened)
-- Listeners (anon): Interact insert/select + poll votes
-- Presenters (authenticated booth user): flag/clear inbox + full news desk
-- ---------------------------------------------------------------------------
alter table public.interaction_messages enable row level security;
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;
alter table public.news_bulletins enable row level security;

drop policy if exists "messages_select" on public.interaction_messages;
drop policy if exists "messages_insert" on public.interaction_messages;
drop policy if exists "messages_update" on public.interaction_messages;
drop policy if exists "messages_delete" on public.interaction_messages;

create policy "messages_select" on public.interaction_messages
  for select to anon, authenticated using (true);
create policy "messages_insert" on public.interaction_messages
  for insert to anon, authenticated with check (true);
-- Flag / clear: open for PIN-only booth (same temporary posture as news desk).
-- Tighten to authenticated-only once studio Auth user is reliable.
create policy "messages_update" on public.interaction_messages
  for update to anon, authenticated using (true) with check (true);
create policy "messages_delete" on public.interaction_messages
  for delete to anon, authenticated using (true);

drop policy if exists "polls_select" on public.polls;
drop policy if exists "polls_insert" on public.polls;
drop policy if exists "polls_update" on public.polls;
drop policy if exists "poll_options_select" on public.poll_options;
drop policy if exists "poll_options_insert" on public.poll_options;
drop policy if exists "poll_options_update" on public.poll_options;
drop policy if exists "poll_options_delete" on public.poll_options;
drop policy if exists "poll_votes_select" on public.poll_votes;
drop policy if exists "poll_votes_insert" on public.poll_votes;
drop policy if exists "poll_votes_update" on public.poll_votes;
drop policy if exists "poll_votes_delete" on public.poll_votes;

create policy "polls_select" on public.polls
  for select to anon, authenticated using (true);
create policy "polls_insert" on public.polls
  for insert to anon, authenticated with check (true);
create policy "polls_update" on public.polls
  for update to anon, authenticated using (true) with check (true);
create policy "poll_options_select" on public.poll_options
  for select to anon, authenticated using (true);
create policy "poll_options_insert" on public.poll_options
  for insert to anon, authenticated with check (true);
create policy "poll_options_update" on public.poll_options
  for update to anon, authenticated using (true) with check (true);
create policy "poll_options_delete" on public.poll_options
  for delete to anon, authenticated using (true);
create policy "poll_votes_select" on public.poll_votes
  for select to anon, authenticated using (true);
create policy "poll_votes_insert" on public.poll_votes
  for insert to anon, authenticated with check (true);
create policy "poll_votes_update" on public.poll_votes
  for update to anon, authenticated using (true) with check (true);
create policy "poll_votes_delete" on public.poll_votes
  for delete to anon, authenticated using (true);

drop policy if exists "news_select" on public.news_bulletins;
drop policy if exists "news_insert" on public.news_bulletins;
drop policy if exists "news_update" on public.news_bulletins;
drop policy if exists "news_delete" on public.news_bulletins;

-- Booth news: open to anon + authenticated so PIN-only booth can save copy.
-- Tighten to authenticated-only after booth Auth user is reliably in use.
-- Storage bucket booth-news stays authenticated-only (see policies below).
create policy "news_select" on public.news_bulletins
  for select to anon, authenticated using (true);
create policy "news_insert" on public.news_bulletins
  for insert to anon, authenticated with check (true);
create policy "news_update" on public.news_bulletins
  for update to anon, authenticated using (true) with check (true);
create policy "news_delete" on public.news_bulletins
  for delete to anon, authenticated using (true);

-- Realtime (phones ↔ booth). Ignore errors if already in publication.
do $$
begin
  alter publication supabase_realtime add table public.interaction_messages;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.poll_votes;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.polls;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.poll_options;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.news_bulletins;
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Booth news attachments (private Storage). Also in news_attachments.sql alone.
-- ---------------------------------------------------------------------------
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
