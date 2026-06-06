
-- ROLES
create type public.app_role as enum ('owner','tenant');

-- UNITS
create table public.units (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  unit_type text not null check (unit_type in ('2br','bedsitter')),
  floor text not null check (floor in ('ground','first')),
  rent_amount numeric not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.units to anon, authenticated;
grant all on public.units to service_role;
alter table public.units enable row level security;
create policy "units readable by authenticated" on public.units for select to authenticated using (true);

insert into public.units (label, unit_type, floor, rent_amount) values
('G-A 2BR','2br','ground',25000),
('G-B 2BR','2br','ground',25000),
('G-C Bedsitter','bedsitter','ground',8000),
('G-D Bedsitter','bedsitter','ground',8000),
('F-A 2BR','2br','first',26000),
('F-B 2BR','2br','first',26000),
('F-C Bedsitter','bedsitter','first',9000),
('F-D Bedsitter','bedsitter','first',9000);

-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role app_role not null,
  full_name text not null,
  login_code text unique,
  unit_id uuid references public.units(id),
  phone text,
  avatar_url text,
  bio text,
  agreed_rent numeric,
  theme_accent text default 'teal',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles all viewable by authenticated" on public.profiles for select to authenticated using (true);
create policy "users update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- PAYMENTS
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.profiles(id) on delete cascade,
  amount_ksh numeric not null,
  kind text not null default 'rent',
  note text,
  paid_for_month date,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.payments to authenticated;
grant all on public.payments to service_role;
alter table public.payments enable row level security;
create policy "tenant sees own payments, owner sees all" on public.payments for select to authenticated
  using (
    tenant_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'owner')
  );
create policy "owner manages payments" on public.payments for insert to authenticated
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'owner'));
create policy "owner update payments" on public.payments for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'owner'));
create policy "owner delete payments" on public.payments for delete to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'owner'));

-- POSTS
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  audience text not null default 'all' check (audience in ('all','owner','specific')),
  target_ids uuid[] default '{}',
  category text default 'general',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.posts to authenticated;
grant all on public.posts to service_role;
alter table public.posts enable row level security;
create policy "posts visibility" on public.posts for select to authenticated using (
  audience = 'all'
  or author_id = auth.uid()
  or (audience = 'owner' and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'owner'))
  or (audience = 'specific' and (auth.uid() = any(target_ids) or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'owner')))
);
create policy "authors create posts" on public.posts for insert to authenticated with check (author_id = auth.uid());
create policy "authors update own posts" on public.posts for update to authenticated using (author_id = auth.uid());
create policy "authors delete own posts" on public.posts for delete to authenticated using (author_id = auth.uid());

-- MESSAGES
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.messages to authenticated;
grant all on public.messages to service_role;
alter table public.messages enable row level security;
create policy "participants read messages" on public.messages for select to authenticated using (sender_id = auth.uid() or recipient_id = auth.uid());
create policy "sender sends message" on public.messages for insert to authenticated with check (sender_id = auth.uid());
create policy "recipient marks read" on public.messages for update to authenticated using (recipient_id = auth.uid());

-- realtime
alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.payments;
