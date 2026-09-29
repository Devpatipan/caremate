import React, { useState } from 'react';
import { View, ScrollView, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BellRing, ShieldCheck, HeartPulse, Check } from 'lucide-react-native';
import { useTheme, useThemeControls } from '../theme/ThemeProvider';
import { Text } from '../components/ui/Text';
import { Button } from '../components/ui/Button';
import { registerForPush } from '../lib/push';
import { setOnboarded } from '../lib/onboarding';

function Feature({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 13, marginBottom: 16 }}>
      <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: t.colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong" weight="700">{title}</Text>
        <Text variant="caption" color="ink3" style={{ marginTop: 2, lineHeight: 19 }}>{detail}</Text>
      </View>
    </View>
  );
}

export default function Onboarding() {
  const t = useTheme();
  const { scheme } = useThemeControls();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);

  const finish = async () => {
    setBusy(true);
    try {
      await registerForPush(); // ขอสิทธิ์แจ้งเตือน (ถ้าเป็น dev/prod build)
    } catch { /* เงียบไว้ */ }
    try {
      const Location: any = await import('expo-location'); // ขอสิทธิ์ตำแหน่ง (สำหรับอากาศ)
      await Location.requestForegroundPermissionsAsync();
    } catch { /* ยังไม่ได้ติดตั้ง expo-location ก็ข้าม */ }
    await setOnboarded();
    setBusy(false);
    router.replace('/(tabs)');
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.canvas }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 30, paddingHorizontal: 24, paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', marginBottom: 26 }}>
          <Image source={require('../assets/icon.png')} style={{ width: 96, height: 96, borderRadius: 24 }} />
          <Text variant="h1" weight="700" style={{ marginTop: 16 }}>ยินดีต้อนรับสู่ CareMate</Text>
          <Text variant="body" color="ink3" center style={{ marginTop: 6, paddingHorizontal: 10 }}>ดูแลการทานยาและสุขภาพของคนที่คุณรัก จากที่ไหนก็ได้</Text>
        </View>

        <Feature icon={<BellRing size={22} color={t.colors.primaryStrong} strokeWidth={2} />} title="เตือนเมื่อพลาดยา" detail="ได้รับแจ้งเตือนทันทีเมื่อผู้สูงอายุยังไม่ได้ทานยาตามเวลา" />
        <Feature icon={<HeartPulse size={22} color={t.colors.primaryStrong} strokeWidth={2} />} title="ติดตามสุขภาพ" detail="บันทึกความดัน น้ำตาล หัวใจ ดูแนวโน้ม และออกรายงานให้แพทย์" />
        <Feature icon={<ShieldCheck size={22} color={t.colors.primaryStrong} strokeWidth={2} />} title="ข้อมูลปลอดภัย" detail="ข้อมูลสุขภาพถูกปกป้อง เห็นได้เฉพาะคุณและผู้ดูแลที่ได้รับสิทธิ์" />

        {/* ขออนุญาต */}
        <View style={{ backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.line, borderRadius: t.radius.lg, padding: 14, marginTop: 8, marginBottom: 16 }}>
          <Text variant="caption" color="ink2" style={{ lineHeight: 20 }}>
            เมื่อเริ่มใช้งาน แอปจะขอสิทธิ์ <Text weight="700">การแจ้งเตือน</Text> เพื่อเตือนเรื่องยา และอาจขอ <Text weight="700">ตำแหน่ง</Text> เพื่อแสดงสภาพอากาศ — คุณเลือกอนุญาตหรือปฏิเสธได้
          </Text>
        </View>

        {/* consent */}
        <Pressable onPress={() => setConsent((v) => !v)} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 11, marginBottom: 18 }}>
          <View style={{ width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: consent ? t.colors.primary : t.colors.line, backgroundColor: consent ? t.colors.primary : 'transparent', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
            {consent ? <Check size={15} color="#fff" strokeWidth={3} /> : null}
          </View>
          <Text variant="caption" color="ink2" style={{ flex: 1, lineHeight: 20 }}>
            ฉันยอมรับ <Text weight="700" style={{ color: t.colors.primaryStrong }}>นโยบายความเป็นส่วนตัว</Text> และยินยอมให้เก็บข้อมูลสุขภาพเพื่อการดูแลผู้ป่วย (PDPA)
          </Text>
        </Pressable>

        <Button label="เริ่มใช้งาน" block loading={busy} disabled={!consent} onPress={finish} />
      </ScrollView>
    </View>
  );
}
