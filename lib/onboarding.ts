import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'caremate_onboarded_v1';
let cache: boolean | null = null;
const listeners = new Set<(v: boolean) => void>();

/** โหลดสถานะว่าเคยผ่าน onboarding แล้วหรือยัง (แคชไว้) */
export async function loadOnboarded(): Promise<boolean> {
  if (cache === null) {
    try {
      cache = (await AsyncStorage.getItem(KEY)) === '1';
    } catch {
      cache = true; // อ่านไม่ได้ = ไม่บล็อกผู้ใช้
    }
  }
  return cache;
}

/** ทำเครื่องหมายว่าผ่าน onboarding แล้ว + แจ้งผู้ฟัง */
export async function setOnboarded(): Promise<void> {
  cache = true;
  try {
    await AsyncStorage.setItem(KEY, '1');
  } catch { /* ignore */ }
  listeners.forEach((l) => l(true));
}

export function onOnboardedChange(l: (v: boolean) => void): () => void {
  listeners.add(l);
  return () => { listeners.delete(l); };
}
