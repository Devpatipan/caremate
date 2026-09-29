/**
 * ดึงอุณหภูมิปัจจุบันตามตำแหน่งมือถือ (Open-Meteo — ฟรี ไม่ต้องใช้ API key)
 * - อ่านสิทธิ์ตำแหน่งแบบ "ไม่ขอเพิ่ม" (ขอไปแล้วตอน onboarding) ถ้าไม่ได้อนุญาต -> คืน null
 * - โหลด expo-location แบบ dynamic กันแอปพังถ้ายังไม่ได้ติดตั้งแพ็กเกจ
 */
export async function getWeather(): Promise<number | null> {
  try {
    const Location: any = await import('expo-location');
    const perm = await Location.getForegroundPermissionsAsync();
    if (perm.status !== 'granted') return null;
    const loc =
      (await Location.getLastKnownPositionAsync()) ??
      (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }));
    if (!loc) return null;
    const { latitude, longitude } = loc.coords;
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m`
    );
    const j = await res.json();
    const temp = j?.current?.temperature_2m;
    return typeof temp === 'number' ? Math.round(temp) : null;
  } catch {
    return null;
  }
}
