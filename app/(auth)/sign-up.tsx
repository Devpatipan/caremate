import React, { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme, useThemeControls } from '../../theme/ThemeProvider';
import { useAuth } from '../../lib/auth';
import { Text } from '../../components/ui/Text';
import { Field } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';

export default function SignUp() {
  const t = useTheme();
  const { scheme } = useThemeControls();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signUp } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setNotice(null);
    if (!name || !email || !password) {
      setError('กรุณากรอกข้อมูลให้ครบ');
      return;
    }
    if (password.length < 6) {
      setError('รหัสผ่านอย่างน้อย 6 ตัวอักษร');
      return;
    }
    setBusy(true);
    try {
      await signUp(email.trim(), password, name.trim());
      setNotice('สมัครสำเร็จ! หากเปิด Confirm email ให้ยืนยันในอีเมลก่อนเข้าสู่ระบบ');
    } catch (e: any) {
      setError(mapError(e?.message));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.canvas }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: 24,
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              position: 'absolute',
              top: insets.top + 8,
              left: 16,
            }}
          >
            <Button
              label="กลับ"
              variant="ghost"
              size="sm"
              icon={<ChevronLeft size={18} color={t.colors.ink2} strokeWidth={2.2} />}
              onPress={() => router.back()}
            />
          </View>

          <Text variant="display" weight="700" style={{ marginBottom: 4 }}>
            สร้างบัญชีผู้ดูแล
          </Text>
          <Text variant="body" color="ink3" style={{ marginBottom: 22 }}>
            สำหรับลูกหลาน/ผู้ดูแล เพื่อติดตามการทานยาและสุขภาพ
          </Text>

          <Field label="ชื่อ-นามสกุล" placeholder="เช่น ปนิธาน ใจดี" value={name} onChangeText={setName} />
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
            placeholder="อย่างน้อย 6 ตัวอักษร"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error ? (
            <View style={{ backgroundColor: t.colors.dangerSoft, borderRadius: t.radius.md, padding: 12, marginBottom: 12 }}>
              <Text variant="caption" weight="600" style={{ color: t.colors.dangerInk }}>{error}</Text>
            </View>
          ) : null}
          {notice ? (
            <View style={{ backgroundColor: t.colors.successSoft, borderRadius: t.radius.md, padding: 12, marginBottom: 12 }}>
              <Text variant="caption" weight="600" style={{ color: t.colors.successInk }}>{notice}</Text>
            </View>
          ) : null}

          <Button label="สมัครสมาชิก" block loading={busy} onPress={onSubmit} />

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 18, gap: 6 }}>
            <Text variant="body" color="ink3">มีบัญชีแล้ว?</Text>
            <Link href="/(auth)/sign-in">
              <Text variant="body" weight="600" style={{ color: t.colors.primaryStrong }}>เข้าสู่ระบบ</Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function mapError(msg?: string): string {
  if (!msg) return 'สมัครไม่สำเร็จ ลองใหม่อีกครั้ง';
  if (/already registered|already exists/i.test(msg)) return 'อีเมลนี้ถูกใช้แล้ว';
  if (/password/i.test(msg)) return 'รหัสผ่านไม่ผ่านเกณฑ์ (อย่างน้อย 6 ตัว)';
  if (/network/i.test(msg)) return 'เชื่อมต่อไม่ได้ ตรวจสอบอินเทอร์เน็ต';
  return msg;
}
