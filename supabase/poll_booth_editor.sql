-- Booth poll editor: create/publish polls, reset votes (PIN-only friendly).
-- Run once on existing projects. schema.sql includes the same policies for new installs.

drop policy if exists "polls_insert" on public.polls;
drop policy if exists "polls_update" on public.polls;
drop policy if exists "poll_options_insert" on public.poll_options;
drop policy if exists "poll_options_update" on public.poll_options;
drop policy if exists "poll_options_delete" on public.poll_options;
drop policy if exists "poll_votes_delete" on public.poll_votes;

create policy "polls_insert" on public.polls
  for insert to anon, authenticated with check (true);
create policy "polls_update" on public.polls
  for update to anon, authenticated using (true) with check (true);

create policy "poll_options_insert" on public.poll_options
  for insert to anon, authenticated with check (true);
create policy "poll_options_update" on public.poll_options
  for update to anon, authenticated using (true) with check (true);
create policy "poll_options_delete" on public.poll_options
  for delete to anon, authenticated using (true);

create policy "poll_votes_delete" on public.poll_votes
  for delete to anon, authenticated using (true);

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
