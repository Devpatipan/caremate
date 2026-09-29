import * as Print from 'expo-print';
import { shareAsync, isAvailableAsync } from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from './supabase';
import { interpretVital, vitalContextLabel, VitalType } from './vitals';
import type { Patient } from './patients';

const TH_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const fmtDateTime = (iso: string) => { const d = new Date(iso); return `${d.getDate()} ${TH_MONTHS[d.getMonth()]} ${d.getFullYear() + 543} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} น.`; };
const fmtDate = (iso: string) => { const d = new Date(iso); return `${d.getDate()} ${TH_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`; };
const esc = (s: any) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string));
const statusHue = (s: string) => (s === 'ok' ? '#0E7A38' : s === 'warn' ? '#B45309' : '#B42318');

export async function generatePatientReport(patient: Patient, adherence: number | null) {
  const pid = patient.id;
  const [meds, vitals, appts] = await Promise.all([
    supabase.from('medications').select('*, reminders(*)').eq('patient_id', pid),
    supabase.from('vitals').select('*').eq('patient_id', pid).order('taken_at', { ascending: false }).limit(20),
    supabase.from('appointments').select('*').eq('patient_id', pid).order('datetime', { ascending: true }),
  ]);

  const medRows = (meds.data ?? []).map((m: any, i: number) => {
    const times = (m.reminders ?? []).map((r: any) => r.time.slice(0, 5)).sort().join(', ');
    return `<tr class="${i % 2 ? 'zebra' : ''}"><td>${esc(m.name)}</td><td>${esc(m.dosage || '-')}</td><td>${esc(times || '-')}</td><td>${esc(m.note || '-')}</td></tr>`;
  }).join('');

  const vitalRows = (vitals.data ?? []).map((v: any, i: number) => {
    const info = interpretVital(v.type as VitalType, v.value_json);
    const label = { bp: 'ความดัน', sugar: 'น้ำตาล', hr: 'หัวใจ' }[v.type as VitalType] ?? v.type;
    const ctx = vitalContextLabel(v.value_json);
    return `<tr class="${i % 2 ? 'zebra' : ''}"><td>${esc(label)}</td><td><b>${esc(info.display)}</b> <span class="u">${esc(info.unit)}</span></td><td><span class="pill" style="color:${statusHue(info.status)};background:${statusHue(info.status)}18">${esc(info.statusLabel)}</span>${ctx ? ` <span class="dim">${esc(ctx)}</span>` : ''}</td><td>${esc(fmtDateTime(v.taken_at))}</td></tr>`;
  }).join('');

  const apptRows = (appts.data ?? []).map((a: any, i: number) => {
    const place = [a.hospital, a.building ? `ตึก ${a.building}` : null, a.room ? `ห้อง ${a.room}` : null].filter(Boolean).join(' · ');
    return `<tr class="${i % 2 ? 'zebra' : ''}"><td><b>${esc(a.department || 'นัดหมาย')}</b>${a.doctor ? `<br><span class="dim">${esc(a.doctor)}</span>` : ''}</td><td>${esc(place || '-')}</td><td>${esc(a.note || '-')}</td><td>${esc(fmtDateTime(a.datetime))}</td></tr>`;
  }).join('');

  const now = new Date();
  const genStamp = `${now.getDate()} ${TH_MONTHS[now.getMonth()]} ${now.getFullYear() + 543} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} น.`;
  const age = patient.birthdate ? Math.floor((Date.now() - new Date(patient.birthdate).getTime()) / (365.25 * 24 * 3600 * 1000)) : null;
  const hn = pid.slice(0, 8).toUpperCase();

  const info = (label: string, val: string) => `<div class="info"><div class="il">${label}</div><div class="iv">${val || '-'}</div></div>`;

  const html = `<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><title>รายงานสุขภาพ ${esc(patient.name)}</title>
  <style>
    @page { size: A4; margin: 0; }
    * { font-family: 'Sarabun','TH Sarabun New','IBM Plex Sans Thai',-apple-system,sans-serif; box-sizing:border-box; }
    body { margin:0; color:#101B2D; }
    .page { padding: 34px 40px; }
    .lh { display:flex; align-items:center; gap:14px; padding-bottom:16px; border-bottom:3px solid #1E88E9; }
    .logo { width:52px; height:52px; border-radius:13px; background:linear-gradient(150deg,#1E88E9,#135BA1); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:24px; }
    .lh h1 { font-size:21px; margin:0; letter-spacing:-.3px; }
    .lh .en { color:#5E6D82; font-size:12px; }
    .lh .meta { margin-left:auto; text-align:right; color:#5E6D82; font-size:11.5px; line-height:1.6; }
    .lh .meta b { color:#101B2D; }

    .pbox { display:flex; gap:16px; align-items:flex-start; background:#F4F7FB; border:1px solid #E4E9F1; border-radius:14px; padding:16px 18px; margin-top:18px; }
    .pname { font-size:18px; font-weight:700; }
    .grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px 18px; margin-top:12px; flex:1; }
    .info .il { font-size:10.5px; color:#8A97A8; }
    .info .iv { font-size:13px; font-weight:600; }
    .kpi { background:#E7F6EC; color:#0E7A38; border-radius:12px; padding:12px 16px; text-align:center; min-width:120px; }
    .kpi .n { font-size:24px; font-weight:700; line-height:1; }
    .kpi .l { font-size:10.5px; margin-top:3px; }

    h2 { font-size:14px; margin:22px 0 8px; color:#135BA1; display:flex; align-items:center; gap:8px; }
    h2::before { content:''; width:4px; height:15px; background:#1E88E9; border-radius:2px; }
    table { width:100%; border-collapse:collapse; font-size:12px; }
    th { text-align:left; background:#EEF3F9; padding:9px 11px; color:#45566E; font-weight:600; border-bottom:1px solid #E4E9F1; }
    td { padding:9px 11px; border-bottom:1px solid #EDF1F6; vertical-align:top; }
    tr.zebra td { background:#FAFCFE; }
    .u { color:#8A97A8; font-size:11px; }
    .dim { color:#8A97A8; font-size:11px; }
    .pill { display:inline-block; padding:2px 9px; border-radius:999px; font-weight:600; font-size:11px; }
    .empty { color:#8A97A8; font-size:12px; padding:10px 2px; }

    .sign { display:flex; justify-content:flex-end; gap:60px; margin-top:40px; }
    .sigcol { text-align:center; width:200px; }
    .sigline { border-top:1px solid #101B2D; margin-bottom:6px; }
    .sigcap { font-size:11px; color:#5E6D82; }
    .foot { margin-top:26px; padding-top:12px; border-top:1px solid #E4E9F1; color:#8A97A8; font-size:10.5px; text-align:center; }
  </style></head><body><div class="page">
    <div class="lh">
      <div class="logo">C</div>
      <div><h1>รายงานสุขภาพผู้ป่วย</h1><div class="en">Patient Health Report · CareMate</div></div>
      <div class="meta">รหัสผู้ป่วย (HN): <b>${hn}</b><br>วันที่ออกรายงาน: <b>${fmtDate(now.toISOString())}</b></div>
    </div>

    <div class="pbox">
      <div style="flex:1">
        <div class="pname">${esc(patient.name)}</div>
        <div class="grid">
          ${info('เพศ', esc(patient.gender || '-'))}
          ${info('อายุ', age != null ? `${age} ปี` : '-')}
          ${info('วันเกิด', patient.birthdate ? fmtDate(patient.birthdate) : '-')}
          ${info('กรุ๊ปเลือด', esc(patient.blood_type || '-'))}
          ${info('โรคประจำตัว', esc(patient.diseases || '-'))}
          ${info('ประวัติแพ้ยา', esc(patient.allergies || '-'))}
        </div>
      </div>
      <div class="kpi"><div class="n">${adherence == null ? '—' : adherence + '%'}</div><div class="l">การทานยา 7 วัน</div></div>
    </div>

    <h2>รายการยาและตารางเตือน</h2>
    ${medRows ? `<table><thead><tr><th style="width:32%">ชื่อยา</th><th>ขนาด</th><th>เวลาเตือน</th><th>หมายเหตุ</th></tr></thead><tbody>${medRows}</tbody></table>` : '<div class="empty">— ไม่มีรายการยา —</div>'}

    <h2>ค่าสุขภาพล่าสุด</h2>
    ${vitalRows ? `<table><thead><tr><th>ชนิด</th><th>ค่าที่วัด</th><th>ผลการแปล</th><th>วันเวลา</th></tr></thead><tbody>${vitalRows}</tbody></table>` : '<div class="empty">— ยังไม่มีบันทึกค่า —</div>'}

    <h2>ตารางนัดหมาย</h2>
    ${apptRows ? `<table><thead><tr><th>แผนก/แพทย์</th><th>สถานที่</th><th>หมายเหตุ</th><th>วันเวลา</th></tr></thead><tbody>${apptRows}</tbody></table>` : '<div class="empty">— ไม่มีนัดหมาย —</div>'}

    <div class="sign">
      <div class="sigcol"><div class="sigline"></div><div class="sigcap">ลงชื่อผู้ดูแล</div></div>
      <div class="sigcol"><div class="sigline"></div><div class="sigcap">ลงชื่อแพทย์ผู้ตรวจ</div></div>
    </div>

    <div class="foot">เอกสารนี้สร้างอัตโนมัติจากแอป CareMate เมื่อ ${genStamp} · เพื่อประกอบการดูแลรักษาเท่านั้น</div>
  </div></body></html>`;

  const { uri } = await Print.printToFileAsync({ html });

  // ตั้งชื่อไฟล์ตามผู้ป่วย + วันที่
  let target = uri;
  try {
    const safeName = patient.name.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '_');
    const ds = `${now.getFullYear() + 543}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const dir = (FileSystem as any).cacheDirectory;
    if (dir && (FileSystem as any).copyAsync) {
      const to = `${dir}รายงานสุขภาพ_${safeName}_${ds}.pdf`;
      await (FileSystem as any).copyAsync({ from: uri, to });
      target = to;
    }
  } catch { /* ใช้ไฟล์เดิมถ้าเปลี่ยนชื่อไม่ได้ */ }

  if (await isAvailableAsync()) await shareAsync(target, { mimeType: 'application/pdf', dialogTitle: 'รายงานสุขภาพ', UTI: 'com.adobe.pdf' });
  return target;
}
