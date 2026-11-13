-- =========================================================================
-- ASHRAFF MEMORIAL HOSPITAL (AMH), KALMUNAI
-- SRI LANKAN ERPM INTERNSHIP (HO) & RHO ROTATION ALLOCATION SCHEMA
-- Database: Supabase PostgreSQL with Row Level Security (RLS)
-- Features: Self-Registration (PIN + Unique Merit Rank per Intake), 2-Tap Pairing,
--           Bipartite Invariants, Granted vs Alternatives Available Logic,
--           Multi-Intake Scheduling & AMH Kalmunai Stage 3 Hospital Units
-- =========================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =========================================================================
-- 1. Stage 1 HO Batches / Appointment Intakes
-- =========================================================================
create table if not exists public.ho_batches (
  id text primary key,
  name text not null,
  academic_year text not null default '2026/2027',
  appointment_start_date date not null default '2026-12-17',
  total_hos integer not null default 40 check (total_hos > 0),
  total_students integer not null default 40 check (total_students > 0),
  status text not null default 'open' check (status in ('open', 'closed', 'registration_open', 'allocated', 'swap_window_open', 'finalized')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for active intake lookups
create index if not exists idx_ho_batches_status on public.ho_batches (status);

-- =========================================================================
-- 2. Profiles & Student Self-Registration
-- =========================================================================
-- Doctors register directly with Full Name, Merit Rank, and a 4-Digit PIN.
-- Merit Rank is unique per intake batch to prevent duplicate claims.
create table if not exists public.profiles (
  id text primary key default gen_random_uuid()::text,
  intake_id text not null references public.ho_batches(id) on delete cascade default 'intake-2026-nov',
  full_name text not null,
  merit_rank integer not null check (merit_rank >= 1),
  pin text not null check (length(pin) = 4),
  role text not null default 'student' check (role in ('admin', 'student', 'consultant')),
  mobile_number text,
  phone text,
  slmc_reg_no text,
  is_locked boolean not null default false,
  submitted_at timestamptz,
  created_at timestamptz default now(),
  unique (intake_id, merit_rank)
);

create index if not exists idx_profiles_intake_merit on public.profiles (intake_id, merit_rank);
create index if not exists idx_profiles_role on public.profiles (role);

-- Idempotent column additions for existing profiles table
alter table public.profiles add column if not exists is_locked boolean not null default false;
alter table public.profiles add column if not exists submitted_at timestamptz;

-- =========================================================================
-- 3. Stage 1 HO Quotas (H1 & H2 Clinical Capacities)
-- =========================================================================
create table if not exists public.ho_quotas (
  id text primary key default gen_random_uuid()::text,
  batch_id text not null references public.ho_batches(id) on delete cascade,
  half text not null check (half in ('H1', 'H2')),
  medicine integer not null default 10 check (medicine >= 0),
  surgery integer not null default 10 check (surgery >= 0),
  pediatrics integer not null default 10 check (pediatrics >= 0),
  gyn_obs integer not null default 10 check (gyn_obs >= 0),
  unique(batch_id, half)
);

-- =========================================================================
-- 4. Stage 1 Candidate Preferences (1st, 2nd, and 3rd Choice via 2-Tap UI)
-- =========================================================================
create table if not exists public.ho_preferences (
  id text primary key default gen_random_uuid()::text,
  batch_id text not null references public.ho_batches(id) on delete cascade,
  student_id text not null references public.profiles(id) on delete cascade,
  preference_rank integer not null check (preference_rank between 1 and 8),
  h1_specialty text not null check (h1_specialty in ('Medicine', 'Surgery', 'Pediatrics', 'Gyn & Obs')),
  h2_specialty text not null check (h2_specialty in ('Medicine', 'Surgery', 'Pediatrics', 'Gyn & Obs')),
  is_locked boolean not null default false,
  submitted_at timestamptz,
  created_at timestamptz default now(),
  unique(student_id, preference_rank),
  -- Mandatory Medical/Surgical Bipartite Group Constraint:
  check (
    (h1_specialty in ('Medicine', 'Pediatrics') and h2_specialty in ('Surgery', 'Gyn & Obs'))
    or
    (h1_specialty in ('Surgery', 'Gyn & Obs') and h2_specialty in ('Medicine', 'Pediatrics'))
  )
);

create index if not exists idx_ho_preferences_student on public.ho_preferences (student_id, preference_rank asc);

-- Idempotent column additions for existing tables
alter table public.ho_preferences add column if not exists is_locked boolean not null default false;
alter table public.ho_preferences add column if not exists submitted_at timestamptz;

-- =========================================================================
-- 5. Stage 1 HO Allocations (Granted vs Alternatives Available)
-- =========================================================================
create table if not exists public.ho_allocations (
  id text primary key default gen_random_uuid()::text,
  batch_id text not null references public.ho_batches(id) on delete cascade,
  student_id text not null references public.profiles(id) on delete cascade unique,
  status text not null check (status in ('GRANTED', 'ALTERNATIVES_AVAILABLE')),
  assigned_h1 text check (assigned_h1 in ('Medicine', 'Surgery', 'Pediatrics', 'Gyn & Obs')),
  assigned_h2 text check (assigned_h2 in ('Medicine', 'Surgery', 'Pediatrics', 'Gyn & Obs')),
  choice_rank integer check (choice_rank between 1 and 8),
  available_alternatives jsonb not null default '[]'::jsonb,
  audit_trail jsonb not null default '[]'::jsonb,
  summary_explanation text not null,
  allocated_at timestamptz default now(),
  check (
    (status = 'ALTERNATIVES_AVAILABLE')
    or
    (
      (assigned_h1 in ('Medicine', 'Pediatrics') and assigned_h2 in ('Surgery', 'Gyn & Obs'))
      or
      (assigned_h1 in ('Surgery', 'Gyn & Obs') and assigned_h2 in ('Medicine', 'Pediatrics'))
    )
  )
);

-- =========================================================================
-- 6. Stage 1 Mutual Swap Window Requests
-- =========================================================================
create table if not exists public.ho_swap_requests (
  id text primary key default gen_random_uuid()::text,
  batch_id text not null references public.ho_batches(id) on delete cascade,
  initiator_id text not null references public.profiles(id) on delete cascade,
  target_id text not null references public.profiles(id) on delete cascade,
  swap_type text not null check (swap_type in ('full', 'h1_only', 'h2_only')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  initiator_new_h1 text not null check (initiator_new_h1 in ('Medicine', 'Surgery', 'Pediatrics', 'Gyn & Obs')),
  initiator_new_h2 text not null check (initiator_new_h2 in ('Medicine', 'Surgery', 'Pediatrics', 'Gyn & Obs')),
  target_new_h1 text not null check (target_new_h1 in ('Medicine', 'Surgery', 'Pediatrics', 'Gyn & Obs')),
  target_new_h2 text not null check (target_new_h2 in ('Medicine', 'Surgery', 'Pediatrics', 'Gyn & Obs')),
  audit_reason text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check (initiator_new_h1 != initiator_new_h2),
  check (target_new_h1 != target_new_h2),
  check (
    (initiator_new_h1 in ('Medicine', 'Pediatrics') and initiator_new_h2 in ('Surgery', 'Gyn & Obs'))
    or
    (initiator_new_h1 in ('Surgery', 'Gyn & Obs') and initiator_new_h2 in ('Medicine', 'Pediatrics'))
  ),
  check (
    (target_new_h1 in ('Medicine', 'Pediatrics') and target_new_h2 in ('Surgery', 'Gyn & Obs'))
    or
    (target_new_h1 in ('Surgery', 'Gyn & Obs') and target_new_h2 in ('Medicine', 'Pediatrics'))
  )
);

-- =========================================================================
-- 7. Stage 2 RHO 3-Month Batches & Quotas
-- =========================================================================
create table if not exists public.rho_batches (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  status text not null default 'draft' check (status in ('draft', 'preferences_open', 'allocated', 'finalized')),
  medicine_quota integer not null default 10 check (medicine_quota >= 0),
  surgery_quota integer not null default 10 check (surgery_quota >= 0),
  pediatrics_quota integer not null default 10 check (pediatrics_quota >= 0),
  gyn_obs_quota integer not null default 10 check (gyn_obs_quota >= 0),
  created_at timestamptz default now()
);

-- =========================================================================
-- 8. Stage 2 RHO 3-Month Allocations
-- =========================================================================
create table if not exists public.rho_allocations (
  id text primary key default gen_random_uuid()::text,
  rho_batch_id text not null references public.rho_batches(id) on delete cascade,
  student_id text not null references public.profiles(id) on delete cascade unique,
  assigned_specialty text not null check (assigned_specialty in ('Medicine', 'Surgery', 'Pediatrics', 'Gyn & Obs')),
  choice_rank integer check (choice_rank in (1, 2)),
  audit_reason text not null,
  allocated_at timestamptz default now()
);

-- =========================================================================
-- 9. Stage 3 RHO Hospital Units & Consultants (AMH Kalmunai)
-- =========================================================================
create table if not exists public.rho_units (
  id text primary key default gen_random_uuid()::text,
  unit_name text not null,
  specialty text not null check (specialty in ('Medicine', 'Surgery', 'Pediatrics', 'Gyn & Obs')),
  consultant_name text not null,
  capacity integer not null default 1 check (capacity > 0),
  magic_pin text not null check (length(magic_pin) = 4),
  created_at timestamptz default now()
);

-- =========================================================================
-- 10. Stage 3 Consultant Selections
-- =========================================================================
create table if not exists public.consultant_selections (
  id text primary key default gen_random_uuid()::text,
  unit_id text not null references public.rho_units(id) on delete cascade,
  student_id text not null references public.profiles(id) on delete cascade,
  selection_rank integer not null check (selection_rank >= 1),
  created_at timestamptz default now(),
  unique(unit_id, student_id)
);

-- =========================================================================
-- 11. Stage 3 Student Unit Preferences
-- =========================================================================
create table if not exists public.rho_unit_preferences (
  id text primary key default gen_random_uuid()::text,
  student_id text not null references public.profiles(id) on delete cascade,
  unit_id text not null references public.rho_units(id) on delete cascade,
  preference_rank integer not null check (preference_rank >= 1),
  created_at timestamptz default now(),
  unique(student_id, preference_rank)
);

-- =========================================================================
-- 12. Stage 3 Final Unit Allocations
-- =========================================================================
create table if not exists public.rho_unit_allocations (
  id text primary key default gen_random_uuid()::text,
  student_id text not null references public.profiles(id) on delete cascade unique,
  unit_id text not null references public.rho_units(id) on delete cascade,
  match_type text not null check (match_type in ('MUTUAL_TOP', 'CONSULTANT_PREFERRED_MERIT', 'MERIT_RESIDUAL')),
  audit_reason text not null,
  allocated_at timestamptz default now()
);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================
alter table public.ho_batches enable row level security;
alter table public.profiles enable row level security;
alter table public.ho_quotas enable row level security;
alter table public.ho_preferences enable row level security;
alter table public.ho_allocations enable row level security;
alter table public.ho_swap_requests enable row level security;
alter table public.rho_batches enable row level security;
alter table public.rho_allocations enable row level security;
alter table public.rho_units enable row level security;
alter table public.consultant_selections enable row level security;
alter table public.rho_unit_preferences enable row level security;
alter table public.rho_unit_allocations enable row level security;

-- Drop existing policies if re-running script
drop policy if exists "Allow read on ho_batches" on public.ho_batches;
drop policy if exists "Allow update on ho_batches" on public.ho_batches;
drop policy if exists "Allow insert on ho_batches" on public.ho_batches;
drop policy if exists "Allow delete on ho_batches" on public.ho_batches;
drop policy if exists "Allow read on profiles" on public.profiles;
drop policy if exists "Allow student self-registration" on public.profiles;
drop policy if exists "Allow student profile update" on public.profiles;
drop policy if exists "Allow delete on profiles" on public.profiles;
drop policy if exists "Allow read on ho_quotas" on public.ho_quotas;
drop policy if exists "Allow manage on ho_quotas" on public.ho_quotas;
drop policy if exists "Allow read on ho_preferences" on public.ho_preferences;
drop policy if exists "Allow student manage ho_preferences" on public.ho_preferences;
drop policy if exists "Allow read on ho_allocations" on public.ho_allocations;
drop policy if exists "Allow manage on ho_allocations" on public.ho_allocations;
drop policy if exists "Allow read on ho_swap_requests" on public.ho_swap_requests;
drop policy if exists "Allow manage swap requests" on public.ho_swap_requests;
drop policy if exists "Allow read on rho_batches" on public.rho_batches;
drop policy if exists "Allow read on rho_allocations" on public.rho_allocations;
drop policy if exists "Allow read on rho_units" on public.rho_units;
drop policy if exists "Allow manage on rho_units" on public.rho_units;
drop policy if exists "Allow manage consultant selections" on public.consultant_selections;
drop policy if exists "Allow read on consultant selections" on public.consultant_selections;
drop policy if exists "Allow student manage rho_unit_preferences" on public.rho_unit_preferences;
drop policy if exists "Allow read on rho_unit_preferences" on public.rho_unit_preferences;
drop policy if exists "Allow read on rho_unit_allocations" on public.rho_unit_allocations;
drop policy if exists "Allow manage on rho_unit_allocations" on public.rho_unit_allocations;

-- Batches & Intakes
create policy "Allow read on ho_batches" on public.ho_batches for select using (true);
create policy "Allow update on ho_batches" on public.ho_batches for update using (true);
create policy "Allow insert on ho_batches" on public.ho_batches for insert with check (true);
create policy "Allow delete on ho_batches" on public.ho_batches for delete using (true);

-- Profiles (Self-Registration & Management)
create policy "Allow read on profiles" on public.profiles for select using (true);
create policy "Allow student self-registration" on public.profiles for insert with check (true);
create policy "Allow student profile update" on public.profiles for update using (true);
create policy "Allow delete on profiles" on public.profiles for delete using (true);

-- Quotas
create policy "Allow read on ho_quotas" on public.ho_quotas for select using (true);
create policy "Allow manage on ho_quotas" on public.ho_quotas for all using (true) with check (true);

-- Preferences
create policy "Allow read on ho_preferences" on public.ho_preferences for select using (true);
create policy "Allow student manage ho_preferences" on public.ho_preferences for all using (true) with check (true);

-- Allocations
create policy "Allow read on ho_allocations" on public.ho_allocations for select using (true);
create policy "Allow manage on ho_allocations" on public.ho_allocations for all using (true) with check (true);

-- Swap Requests
create policy "Allow read on ho_swap_requests" on public.ho_swap_requests for select using (true);
create policy "Allow manage swap requests" on public.ho_swap_requests for all using (true) with check (true);

-- Stage 2 RHO
create policy "Allow read on rho_batches" on public.rho_batches for select using (true);
create policy "Allow read on rho_allocations" on public.rho_allocations for select using (true);

-- Stage 3 Hospital Units & Consultants
create policy "Allow read on rho_units" on public.rho_units for select using (true);
create policy "Allow manage on rho_units" on public.rho_units for all using (true) with check (true);
create policy "Allow read on consultant selections" on public.consultant_selections for select using (true);
create policy "Allow manage consultant selections" on public.consultant_selections for all using (true) with check (true);
create policy "Allow read on rho_unit_preferences" on public.rho_unit_preferences for select using (true);
create policy "Allow student manage rho_unit_preferences" on public.rho_unit_preferences for all using (true) with check (true);
create policy "Allow read on rho_unit_allocations" on public.rho_unit_allocations for select using (true);
create policy "Allow manage on rho_unit_allocations" on public.rho_unit_allocations for all using (true) with check (true);

-- =========================================================================
-- SEED DATA: AMH KALMUNAI INITIAL INTAKES & CLINICAL UNITS
-- =========================================================================

-- 1. Default Appointment Intakes
insert into public.ho_batches (id, name, academic_year, appointment_start_date, total_hos, total_students, status)
values
  ('intake-2026-nov', '2026 November Intake', '2026/2027', '2026-12-17', 40, 40, 'open'),
  ('intake-2026-may', '2026 May Intake', '2026/2027', '2027-05-15', 24, 24, 'open')
on conflict (id) do update set
  name = excluded.name,
  appointment_start_date = excluded.appointment_start_date,
  total_hos = excluded.total_hos,
  total_students = excluded.total_students,
  status = excluded.status;

-- 2. Section Capacities (H1 and H2) for 2026 November Intake (N = 40)
insert into public.ho_quotas (id, batch_id, half, medicine, surgery, pediatrics, gyn_obs)
values
  ('q-nov-h1', 'intake-2026-nov', 'H1', 10, 10, 10, 10),
  ('q-nov-h2', 'intake-2026-nov', 'H2', 10, 10, 10, 10),
  ('q-may-h1', 'intake-2026-may', 'H1', 6, 6, 6, 6),
  ('q-may-h2', 'intake-2026-may', 'H2', 6, 6, 6, 6)
on conflict (id) do update set
  medicine = excluded.medicine,
  surgery = excluded.surgery,
  pediatrics = excluded.pediatrics,
  gyn_obs = excluded.gyn_obs;

-- 3. AMH Kalmunai Clinical Units & Supervising Consultants (Stage 3)
insert into public.rho_units (id, unit_name, specialty, consultant_name, capacity, magic_pin)
values
  ('unit-med-1', 'Medical Ward 1 (Male & ICU Stepdown)', 'Medicine', 'Dr. M. R. Farook (Consultant Physician)', 1, '1001'),
  ('unit-med-2', 'Medical Ward 2 (Female & Acute Medical)', 'Medicine', 'Dr. S. K. Pathmanathan (Consultant Physician)', 1, '1002'),
  ('unit-surg-a', 'Surgical Ward A (General & Ortho)', 'Surgery', 'Dr. A. L. M. Nazeer (Consultant Surgeon)', 1, '2001'),
  ('unit-surg-b', 'Surgical Ward B (Trauma & Gastro)', 'Surgery', 'Dr. T. Thavarajah (Consultant Surgeon)', 1, '2002'),
  ('unit-ped-1', 'Pediatric Ward 1 (General & SCBU)', 'Pediatrics', 'Dr. F. R. Mansoor (Consultant Pediatrician)', 1, '3001'),
  ('unit-ped-2', 'Pediatric Ward 2 (Neonatology & NICU)', 'Pediatrics', 'Dr. K. S. Jayasinghe (Consultant Pediatrician)', 1, '3002'),
  ('unit-gyn-1', 'Obstetrics Ward & Labour Suite', 'Gyn & Obs', 'Dr. M. I. M. Riyas (Consultant Obstetrician)', 1, '4001'),
  ('unit-gyn-2', 'Gynecology Ward & Antenatal Clinic', 'Gyn & Obs', 'Dr. H. N. Fernando (Consultant Obstetrician)', 1, '4002')
on conflict (id) do update set
  unit_name = excluded.unit_name,
  specialty = excluded.specialty,
  consultant_name = excluded.consultant_name,
  capacity = excluded.capacity,
  magic_pin = excluded.magic_pin;

-- =========================================================================
-- 13. REALTIME PUBLICATION & REPLICA IDENTITY (IDEMPOTENT)
-- =========================================================================
do $$
declare
  tbl text;
begin
  for tbl in select unnest(array[
    'ho_batches',
    'profiles',
    'ho_quotas',
    'ho_preferences',
    'ho_allocations',
    'ho_swap_requests',
    'rho_batches',
    'rho_units',
    'consultant_selections',
    'rho_unit_preferences',
    'rho_unit_allocations'
  ]) loop
    execute format('alter table public.%I replica identity full;', tbl);
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = tbl
    ) then
      execute format('alter publication supabase_realtime add table public.%I;', tbl);
    end if;
  end loop;
end;
$$;


-- =========================================================================
-- 13. REALTIME PUBLICATION & REPLICA IDENTITY (IDEMPOTENT)
-- =========================================================================
do $$
declare
  tbl text;
begin
  for tbl in select unnest(array[
    'ho_batches',
    'profiles',
    'ho_quotas',
    'ho_preferences',
    'ho_allocations',
    'ho_swap_requests',
    'rho_batches',
    'rho_units',
    'consultant_selections',
    'rho_unit_preferences',
    'rho_unit_allocations'
  ]) loop
    execute format('alter table public.%I replica identity full;', tbl);
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = tbl
    ) then
      execute format('alter publication supabase_realtime add table public.%I;', tbl);
    end if;
  end loop;
end;
$$;

