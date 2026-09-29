import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';

export type VitalType = 'bp' | 'sugar' | 'hr';
export type VitalStatus = 'ok' | 'warn' | 'bad';
export type Vital = { id: string; patient_id: string; type: VitalType; value_json: any; taken_at: string; source: string };

export const VITAL_META: Record<VitalType, { label: string; unit: string }> = {
  bp: { label: 'ความดัน', unit: 'มม.ปรอท' },
  sugar: { label: 'น้ำตาล', unit: 'mg/dL' },
  hr: { label: 'หัวใจ', unit: 'bpm' },
};

export function interpretVital(type: VitalType, v: any): { display: string; unit: string; status: VitalStatus; statusLabel: string } {
  if (type === 'bp') {
    const sys = Number(v?.sys ?? 0), dia = Number(v?.dia ?? 0);
    let status: VitalStatus = 'ok', statusLabel = 'ปกติ';
    if (sys >= 180 || dia >= 120) { status = 'bad'; statusLabel = 'สูงวิกฤต'; }
    else if (sys >= 140 || dia >= 90) { status = 'bad'; statusLabel = 'สูง'; }
    else if (sys >= 130 || dia >= 80) { status = 'warn'; statusLabel = 'ค่อนข้างสูง'; }
    else if (sys < 90 || dia < 60) { status = 'warn'; statusLabel = 'ค่อนข้างต่ำ'; }
    return { display: `${sys}/${dia}`, unit: 'มม.ปรอท', status, statusLabel };
  }
  if (type === 'sugar') {
    const val = Number(v?.value ?? 0), post = v?.context === 'หลังอาหาร';
    let status: VitalStatus = 'ok', statusLabel = 'ปกติ';
    if (val > 0 && val < 70) { status = 'warn'; statusLabel = 'ต่ำ'; }
    else if (post) { if (val >= 200) { status = 'bad'; statusLabel = 'สูง'; } else if (val >= 140) { status = 'warn'; statusLabel = 'เฝ้าระวัง'; } }
    else { if (val >= 126) { status = 'bad'; statusLabel = 'สูง'; } else if (val >= 100) { status = 'warn'; statusLabel = 'เฝ้าระวัง'; } }
    return { display: `${val}`, unit: 'mg/dL', status, statusLabel };
  }
  const val = Number(v?.value ?? 0), resting = v?.context !== 'หลังออกกำลัง';
  let status: VitalStatus = 'ok', statusLabel = 'ปกติ';
  if (resting) { if (val > 100) { status = 'warn'; statusLabel = 'เต้นเร็ว'; } else if (val > 0 && val < 60) { status = 'warn'; statusLabel = 'เต้นช้า'; } }
  return { display: `${val}`, unit: 'bpm', status, statusLabel };
}

/** คำแนะนำตามเกณฑ์มาตรฐาน (ตาม type + สถานะ) */
export function vitalAdvice(type: VitalType, status: VitalStatus): string {
  if (type === 'bp') {
    if (status === 'bad') return 'ความดันสูงกว่าเกณฑ์ ควรลดอาหารเค็ม พักผ่อนให้พอ และปรึกษาแพทย์ — หากสูงมาก (≥180/120) พบแพทย์ทันที';
    if (status === 'warn') return 'ความดันเริ่มสูง/ต่ำกว่าปกติเล็กน้อย ควรวัดซ้ำเป็นระยะและปรับพฤติกรรม';
    return 'ความดันอยู่ในเกณฑ์ดี รักษาพฤติกรรมสุขภาพต่อไป';
  }
  if (type === 'sugar') {
    if (status === 'bad') return 'น้ำตาลสูงกว่าเกณฑ์ ควรคุมอาหารหวาน/แป้ง ออกกำลังกาย และปรึกษาแพทย์';
    if (status === 'warn') return 'น้ำตาลอยู่ในช่วงเฝ้าระวัง/ต่ำ ควรวัดซ้ำและดูแลอาหารให้เหมาะสม';
    return 'ระดับน้ำตาลอยู่ในเกณฑ์ดี ดูแลต่อเนื่อง';
  }
  if (status === 'warn') return 'ชีพจรเร็ว/ช้ากว่าปกติ ควรพักและวัดซ้ำ หากมีอาการผิดปกติให้พบแพทย์';
  return 'อัตราการเต้นหัวใจอยู่ในเกณฑ์ปกติ';
}

/** เกณฑ์ปกติ (ข้อความสั้น) */
export function vitalNormalRange(type: VitalType): string {
  if (type === 'bp') return 'เกณฑ์ปกติ: น้อยกว่า 120/80 มม.ปรอท';
  if (type === 'sugar') return 'เกณฑ์ปกติ (อดอาหาร): 70–99 mg/dL';
  return 'เกณฑ์ปกติ (ขณะพัก): 60–100 bpm';
}

/** ค่าหลักของ vital (ตัวเลขสำหรับกราฟ/แนวโน้ม) */
export function vitalPrimary(type: VitalType, v: any): number {
  if (type === 'bp') return Number(v?.sys ?? 0);
  return Number(v?.value ?? 0);
}

export function vitalContextLabel(v: any): string | null {
  if (!v) return null;
  const parts: string[] = [];
  if (v.context) parts.push(v.context);
  if (v.arm) parts.push(`แขน${v.arm}`);
  if (v.position) parts.push(`ท่า${v.position}`);
  if (v.pulse) parts.push(`ชีพจร ${v.pulse}`);
  return parts.length ? parts.join(' · ') : null;
}

export function useVitals(patientId?: string | null, type?: VitalType) {
  return useQuery({
    queryKey: ['vitals', patientId, type],
    enabled: !!patientId && !!type,
    queryFn: async (): Promise<Vital[]> => {
      const { data, error } = await supabase.from('vitals').select('*').eq('patient_id', patientId!).eq('type', type!).order('taken_at', { ascending: false }).limit(30);
      if (error) throw error;
      return (data ?? []) as Vital[];
    },
  });
}

export function useLatestVitals(patientId?: string | null) {
  return useQuery({
    queryKey: ['latestVitals', patientId],
    enabled: !!patientId,
    queryFn: async (): Promise<Partial<Record<VitalType, Vital>>> => {
      const { data, error } = await supabase.from('vitals').select('*').eq('patient_id', patientId!).order('taken_at', { ascending: false }).limit(60);
      if (error) throw error;
      const out: Partial<Record<VitalType, Vital>> = {};
      for (const v of (data ?? []) as Vital[]) if (!out[v.type]) out[v.type] = v;
      return out;
    },
  });
}

function invalidateVitals(qc: ReturnType<typeof useQueryClient>, patientId?: string | null, type?: VitalType) {
  qc.invalidateQueries({ queryKey: ['vitals', patientId, type] });
  qc.invalidateQueries({ queryKey: ['latestVitals', patientId] });
}

export function useCreateVital(patientId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { type: VitalType; value_json: any; taken_at?: string }) => {
      if (!patientId) throw new Error('ยังไม่ได้เลือกผู้ป่วย');
      const row: any = { patient_id: patientId, type: input.type, value_json: input.value_json, source: 'app' };
      if (input.taken_at) row.taken_at = input.taken_at;
      const { error } = await supabase.from('vitals').insert(row);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => invalidateVitals(qc, patientId, vars.type),
  });
}

export function useUpdateVital(patientId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; type: VitalType; value_json: any; taken_at?: string }) => {
      const patch: any = { value_json: input.value_json };
      if (input.taken_at) patch.taken_at = input.taken_at;
      const { error } = await supabase.from('vitals').update(patch).eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => invalidateVitals(qc, patientId, vars.type),
  });
}

export function useDeleteVital(patientId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; type: VitalType }) => {
      const { error } = await supabase.from('vitals').delete().eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => invalidateVitals(qc, patientId, vars.type),
  });
}
