-- Unblock booth news saves without Auth (PIN-only / until booth user exists).
-- Run in Supabase SQL Editor if Add bulletin fails with RLS errors.
-- Prefer creating Auth user studio@jowi981fm.com (password = studio PIN) for Storage uploads.

drop policy if exists "news_select" on public.news_bulletins;
drop policy if exists "news_insert" on public.news_bulletins;
drop policy if exists "news_update" on public.news_bulletins;
drop policy if exists "news_delete" on public.news_bulletins;

create policy "news_select" on public.news_bulletins
  for select to anon, authenticated using (true);
create policy "news_insert" on public.news_bulletins
  for insert to anon, authenticated with check (true);
create policy "news_update" on public.news_bulletins
  for update to anon, authenticated using (true) with check (true);
create policy "news_delete" on public.news_bulletins
  for delete to anon, authenticated using (true);
