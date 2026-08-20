import React, { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { HeartPulse } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme, useThemeControls } from '../../theme/ThemeProvider';
import { useAuth } from '../../lib/auth';
import { Text } from '../../components/ui/Text';
import { Field } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';

export default function SignIn() {
  const t = useTheme();
  const { scheme } = useThemeControls();
  const insets = useSafeAreaInsets();
  const { signIn, configured } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    setError(null);
    if (!email || !password) {
      setError('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      // สำเร็จ → RootNavigator จะพาไปหน้าหลักเอง
    } catch (e: any) {
      setError(mapError(e?.message));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.canvas }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: 24,
            paddingTop: insets.top + 24,
            paddingBottom: insets.bottom + 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* โลโก้ */}
          <View style={{ alignItems: 'center', marginBottom: 28 }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                backgroundColor: t.colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                ...t.shadows.e2,
              }}
            >
              <HeartPulse size={38} color="#FFFFFF" strokeWidth={2.2} />
            </View>
            <Text variant="display" weight="700" style={{ marginTop: 16 }}>
              CareMate
            </Text>
            <Text variant="body" color="ink3" style={{ marginTop: 2 }}>
              ดูแลใกล้ชิด แม้อยู่ไกล
            </Text>
          </View>

          <Text variant="h2" weight="700" style={{ marginBottom: 16 }}>
            เข้าสู่ระบบ
          </Text>

          <Field
            label="อีเมล"
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
          />
          <Field
            label="รหัสผ่าน"
            placeholder="••••••••"
            secureTextEntry
            autoComplete="password"
            value={password}
            onChangeText={setPassword}
          />

          {error ? (
            <View
              style={{
                backgroundColor: t.colors.dangerSoft,
                borderRadius: t.radius.md,
                padding: 12,
                marginBottom: 12,
              }}
            >
              <Text variant="caption" weight="600" style={{ color: t.colors.dangerInk }}>
                {error}
              </Text>
            </View>
          ) : null}

          <Button label="เข้าสู่ระบบ" block loading={busy} onPress={onSubmit} />

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 18, gap: 6 }}>
            <Text variant="body" color="ink3">
              ยังไม่มีบัญชี?
            </Text>
            <Link href="/(auth)/sign-up">
              <Text variant="body" weight="600" style={{ color: t.colors.primaryStrong }}>
                สมัครสมาชิก
              </Text>
            </Link>
          </View>

          {!configured ? (
            <Text variant="micro" color="ink3" center style={{ marginTop: 24 }}>
              * ยังไม่ได้ตั้งค่า Supabase — ดูขั้นตอนใน README แล้วใส่ค่าใน .env
            </Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function mapError(msg?: string): string {
  if (!msg) return 'เข้าสู่ระบบไม่สำเร็จ ลองใหม่อีกครั้ง';
  if (/invalid login credentials/i.test(msg)) return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
  if (/email not confirmed/i.test(msg)) return 'ยังไม่ยืนยันอีเมล — ปิด Confirm email ใน Supabase ตอนพัฒนา';
  if (/network/i.test(msg)) return 'เชื่อมต่อไม่ได้ ตรวจสอบอินเทอร์เน็ต';
  return msg;
}
