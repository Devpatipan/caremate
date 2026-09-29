import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';

export type Patient = {
  id: string;
  name: string;
  gender: string | null;
  birthdate: string | null;
  blood_type: string | null;
  diseases: string | null;
  allergies: string | null;
  photo_url: string | null;
  created_at?: string;
};

export type NewPatient = {
  name: string;
  gender?: string | null;
  diseases?: string | null;
  blood_type?: string | null;
  birthdate?: string | null;
  allergies?: string | null;
};

export function usePatients(enabled = true) {
  return useQuery({
    queryKey: ['patients'],
    enabled,
    queryFn: async (): Promise<Patient[]> => {
      const { data, error } = await supabase.from('caregiver_patient').select('created_at, patient:patients(*)').order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row: any) => row.patient).filter(Boolean) as Patient[];
    },
  });
}

export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewPatient): Promise<Patient> => {
      const { data, error } = await supabase.rpc('create_patient', {
        p_name: input.name,
        p_gender: input.gender ?? null,
        p_blood_type: input.blood_type ?? null,
        p_diseases: input.diseases ?? null,
        p_birthdate: input.birthdate ?? null,
        p_allergies: input.allergies ?? null,
      });
      if (error) throw error;
      return data as Patient;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients'] }),
  });
}

/** ลบผู้ป่วย + ข้อมูลที่เกี่ยวข้องทั้งหมด (cascade) — สำหรับสิทธิ์ลบข้อมูลตาม PDPA */
export function useDeletePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('patients').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients'] }),
  });
}
