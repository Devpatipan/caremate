import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator, AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { ThemeProvider, useTheme } from '../theme/ThemeProvider';
import { AuthProvider, useAuth } from '../lib/auth';
import { PatientProvider } from '../lib/patient-context';
import { registerForPush } from '../lib/push';
import { loadOnboarded, onOnboardedChange } from '../lib/onboarding';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // ดึงข้อมูลใหม่อัตโนมัติทุก 10 วิ (เห็นผลจากกล่องเกือบเรียลไทม์)
      refetchInterval: 10000,
      refetchIntervalInBackground: false,
      // พอสลับกลับเข้าแอป ให้ดึงใหม่ทันที
      refetchOnWindowFocus: true,
      staleTime: 3000,
    },
  },
});

// React Native: ผูก AppState เข้ากับ focusManager
// เพื่อให้ refetchOnWindowFocus ทำงานตอนกลับเข้าแอป
AppState.addEventListener('change', (status) => {
  focusManager.setFocused(status === 'active');
});

function Splash() {
  const t = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.canvas }}>
      <ActivityIndicator color={t.colors.primary} size="large" />
    </View>
  );
}

function RootNavigator() {
  const { loading, configured, session } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [onboarded, setOb] = useState<boolean | null>(null);

  useEffect(() => {
    loadOnboarded().then(setOb);
    return onOnboardedChange(setOb);
  }, []);

  useEffect(() => {
    if (loading || !configured) return;
    const inAuth = segments[0] === '(auth)';
    if (!session) { if (!inAuth) router.replace('/(auth)/sign-in'); return; }
    // ล็อกอินแล้ว — เช็ค onboarding
    if (onboarded === null) return; // รอโหลดสถานะ
    const inOnboarding = segments[0] === 'onboarding';
    if (!onboarded) { if (!inOnboarding) router.replace('/onboarding'); return; }
    if (inAuth || inOnboarding) router.replace('/(tabs)');
  }, [loading, configured, session, segments, onboarded]);

  useEffect(() => { if (session) registerForPush(); }, [session]);

  if (loading) return <Splash />;

  const modal = { animation: 'slide_from_bottom' as const };
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade', animationDuration: 220 }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="alerts" options={modal} />
      <Stack.Screen name="notifications" options={modal} />
      <Stack.Screen name="add-patient" options={modal} />
      <Stack.Screen name="patients" options={modal} />
      <Stack.Screen name="patient-profile" options={modal} />
      <Stack.Screen name="add-medication" options={modal} />
      <Stack.Screen name="add-vital" options={modal} />
      <Stack.Screen name="appointments" options={modal} />
      <Stack.Screen name="add-appointment" options={modal} />
      <Stack.Screen name="sos" options={modal} />
      <Stack.Screen name="add-contact" options={modal} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'LINESeedSansTH-Regular': require('../assets/fonts/LINESeedSansTH_A_Rg.ttf'),
    'LINESeedSansTH-Bold': require('../assets/fonts/LINESeedSansTH_A_Bd.ttf'),
    'LINESeedSansTH-ExtraBold': require('../assets/fonts/LINESeedSansTH_A_XBd.ttf'),
  });

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ThemeProvider initialMode="light">
          {!fontsLoaded ? (
            <Splash />
          ) : (
            <AuthProvider>
              <PatientProvider>
                <RootNavigator />
              </PatientProvider>
            </AuthProvider>
          )}
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
