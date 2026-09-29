import { supabase } from './supabase';

/** ลบบัญชี + ข้อมูลทั้งหมดถาวร (เรียก Edge Function delete-account) */
export async function deleteAccount(): Promise<void> {
  const { data, error } = await supabase.functions.invoke('delete-account');
  if (error) throw error;
  if ((data as any)?.error) throw new Error((data as any).error);
}
