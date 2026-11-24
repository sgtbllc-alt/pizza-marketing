create table public.push_subscriptions (
  id uuid primary key,
  device_secret_hash text not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
-- Only the Edge Functions' service role may access device endpoints and keys.
revoke all on public.push_subscriptions from anon, authenticated;
grant all on public.push_subscriptions to service_role;
