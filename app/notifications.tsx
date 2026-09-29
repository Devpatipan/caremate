import React from 'react';
import { View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X, BellRing, Clock, ShieldCheck, Info } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme, useThemeControls } from '../theme/ThemeProvider';
import { Text } from '../components/ui/Text';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { registerForPush, disablePush, pushEnabled, pushLimitedInExpoGo } from '../lib/push';

function Bullet({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 14 }}>
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: t.colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong" weight="600">{title}</Text>
        <Text variant="caption" color="ink3" style={{ marginTop: 1 }}>{detail}</Text>
      </View>
    </View>
  );
}

export default function Notifications() {
  const t = useTheme();
  const { scheme } = useThemeControls();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const [busy, setBusy] = React.useState(false);
  const isExpoGo = pushLimitedInExpoGo();

  const status = useQuery({ queryKey: ['pushEnabled'], queryFn: pushEnabled });
  const enabled = status.data === true;

  const toggle = async () => {
    setBusy(true);
    try {
      if (enabled) {
        await disablePush();
      } else {
        const token = await registerForPush();
        if (!token && isExpoGo) {
          // Expo Go: แจ้งข้อจำกัด
        }
      }
      await qc.invalidateQueries({ queryKey: ['pushEnabled'] });
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.canvas }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.line, alignItems: 'center', justifyContent: 'center' }}>
          <X size={20} color={t.colors.ink2} strokeWidth={2} />
        </Pressable>
        <Text variant="h2" weight="700" style={{ flex: 1 }}>การแจ้งเตือน</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: insets.bottom + 24, paddingTop: 8 }} showsVerticalScrollIndicator={false}>
        {/* สถานะ */}
        <Card style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
            <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: enabled ? t.colors.successSoft : t.colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
              <BellRing size={24} color={enabled ? t.colors.successInk : t.colors.ink3} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong" weight="700">แจ้งเตือนพลาดยา</Text>
              <Text variant="caption" color="ink3">
                {status.isLoading ? 'กำลังตรวจสอบ…' : enabled ? 'เปิดอยู่ — จะได้รับแจ้งเมื่อผู้ป่วยไม่กดทานยาตามเวลา' : 'ปิดอยู่'}
              </Text>
            </View>
            {status.isLoading ? <ActivityIndicator color={t.colors.primary} /> : (
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: enabled ? t.colors.success : t.colors.ink3 }} />
            )}
          </View>
        </Card>

        <Text variant="title" weight="700" style={{ marginBottom: 12 }}>ทำงานยังไง</Text>
        <Bullet icon={<Clock size={18} color={t.colors.primaryStrong} strokeWidth={2} />} title="เลยเวลายา 15 นาที" detail="ถ้าถึงเวลายาแล้วเกิน 15 นาที ผู้ป่วยยังไม่กดทาน (ทั้งที่แอปและที่กล่อง)" />
        <Bullet icon={<BellRing size={18} color={t.colors.primaryStrong} strokeWidth={2} />} title="เด้งแจ้งลูกหลานทันที" detail="ส่งแจ้งเตือนไปที่มือถือผู้ดูแลทุกคนของผู้ป่วยคนนั้น + ขึ้นในหน้าแจ้งเตือน" />
        <Bullet icon={<ShieldCheck size={18} color={t.colors.primaryStrong} strokeWidth={2} />} title="อยู่ไกลก็รู้" detail="แม้ไม่ได้เปิดแอปค้าง ก็ได้รับแจ้งเตือนบนมือถือ" />

        {isExpoGo ? (
          <View style={{ flexDirection: 'row', gap: 10, backgroundColor: t.colors.warningSoft, borderRadius: t.radius.lg, padding: 14, marginTop: 6, marginBottom: 16 }}>
            <Info size={18} color={t.colors.warningInk} strokeWidth={2} style={{ marginTop: 1 }} />
            <Text variant="caption" style={{ flex: 1, color: t.colors.warningInk, lineHeight: 20 }}>
              ตอนนี้เปิดผ่าน Expo Go — Push จริงยังใช้ไม่ได้ (ข้อจำกัดของ Expo Go) ต้องสร้าง development build ก่อนถึงจะรับแจ้งเตือนบนมือถือได้จริง ดูวิธีในไฟล์ PUSH_SETUP.md
            </Text>
          </View>
        ) : null}

        <Button
          label={enabled ? 'ปิดการแจ้งเตือน' : 'เปิดการแจ้งเตือน'}
          variant={enabled ? 'ghost' : undefined}
          block
          loading={busy}
          icon={<BellRing size={18} color={enabled ? t.colors.dangerInk : t.colors.onPrimary} strokeWidth={2} />}
          onPress={toggle}
          style={{ marginTop: 6 }}
        />
      </ScrollView>
    </View>
  );
}
