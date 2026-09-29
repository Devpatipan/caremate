import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Expo Go (SDK 53+) ตัด remote push ออกแล้ว และ expo-notifications จะ throw
// ตอนถูก import — จึงต้องเช็คก่อน แล้วโหลดแบบ dynamic เฉพาะตอนไม่ใช่ Expo Go
const isExpoGo = Constants.executionEnvironment === 'storeClient';

let handlerSet = false;

/**
 * ขอสิทธิ์ + รับ Expo Push Token แล้วบันทึกลง push_tokens (เรียกหลังล็อกอิน)
 * - ใน Expo Go: ข้ามทั้งหมด (ไม่พังแอป) → ใช้ development build เพื่อทดสอบ push จริง
 * - ใน dev build / standalone: ทำงานเต็มรูปแบบ
 */
export async function registerForPush(): Promise<string | null> {
  try {
    if (isExpoGo) {
      console.warn('[CareMate] Push ถูกจำกัดใน Expo Go — ใช้ development build เพื่อทดสอบจริง');
      return null;
    }
    if (!Device.isDevice) return null;

    // โหลดแบบ dynamic เพื่อไม่ให้ side-effect ของ expo-notifications รันใน Expo Go
    const Notifications = await import('expo-notifications');

    if (!handlerSet) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
      handlerSet = true;
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (existing !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== 'granted') return null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'การแจ้งเตือน CareMate',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    const projectId =
      (Constants.expoConfig as any)?.extra?.eas?.projectId ??
      (Constants as any)?.easConfig?.projectId;

    const tokenResp = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    const token = tokenResp.data;
    if (!token) return null;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    await supabase.from('push_tokens').upsert(
      { caregiver_id: user.id, expo_token: token },
      { onConflict: 'expo_token' }
    );
    return token;
  } catch (e) {
    console.warn('[CareMate] registerForPush skipped:', (e as any)?.message);
    return null;
  }
}

/** ปิดการแจ้งเตือน: ลบ push token ของผู้ใช้ออกจากคลาวด์ */
export async function disablePush(): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('push_tokens').delete().eq('caregiver_id', user.id);
  } catch (e) {
    console.warn('[CareMate] disablePush:', (e as any)?.message);
  }
}

/** เช็คว่าเปิดแจ้งเตือนอยู่ไหม (มี token ในคลาวด์) */
export async function pushEnabled(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data } = await supabase.from('push_tokens').select('id').eq('caregiver_id', user.id).limit(1);
    return (data?.length ?? 0) > 0;
  } catch {
    return false;
  }
}

/** true ถ้าอยู่ใน Expo Go (push จริงต้องใช้ development build) */
export function pushLimitedInExpoGo(): boolean {
  return isExpoGo;
}
