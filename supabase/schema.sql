-- ============================================================
-- CareMate 2.0 — Supabase Schema v2  (Postgres + RLS)
-- ------------------------------------------------------------
-- วิธีใช้: Supabase Dashboard → SQL Editor → New query → วางทั้งไฟล์ → Run
-- ปลอดภัยต่อการรันซ้ำ (idempotent: ใช้ if not exists / drop policy if exists)
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- Tables ------------------------------------------------

-- โปรไฟล์ผู้ดูแล (ผูก 1:1 กับ auth.users)
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text,
  phone      text,
  created_at timestamptz not null default now()
);

-- ผู้สูงอายุ (ผู้ป่วย)
create table if not exists public.patients (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  birthdate  date,
  blood_type text,
  diseases   text,
  allergies  text,
  photo_url  text,
  created_at timestamptz not null default now()
);

-- ผูกหลายผู้ดูแล ↔ หลายผู้ป่วย (M:N)
create table if not exists public.caregiver_patient (
  caregiver_id uuid not null references public.profiles(id) on delete cascade,
  patient_id   uuid not null references public.patients(id) on delete cascade,
  role         text not null default 'owner',      -- owner | member
  created_at   timestamptz not null default now(),
  primary key (caregiver_id, patient_id)
);

-- กล่องเตือนยา KidBright (1 เครื่อง/ผู้ป่วย)
create table if not exists public.devices (
  id            uuid primary key default gen_random_uuid(),
  patient_id    uuid not null references public.patients(id) on delete cascade,
  device_key    text not null unique default encode(gen_random_bytes(16),'hex'),
  last_seen     timestamptz,
  sound_profile text not null default 'voice_th',  -- voice_th | buzzer | custom
  created_at    timestamptz not null default now()
);

-- รายการยา
create table if not exists public.medications (
  id         uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  name       text not null,
  dosage     text,
  note       text,
  created_at timestamptz not null default now()
);

-- ตารางเตือน (เวลา + วันซ้ำ)
create table if not exists public.reminders (
  id            uuid primary key default gen_random_uuid(),
  medication_id uuid not null references public.medications(id) on delete cascade,
  patient_id    uuid not null references public.patients(id) on delete cascade,
  time          time not null,                     -- เวลาเตือน (เขตเวลาแอป)
  days          smallint[] not null default '{}',  -- 0=อา..6=ส ; ว่าง = ทุกวัน
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ประวัติการทานจริง → ใช้คำนวณ adherence
create table if not exists public.med_events (
  id          uuid primary key default gen_random_uuid(),
  reminder_id uuid references public.reminders(id) on delete set null,
  patient_id  uuid not null references public.patients(id) on delete cascade,
  status      text not null,                        -- taken | missed | snoozed
  source      text not null default 'box',          -- box | app
  created_at  timestamptz not null default now()
);

-- ค่าสุขภาพ (ยืดหยุ่นด้วย jsonb)
create table if not exists public.vitals (
  id         uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  type       text not null,                         -- bp | sugar | hr | spo2 | weight
  value_json jsonb not null,                        -- {"sys":128,"dia":82} ฯลฯ
  taken_at   timestamptz not null default now(),
  source     text not null default 'app'            -- app | box
);

-- นัดหมาย
create table if not exists public.appointments (
  id         uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  doctor     text,
  hospital   text,
  datetime   timestamptz not null,
  note       text,
  created_at timestamptz not null default now()
);

-- ผู้ติดต่อฉุกเฉิน (SOS)
create table if not exists public.emergency_contacts (
  id         uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  name       text not null,
  relation   text,
  phone      text not null,
  created_at timestamptz not null default now()
);

-- ประวัติแจ้งเตือนถึงลูกหลาน
create table if not exists public.alerts (
  id         uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  type       text not null,                         -- missed | vital | offline | appointment | taken | info
  message    text not null,
  seen       boolean not null default false,
  created_at timestamptz not null default now()
);

-- Expo push tokens ของผู้ดูแล
create table if not exists public.push_tokens (
  id           uuid primary key default gen_random_uuid(),
  caregiver_id uuid not null references public.profiles(id) on delete cascade,
  expo_token   text not null unique,
  created_at   timestamptz not null default now()
);

-- ดัชนีที่ใช้บ่อย
create index if not exists idx_cp_caregiver   on public.caregiver_patient(caregiver_id);
create index if not exists idx_cp_patient     on public.caregiver_patient(patient_id);
create index if not exists idx_meds_patient   on public.medications(patient_id);
create index if not exists idx_rem_patient    on public.reminders(patient_id);
create index if not exists idx_events_patient on public.med_events(patient_id, created_at desc);
create index if not exists idx_vitals_patient on public.vitals(patient_id, taken_at desc);
create index if not exists idx_alerts_patient on public.alerts(patient_id, created_at desc);

-- ---------- Helper: ผู้ใช้ปัจจุบันเป็นผู้ดูแลของผู้ป่วยนี้ไหม ----------
create or replace function public.is_caregiver_of(p uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.caregiver_patient cp
    where cp.patient_id = p and cp.caregiver_id = auth.uid()
  );
$$;

-- ---------- Auto-create profile เมื่อสมัครสมาชิก ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
--  Row Level Security
-- ============================================================
alter table public.profiles           enable row level security;
alter table public.patients           enable row level security;
alter table public.caregiver_patient  enable row level security;
alter table public.devices            enable row level security;
alter table public.medications        enable row level security;
alter table public.reminders          enable row level security;
alter table public.med_events         enable row level security;
alter table public.vitals             enable row level security;
alter table public.appointments       enable row level security;
alter table public.emergency_contacts enable row level security;
alter table public.alerts             enable row level security;
alter table public.push_tokens        enable row level security;

-- profiles: เจ้าของแถวเท่านั้น
drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

-- patients: ผู้ดูแลที่ผูกไว้เห็น/แก้ได้ ; ผู้ใช้ที่ล็อกอินสร้างใหม่ได้
drop policy if exists patients_select on public.patients;
create policy patients_select on public.patients
  for select using (public.is_caregiver_of(id));
drop policy if exists patients_insert on public.patients;
create policy patients_insert on public.patients
  for insert with check (auth.uid() is not null);
drop policy if exists patients_update on public.patients;
create policy patients_update on public.patients
  for update using (public.is_caregiver_of(id)) with check (public.is_caregiver_of(id));
drop policy if exists patients_delete on public.patients;
create policy patients_delete on public.patients
  for delete using (public.is_caregiver_of(id));

-- caregiver_patient: ผู้ดูแลจัดการลิงก์ของตัวเอง
drop policy if exists cp_self on public.caregiver_patient;
create policy cp_self on public.caregiver_patient
  for all using (caregiver_id = auth.uid()) with check (caregiver_id = auth.uid());

-- ตารางที่ผูกกับผู้ป่วย: อิงสิทธิ์จาก is_caregiver_of(patient_id)
--  (ใช้ policy รูปแบบเดียวกันทุกตาราง)
do $$
declare tb text;
begin
  foreach tb in array array[
    'devices','medications','reminders','med_events','vitals',
    'appointments','emergency_contacts','alerts'
  ] loop
    execute format('drop policy if exists %I_rw on public.%I;', tb, tb);
    execute format(
      'create policy %I_rw on public.%I for all
         using (public.is_caregiver_of(patient_id))
         with check (public.is_caregiver_of(patient_id));', tb, tb);
  end loop;
end $$;

-- push_tokens: ของผู้ดูแลเอง
drop policy if exists push_self on public.push_tokens;
create policy push_self on public.push_tokens
  for all using (caregiver_id = auth.uid()) with check (caregiver_id = auth.uid());

-- ============================================================
-- หมายเหตุ: การเข้าถึงจาก "กล่อง KidBright" (ใช้ device_key ไม่ใช่ auth.uid)
-- จะทำผ่าน Edge Function + service_role ในเฟสถัดไป — ไม่เปิด RLS ให้ anon
-- ============================================================
