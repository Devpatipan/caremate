import React, { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { X, CalendarDays, Camera } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme, useThemeControls } from '../theme/ThemeProvider';
import { Text } from '../components/ui/Text';
import { Field } from '../components/ui/Field';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Chips, MultiChips } from '../components/ui/Chips';
import { Avatar } from '../components/ui/Avatar';
import { useCreatePatient } from '../lib/patients';
import { useCurrentPatient } from '../lib/patient-context';
import { pickImage, uploadPatientPhoto } from '../lib/photo';

const TH_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const PREFIXES = ['นาย', 'นาง', 'นางสาว'];
const GENDERS = [{ value: 'ชาย', label: 'ชาย' }, { value: 'หญิง', label: 'หญิง' }, { value: '', label: 'ไม่ระบุ' }];
const BLOODS = ['A', 'B', 'AB', 'O', '-'];
const DISEASES = ['เบาหวาน', 'ความดันโลหิตสูง', 'โรคหัวใจ', 'ไขมันในเลือดสูง', 'โรคไต', 'อัลไซเมอร์', 'ข้อเข่าเสื่อม', 'หอบหืด'];

function Label({ children }: { children: React.ReactNode }) {
  return <Text variant="caption" weight="600" color="ink2" style={{ marginBottom: 8 }}>{children}</Text>;
}

export default function AddPatient() {
  const t = useTheme();
  const { scheme } = useThemeControls();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const createPatient = useCreatePatient();
  const { setCurrentPatient } = useCurrentPatient();

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [prefix, setPrefix] = useState('นาย');
  const [name, setName] = useState('');
  const [gender, setGender] = useState('ชาย');
  const [blood, setBlood] = useState('-');
  const [diseases, setDiseases] = useState<string[]>([]);
  const [otherDiseases, setOtherDiseases] = useState('');
  const [allergies, setAllergies] = useState('');
  const [birth, setBirth] = useState<Date | null>(null);
  const [showBirth, setShowBirth] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPrefix = (p: string) => { setPrefix(p); setGender(p === 'นาย' ? 'ชาย' : 'หญิง'); };
  const onPickPhoto = async () => { try { const uri = await pickImage(); if (uri) setPhotoUri(uri); } catch {} };

  const age = birth ? Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 3600 * 1000)) : null;
  const birthStr = birth ? `${birth.getDate()} ${TH_MONTHS[birth.getMonth()]} ${birth.getFullYear() + 543}${age != null ? `  ·  อายุ ${age} ปี` : ''}` : 'แตะเพื่อเลือกวันเกิด';

  const onSave = async () => {
    setError(null);
    if (!name.trim()) { setError('กรุณากรอกชื่อผู้ป่วย'); return; }
    const extra = otherDiseases.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
    const allDiseases = [...diseases, ...extra];
    setBusy(true);
    try {
      const p = await createPatient.mutateAsync({
        name: `${prefix} ${name.trim()}`,
        gender: gender || null,
        blood_type: blood === '-' ? null : blood,
        diseases: allDiseases.length ? allDiseases.join(', ') : null,
        birthdate: birth ? birth.toISOString().slice(0, 10) : null,
        allergies: allergies.trim() || null,
      });
      if (photoUri) { try { await uploadPatientPhoto(p.id, photoUri); } catch { /* ข้ามถ้าอัปโหลดรูปไม่สำเร็จ */ } }
      setCurrentPatient(p.id);
      router.back();
    } catch (e: any) { setError(e?.message ?? 'บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง'); }
    finally { setBusy(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.canvas }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.line, alignItems: 'center', justifyContent: 'center' }}>
          <X size={20} color={t.colors.ink2} strokeWidth={2} />
        </Pressable>
        <Text variant="h2" weight="700" style={{ flex: 1 }}>เพิ่มผู้ป่วย</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: insets.bottom + 24, paddingTop: 6 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* รูปโปรไฟล์ */}
          <Pressable onPress={onPickPhoto} style={{ alignSelf: 'center', alignItems: 'center', marginBottom: 18 }}>
            <View>
              <Avatar name={name} photoUrl={photoUri} size={92} />
              <View style={{ position: 'absolute', right: -2, bottom: -2, width: 30, height: 30, borderRadius: 15, backgroundColor: t.colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: t.colors.canvas }}>
                <Camera size={15} color="#fff" strokeWidth={2.2} />
              </View>
            </View>
            <Text variant="caption" weight="600" style={{ color: t.colors.primaryStrong, marginTop: 8 }}>{photoUri ? 'เปลี่ยนรูป' : 'เพิ่มรูปโปรไฟล์'}</Text>
          </Pressable>

          <Text variant="caption" weight="700" color="ink3" style={{ marginBottom: 8, marginLeft: 2, textTransform: 'uppercase', letterSpacing: 0.6 }}>ข้อมูลพื้นฐาน</Text>
          <Card style={{ marginBottom: 16, gap: 4 }}>
            <Label>คำนำหน้า</Label>
            <Chips options={PREFIXES.map((p) => ({ value: p, label: p }))} value={prefix} onChange={onPrefix} style={{ marginBottom: 14 }} />
            <Field label="ชื่อ-นามสกุล *" placeholder="เช่น สมหญิง ใจดี" value={name} onChangeText={setName} containerStyle={{ marginBottom: 12 }} />
            <Label>เพศ</Label>
            <Chips options={GENDERS} value={gender} onChange={setGender} />
          </Card>

          <Text variant="caption" weight="700" color="ink3" style={{ marginBottom: 8, marginLeft: 2, textTransform: 'uppercase', letterSpacing: 0.6 }}>ข้อมูลสุขภาพ</Text>
          <Card style={{ marginBottom: 16 }}>
            <Label>วันเกิด</Label>
            <Pressable onPress={() => setShowBirth(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: t.colors.surface2, borderWidth: 1.5, borderColor: t.colors.line, borderRadius: t.radius.md, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 14 }}>
              <CalendarDays size={18} color={t.colors.primaryStrong} strokeWidth={2} />
              <Text variant="bodyStrong" weight="600" style={{ flex: 1, color: birth ? t.colors.ink : t.colors.ink3 }}>{birthStr}</Text>
            </Pressable>
            {showBirth ? (
              <DateTimePicker value={birth ?? new Date(1955, 0, 1)} mode="date" maximumDate={new Date()} display={Platform.OS === 'ios' ? 'inline' : 'default'} onChange={(_e, dd) => { if (Platform.OS !== 'ios') setShowBirth(false); if (dd) setBirth(dd); }} />
            ) : null}
            <Label>กรุ๊ปเลือด</Label>
            <Chips options={BLOODS.map((b) => ({ value: b, label: b === '-' ? 'ไม่ระบุ' : b }))} value={blood} onChange={setBlood} />
          </Card>

          <Text variant="caption" weight="700" color="ink3" style={{ marginBottom: 8, marginLeft: 2, textTransform: 'uppercase', letterSpacing: 0.6 }}>โรคประจำตัว & การแพ้ยา</Text>
          <Card style={{ marginBottom: 20 }}>
            <Label>โรคประจำตัว (เลือกได้หลายอย่าง)</Label>
            <MultiChips options={DISEASES.map((d) => ({ value: d, label: d }))} value={diseases} onChange={setDiseases} style={{ marginBottom: 12 }} />
            <Field label="โรคอื่นๆ (พิมพ์เพิ่ม คั่นด้วยจุลภาค)" placeholder="เช่น พาร์กินสัน, ต้อกระจก" value={otherDiseases} onChangeText={setOtherDiseases} containerStyle={{ marginBottom: 12 }} />
            <Field label="แพ้ยา (ถ้ามี)" placeholder="เช่น เพนิซิลลิน, แอสไพริน" value={allergies} onChangeText={setAllergies} containerStyle={{ marginBottom: 0 }} />
          </Card>

          {error ? (
            <View style={{ backgroundColor: t.colors.dangerSoft, borderRadius: t.radius.md, padding: 12, marginBottom: 12 }}>
              <Text variant="caption" weight="600" style={{ color: t.colors.dangerInk }}>{error}</Text>
            </View>
          ) : null}

          <Button label="บันทึกผู้ป่วย" block loading={busy} onPress={onSave} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
