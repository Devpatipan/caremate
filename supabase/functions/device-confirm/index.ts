// Supabase Edge Function: device-confirm
// กล่อง KidBright เรียกเมื่อผู้ใช้กดปุ่มบนกล่อง
//   S1 (สวิตช์ 1) = ทานยาแล้ว  -> action "taken"
//   S2 (สวิตช์ 2) = ขอเลื่อน    -> action "snoozed"
// ยืนยันตัวด้วย device_key — ทำงานด้วย service role ข้าม RLS
//
// Deploy:  supabase functions deploy device-confirm --no-verify-jwt
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  let body: any = {};
  try { body = await req.json(); } catch { /* ignore */ }

  const deviceKey = body.device_key;
  const reminderId = body.reminder_id;
  const action = body.action; // 'taken' | 'snoozed'
  if (!deviceKey) return json({ error: 'device_key required' }, 400);
  if (!reminderId) return json({ error: 'reminder_id required' }, 400);
  if (action !== 'taken' && action !== 'snoozed') return json({ error: 'action must be taken|snoozed' }, 400);

  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // ตรวจ device_key และดึง patient_id
  const { data: dev } = await sb.from('devices').select('id, patient_id').eq('device_key', deviceKey).maybeSingle();
  if (!dev) return json({ error: 'invalid device_key' }, 403);

  // reminder ต้องเป็นของผู้ป่วยคนเดียวกับกล่อง (กันกดข้ามคน)
  const { data: rem } = await sb.from('reminders').select('id, patient_id').eq('id', reminderId).maybeSingle();
  if (!rem || rem.patient_id !== dev.patient_id) return json({ error: 'reminder not found for this device' }, 404);

  await sb.from('devices').update({ last_seen: new Date().toISOString() }).eq('id', dev.id);

  const { error } = await sb.from('med_events').insert({
    reminder_id: reminderId,
    patient_id: dev.patient_id,
    status: action,
    source: 'box',
  });
  if (error) return json({ error: error.message }, 500);

  return json({ ok: true, status: action });
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
}
