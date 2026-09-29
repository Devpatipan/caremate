# ตั้งค่า Login ด้วย Google (CareMate)

โค้ดในแอปพร้อมแล้ว (ปุ่ม "เข้าสู่ระบบด้วย Google" + การเชื่อม Supabase OAuth แบบ PKCE)
เหลือ 4 ขั้นตอนที่ต้องทำเอง ทำตามลำดับนี้

> ⚠️ **สำคัญ:** Google login ใช้ได้เฉพาะบน **APK / dev build จริง** เท่านั้น
> **ไม่ทำงานใน Expo Go** (เพราะ redirect scheme `caremate://` ใช้ไม่ได้ใน Expo Go)

---

## 1) ลงแพ็กเกจเพิ่ม

เปิด Terminal ในโฟลเดอร์โปรเจกต์:

```
cd C:\dev\caremate-app
npx expo install expo-web-browser
```

---

## 2) Google Cloud Console — สร้าง OAuth Client

1. เข้า https://console.cloud.google.com → สร้าง **Project** ใหม่ (หรือใช้ที่มีอยู่)
2. เมนู **APIs & Services → OAuth consent screen**
   - User Type: **External** → Create
   - กรอก App name = `CareMate`, User support email, Developer email → Save
   - ถ้าสถานะเป็น *Testing* ให้ไปที่ **Audience / Test users** แล้วเพิ่มอีเมล Google ที่จะใช้ทดสอบ
3. เมนู **APIs & Services → Credentials → + Create Credentials → OAuth client ID**
   - Application type: **Web application** ← ต้องเป็น Web (Supabase แลก token ฝั่ง server)
   - Name: `CareMate Supabase`
   - **Authorized redirect URIs** → Add URI:
     ```
     https://<PROJECT-REF>.supabase.co/auth/v1/callback
     ```
     (`<PROJECT-REF>` คือส่วนหน้าใน `EXPO_PUBLIC_SUPABASE_URL` เช่น `https://abcd1234.supabase.co` → ref = `abcd1234`)
   - Create → **คัดลอก Client ID และ Client Secret** เก็บไว้

---

## 3) Supabase Dashboard — เปิด Google Provider

1. **Authentication → Sign In / Providers → Google** → เปิด (Enable)
2. วาง **Client ID** และ **Client Secret** จากขั้นที่ 2 → **Save**
3. **Authentication → URL Configuration → Redirect URLs** → Add URL:
   ```
   caremate://auth-callback
   ```
   (จะเพิ่ม `caremate://*` เผื่อไว้อีกอันก็ได้)

---

## 4) Build เป็น APK แล้วทดสอบ

```
cd C:\dev\caremate-app
eas build -p android --profile preview
```

- ได้ลิงก์ไฟล์ `.apk` → ลากลง emulator หรือส่งเข้ามือถือจริงเพื่อติดตั้ง
- เปิดแอป → หน้าเข้าสู่ระบบ → กด **เข้าสู่ระบบด้วย Google**
- จะเปิดหน้าเลือกบัญชี Google → เลือกบัญชี → เด้งกลับเข้าแอปอัตโนมัติ → เข้าสู่ระบบสำเร็จ

---

## แก้ปัญหาที่พบบ่อย

| อาการ | สาเหตุ / วิธีแก้ |
|---|---|
| กดปุ่มแล้วขึ้น "ยังไม่ได้เปิด Google ใน Supabase" | ยังไม่ Enable Google provider ในขั้นที่ 3 |
| ขึ้น "Redirect URL ไม่ตรง" | ยังไม่เพิ่ม `caremate://auth-callback` ใน Supabase URL Configuration (ขั้น 3.3) |
| `redirect_uri_mismatch` ในหน้า Google | Authorized redirect URI ใน Google Console (ขั้น 2) ไม่ตรงกับ `https://<ref>.supabase.co/auth/v1/callback` |
| `access_blocked` / app not verified | เพิ่มอีเมลตัวเองใน **Test users** (ขั้น 2.2) หรือกด Publish app |
| กดใน Expo Go แล้วไม่กลับเข้าแอป | Google login ใช้ไม่ได้ใน Expo Go — ต้อง build APK (ขั้น 4) |

---

## หมายเหตุทางเทคนิค

- ใช้ **PKCE flow** (`flowType: 'pkce'` ใน `lib/supabase.ts`) — ปลอดภัยกว่า implicit
- flow: แอปขอ URL จาก Supabase → เปิดด้วย `expo-web-browser` → Google auth →
  Supabase redirect กลับที่ `caremate://auth-callback?code=...` →
  แอปเรียก `exchangeCodeForSession(code)` → ได้ session
- โค้ดอยู่ใน `lib/auth.tsx` (ฟังก์ชัน `signInWithGoogle`) และปุ่มใน `app/(auth)/sign-in.tsx`
- ผู้ใช้ที่ล็อกอิน Google จะเป็น user ปกติใน Supabase Auth เหมือนสมัครด้วยอีเมล — RLS/ข้อมูลทำงานเหมือนกันทุกอย่าง
