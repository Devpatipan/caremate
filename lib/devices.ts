import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';

export type Device = {
  id: string;
  patient_id: string;
  device_key: string;
  name?: string | null;
  last_seen: string | null;
  sound_profile: string;
  test_ring_at?: string | null;
  provisioning?: boolean;
};

export type DeviceState = 'online' | 'offline' | 'provisioning' | 'never';

/** สถานะกล่องแบบละเอียด — ตรงกับสภาพจริงของอุปกรณ์ */
export function deviceState(device?: Device | null): DeviceState {
  if (!device) return 'never';
  if (device.provisioning) return 'provisioning'; // กำลังปล่อย CareMate-Setup รอตั้ง WiFi
  if (!device.last_seen) return 'never';
  return Date.now() - new Date(device.last_seen).getTime() < 60000 ? 'online' : 'offline'; // 60 วิ (3 รอบ poll)
}

export type SoundProfile = 'voice_th' | 'buzzer' | 'custom';
export const SOUND_OPTIONS: { id: SoundProfile; name: string; detail: string }[] = [
  { id: 'buzzer', name: 'เสียงตี๊ด (เตือนถี่)', detail: 'เสียงบี๊บถี่ ๆ กระตุ้นเตือน' },
  { id: 'voice_th', name: 'เสียงทำนอง (นุ่มนวล)', detail: 'โน้ตดนตรีไพเราะ โด-มี-ซอล ไม่ตกใจ' },
  { id: 'custom', name: 'เสียงเตือนแรง', detail: 'เสียงดังยาว สลับสูง-ต่ำ คล้ายไซเรน' },
];

export function isOnline(device?: Device | null): boolean {
  return deviceState(device) === 'online';
}

function invDevices(qc: ReturnType<typeof useQueryClient>, patientId?: string | null) {
  qc.invalidateQueries({ queryKey: ['devices', patientId] });
  qc.invalidateQueries({ queryKey: ['device', patientId] });
}

/** รายการกล่องทั้งหมดของผู้ป่วยคนนี้ (รองรับหลายกล่อง) */
export function useDevices(patientId?: string | null) {
  return useQuery({
    queryKey: ['devices', patientId],
    enabled: !!patientId,
    queryFn: async (): Promise<Device[]> => {
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .eq('patient_id', patientId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Device[];
    },
  });
}

/** กล่องตัวแรก (ใช้สรุปในหน้าหลัก) */
export function useDevice(patientId?: string | null) {
  return useQuery({
    queryKey: ['device', patientId],
    enabled: !!patientId,
    queryFn: async (): Promise<Device | null> => {
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .eq('patient_id', patientId!)
        .order('created_at', { ascending: true })
        .limit(1);
      if (error) throw error;
      return (data?.[0] as Device) ?? null;
    },
  });
}

export function useCreateDevice(patientId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name?: string) => {
      if (!patientId) throw new Error('ยังไม่ได้เลือกผู้ป่วย');
      const { data, error } = await supabase
        .from('devices')
        .insert({ patient_id: patientId, name: name ?? null })
        .select()
        .single();
      if (error) throw error;
      return data as Device;
    },
    onSuccess: () => invDevices(qc, patientId),
  });
}

export function useUpdateDeviceName(patientId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; name: string }) => {
      const { error } = await supabase.from('devices').update({ name: input.name }).eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: () => invDevices(qc, patientId),
  });
}

export function useUpdateSound(patientId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; sound_profile: SoundProfile }) => {
      const { error } = await supabase.from('devices').update({ sound_profile: input.sound_profile }).eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: () => invDevices(qc, patientId),
  });
}

/** ส่งคำสั่งให้กล่องส่งเสียงทดสอบทันที (กล่องจะดังในรอบ poll ถัดไป ~20 วิ) */
export function useTestRing(patientId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('devices').update({ test_ring_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invDevices(qc, patientId),
  });
}

/** สั่งให้กล่องลืม WiFi และกลับเข้าโหมดตั้งค่า (device key คงเดิม) */
export function useResetWifi(patientId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('devices').update({ wifi_reset_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invDevices(qc, patientId),
  });
}

export function useUnpairDevice(patientId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('devices').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invDevices(qc, patientId),
  });
}
