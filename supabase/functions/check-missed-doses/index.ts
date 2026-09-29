// Supabase Edge Function: check-missed-doses
// ตรวจยาที่ถึงเวลาแล้วเกิน X นาที และยังไม่มี med_event วันนี้ → สร้าง alert + ส่ง Expo Push
// รันเป็นระยะด้วย Cron (ดู PUSH_SETUP.md)
//
// Deploy:  supabase functions deploy check-missed-doses --no-verify-jwt
import { createClient } from 'jsr:@supabase/supabase-js@2';

const GRACE_MINUTES = 15;
const TZ_OFFSET_MIN = 7 * 60; // Asia/Bangkok (UTC+7)

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // เวลา "ตามเขตไทย"
  const nowUtc = new Date();
  const bkk = new Date(nowUtc.getTime() + TZ_OFFSET_MIN * 60000);
  const weekday = bkk.getUTCDay(); // 0=อา..6=ส
  const nowMin = bkk.getUTCHours() * 60 + bkk.getUTCMinutes();
  const startOfTodayUtc = new Date(
    Date.UTC(bkk.getUTCFullYear(), bkk.getUTCMonth(), bkk.getUTCDate()) - TZ_OFFSET_MIN * 60000
  );

  // reminders ที่เปิดใช้ + ชื่อยา
  const { data: reminders, error: rErr } = await supabase
    .from('reminders')
    .select('id, patient_id, time, days, active, medications(name)')
    .eq('active', true);
  if (rErr) return json({ error: rErr.message }, 500);

  // med_events วันนี้ (กันซ้ำ)
  const { data: events } = await supabase
    .from('med_events')
    .select('reminder_id')
    .gte('created_at', startOfTodayUtc.toISOString());
  const doneToday = new Set((events ?? []).map((e: any) => e.reminder_id));

  const missed: any[] = [];
  for (const r of reminders ?? []) {
    const days: number[] = r.days ?? [];
    if (days.length > 0 && !days.includes(weekday)) continue;
    if (doneToday.has(r.id)) continue;
    const [h, m] = String(r.time).split(':').map((n: string) => parseInt(n, 10));
    const dueMin = h * 60 + m;
    if (nowMin <= dueMin + GRACE_MINUTES) continue; // ยังไม่พลาด
    missed.push(r);
  }

  let pushed = 0;
  const messages: any[] = [];

  for (const r of missed) {
    const medName = (r as any).medications?.name ?? 'ยา';
    const timeLabel = String(r.time).slice(0, 5);

    // marker กันซ้ำ + ประวัติ
    await supabase.from('med_events').insert({
      reminder_id: r.id,
      patient_id: r.patient_id,
      status: 'missed',
      source: 'app',
    });

    // ชื่อผู้ป่วย
    const { data: patient } = await supabase
      .from('patients')
      .select('name')
      .eq('id', r.patient_id)
      .single();
    const pname = patient?.name ?? 'ผู้ป่วย';

    // ข้อความในหน้าแจ้งเตือน (สั้น กระชับ)
    const message = `${pname} ยังไม่ทานยา ${medName} เวลา ${timeLabel} น.`;

    await supabase.from('alerts').insert({
      patient_id: r.patient_id,
      type: 'missed',
      message,
    });

    // ข้อความ push บนมือถือ (สวย + มีรายละเอียดเวลา)
    const pushTitle = `⏰ ${pname} ยังไม่ได้ทานยา`;
    const pushBody = `💊 ${medName}\nถึงเวลา ${timeLabel} น. · เลยกำหนดมาแล้ว ${GRACE_MINUTES}+ นาที\nแตะเพื่อดูรายละเอียด`;

    // ผู้ดูแลของผู้ป่วยนี้ → push tokens
    const { data: links } = await supabase
      .from('caregiver_patient')
      .select('caregiver_id')
      .eq('patient_id', r.patient_id);
    const caregiverIds = (links ?? []).map((l: any) => l.caregiver_id);
    if (caregiverIds.length === 0) continue;

    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('expo_token')
      .in('caregiver_id', caregiverIds);

    for (const tk of tokens ?? []) {
      messages.push({
        to: tk.expo_token,
        sound: 'default',
        title: pushTitle,
        body: pushBody,
        priority: 'high',
        channelId: 'default',
        badge: 1,
        data: { type: 'missed', patient_id: r.patient_id, time: timeLabel, med: medName },
      });
    }
  }

  // ส่ง Expo Push (ทีละ 100)
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chunk),
    });
    if (res.ok) pushed += chunk.length;
  }

  return json({ checked: reminders?.length ?? 0, missed: missed.length, pushed });
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
