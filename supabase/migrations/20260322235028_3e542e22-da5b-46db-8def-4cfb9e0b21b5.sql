-- Artist engagement: streaks + growth score
create table public.artist_engagement (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  streak_days integer not null default 0,
  last_active_date date,
  growth_score integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint artist_engagement_user_id_key unique (user_id)
);

alter table public.artist_engagement enable row level security;

create policy "Users can read own engagement"
  on public.artist_engagement for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own engagement"
  on public.artist_engagement for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own engagement"
  on public.artist_engagement for update
  to authenticated
  using (auth.uid() = user_id);

-- Daily tasks tracking
create table public.daily_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_date date not null default current_date,
  task_key text not null,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint daily_tasks_unique unique (user_id, task_date, task_key)
);

alter table public.daily_tasks enable row level security;

create policy "Users can read own daily tasks"
  on public.daily_tasks for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own daily tasks"
  on public.daily_tasks for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own daily tasks"
  on public.daily_tasks for update
  to authenticated
  using (auth.uid() = user_id);

-- Daily bonus tracking (one per user per day)
create table public.daily_bonus_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  claim_date date not null default current_date,
  credits_awarded integer not null default 5,
  created_at timestamptz not null default now(),
  constraint daily_bonus_unique unique (user_id, claim_date)
);

alter table public.daily_bonus_claims enable row level security;

create policy "Users can read own bonus claims"
  on public.daily_bonus_claims for select
  to authenticated
  using (auth.uid() = user_id);

-- Indexes for fast daily lookups
create index idx_daily_tasks_user_date on public.daily_tasks (user_id, task_date);
create index idx_artist_engagement_user on public.artist_engagement (user_id);