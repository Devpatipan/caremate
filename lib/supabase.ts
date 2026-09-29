import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** true เมื่อใส่ค่าใน .env ครบแล้ว — ใช้ตัดสินใจว่าจะบังคับล็อกอินไหม */
export const supabaseConfigured = url.length > 0 && anonKey.length > 0;

if (!supabaseConfigured) {
  // ไม่ throw เพื่อให้แอปยังเปิดดู UI ได้ระหว่างยังไม่ตั้งค่า backend
  console.warn(
    '[CareMate] ยังไม่ได้ตั้งค่า Supabase — คัดลอก .env.example เป็น .env แล้วใส่ URL + anon key'
  );
}

export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'public-anon-placeholder',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'pkce',
    },
  }
);
