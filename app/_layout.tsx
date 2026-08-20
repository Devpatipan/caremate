import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, useTheme } from '../theme/ThemeProvider';
import { AuthProvider, useAuth } from '../lib/auth';

// --- LINE Seed Sans TH (optional) ---------------------------------------
// 1) put the .ttf files in assets/fonts/
// 2) uncomment below, 3) set FONTS_ENABLED = true in theme/fonts.ts
//
// import { useFonts } from 'expo-font';
// const [fontsLoaded] = useFonts({
//   'LINESeedSansTH-Regular': require('../assets/fonts/LINESeedSansTH-Regular.ttf'),
//   'LINESeedSansTH-Medium':  require('../assets/fonts/LINESeedSansTH-Medium.ttf'),
//   'LINESeedSansTH-Bold':    require('../assets/fonts/LINESeedSansTH-Bold.ttf'),
// });
// if (!fontsLoaded) return null;
// ------------------------------------------------------------------------

const queryClient = new QueryClient();

function Splash() {
  const t = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.canvas }}>
      <ActivityIndicator color={t.colors.primary} size="large" />
    </View>
  );
}

/** จัดการ redirect ตามสถานะล็อกอิน (Expo Router auth pattern) */
function RootNavigator() {
  const { loading, configured, session } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!configured) return; // ยังไม่ตั้งค่า backend → เปิดดู UI ได้เลย
    const inAuth = segments[0] === '(auth)';
    if (!session && !inAuth) router.replace('/(auth)/sign-in');
    else if (session && inAuth) router.replace('/(tabs)');
  }, [loading, configured, session, segments]);

  if (loading) return <Splash />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="alerts" options={{ presentation: 'card' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ThemeProvider initialMode="system">
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
