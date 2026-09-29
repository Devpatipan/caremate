# CareMate — ตั้งค่า Push แจ้งเตือนพลาดยา

Push มี 2 ส่วน: **ฝั่งแอป** (ลงทะเบียน token — ทำในโค้ดแล้ว) และ **ฝั่ง Supabase** (ตาราง + Edge Function + Cron ที่ต้อง deploy เอง) ทำตามนี้

---

## 0) สร้างตารางในฐานข้อมูล (ทำครั้งเดียว)

Supabase → **SQL Editor** → รัน:

```sql
-- ตารางเก็บ Expo push token ของผู้ดูแลแต่ละคน
create table if not exists push_tokens (
  id uuid primary key default gen_random_uuid(),
  caregiver_id uuid not null references auth.users(id) on delete cascade,
  expo_token text unique not null,
  created_at timestamptz default now()
);
alter table push_tokens enable row level security;
create policy "own token select" on push_tokens for select using (auth.uid() = caregiver_id);
create policy "own token insert" on push_tokens for insert with check (auth.uid() = caregiver_id);
create policy "own token update" on push_tokens for update using (auth.uid() = caregiver_id);
create policy "own token delete" on push_tokens for delete using (auth.uid() = caregiver_id);

-- ตารางเชื่อมผู้ดูแล↔ผู้ป่วย (ปกติมีอยู่แล้ว — เผื่อยังไม่มี)
create table if not exists caregiver_patient (
  caregiver_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (caregiver_id, patient_id)
);
```

> Edge Function อ่าน token ด้วย service role (ข้าม RLS) ส่วนแอปเขียน token ของตัวเองผ่าน RLS

---

## 1) ติดตั้งแพ็กเกจในแอป

```bat
cd /d C:\dev\caremate-app
npx expo install expo-notifications expo-device
npx expo start -c
```

หลังล็อกอิน แอปจะขอสิทธิ์แจ้งเตือน แล้วบันทึก Expo Push Token ลงตาราง `push_tokens` อัตโนมัติ

> ⚠️ **สำคัญ:** ตั้งแต่ Expo SDK 53 เป็นต้นไป **Expo Go ไม่รองรับ Push จริงบน Android แล้ว**
> การทดสอบ Push แบบครบวงจรต้องสร้าง **Development Build**:
> ```bat
> npm i -g eas-cli
> eas login
> eas build --profile development --platform android
> ```
> (บนเครื่องจริง/แอปที่ build เอง token จะได้ครบและรับ push ได้)

---

## 2) Deploy Edge Function (ตรวจพลาดยา + ส่ง Push)

ไฟล์อยู่ที่ `supabase/functions/check-missed-doses/index.ts` แล้ว

```bat
npx supabase functions deploy check-missed-doses --no-verify-jwt
```
(ถ้ายังไม่ได้ล็อกอิน/ลิงก์ ให้รัน `npx supabase login` แล้ว `npx supabase link --project-ref kxsujkyxuxierctfatpu` ก่อน)

ทดสอบเรียกมือ:
```bat
curl -X POST https://kxsujkyxuxierctfatpu.supabase.co/functions/v1/check-missed-doses
```
ควรได้ผลลัพธ์ JSON เช่น `{"checked":3,"missed":1,"pushed":1}`

---

## 3) ตั้ง Cron ให้รันทุกนาที

Supabase Dashboard → **Database → Extensions** → เปิด **pg_cron** และ **pg_net**

จากนั้น **SQL Editor** รัน:

```sql
select cron.schedule(
  'caremate-missed-doses',
  '* * * * *',   -- ทุก 1 นาที
  $$
    select net.http_post(
      url := 'https://kxsujkyxuxierctfatpu.supabase.co/functions/v1/check-missed-doses',
      headers := '{"Content-Type":"application/json"}'::jsonb
    );
  $$
);
```

ดูงานที่ตั้งไว้:  `select * from cron.job;`
ยกเลิก:  `select cron.unschedule('caremate-missed-doses');`

---

## วิธีทำงาน (สรุป)

1. Cron เรียก Edge Function ทุกนาที
2. ฟังก์ชันหา reminder ที่ถึงเวลาแล้วเกิน 15 นาที และวันนี้ยังไม่มี `med_events`
3. บันทึก `med_events {status:'missed'}` (กันซ้ำ) + สร้าง `alerts` + ส่ง Expo Push หาผู้ดูแลทุกคนของผู้ป่วยนั้น
4. แอปเด้งแจ้งเตือน + หน้า "แจ้งเตือน" มีรายการใหม่ + กระดิ่งมีจุดแดง

> ปรับเวลาผ่อนผันได้ที่ตัวแปร `GRACE_MINUTES` ในฟังก์ชัน (ค่าเริ่มต้น 15 นาที)
> เขตเวลาใช้ Asia/Bangkok (UTC+7) — แก้ที่ `TZ_OFFSET_MIN` ถ้าต้องการ
