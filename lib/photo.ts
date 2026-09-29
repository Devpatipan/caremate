import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from './supabase';

const BUCKET = 'patient-photos';

/** base64 → Uint8Array (ไม่ต้องพึ่งไลบรารีเพิ่ม) */
function b64ToBytes(b64: string): Uint8Array {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;
  let len = b64.length * 0.75;
  if (b64[b64.length - 1] === '=') len--;
  if (b64[b64.length - 2] === '=') len--;
  const bytes = new Uint8Array(len);
  let p = 0;
  for (let i = 0; i < b64.length; i += 4) {
    const e1 = lookup[b64.charCodeAt(i)], e2 = lookup[b64.charCodeAt(i + 1)], e3 = lookup[b64.charCodeAt(i + 2)], e4 = lookup[b64.charCodeAt(i + 3)];
    bytes[p++] = (e1 << 2) | (e2 >> 4);
    if (b64[i + 2] !== '=') bytes[p++] = ((e2 & 15) << 4) | (e3 >> 2);
    if (b64[i + 3] !== '=') bytes[p++] = ((e3 & 3) << 6) | e4;
  }
  return bytes;
}

/** เปิดคลังรูป → คืน uri (หรือ null ถ้ายกเลิก/ไม่ให้สิทธิ์) */
export async function pickImage(): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });
  if (res.canceled || !res.assets?.length) return null;
  return res.assets[0].uri;
}

/** อัปโหลดรูปขึ้น Storage แล้วอัปเดต patients.photo_url → คืน public URL */
export async function uploadPatientPhoto(patientId: string, uri: string): Promise<string> {
  const b64 = await (FileSystem as any).readAsStringAsync(uri, { encoding: 'base64' });
  const bytes = b64ToBytes(b64);
  const path = `${patientId}/${Date.now()}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
  if (error) throw error;
  const url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  const { error: uErr } = await supabase.from('patients').update({ photo_url: url }).eq('id', patientId);
  if (uErr) throw uErr;
  return url;
}

/** hook: เลือกรูป + อัปโหลด + อัปเดตให้ผู้ป่วย */
export function useChangePatientPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patientId: string) => {
      const uri = await pickImage();
      if (!uri) return null;
      return await uploadPatientPhoto(patientId, uri);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients'] }),
  });
}
