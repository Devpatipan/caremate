import React, { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView, Image, Pressable, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme, useThemeControls } from '../../theme/ThemeProvider';
import { useAuth } from '../../lib/auth';
import { Text } from '../../components/ui/Text';
import { Field } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';

function GoogleG({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <Path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <Path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <Path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </Svg>
  );
}

export default function SignIn() {
  const t = useTheme();
  const { scheme } = useThemeControls();
  const insets = useSafeAreaInsets();
  const { signIn, signInWithGoogle, configured } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [gbusy, setGbusy] = useState(false);

  const onGoogle = async () => {
    setError(null);
    setGbusy(true);
    try {
      await signInWithGoogle();
      // สำเร็จ → RootNavigator พาเข้าหน้าหลักเอง / ยกเลิก → อยู่หน้าเดิม
    } catch (e: any) {
      setError(mapError(e?.message));
    } finally {
      setGbusy(false);
    }
  };

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
            <Image
              source={require('../../assets/icon.png')}
              style={{ width: 104, height: 104, borderRadius: 26, ...t.shadows.e2 }}
              resizeMode="cover"
            />
            <Text variant="display" weight="700" style={{ marginTop: 14 }}>
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

          {/* ตัวคั่น หรือ */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 18 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: t.colors.line }} />
            <Text variant="caption" color="ink3">หรือ</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: t.colors.line }} />
          </View>

          {/* เข้าสู่ระบบด้วย Google */}
          <Pressable
            onPress={onGoogle}
            disabled={gbusy || busy}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              height: 52,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: t.colors.line,
              backgroundColor: t.colors.surface,
              opacity: gbusy || busy ? 0.6 : 1,
            }}
          >
            {gbusy ? (
              <ActivityIndicator color={t.colors.ink2} />
            ) : (
              <>
                <GoogleG size={20} />
                <Text variant="body" weight="600">เข้าสู่ระบบด้วย Google</Text>
              </>
            )}
          </Pressable>

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
  if (/provider is not enabled|unsupported provider/i.test(msg)) return 'ยังไม่ได้เปิด Google ใน Supabase (Authentication → Providers → Google)';
  if (/redirect|not allowed/i.test(msg)) return 'Redirect URL ไม่ตรง — เพิ่ม caremate://auth-callback ใน Supabase → URL Configuration';
  if (/network/i.test(msg)) return 'เชื่อมต่อไม่ได้ ตรวจสอบอินเทอร์เน็ต';
  return msg;
}
