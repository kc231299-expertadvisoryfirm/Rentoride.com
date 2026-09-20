-- =========================================================
-- RentoRide — Production Schema
-- Run this in Supabase SQL Editor (or via `supabase db push`)
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE where possible
-- =========================================================

-- ---------------------------------------------------------
-- EXTENSIONS
-- ---------------------------------------------------------
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------
-- ENUM TYPES
-- ---------------------------------------------------------
do $$ begin
  create type user_role as enum ('customer', 'owner', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type vehicle_status as enum ('pending', 'approved', 'rejected', 'suspended');
exception when duplicate_object then null; end $$;

do $$ begin
  create type booking_status as enum ('pending', 'accepted', 'active', 'completed', 'cancelled', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type withdrawal_status as enum ('pending', 'processing', 'paid', 'rejected');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------
-- PROFILES  (1:1 with auth.users)
-- ---------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null,
  phone text,
  role user_role not null default 'customer',
  city text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- auto-create a profile row whenever a new auth user signs up
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'customer')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------
-- BIKES  (single source of truth — replaces bikes-data.js hardcoding)
-- ---------------------------------------------------------
create table if not exists bikes (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references profiles(id) on delete cascade,

  name text not null,
  brand text not null,
  model text not null,
  vehicle_type text not null default 'bike',  -- bike | scooter | car
  registration_number text not null,
  registration_year int,
  color text,
  fuel_type text not null default 'Petrol',
  engine_cc text,

  location text not null,
  latitude double precision,
  longitude double precision,

  price_3h numeric(10,2) not null,
  price_6h numeric(10,2) not null,
  price_12h numeric(10,2) not null,
  price_24h numeric(10,2) not null,

  delivery_enabled boolean not null default false,
  delivery_charge numeric(10,2) default 0,
  delivery_distance_km numeric(6,2) default 0,

  image_url text,
  gallery_urls text[] default '{}',
  description text,

  rating numeric(2,1) default 0,
  rating_count int default 0,

  status vehicle_status not null default 'pending',
  is_available boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_bikes_owner on bikes(owner_id);
create index if not exists idx_bikes_status on bikes(status);
create index if not exists idx_bikes_location on bikes(location);

-- ---------------------------------------------------------
-- BOOKINGS  (single source of truth — replaces localStorage bookings)
-- ---------------------------------------------------------
create table if not exists bookings (
  id uuid primary key default uuid_generate_v4(),
  booking_ref text unique not null default ('RR' || lpad((floor(random()*100000000))::text, 8, '0')),

  bike_id uuid not null references bikes(id) on delete restrict,
  customer_id uuid not null references profiles(id) on delete cascade,
  owner_id uuid not null references profiles(id) on delete cascade,

  start_date date not null,
  start_time time not null,
  end_date date not null,
  end_time time not null,

  duration_hours numeric(6,2) not null,
  rate_applied text not null,
  amount numeric(10,2) not null,

  delivery_requested boolean not null default false,
  delivery_address text,

  status booking_status not null default 'pending',
  cancellation_reason text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint chk_dates check (
    (end_date > start_date) or (end_date = start_date and end_time > start_time)
  )
);

create index if not exists idx_bookings_customer on bookings(customer_id);
create index if not exists idx_bookings_owner on bookings(owner_id);
create index if not exists idx_bookings_bike on bookings(bike_id);
create index if not exists idx_bookings_status on bookings(status);

-- owner_id is denormalized onto bookings for fast owner-dashboard queries;
-- keep it in sync automatically so the app never has to set it manually
create or replace function set_booking_owner()
returns trigger as $$
begin
  select owner_id into new.owner_id from bikes where id = new.bike_id;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_booking_owner on bookings;
create trigger trg_set_booking_owner
  before insert on bookings
  for each row execute function set_booking_owner();

-- ---------------------------------------------------------
-- BANK ACCOUNTS  (owner payout details — never store raw account # in localStorage again)
-- ---------------------------------------------------------
create table if not exists bank_accounts (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null unique references profiles(id) on delete cascade,
  holder_name text not null,
  account_number_last4 text not null,     -- UI display only
  account_number_encrypted text not null, -- encrypted at rest, see note below
  ifsc text not null,
  bank_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- NOTE: encrypt account_number_encrypted at the application layer (or via
-- pgsodium/Vault on Supabase) before insert. Never store plaintext account
-- numbers, and never return account_number_encrypted to the client — only
-- ever return account_number_last4.

-- ---------------------------------------------------------
-- WITHDRAWALS
-- ---------------------------------------------------------
create table if not exists withdrawals (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references profiles(id) on delete cascade,
  amount numeric(10,2) not null check (amount >= 500),
  status withdrawal_status not null default 'pending',
  requested_at timestamptz not null default now(),
  processed_at timestamptz
);

-- ---------------------------------------------------------
-- UPDATED_AT AUTO-TOUCH
-- ---------------------------------------------------------
create or replace function touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_touch_profiles on profiles;
create trigger trg_touch_profiles before update on profiles
  for each row execute function touch_updated_at();

drop trigger if exists trg_touch_bikes on bikes;
create trigger trg_touch_bikes before update on bikes
  for each row execute function touch_updated_at();

drop trigger if exists trg_touch_bookings on bookings;
create trigger trg_touch_bookings before update on bookings
  for each row execute function touch_updated_at();

-- =========================================================
-- ROW LEVEL SECURITY — this is what makes the publishable
-- key safe to ship in the frontend. Nothing is trusted from
-- the client except "who is logged in".
-- =========================================================

alter table profiles enable row level security;
alter table bikes enable row level security;
alter table bookings enable row level security;
alter table bank_accounts enable row level security;
alter table withdrawals enable row level security;

-- helper: is the current user an admin?
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- ---- PROFILES ----
drop policy if exists "profiles_select_own_or_admin" on profiles;
create policy "profiles_select_own_or_admin" on profiles
  for select using (auth.uid() = id or is_admin());

drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id and role = (select role from profiles where id = auth.uid()));
  -- ^ users can edit their own profile but cannot change their own role

-- ---- BIKES ----
drop policy if exists "bikes_select_approved_or_own_or_admin" on bikes;
create policy "bikes_select_approved_or_own_or_admin" on bikes
  for select using (
    status = 'approved' or owner_id = auth.uid() or is_admin()
  );

drop policy if exists "bikes_insert_owner" on bikes;
create policy "bikes_insert_owner" on bikes
  for insert with check (owner_id = auth.uid());

drop policy if exists "bikes_update_own_or_admin" on bikes;
create policy "bikes_update_own_or_admin" on bikes
  for update using (owner_id = auth.uid() or is_admin());

drop policy if exists "bikes_delete_own_or_admin" on bikes;
create policy "bikes_delete_own_or_admin" on bikes
  for delete using (owner_id = auth.uid() or is_admin());

-- ---- BOOKINGS ----
drop policy if exists "bookings_select_participant_or_admin" on bookings;
create policy "bookings_select_participant_or_admin" on bookings
  for select using (
    customer_id = auth.uid() or owner_id = auth.uid() or is_admin()
  );

drop policy if exists "bookings_insert_customer" on bookings;
create policy "bookings_insert_customer" on bookings
  for insert with check (customer_id = auth.uid());

drop policy if exists "bookings_update_participant_or_admin" on bookings;
create policy "bookings_update_participant_or_admin" on bookings
  for update using (
    customer_id = auth.uid() or owner_id = auth.uid() or is_admin()
  );
  -- app layer restricts WHAT fields each side may change (see booking.js /
  -- owner-dashboard.js — customers can only set status='cancelled', owners
  -- can only move pending→accepted/rejected→active→completed)

-- ---- BANK ACCOUNTS ----
drop policy if exists "bank_accounts_owner_only" on bank_accounts;
create policy "bank_accounts_owner_only" on bank_accounts
  for all using (owner_id = auth.uid() or is_admin())
  with check (owner_id = auth.uid());

-- ---- WITHDRAWALS ----
drop policy if exists "withdrawals_owner_or_admin_select" on withdrawals;
create policy "withdrawals_owner_or_admin_select" on withdrawals
  for select using (owner_id = auth.uid() or is_admin());

drop policy if exists "withdrawals_owner_insert" on withdrawals;
create policy "withdrawals_owner_insert" on withdrawals
  for insert with check (owner_id = auth.uid());

drop policy if exists "withdrawals_admin_update" on withdrawals;
create policy "withdrawals_admin_update" on withdrawals
  for update using (is_admin());

-- =========================================================
-- END OF SCHEMA
-- =========================================================
