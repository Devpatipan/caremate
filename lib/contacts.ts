import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';

export type EmergencyContact = {
  id: string;
  patient_id: string;
  name: string;
  relation: string | null;
  phone: string;
  note: string | null;
};

export function useEmergencyContacts(patientId?: string | null) {
  return useQuery({
    queryKey: ['contacts', patientId],
    enabled: !!patientId,
    queryFn: async (): Promise<EmergencyContact[]> => {
      const { data, error } = await supabase.from('emergency_contacts').select('*').eq('patient_id', patientId!).order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as EmergencyContact[];
    },
  });
}

export function useCreateContact(patientId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; relation?: string | null; phone: string; note?: string | null }) => {
      if (!patientId) throw new Error('ยังไม่ได้เลือกผู้ป่วย');
      const { error } = await supabase.from('emergency_contacts').insert({
        patient_id: patientId,
        name: input.name,
        relation: input.relation ?? null,
        phone: input.phone,
        note: input.note ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts', patientId] }),
  });
}

export function useDeleteContact(patientId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('emergency_contacts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts', patientId] }),
  });
}
