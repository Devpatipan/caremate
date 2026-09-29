-- ============================================================
-- CareMate — Row Level Security (RLS) ทุกตาราง
-- หลักการ: ผู้ดูแล (auth.uid()) เข้าถึงได้เฉพาะข้อมูลของผู้ป่วย
--          ที่ตัวเองผูกไว้ในตาราง caregiver_patient เท่านั้น
--
-- รันทั้งไฟล์ใน Supabase → SQL Editor (รันซ้ำได้ ไม่พัง)
-- หลังรัน ให้เปิดแอปทดสอบ: เพิ่มผู้ป่วย / ดูยา / บันทึกค่า ว่ายังทำงานปกติ
-- ============================================================

-- ฟังก์ชันช่วย: ผู้ใช้ปัจจุบันเป็นผู้ดูแลของผู้ป่วย pid ไหม
-- (SECURITY DEFINER = ข้าม RLS ภายใน กัน recursion)
create or replace function public.is_caregiver_of(pid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from caregiver_patient
    where caregiver_id = auth.uid() and patient_id = pid
  );
$$;

-- ---------- caregiver_patient (การผูกผู้ดูแล↔ผู้ป่วย) ----------
alter table caregiver_patient enable row level security;
drop policy if exists cm_cp_all on caregiver_patient;
create policy cm_cp_all on caregiver_patient for all
  using (caregiver_id = auth.uid())
  with check (caregiver_id = auth.uid());

-- ---------- patients ----------
alter table patients enable row level security;
drop policy if exists cm_patients_sel on patients;
drop policy if exists cm_patients_mod on patients;
-- อ่าน/แก้/ลบ เฉพาะผู้ป่วยของตัวเอง
create policy cm_patients_sel on patients for select using (is_caregiver_of(id));
create policy cm_patients_mod on patients for update using (is_caregiver_of(id)) with check (is_caregiver_of(id));
drop policy if exists cm_patients_del on patients;
create policy cm_patients_del on patients for delete using (is_caregiver_of(id));
-- หมายเหตุ: การเพิ่มผู้ป่วยทำผ่าน RPC create_patient (SECURITY DEFINER) จึงไม่ต้องมี insert policy

-- ---------- ตารางที่อ้างอิง patient_id ----------
-- รูปแบบเดียวกันหมด: เข้าถึงได้เฉพาะถ้าเป็นผู้ดูแลของ patient_id นั้น
do $$
declare tbl text;
begin
  foreach tbl in array array[
    'medications','reminders','med_events','vitals',
    'appointments','emergency_contacts','alerts','devices'
  ]
  loop
    execute format('alter table %I enable row level security', tbl);
    execute format('drop policy if exists cm_%s_all on %I', tbl, tbl);
    execute format(
      'create policy cm_%s_all on %I for all using (is_caregiver_of(patient_id)) with check (is_caregiver_of(patient_id))',
      tbl, tbl
    );
  end loop;
end $$;

-- ---------- push_tokens (token แจ้งเตือนของผู้ดูแลแต่ละคน) ----------
alter table push_tokens enable row level security;
drop policy if exists cm_push_all on push_tokens;
create policy cm_push_all on push_tokens for all
  using (caregiver_id = auth.uid())
  with check (caregiver_id = auth.uid());

-- ============================================================
-- ตรวจผลหลังรัน:
--   select tablename, rowsecurity from pg_tables where schemaname='public';
--   (rowsecurity ควรเป็น true ทุกตารางด้านบน)
-- ============================================================
