// Supabase Edge Function: delete-account
// ลบบัญชีผู้ใช้ + ข้อมูลทั้งหมดตามสิทธิ์ PDPA
//   - ยืนยันตัวผู้ใช้จาก JWT (ต้องล็อกอิน)
//   - ลบผู้ป่วยที่ผู้ใช้เป็น "ผู้ดูแลคนเดียว" (พร้อมข้อมูลลูกทั้งหมด)
//   - ลบ caregiver_patient links, push_tokens ของผู้ใช้
//   - ลบบัญชี auth ทิ้ง
//
// Deploy:  supabase functions deploy delete-account   (ค่าเริ่มต้น verify_jwt=true)
import { createClient } from 'jsr:@supabase/supabase-js@2';

const CHILD_TABLES = ['med_events', 'reminders', 'medications', 'vitals', 'appointments', 'emergency_contacts', 'alerts', 'devices'];

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader) return json({ error: 'unauthorized' }, 401);

  const url = Deno.env.get('SUPABASE_URL')!;
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // ยืนยันว่าใครเรียก (จาก JWT)
  const asUser = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error: uErr } = await asUser.auth.getUser();
  if (uErr || !user) return json({ error: 'unauthorized' }, 401);
  const uid = user.id;

  const admin = createClient(url, service);

  // ผู้ป่วยที่ผู้ใช้นี้ดูแล
  const { data: links } = await admin.from('caregiver_patient').select('patient_id').eq('caregiver_id', uid);
  const pids: string[] = (links ?? []).map((l: any) => l.patient_id);

  let deletedPatients = 0;
  for (const pid of pids) {
    // มีผู้ดูแลคนอื่นอีกไหม
    const { data: others } = await admin
      .from('caregiver_patient')
      .select('caregiver_id')
      .eq('patient_id', pid)
      .neq('caregiver_id', uid);

    if (others && others.length > 0) continue; // มีคนอื่นดูแล -> ไม่ลบผู้ป่วย

    // เป็นผู้ดูแลคนเดียว -> ลบข้อมูลลูกทั้งหมด แล้วลบผู้ป่วย
    for (const tbl of CHILD_TABLES) {
      await admin.from(tbl).delete().eq('patient_id', pid);
    }
    await admin.from('patients').delete().eq('id', pid);
    deletedPatients++;
  }

  // ลบการผูก + token ของผู้ใช้
  await admin.from('caregiver_patient').delete().eq('caregiver_id', uid);
  await admin.from('push_tokens').delete().eq('caregiver_id', uid);

  // ลบบัญชี auth
  const { error: dErr } = await admin.auth.admin.deleteUser(uid);
  if (dErr) return json({ error: dErr.message }, 500);

  return json({ ok: true, deletedPatients });
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
}
