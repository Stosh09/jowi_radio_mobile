-- JOWI mobile app: station alert push tokens + broadcast log.
-- Run once in the Supabase SQL Editor, then deploy supabase/functions/send-push.

create table if not exists public.push_tokens (
  token text primary key,
  platform text not null default 'android',
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.push_tokens enable row level security;
-- No policies on purpose: listeners never read or write tokens directly.
-- Registration goes through register_push_token(); sending uses the service role.

create or replace function public.register_push_token(
  p_token text,
  p_platform text default 'android',
  p_enabled boolean default true
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_token is null or p_token !~ '^Expo(nent)?PushToken\[[A-Za-z0-9_-]+\]$' then
    raise exception 'invalid push token';
  end if;
  if p_platform not in ('android', 'ios') then
    raise exception 'invalid platform';
  end if;

  insert into public.push_tokens (token, platform, enabled, updated_at)
  values (p_token, p_platform, p_enabled, now())
  on conflict (token) do update
    set platform = excluded.platform,
        enabled = excluded.enabled,
        updated_at = now();
end;
$$;

revoke all on function public.register_push_token(text, text, boolean) from public;
grant execute on function public.register_push_token(text, text, boolean) to anon, authenticated;

create table if not exists public.push_broadcasts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  url text,
  sent_count integer not null default 0,
  sent_by text,
  created_at timestamptz not null default now()
);

alter table public.push_broadcasts enable row level security;

drop policy if exists "push_broadcasts_select" on public.push_broadcasts;
create policy "push_broadcasts_select" on public.push_broadcasts
  for select to authenticated using (true);
