import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';

export type Reminder = { id: string; medication_id: string; patient_id: string; time: string; days: number[]; active: boolean };
export type Medication = { id: string; patient_id: string; name: string; dosage: string | null; note: string | null; reminders: Reminder[] };
export type NewMedication = { name: string; dosage?: string | null; note?: string | null; times: string[]; days?: number[] };

export type DoseStatus = 'taken' | 'overdue' | 'waiting';
export type TodayDose = { reminderId: string; medicationId: string; time: string; period: string; medName: string; dosage: string | null; status: DoseStatus };

const hhmm = (time: string) => time.slice(0, 5);
const toFull = (time: string) => (time.length === 5 ? `${time}:00` : time);
function periodLabel(hour: number): string {
  if (hour < 11) return 'เช้า';
  if (hour < 14) return 'เที่ยง';
  if (hour < 17) return 'บ่าย';
  if (hour < 20) return 'เย็น';
  return 'ก่อนนอน';
}

export function useMedications(patientId?: string | null) {
  return useQuery({
    queryKey: ['medications', patientId],
    enabled: !!patientId,
    queryFn: async (): Promise<Medication[]> => {
      const { data, error } = await supabase.from('medications').select('*, reminders(*)').eq('patient_id', patientId!).order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Medication[];
    },
  });
}

export function useTodayDoses(patientId?: string | null) {
  return useQuery({
    queryKey: ['todayDoses', patientId],
    enabled: !!patientId,
    queryFn: async (): Promise<TodayDose[]> => {
      const now = new Date();
      const weekday = now.getDay();
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const [{ data: meds, error: e1 }, { data: events, error: e2 }] = await Promise.all([
        supabase.from('medications').select('id, name, dosage, reminders(*)').eq('patient_id', patientId!),
        supabase.from('med_events').select('reminder_id, status, created_at').eq('patient_id', patientId!).gte('created_at', start.toISOString()),
      ]);
      if (e1) throw e1; if (e2) throw e2;
      const takenReminderIds = new Set((events ?? []).filter((ev: any) => ev.status === 'taken').map((ev: any) => ev.reminder_id));
      const doses: TodayDose[] = [];
      for (const med of (meds ?? []) as any[]) {
        for (const r of (med.reminders ?? []) as Reminder[]) {
          if (!r.active) continue;
          const days = r.days ?? [];
          if (days.length > 0 && !days.includes(weekday)) continue;
          const [h, m] = r.time.split(':').map((n) => parseInt(n, 10));
          let status: DoseStatus = 'waiting';
          if (takenReminderIds.has(r.id)) status = 'taken';
          else { const due = new Date(); due.setHours(h, m, 0, 0); status = now.getTime() > due.getTime() + 15 * 60 * 1000 ? 'overdue' : 'waiting'; }
          doses.push({ reminderId: r.id, medicationId: med.id, time: hhmm(r.time), period: periodLabel(h), medName: med.name, dosage: med.dosage ?? null, status });
        }
      }
      doses.sort((a, b) => a.time.localeCompare(b.time));
      return doses;
    },
  });
}

export function useAdherence7d(patientId?: string | null) {
  return useQuery({
    queryKey: ['adherence7d', patientId],
    enabled: !!patientId,
    queryFn: async (): Promise<number | null> => {
      const now = new Date();
      const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - 6);
      const [{ data: rems, error: e1 }, { data: events, error: e2 }] = await Promise.all([
        supabase.from('reminders').select('*').eq('patient_id', patientId!).eq('active', true),
        supabase.from('med_events').select('created_at').eq('patient_id', patientId!).eq('status', 'taken').gte('created_at', start.toISOString()),
      ]);
      if (e1) throw e1; if (e2) throw e2;
      let expected = 0;
      for (let i = 0; i < 7; i++) {
        const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
        const wd = d.getDay();
        for (const r of (rems ?? []) as Reminder[]) {
          const days = r.days ?? [];
          if (days.length > 0 && !days.includes(wd)) continue;
          if (i === 0) { const [h, m] = r.time.split(':').map((n) => parseInt(n, 10)); const due = new Date(); due.setHours(h, m, 0, 0); if (now.getTime() < due.getTime()) continue; }
          expected++;
        }
      }
      if (expected === 0) return null;
      return Math.min(100, Math.round(((events ?? []).length / expected) * 100));
    },
  });
}

function invalidateMeds(qc: ReturnType<typeof useQueryClient>, patientId?: string | null) {
  qc.invalidateQueries({ queryKey: ['medications', patientId] });
  qc.invalidateQueries({ queryKey: ['todayDoses', patientId] });
  qc.invalidateQueries({ queryKey: ['adherence7d', patientId] });
}

export function useCreateMedication(patientId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewMedication) => {
      if (!patientId) throw new Error('ยังไม่ได้เลือกผู้ป่วย');
      const { data: med, error } = await supabase.from('medications').insert({ patient_id: patientId, name: input.name, dosage: input.dosage ?? null, note: input.note ?? null }).select().single();
      if (error) throw error;
      const rows = (input.times ?? []).map((tm) => ({ medication_id: med.id, patient_id: patientId, time: toFull(tm), days: input.days ?? [], active: true }));
      if (rows.length) { const { error: rErr } = await supabase.from('reminders').insert(rows); if (rErr) throw rErr; }
      return med;
    },
    onSuccess: () => invalidateMeds(qc, patientId),
  });
}

/** แก้ไขยา: อัปเดตข้อมูลยา + แทนที่ชุดเวลาเตือนทั้งหมด */
export function useUpdateMedication(patientId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; name: string; dosage?: string | null; note?: string | null; times: string[]; days?: number[] }) => {
      const { error } = await supabase.from('medications').update({ name: input.name, dosage: input.dosage ?? null, note: input.note ?? null }).eq('id', input.id);
      if (error) throw error;
      // แทนที่ reminders ทั้งหมดของยานี้
      const { error: dErr } = await supabase.from('reminders').delete().eq('medication_id', input.id);
      if (dErr) throw dErr;
      const rows = (input.times ?? []).map((tm) => ({ medication_id: input.id, patient_id: patientId, time: toFull(tm), days: input.days ?? [], active: true }));
      if (rows.length) { const { error: rErr } = await supabase.from('reminders').insert(rows); if (rErr) throw rErr; }
    },
    onSuccess: () => invalidateMeds(qc, patientId),
  });
}

export function useDeleteMedication(patientId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('medications').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => invalidateMeds(qc, patientId),
  });
}

export function useMarkDose(patientId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (reminderId: string) => {
      if (!patientId) throw new Error('ยังไม่ได้เลือกผู้ป่วย');
      const { error } = await supabase.from('med_events').insert({ reminder_id: reminderId, patient_id: patientId, status: 'taken', source: 'app' });
      if (error) throw error;
    },
    onSuccess: () => invalidateMeds(qc, patientId),
  });
}
