-- Allow PIN-only booth to Flag / Clear Interact inbox (no Auth session required).
-- Same temporary pattern as news_anon_write.sql — run in SQL Editor or via CLI.
-- Prefer creating Auth user studio@jowi981fm.com (password = studio PIN) later, then
-- tighten these policies back to authenticated-only.

drop policy if exists "messages_update" on public.interaction_messages;
drop policy if exists "messages_delete" on public.interaction_messages;

create policy "messages_update" on public.interaction_messages
  for update to anon, authenticated using (true) with check (true);
create policy "messages_delete" on public.interaction_messages
  for delete to anon, authenticated using (true);
