import React from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Screen, Text, AlertRow } from '../components/ui';
import { useTheme } from '../theme/ThemeProvider';
import { alerts } from '../lib/mockData';

export default function Alerts() {
  const t = useTheme();
  const router = useRouter();
  const today = alerts.filter((a) => a.day === 'today');
  const yesterday = alerts.filter((a) => a.day === 'yesterday');

  return (
    <Screen>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: t.colors.surface,
            borderColor: t.colors.line,
            borderWidth: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChevronLeft size={22} color={t.colors.ink2} strokeWidth={2} />
        </Pressable>
        <Text variant="h1" weight="700" style={{ flex: 1 }}>
          แจ้งเตือน
        </Text>
        <Pressable hitSlop={8}>
          <Text variant="caption" weight="600" style={{ color: t.colors.primaryStrong }}>
            อ่านทั้งหมด
          </Text>
        </Pressable>
      </View>

      <SectionHeading label="วันนี้" />
      {today.map((a) => (
        <AlertRow key={a.id} type={a.type} title={a.title} detail={a.detail} time={a.time} unread={a.unread} />
      ))}

      <SectionHeading label="เมื่อวาน" />
      {yesterday.map((a) => (
        <AlertRow key={a.id} type={a.type} title={a.title} detail={a.detail} time={a.time} unread={a.unread} />
      ))}
    </Screen>
  );
}

function SectionHeading({ label }: { label: string }) {
  return (
    <Text
      variant="micro"
      weight="700"
      color="ink3"
      style={{ marginTop: 16, marginBottom: 8, marginLeft: 2, letterSpacing: 0.6, textTransform: 'uppercase' }}
    >
      {label}
    </Text>
  );
}
