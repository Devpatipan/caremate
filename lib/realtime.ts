import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';

/**
 * เชื่อม Supabase Realtime:
 * เมื่อข้อมูลของผู้ป่วยคนที่กำลังดูแลเปลี่ยนในคลาวด์ (จากกล่อง, จากผู้ดูแลคนอื่น,
 * หรือจาก cron) แอปจะอัปเดตทันที ไม่ต้องรอ refetch
 *
 * ต้องเปิด Realtime ให้ตารางเหล่านี้ก่อน (รัน SQL ครั้งเดียว):
 *   alter publication supabase_realtime add table <table>;
 */
export function useRealtimeSync(patientId?: string | null) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!patientId) return;
    const pid = patientId;
    const filter = `patient_id=eq.${pid}`;
    const inv = (keys: any[][]) => keys.forEach((k) => qc.invalidateQueries({ queryKey: k }));

    const onTable = (table: string, keys: any[][]) => ({ table, keys });
    const MAP = [
      onTable('med_events', [['todayDoses', pid], ['adherence7d', pid]]),
      onTable('medications', [['medications', pid], ['todayDoses', pid], ['adherence7d', pid]]),
      onTable('reminders', [['medications', pid], ['todayDoses', pid], ['adherence7d', pid]]),
      onTable('vitals', [['vitals', pid], ['latestVitals', pid]]),
      onTable('appointments', [['appointments', pid], ['nextAppointment', pid]]),
      onTable('emergency_contacts', [['contacts', pid]]),
      onTable('alerts', [['alerts', pid]]),
      onTable('devices', [['device', pid], ['devices', pid]]),
    ];

    let channel = supabase.channel(`patient-${pid}`);
    for (const m of MAP) {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: m.table, filter },
        () => inv(m.keys),
      );
    }
    channel.subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [patientId, qc]);
}
