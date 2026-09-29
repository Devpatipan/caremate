import React, { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Clock, Trash2, Plus } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme, useThemeControls } from '../theme/ThemeProvider';
import { Text } from '../components/ui/Text';
import { Field } from '../components/ui/Field';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Chips } from '../components/ui/Chips';
import { Stepper } from '../components/ui/Stepper';
import { useCurrentPatient } from '../lib/patient-context';
import { useCreateMedication, useUpdateMedication, useDeleteMedication } from '../lib/medications';

const DAY_LABELS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const UNITS = ['เม็ด', 'แคปซูล', 'ซีซี', 'ช้อนชา', 'ซอง', 'หยด', 'ครั้ง'];
const MEALS = ['ก่อนอาหาร', 'หลังอาหาร', 'พร้อมอาหาร', 'ก่อนนอน'];
const TIME_PRESETS = ['08:00', '12:00', '18:00', '21:00'];

const fmt = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

function Label({ children }: { children: React.ReactNode }) {
  return <Text variant="caption" weight="600" color="ink2" style={{ marginBottom: 8 }}>{children}</Text>;
}

export default function AddMedication() {
  const t = useTheme();
  const { scheme } = useThemeControls();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentPatientId } = useCurrentPatient();
  const params = useLocalSearchParams<{ id?: string; name?: string; dosage?: string; note?: string; times?: string; days?: string }>();
  const isEdit = !!params.id;

  const createMed = useCreateMedication(currentPatientId);
  const updateMed = useUpdateMedication(currentPatientId);
  const deleteMed = useDeleteMedication(currentPatientId);

  const parsedAmount = parseInt((params.dosage ?? '').trim().split(' ')[0], 10);
  const parsedUnit = UNITS.find((u) => (params.dosage ?? '').includes(u)) ?? 'เม็ด';
  const parsedMeal = MEALS.find((m) => (params.note ?? '').includes(m)) ?? '';

  const [name, setName] = useState(params.name ?? '');
  const [amount, setAmount] = useState<number>(!isNaN(parsedAmount) ? parsedAmount : 1);
  const [unit, setUnit] = useState<string>(parsedUnit);
  const [meal, setMeal] = useState<string>(parsedMeal);
  const [times, setTimes] = useState<string[]>(params.times ? params.times.split(',').map((s) => s.trim()).filter(Boolean) : ['08:00']);
  const [everyday, setEveryday] = useState(!params.days);
  const [days, setDays] = useState<number[]>(params.days ? params.days.split(',').map((n) => parseInt(n, 10)).filter((n) => !isNaN(n)) : []);
  const [pickTime, setPickTime] = useState<Date>(new Date(2020, 0, 1, 8, 0));
  const [showPicker, setShowPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addTime = (v: string) => setTimes((p) => (p.includes(v) ? p : [...p, v].sort()));
  const removeTime = (v: string) => setTimes((p) => p.filter((x) => x !== v));
  const toggleDay = (d: number) => setDays((p) => (p.includes(d) ? p.filter((x) => x !== d) : [...p, d].sort()));

  const onSave = async () => {
    setError(null);
    if (!name.trim()) { setError('กรุณากรอกชื่อยา'); return; }
    if (times.length === 0) { setError('เพิ่มเวลาเตือนอย่างน้อย 1 เวลา'); return; }
    const dosage = `${amount} ${unit}`;
    const note = meal || null;
    const chosenDays = everyday ? [] : days;
    try {
      if (isEdit) await updateMed.mutateAsync({ id: params.id!, name: name.trim(), dosage, note, times, days: chosenDays });
      else await createMed.mutateAsync({ name: name.trim(), dosage, note, times, days: chosenDays });
      router.back();
    } catch (e: any) { setError(e?.message ?? 'บันทึกไม่สำเร็จ'); }
  };

  const onDelete = () => {
    Alert.alert('ลบยา', `ลบ "${name}" ออกจากรายการ?`, [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ลบ', style: 'destructive', onPress: async () => { try { await deleteMed.mutateAsync(params.id!); router.back(); } catch (e: any) { setError(e?.message); } } },
    ]);
  };

  const busy = createMed.isPending || updateMed.isPending;
  const previewName = name.trim() || 'ชื่อยา';
  const previewTimes = times.length ? times.join(' · ') : 'ยังไม่ตั้งเวลา';

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.canvas }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.line, alignItems: 'center', justifyContent: 'center' }}>
          <X size={20} color={t.colors.ink2} strokeWidth={2} />
        </Pressable>
        <Text variant="h2" weight="700" style={{ flex: 1 }}>{isEdit ? 'แก้ไขยา' : 'เพิ่มยา'}</Text>
        {isEdit ? (
          <Pressable onPress={onDelete} hitSlop={10} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: t.colors.dangerSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Trash2 size={18} color={t.colors.dangerInk} strokeWidth={2} />
          </Pressable>
        ) : null}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: insets.bottom + 24, paddingTop: 8 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Field label="ชื่อยา *" placeholder="เช่น ยาลดความดัน (Amlodipine)" value={name} onChangeText={setName} />

          <Label>จำนวนต่อครั้ง</Label>
          <View style={{ marginBottom: 12 }}><Stepper value={amount} onChange={setAmount} min={1} max={20} suffix={unit} /></View>
          <Label>หน่วย</Label>
          <Chips options={UNITS.map((u) => ({ value: u, label: u }))} value={unit} onChange={setUnit} style={{ marginBottom: 16 }} />

          {/* เวลาเตือน (หลายเวลาได้) */}
          <Label>เวลาเตือน (เพิ่มได้หลายเวลา)</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            {times.map((tm) => (
              <Pressable key={tm} onPress={() => removeTime(tm)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 9, paddingHorizontal: 14, borderRadius: 999, backgroundColor: t.colors.primary }}>
                <Text variant="caption" weight="700" style={{ color: '#fff' }}>{tm}</Text>
                <X size={13} color="#fff" strokeWidth={2.6} />
              </Pressable>
            ))}
            {times.length === 0 ? <Text variant="caption" color="ink3" style={{ paddingVertical: 9 }}>ยังไม่มีเวลา</Text> : null}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 16 }}>
            {TIME_PRESETS.filter((v) => !times.includes(v)).map((v) => (
              <Pressable key={v} onPress={() => addTime(v)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1.5, borderColor: t.colors.line, backgroundColor: t.colors.surface }}>
                <Plus size={13} color={t.colors.primaryStrong} strokeWidth={2.4} />
                <Text variant="caption" weight="600" color="ink2">{v}</Text>
              </Pressable>
            ))}
            <Pressable onPress={() => setShowPicker(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1.5, borderColor: t.colors.primary, backgroundColor: t.colors.primarySoft }}>
              <Clock size={13} color={t.colors.primaryStrong} strokeWidth={2.4} />
              <Text variant="caption" weight="600" style={{ color: t.colors.primaryStrong }}>ตั้งเวลาเอง</Text>
            </Pressable>
          </View>
          {showPicker ? (
            <DateTimePicker value={pickTime} mode="time" is24Hour display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(_e, d) => { if (Platform.OS !== 'ios') setShowPicker(false); if (d) { setPickTime(d); addTime(fmt(d)); } }} />
          ) : null}

          <Label>ช่วงการทาน (ถ้ามี)</Label>
          <Chips options={[{ value: '', label: 'ไม่ระบุ' }, ...MEALS.map((m) => ({ value: m, label: m }))]} value={meal} onChange={setMeal} style={{ marginBottom: 16 }} />

          <Label>วันที่เตือน</Label>
          <Pressable onPress={() => setEveryday((v) => !v)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: everyday ? t.colors.primary : t.colors.line, backgroundColor: everyday ? t.colors.primary : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
              {everyday ? <Text style={{ color: '#fff', fontSize: 13 }}>✓</Text> : null}
            </View>
            <Text variant="bodyStrong" weight="600">ทุกวัน</Text>
          </Pressable>
          {!everyday ? (
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
              {DAY_LABELS.map((lbl, i) => {
                const on = days.includes(i);
                return (
                  <Pressable key={i} onPress={() => toggleDay(i)} style={{ flex: 1, aspectRatio: 1, borderRadius: t.radius.md, borderWidth: 1.5, borderColor: on ? t.colors.primary : t.colors.line, backgroundColor: on ? t.colors.primary : t.colors.surface, alignItems: 'center', justifyContent: 'center' }}>
                    <Text variant="caption" weight="600" style={{ color: on ? '#fff' : t.colors.ink2 }}>{lbl}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <Card style={{ marginTop: 10, marginBottom: 16, backgroundColor: t.colors.primarySoft }}>
            <Text variant="caption" weight="700" style={{ color: t.colors.primaryStrong, marginBottom: 8 }}>ตัวอย่างรายการที่จะบันทึก</Text>
            <Text variant="bodyStrong" weight="700">{previewName}</Text>
            <Text variant="caption" color="ink2" style={{ marginTop: 2 }}>
              {amount} {unit}{meal ? ` · ${meal}` : ''} · {previewTimes}
            </Text>
            <Text variant="micro" color="ink3" style={{ marginTop: 6 }}>
              {everyday ? 'เตือนทุกวัน' : days.length ? `เตือนเฉพาะ ${days.map((d) => DAY_LABELS[d]).join(', ')}` : 'ยังไม่ได้เลือกวันที่เตือน'}
            </Text>
          </Card>

          {error ? (
            <View style={{ backgroundColor: t.colors.dangerSoft, borderRadius: t.radius.md, padding: 12, marginTop: 6, marginBottom: 12 }}>
              <Text variant="caption" weight="600" style={{ color: t.colors.dangerInk }}>{error}</Text>
            </View>
          ) : null}

          <Button label={isEdit ? 'บันทึกการแก้ไข' : 'บันทึกยา'} block loading={busy} onPress={onSave} style={{ marginTop: 12 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
