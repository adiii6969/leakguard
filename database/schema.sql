-- =====================================================================
-- LeakGuard AI — Supabase Database Schema
-- Privacy-first AI subscription leak detector
-- =====================================================================
-- Run this in the Supabase SQL editor (or via `supabase db push`).
-- Auth users are managed by Supabase Auth (auth.users) — we reference
-- auth.uid() throughout for row-level security.
-- =====================================================================

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm"; -- for merchant fuzzy search

-- =====================================================================
-- 1. PROFILES  (1:1 with auth.users)
-- =====================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  currency text not null default 'INR',
  monthly_budget numeric(12,2),
  theme text not null default 'dark' check (theme in ('dark','light','system')),
  notifications_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================================================================
-- 2. STATEMENTS  (upload batches — metadata only, privacy-first)
-- Raw files are NEVER persisted to storage; they are parsed in-memory
-- by the backend and discarded immediately after extraction. This
-- table only records that an upload event happened, for the user's
-- own history/audit trail.
-- =====================================================================
create table if not exists public.statements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  file_type text not null check (file_type in ('csv','pdf','xlsx')),
  status text not null default 'processing'
    check (status in ('processing','completed','failed')),
  transactions_found int not null default 0,
  subscriptions_found int not null default 0,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- =====================================================================
-- 3. TRANSACTIONS  (normalized line items extracted from a statement)
-- Kept only long enough to power detection + history charts; retention
-- job (see below) purges raw transaction rows after N days, keeping
-- only the derived subscriptions/analytics.
-- =====================================================================
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  statement_id uuid references public.statements(id) on delete cascade,
  raw_description text not null,
  merchant_normalized text,
  amount numeric(12,2) not null,
  currency text not null default 'INR',
  txn_date date not null,
  category text,
  created_at timestamptz not null default now()
);

create index if not exists idx_transactions_user on public.transactions(user_id);
create index if not exists idx_transactions_statement on public.transactions(statement_id);
create index if not exists idx_transactions_merchant on public.transactions using gin (merchant_normalized gin_trgm_ops);
create index if not exists idx_transactions_date on public.transactions(txn_date);

-- =====================================================================
-- 4. MERCHANTS  (canonical merchant directory used for normalization)
-- =====================================================================
create table if not exists public.merchants (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null unique,
  category text not null,
  aliases text[] not null default '{}',
  typical_billing_cycle text check (typical_billing_cycle in ('monthly','yearly','weekly','quarterly')),
  logo_url text,
  website text,
  created_at timestamptz not null default now()
);

create index if not exists idx_merchants_name on public.merchants using gin (canonical_name gin_trgm_ops);
create index if not exists idx_merchants_aliases on public.merchants using gin (aliases);

-- =====================================================================
-- 5. SUBSCRIPTIONS  (detected recurring subscriptions per user)
-- =====================================================================
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  merchant_id uuid references public.merchants(id),
  merchant_name text not null,
  category text not null default 'Other',
  plan_name text,
  amount numeric(12,2) not null,
  previous_amount numeric(12,2),
  currency text not null default 'INR',
  billing_cycle text not null default 'monthly'
    check (billing_cycle in ('monthly','yearly','weekly','quarterly')),
  first_seen date not null,
  last_charged date not null,
  next_renewal date,
  status text not null default 'active'
    check (status in ('active','cancelled','paused','unused')),
  is_duplicate boolean not null default false,
  duplicate_of uuid references public.subscriptions(id),
  price_hike_detected boolean not null default false,
  price_hike_pct numeric(6,2),
  leak_score int not null default 0 check (leak_score between 0 and 100),
  confidence numeric(4,3) not null default 0.8 check (confidence between 0 and 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_subscriptions_user on public.subscriptions(user_id);
create index if not exists idx_subscriptions_status on public.subscriptions(status);
create index if not exists idx_subscriptions_renewal on public.subscriptions(next_renewal);
create index if not exists idx_subscriptions_leak_score on public.subscriptions(leak_score desc);

-- =====================================================================
-- 6. RECOMMENDATIONS  (AI-generated actions per subscription)
-- =====================================================================
create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  action text not null check (action in
    ('cancel','downgrade','keep','alternative','family_plan','cashback','switch_plan')),
  title text not null,
  reasoning text not null,
  estimated_monthly_savings numeric(12,2) not null default 0,
  estimated_yearly_savings numeric(12,2) not null default 0,
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  status text not null default 'pending' check (status in ('pending','accepted','dismissed')),
  ai_model text default 'gemini-2.0-flash',
  created_at timestamptz not null default now()
);

create index if not exists idx_recommendations_user on public.recommendations(user_id);
create index if not exists idx_recommendations_subscription on public.recommendations(subscription_id);
create index if not exists idx_recommendations_status on public.recommendations(status);

-- =====================================================================
-- 7. LEAK_SCORE_HISTORY  (time series for trend charts)
-- =====================================================================
create table if not exists public.leak_score_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  score int not null check (score between 0 and 100),
  monthly_spend numeric(12,2) not null default 0,
  potential_savings numeric(12,2) not null default 0,
  active_subscriptions int not null default 0,
  recorded_at timestamptz not null default now()
);

create index if not exists idx_leak_history_user on public.leak_score_history(user_id, recorded_at desc);

-- =====================================================================
-- 8. SPENDING_PREDICTIONS  (future spend / savings forecasts)
-- =====================================================================
create table if not exists public.spending_predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  forecast_month date not null,
  predicted_spend numeric(12,2) not null,
  predicted_savings_if_actioned numeric(12,2) not null default 0,
  model_version text default 'trend-v1',
  created_at timestamptz not null default now(),
  unique (user_id, forecast_month)
);

-- =====================================================================
-- 9. REPORTS  (generated PDF report metadata)
-- =====================================================================
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  summary jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- =====================================================================
-- VIEWS
-- =====================================================================

-- Dashboard summary — one row per user, cheap to query
create or replace view public.v_dashboard_summary as
select
  s.user_id,
  coalesce(sum(s.amount) filter (
    where s.status = 'active' and s.billing_cycle = 'monthly'
  ), 0)
  + coalesce(sum(s.amount / 12.0) filter (
    where s.status = 'active' and s.billing_cycle = 'yearly'
  ), 0)
  + coalesce(sum(s.amount * 4.33) filter (
    where s.status = 'active' and s.billing_cycle = 'weekly'
  ), 0)
  + coalesce(sum(s.amount / 3.0) filter (
    where s.status = 'active' and s.billing_cycle = 'quarterly'
  ), 0) as monthly_spend,
  count(*) filter (where s.status = 'active') as active_subscriptions,
  count(*) filter (where s.is_duplicate) as duplicate_count,
  count(*) filter (where s.price_hike_detected) as price_hike_count,
  count(*) filter (where s.status = 'unused') as unused_count,
  round(avg(s.leak_score) filter (where s.status = 'active'))::int as avg_leak_score
from public.subscriptions s
group by s.user_id;

-- Upcoming renewals in next 30 days
create or replace view public.v_upcoming_renewals as
select *
from public.subscriptions
where status = 'active'
  and next_renewal is not null
  and next_renewal between current_date and current_date + interval '30 days'
order by next_renewal asc;

-- Category breakdown
create or replace view public.v_category_breakdown as
select
  user_id,
  category,
  count(*) as subscription_count,
  sum(amount) as total_amount
from public.subscriptions
where status = 'active'
group by user_id, category;

-- =====================================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================================

-- Keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_subscriptions_updated on public.subscriptions;
create trigger trg_subscriptions_updated
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create profile row on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_auth_user_created on auth.users;
create trigger trg_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Snapshot leak score whenever subscriptions change materially
create or replace function public.snapshot_leak_score(p_user_id uuid)
returns void language plpgsql as $$
declare
  v_score int;
  v_spend numeric;
  v_savings numeric;
  v_active int;
begin
  select avg_leak_score, monthly_spend, active_subscriptions
    into v_score, v_spend, v_active
  from public.v_dashboard_summary where user_id = p_user_id;

  select coalesce(sum(estimated_monthly_savings), 0) into v_savings
  from public.recommendations
  where user_id = p_user_id and status = 'pending';

  insert into public.leak_score_history
    (user_id, score, monthly_spend, potential_savings, active_subscriptions)
  values
    (p_user_id, coalesce(v_score, 0), coalesce(v_spend, 0), v_savings, coalesce(v_active, 0));
end;
$$;

-- Purge raw transactions older than 90 days (privacy-first retention policy)
-- Schedule via Supabase Cron: select cron.schedule('purge-transactions', '0 3 * * *',
--   'select public.purge_old_transactions()');
create or replace function public.purge_old_transactions()
returns void language plpgsql as $$
begin
  delete from public.transactions where created_at < now() - interval '90 days';
end;
$$;

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.statements enable row level security;
alter table public.transactions enable row level security;
alter table public.subscriptions enable row level security;
alter table public.recommendations enable row level security;
alter table public.leak_score_history enable row level security;
alter table public.spending_predictions enable row level security;
alter table public.reports enable row level security;
-- merchants is a shared reference table — public read, no user data
alter table public.merchants enable row level security;

create policy "profiles_self" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "statements_owner" on public.statements
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "transactions_owner" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "subscriptions_owner" on public.subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "recommendations_owner" on public.recommendations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "leak_history_owner" on public.leak_score_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "predictions_owner" on public.spending_predictions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "reports_owner" on public.reports
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "merchants_public_read" on public.merchants
  for select using (true);

-- =====================================================================
-- STORAGE (temporary upload bucket — auto-purged, not user-accessible
-- after processing; backend uses service role to write/delete)
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('temp-statements', 'temp-statements', false)
on conflict (id) do nothing;

create policy "temp_statements_owner_rw" on storage.objects
  for all using (
    bucket_id = 'temp-statements' and auth.uid()::text = (storage.foldername(name))[1]
  ) with check (
    bucket_id = 'temp-statements' and auth.uid()::text = (storage.foldername(name))[1]
  );

-- =====================================================================
-- SEED DATA — canonical merchant directory (used by the merchant
-- normalizer / RapidFuzz matcher as the reference set)
-- =====================================================================
insert into public.merchants (canonical_name, category, aliases, typical_billing_cycle) values
  ('Netflix', 'Streaming', array['NETFLIX.COM','NETFLIX','NFLX*NETFLIX'], 'monthly'),
  ('Amazon Prime', 'Shopping', array['AMAZON PRIME','AMZN PRIME','PRIME VIDEO'], 'yearly'),
  ('Spotify', 'Music', array['SPOTIFY','SPOTIFY AB','SPOTIFY USA'], 'monthly'),
  ('YouTube Premium', 'Streaming', array['YOUTUBE PREMIUM','GOOGLE YOUTUBE'], 'monthly'),
  ('Disney+ Hotstar', 'Streaming', array['HOTSTAR','DISNEY HOTSTAR','DISNEY+'], 'yearly'),
  ('Adobe Creative Cloud', 'Creative', array['ADOBE','ADOBE CC','ADOBE SYSTEMS'], 'monthly'),
  ('Microsoft 365', 'Productivity', array['MICROSOFT 365','MSFT 365','OFFICE 365'], 'yearly'),
  ('Google One', 'Storage', array['GOOGLE ONE','GOOGLE STORAGE'], 'monthly'),
  ('Apple iCloud', 'Storage', array['ICLOUD','APPLE.COM/BILL','ICLOUD STORAGE'], 'monthly'),
  ('Notion', 'Productivity', array['NOTION LABS','NOTION.SO'], 'monthly'),
  ('Zomato Gold', 'Food', array['ZOMATO GOLD','ZOMATO'], 'monthly'),
  ('Swiggy One', 'Food', array['SWIGGY ONE','SWIGGY'], 'monthly'),
  ('LinkedIn Premium', 'Professional', array['LINKEDIN','LINKEDIN PREMIUM'], 'monthly'),
  ('Canva Pro', 'Creative', array['CANVA','CANVA PRO'], 'yearly'),
  ('ChatGPT Plus', 'AI Tools', array['OPENAI','CHATGPT','OPENAI CHATGPT'], 'monthly'),
  ('Gym Membership', 'Fitness', array['CULT FIT','CULTFIT','GOLD GYM','GYM'], 'monthly')
on conflict (canonical_name) do nothing;
