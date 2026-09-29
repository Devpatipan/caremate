import React, { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme, useThemeControls } from '../theme/ThemeProvider';
import { Text } from '../components/ui/Text';
import { Field } from '../components/ui/Field';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Chips } from '../components/ui/Chips';
import { useCurrentPatient } from '../lib/patient-context';
import { useCreateContact } from '../lib/contacts';

const RELATIONS = ['ลูกชาย', 'ลูกสาว', 'คู่สมรส', 'พี่น้อง', 'ญาติ', 'เพื่อนบ้าน', 'แพทย์', 'รพ.'];

function Label({ children }: { children: React.ReactNode }) {
  return <Text variant="caption" weight="600" color="ink2" style={{ marginBottom: 8 }}>{children}</Text>;
}

export default function AddContact() {
  const t = useTheme();
  const { scheme } = useThemeControls();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentPatientId } = useCurrentPatient();
  const createContact = useCreateContact(currentPatientId);

  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSave = async () => {
    setError(null);
    if (!name.trim() || !phone.trim()) { setError('กรอกชื่อและเบอร์โทร'); return; }
    try {
      await createContact.mutateAsync({ name: name.trim(), relation: relation || null, phone: phone.trim(), note: note.trim() || null });
      router.back();
    } catch (e: any) { setError(e?.message ?? 'บันทึกไม่สำเร็จ'); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.canvas }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.line, alignItems: 'center', justifyContent: 'center' }}>
          <X size={20} color={t.colors.ink2} strokeWidth={2} />
        </Pressable>
        <Text variant="h2" weight="700" style={{ flex: 1 }}>เพิ่มผู้ติดต่อฉุกเฉิน</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: insets.bottom + 24, paddingTop: 6 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Card style={{ marginBottom: 16 }}>
            <Field label="ชื่อ *" placeholder="เช่น สมชาย" value={name} onChangeText={setName} />
            <Label>ความสัมพันธ์</Label>
            <Chips options={RELATIONS.map((r) => ({ value: r, label: r }))} value={relation} onChange={setRelation} style={{ marginBottom: 14 }} />
            <Field label="เบอร์โทร *" placeholder="0812345678" keyboardType="phone-pad" value={phone} onChangeText={setPhone} containerStyle={{ marginBottom: 0 }} />
          </Card>

          <Field label="หมายเหตุ (ถ้ามี)" placeholder="เช่น โทรก่อน 20:00 · อยู่บ้านหลังตลาด" value={note} onChangeText={setNote} multiline />

          {error ? (
            <View style={{ backgroundColor: t.colors.dangerSoft, borderRadius: t.radius.md, padding: 12, marginBottom: 12 }}>
              <Text variant="caption" weight="600" style={{ color: t.colors.dangerInk }}>{error}</Text>
            </View>
          ) : null}

          <Button label="บันทึกผู้ติดต่อ" block loading={createContact.isPending} onPress={onSave} style={{ marginTop: 6 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
