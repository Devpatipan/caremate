import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Pill, Activity, Tablet, MoreHorizontal } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { FONTS_ENABLED, fontFamilies } from '../../theme/fonts';
import { useCurrentPatient } from '../../lib/patient-context';
import { useRealtimeSync } from '../../lib/realtime';

export default function TabsLayout() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { currentPatientId } = useCurrentPatient();
  useRealtimeSync(currentPatientId);   // อัปเดตสดจากคลาวด์

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.colors.primaryStrong,
        tabBarInactiveTintColor: t.colors.ink3,
        tabBarStyle: {
          backgroundColor: t.colors.surface,
          borderTopColor: t.colors.line,
          // Reserve room for the device's bottom safe area (gesture bar /
          // nav buttons) so labels are never overlapped.
          height: 60 + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
        },
        tabBarLabelStyle: {
          fontSize: 10.5,
          fontWeight: FONTS_ENABLED ? undefined : '600',
          fontFamily: FONTS_ENABLED ? fontFamilies.medium : undefined,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'หน้าหลัก', tabBarIcon: ({ color }) => <Home size={23} color={color} strokeWidth={2} /> }}
      />
      <Tabs.Screen
        name="medications"
        options={{ title: 'ยา', tabBarIcon: ({ color }) => <Pill size={23} color={color} strokeWidth={2} /> }}
      />
      <Tabs.Screen
        name="health"
        options={{ title: 'สุขภาพ', tabBarIcon: ({ color }) => <Activity size={23} color={color} strokeWidth={2} /> }}
      />
      <Tabs.Screen
        name="device"
        options={{ title: 'อุปกรณ์', tabBarIcon: ({ color }) => <Tablet size={23} color={color} strokeWidth={2} /> }}
      />
      <Tabs.Screen
        name="more"
        options={{ title: 'เพิ่มเติม', tabBarIcon: ({ color }) => <MoreHorizontal size={23} color={color} strokeWidth={2} /> }}
      />
    </Tabs>
  );
}
