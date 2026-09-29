import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';

export type Appointment = {
  id: string;
  patient_id: string;
  department: string | null;
  doctor: string | null;
  hospital: string | null;
  building: string | null;
  room: string | null;
  datetime: string;
  note: string | null;
};

const TH_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
export const apptDay = (iso: string) => String(new Date(iso).getDate());
export const apptMonth = (iso: string) => TH_MONTHS[new Date(iso).getMonth()];
export const apptTime = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} น.`;
};
/** หัวข้อนัด (แผนก) + บรรทัดรอง (สถานที่) */
export const apptTitle = (a: Appointment) => a.department || 'นัดหมาย';
export const apptPlace = (a: Appointment) =>
  [a.hospital, a.building ? `ตึก ${a.building}` : null, a.room ? `ห้อง ${a.room}` : null].filter(Boolean).join(' · ');

export function useAppointments(patientId?: string | null) {
  return useQuery({
    queryKey: ['appointments', patientId],
    enabled: !!patientId,
    queryFn: async (): Promise<Appointment[]> => {
      const { data, error } = await supabase.from('appointments').select('*').eq('patient_id', patientId!).order('datetime', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Appointment[];
    },
  });
}

export function useNextAppointment(patientId?: string | null) {
  return useQuery({
    queryKey: ['nextAppointment', patientId],
    enabled: !!patientId,
    queryFn: async (): Promise<Appointment | null> => {
      const since = new Date(); since.setHours(0, 0, 0, 0);
      const { data, error } = await supabase.from('appointments').select('*').eq('patient_id', patientId!).gte('datetime', since.toISOString()).order('datetime', { ascending: true }).limit(1);
      if (error) throw error;
      return (data?.[0] as Appointment) ?? null;
    },
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>, patientId?: string | null) {
  qc.invalidateQueries({ queryKey: ['appointments', patientId] });
  qc.invalidateQueries({ queryKey: ['nextAppointment', patientId] });
}

export function useCreateAppointment(patientId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { department?: string | null; doctor?: string | null; hospital?: string | null; building?: string | null; room?: string | null; datetime: string; note?: string | null }) => {
      if (!patientId) throw new Error('ยังไม่ได้เลือกผู้ป่วย');
      const { error } = await supabase.from('appointments').insert({
        patient_id: patientId,
        department: input.department ?? null,
        doctor: input.doctor ?? null,
        hospital: input.hospital ?? null,
        building: input.building ?? null,
        room: input.room ?? null,
        datetime: input.datetime,
        note: input.note ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => invalidate(qc, patientId),
  });
}

export function useDeleteAppointment(patientId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(qc, patientId),
  });
}
