-- Optional, unverified phone number of the customer who turned on notifications on this device.
-- Copied from the browser's signup (customer_phone). Used only to target admin test sends.
alter table public.push_subscriptions add column if not exists phone text;
create index if not exists push_subscriptions_phone_idx on public.push_subscriptions (phone);
