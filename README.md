# CareMate 2.0 — Expo App (Design System + Screens)

ระบบดีไซน์ + 6 หน้าจอสำหรับแอปผู้ดูแล (ลูกหลาน) แปลงจากพิมพ์เขียว `CareMate-v2-Design.md`
โครงนี้ **รันได้ทันที** ด้วย mock data (ยังไม่ต่อ Supabase) เพื่อให้เห็นภาพ UI จริงบนมือถือ

## เริ่มใช้งาน

```bash
npm install
npx expo start           # กด i (iOS) / a (Android) หรือสแกน QR ด้วย Expo Go
```

> ถ้าเวอร์ชัน Expo/แพ็กเกจไม่ตรงกับเครื่อง ให้รัน `npx expo install --fix` เพื่อจัดเวอร์ชันให้เข้ากัน

## โครงสร้าง

```
app/                        # เส้นทาง (expo-router, file-based)
  _layout.tsx               # Providers: Theme + react-query + SafeArea + fonts
  (tabs)/
    _layout.tsx             # แท็บล่าง 5 แท็บ
    index.tsx               # 1. หน้าหลัก (Dashboard)
    medications.tsx         # 2. ยา
    health.tsx              # 3. สุขภาพ (มีกราฟแนวโน้ม)
    device.tsx              # 4. อุปกรณ์ (KidBright)
    more.tsx                # 5. เพิ่มเติม
  alerts.tsx                # แจ้งเตือน (เข้าจากกระดิ่งบนหน้าหลัก)
theme/
  tokens.ts                 # ⭐ design tokens ทั้งหมด (สี/ระยะ/รัศมี/เงา/ตัวอักษร) light+dark
  ThemeProvider.tsx         # useTheme() / useThemeControls() + toggle โหมดมืด
  fonts.ts                  # เปิด/ปิด LINE Seed Sans TH
components/
  ui/                       # คอมโพเนนต์แกน: Button, Badge, Card, Field, Toggle,
                            #   StatTile, SegmentedControl, AlertRow, EmptyState,
                            #   MedRing, ListRow, SectionLabel, Screen, Text
  charts/TrendChart.tsx     # กราฟเส้นแนวโน้ม (react-native-svg)
  app/                      # คอมโพเนนต์เฉพาะแอป: HeroMedCard, DoseRow, AlertBanner
lib/mockData.ts             # ข้อมูลจำลอง — แทนที่ด้วย query จริงภายหลัง
```

## ระบบดีไซน์ (design tokens)

แก้สี/ระยะ/ตัวอักษรทั้งแอปได้ที่ **`theme/tokens.ts`** ที่เดียว โทเคนถูกออกแบบให้:

- **แบรนด์** = น้ำเงิน `#1E88E9` (blue ramp 50–900)
- **สถานะ** = เขียว/ส้ม/แดง พร้อมเฉด `soft` สำหรับพื้นหลัง
- **รองรับ light/dark** อัตโนมัติ (`useColorScheme`) หรือบังคับได้ด้วย `useThemeControls().setMode('dark')`
- ผ่าน **WCAG AA** บนคู่สีที่ใช้จริง (ปุ่ม/ป้าย/ข้อความจาง ปรับให้ผ่าน)

ใช้ผ่าน hook เสมอ:

```tsx
import { useTheme } from '@/theme/ThemeProvider';
const t = useTheme();
// t.colors.primary, t.spacing.lg, t.radius.xl, t.shadows.e2, t.blue[700] ...
```

## ฟอนต์ LINE Seed Sans TH

ค่าเริ่มต้นใช้ฟอนต์ระบบ (แสดงไทยได้ครบ) เพื่อไม่ให้แครชถ้ายังไม่มีไฟล์ฟอนต์ วิธีเปิดใช้ LINE Seed:

1. วางไฟล์ `LINESeedSansTH-Regular.ttf`, `-Medium.ttf`, `-Bold.ttf` ใน `assets/fonts/`
2. เปิดคอมเมนต์บล็อก `useFonts` ใน `app/_layout.tsx`
3. ตั้ง `FONTS_ENABLED = true` ใน `theme/fonts.ts`

## การต่อ Supabase (ขั้นต่อไป)

ตอนนี้ทุกหน้าดึงจาก `lib/mockData.ts` การต่อจริงแนะนำ:

1. `npx expo install @supabase/supabase-js` + สร้าง `lib/supabase.ts` (url + anon key)
2. แทน export ใน `mockData.ts` ด้วย react-query hooks เช่น
   ```ts
   export const useTodayDoses = (patientId: string) =>
     useQuery({ queryKey: ['doses', patientId, 'today'],
                queryFn: () => fetchDosesToday(patientId) });
   ```
3. เปิด **Realtime** สำหรับตาราง `med_events` เพื่ออัปเดตสถานะทานยาแบบสด
4. RLS ทุกตารางผูก `caregiver_patient` ตาม schema v2 ในเอกสาร

## หมายเหตุ

- ไอคอนใช้ `lucide-react-native` (เปลี่ยน/เพิ่มได้อิสระ)
- กราฟใช้ `react-native-svg` แบบเบา ๆ ถ้าต้องการ interactive/tooltip มากขึ้น สลับไป `victory-native` ได้
- โลโก้: วาง `caremate.png` ที่ `assets/icon.png` และอัปเดต `app.json`
