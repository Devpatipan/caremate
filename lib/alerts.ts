import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';

export type AlertType = 'missed' | 'vital' | 'taken' | 'appointment' | 'offline' | 'info';
export type AlertRecord = {
  id: string;
  patient_id: string;
  type: AlertType;
  message: string;
  seen: boolean;
  created_at: string;
};

export function useAlerts(patientId?: string | null) {
  return useQuery({
    queryKey: ['alerts', patientId],
    enabled: !!patientId,
    queryFn: async (): Promise<AlertRecord[]> => {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('patient_id', patientId!)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as AlertRecord[];
    },
  });
}

export function useUnreadCount(patientId?: string | null) {
  const q = useAlerts(patientId);
  const count = (q.data ?? []).filter((a) => !a.seen).length;
  return { count, ...q };
}

export function useMarkSeen(patientId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('alerts').update({ seen: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts', patientId] }),
  });
}

/** ป้ายชื่อชนิดแจ้งเตือน (ภาษาไทย) */
export function alertTypeLabel(type: AlertType): string {
  const map: Record<AlertType, string> = {
    missed: 'พลาดการทานยา',
    vital: 'ค่าสุขภาพผิดปกติ',
    taken: 'ทานยาแล้ว',
    appointment: 'นัดหมายแพทย์',
    offline: 'กล่องออฟไลน์',
    info: 'แจ้งเตือน',
  };
  return map[type] ?? 'แจ้งเตือน';
}

export function useMarkAllSeen(patientId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!patientId) return;
      const { error } = await supabase
        .from('alerts')
        .update({ seen: true })
        .eq('patient_id', patientId)
        .eq('seen', false);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts', patientId] }),
  });
}
