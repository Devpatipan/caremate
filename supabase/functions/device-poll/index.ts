// Supabase Edge Function: device-poll
// กล่อง KidBright เรียกทุก ~20 วิ เพื่อถามว่ามียาที่ต้องเตือน "ตอนนี้" ไหม
// ยืนยันตัวด้วย device_key (ไม่ใช่บัญชีผู้ใช้) — ทำงานด้วย service role ข้าม RLS
//
// Deploy:  supabase functions deploy device-poll --no-verify-jwt
import { createClient } from 'jsr:@supabase/supabase-js@2';

const TZ_OFFSET_MIN = 7 * 60; // Asia/Bangkok
const ALARM_WINDOW = 30;      // นาที: เตือนภายใน 30 นาทีหลังถึงเวลา
const SNOOZE_MIN = 10;        // นาที: กดเลื่อนแล้วเงียบ 10 นาที

Deno.serve(async (req) => {
  let body: any = {};
  try { body = await req.json(); } catch { /* ignore */ }
  const deviceKey = body.device_key;
  if (!deviceKey) return json({ error: 'device_key required' }, 400);

  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const { data: dev } = await sb.from('devices').select('id, patient_id, test_ring_at, sound_profile, wifi_reset_at').eq('device_key', deviceKey).maybeSingle();
  if (!dev) return json({ error: 'invalid device_key' }, 403);

  // อัปเดตสถานะออนไลน์ + เคลียร์ธง provisioning (กล่อง poll ได้ = ต่อคลาวด์แล้ว)
  await sb.from('devices').update({ last_seen: new Date().toISOString(), provisioning: false }).eq('id', dev.id);

  // คำสั่ง "ทดสอบเสียง" จากแอป: ถ้าถูกกดภายใน 10 นาที ให้กล่องดัง 1 ครั้ง
  // (เผื่อกล่องกำลังยุ่งเตือนยาจริงอยู่ กว่าจะว่างมา poll)
  let testRing = false;
  if (dev.test_ring_at) {
    const ageSec = (Date.now() - new Date(dev.test_ring_at).getTime()) / 1000;
    testRing = ageSec < 600;
    // เคลียร์ทันที เพื่อให้ดังครั้งเดียว
    await sb.from('devices').update({ test_ring_at: null }).eq('id', dev.id);
  }

  // คำสั่ง "รีเซ็ต WiFi" จากแอป: ให้กล่องลืม WiFi แล้วเข้าโหมดตั้งค่าใหม่
  let resetWifi = false;
  if (dev.wifi_reset_at) {
    const ageSec = (Date.now() - new Date(dev.wifi_reset_at).getTime()) / 1000;
    resetWifi = ageSec < 600;
    // ถ้ากำลังจะรีเซ็ต -> ตั้งธง provisioning ให้แอปรู้ว่ากล่องกำลังเข้าโหมดตั้งค่า
    await sb.from('devices').update({ wifi_reset_at: null, provisioning: resetWifi }).eq('id', dev.id);
  }

  const nowUtc = new Date();
  const bkk = new Date(nowUtc.getTime() + TZ_OFFSET_MIN * 60000);
  const weekday = bkk.getUTCDay();
  const nowMin = bkk.getUTCHours() * 60 + bkk.getUTCMinutes();
  const startToday = new Date(Date.UTC(bkk.getUTCFullYear(), bkk.getUTCMonth(), bkk.getUTCDate()) - TZ_OFFSET_MIN * 60000);

  const [{ data: rems }, { data: events }] = await Promise.all([
    sb.from('reminders').select('id, time, days, active, medications(name)').eq('patient_id', dev.patient_id).eq('active', true),
    sb.from('med_events').select('reminder_id, status, created_at').eq('patient_id', dev.patient_id).gte('created_at', startToday.toISOString()).order('created_at', { ascending: false }),
  ]);

  // เหตุการณ์ล่าสุดของแต่ละ reminder วันนี้
  const latest: Record<string, any> = {};
  for (const e of events ?? []) if (!latest[e.reminder_id]) latest[e.reminder_id] = e;

  const due: any[] = [];
  for (const r of rems ?? []) {
    const days: number[] = r.days ?? [];
    if (days.length && !days.includes(weekday)) continue;
    const [h, m] = String(r.time).split(':').map((n: string) => parseInt(n, 10));
    const dueMin = h * 60 + m;
    if (nowMin < dueMin) continue;                 // ยังไม่ถึงเวลา
    if (nowMin > dueMin + ALARM_WINDOW) continue;  // เลยหน้าต่างเตือน (cron จะจัดการ "พลาดยา")
    const ev = latest[r.id];
    if (ev) {
      if (ev.status === 'taken') continue;
      if (ev.status === 'snoozed') {
        const mins = (nowUtc.getTime() - new Date(ev.created_at).getTime()) / 60000;
        if (mins < SNOOZE_MIN) continue;           // ยังอยู่ในช่วงเลื่อน
      }
    }
    due.push({ reminder_id: r.id, name: (r as any).medications?.name ?? 'ยา', time: String(r.time).slice(0, 5) });
  }

  // ใส่รายการทดสอบไว้หน้าสุด (กล่องจะดังทันที กดปุ่มแล้วแค่หยุด ไม่บันทึกกินยา)
  if (testRing) due.unshift({ reminder_id: 'test', name: 'ทดสอบเสียงเตือน', time: '' });

  // ส่งค่าเสียง + คำสั่งรีเซ็ต WiFi ไปให้กล่อง
  return json({ patient_id: dev.patient_id, count: due.length, due, sound: dev.sound_profile ?? 'buzzer', reset_wifi: resetWifi });
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
}
