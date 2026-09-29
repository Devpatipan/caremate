import React, { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, CalendarDays, Clock, Trash2 } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme, useThemeControls } from '../theme/ThemeProvider';
import { Text } from '../components/ui/Text';
import { Field } from '../components/ui/Field';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Chips } from '../components/ui/Chips';
import { useCurrentPatient } from '../lib/patient-context';
import { useCreateVital, useUpdateVital, useDeleteVital, interpretVital, VitalType } from '../lib/vitals';

const TH_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
function Label({ children }: { children: React.ReactNode }) {
  return <Text variant="caption" weight="600" color="ink2" style={{ marginBottom: 8 }}>{children}</Text>;
}

export default function AddVital() {
  const t = useTheme();
  const { scheme } = useThemeControls();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentPatientId } = useCurrentPatient();
  const params = useLocalSearchParams<{ id?: string; type?: string; sys?: string; dia?: string; pulse?: string; arm?: string; position?: string; value?: string; context?: string; note?: string; at?: string }>();
  const isEdit = !!params.id;

  const createVital = useCreateVital(currentPatientId);
  const updateVital = useUpdateVital(currentPatientId);
  const deleteVital = useDeleteVital(currentPatientId);

  const [type, setType] = useState<VitalType>((['bp', 'sugar', 'hr'].includes(params.type ?? '') ? params.type : 'bp') as VitalType);
  const [sys, setSys] = useState(params.sys ?? '');
  const [dia, setDia] = useState(params.dia ?? '');
  const [pulse, setPulse] = useState(params.pulse ?? '');
  const [arm, setArm] = useState(params.arm ?? '');
  const [position, setPosition] = useState(params.position || 'นั่ง');
  const [value, setValue] = useState(params.value ?? '');
  const [sugarCtx, setSugarCtx] = useState(params.context || 'ก่อนอาหาร');
  const [hrCtx, setHrCtx] = useState(params.context || 'ขณะพัก');
  const [note, setNote] = useState(params.note ?? '');
  const [when, setWhen] = useState<Date>(params.at ? new Date(params.at) : new Date());
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateStr = `${when.getDate()} ${TH_MONTHS[when.getMonth()]} ${when.getFullYear() + 543}`;
  const timeStr = `${String(when.getHours()).padStart(2, '0')}:${String(when.getMinutes()).padStart(2, '0')} น.`;
  const setDatePart = (d: Date) => { const n = new Date(when); n.setFullYear(d.getFullYear(), d.getMonth(), d.getDate()); setWhen(n); };
  const setTimePart = (d: Date) => { const n = new Date(when); n.setHours(d.getHours(), d.getMinutes(), 0, 0); setWhen(n); };

  const buildJson = (): any | null => {
    if (type === 'bp') {
      const s = parseInt(sys, 10), d = parseInt(dia, 10);
      if (!s || !d) return null;
      const j: any = { sys: s, dia: d, position };
      if (parseInt(pulse, 10)) j.pulse = parseInt(pulse, 10);
      if (arm) j.arm = arm;
      if (note.trim()) j.note = note.trim();
      return j;
    }
    const val = parseInt(value, 10);
    if (!val) return null;
    const j: any = { value: val, context: type === 'sugar' ? sugarCtx : hrCtx };
    if (note.trim()) j.note = note.trim();
    return j;
  };
  const preview = (() => { const j = buildJson(); return j ? interpretVital(type, j) : null; })();

  const onSave = async () => {
    setError(null);
    const value_json = buildJson();
    if (!value_json) { setError(type === 'bp' ? 'กรอกค่าความดันตัวบน/ตัวล่าง' : 'กรอกค่าที่วัดได้'); return; }
    try {
      if (isEdit) await updateVital.mutateAsync({ id: params.id!, type, value_json, taken_at: when.toISOString() });
      else await createVital.mutateAsync({ type, value_json, taken_at: when.toISOString() });
      router.back();
    } catch (e: any) { setError(e?.message ?? 'บันทึกไม่สำเร็จ'); }
  };
  const onDelete = () => {
    Alert.alert('ลบค่านี้', 'ต้องการลบค่าที่บันทึกไว้?', [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ลบ', style: 'destructive', onPress: async () => { try { await deleteVital.mutateAsync({ id: params.id!, type }); router.back(); } catch (e: any) { setError(e?.message); } } },
    ]);
  };

  const statusColor = (s: string) => (s === 'ok' ? t.colors.successInk : s === 'warn' ? t.colors.warningInk : t.colors.dangerInk);
  const statusBg = (s: string) => (s === 'ok' ? t.colors.successSoft : s === 'warn' ? t.colors.warningSoft : t.colors.dangerSoft);
  const busy = createVital.isPending || updateVital.isPending;

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.canvas }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.line, alignItems: 'center', justifyContent: 'center' }}>
          <X size={20} color={t.colors.ink2} strokeWidth={2} />
        </Pressable>
        <Text variant="h2" weight="700" style={{ flex: 1 }}>{isEdit ? 'แก้ไขค่าสุขภาพ' : 'บันทึกค่าสุขภาพ'}</Text>
        {isEdit ? (
          <Pressable onPress={onDelete} hitSlop={10} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: t.colors.dangerSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Trash2 size={18} color={t.colors.dangerInk} strokeWidth={2} />
          </Pressable>
        ) : null}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: insets.bottom + 24, paddingTop: 6 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {!isEdit ? (
            <View style={{ marginBottom: 16 }}>
              <Chips options={[{ value: 'bp', label: 'ความดัน' }, { value: 'sugar', label: 'น้ำตาล' }, { value: 'hr', label: 'หัวใจ' }]} value={type} onChange={(v) => setType(v as VitalType)} />
            </View>
          ) : null}

          <Card style={{ marginBottom: 16 }}>
            {type === 'bp' ? (
              <>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}><Field label="ตัวบน *" placeholder="128" keyboardType="number-pad" value={sys} onChangeText={setSys} /></View>
                  <View style={{ flex: 1 }}><Field label="ตัวล่าง *" placeholder="82" keyboardType="number-pad" value={dia} onChangeText={setDia} /></View>
                </View>
                <Field label="ชีพจร (bpm) — ถ้ามี" placeholder="72" keyboardType="number-pad" value={pulse} onChangeText={setPulse} />
                <Label>วัดที่แขน</Label>
                <Chips options={[{ value: 'ซ้าย', label: 'ซ้าย' }, { value: 'ขวา', label: 'ขวา' }, { value: '', label: 'ไม่ระบุ' }]} value={arm} onChange={setArm} style={{ marginBottom: 14 }} />
                <Label>ท่าที่วัด</Label>
                <Chips options={[{ value: 'นั่ง', label: 'นั่ง' }, { value: 'นอน', label: 'นอน' }]} value={position} onChange={setPosition} />
              </>
            ) : type === 'sugar' ? (
              <>
                <Field label="ระดับน้ำตาล (mg/dL) *" placeholder="110" keyboardType="number-pad" value={value} onChangeText={setValue} />
                <Label>ช่วงเวลาที่วัด (มีผลต่อการแปลผล)</Label>
                <Chips options={[{ value: 'ก่อนอาหาร', label: 'ก่อนอาหาร/อดอาหาร' }, { value: 'หลังอาหาร', label: 'หลังอาหาร 2 ชม.' }, { value: 'ก่อนนอน', label: 'ก่อนนอน' }, { value: 'สุ่ม', label: 'สุ่ม' }]} value={sugarCtx} onChange={setSugarCtx} />
              </>
            ) : (
              <>
                <Field label="อัตราการเต้นหัวใจ (bpm) *" placeholder="72" keyboardType="number-pad" value={value} onChangeText={setValue} />
                <Label>สถานะขณะวัด</Label>
                <Chips options={[{ value: 'ขณะพัก', label: 'ขณะพัก' }, { value: 'หลังออกกำลัง', label: 'หลังออกกำลังกาย' }]} value={hrCtx} onChange={setHrCtx} />
              </>
            )}
          </Card>

          {preview ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: statusBg(preview.status), borderRadius: t.radius.md, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 16 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: statusColor(preview.status) }} />
              <Text variant="bodyStrong" weight="600" style={{ color: statusColor(preview.status) }}>ผลเบื้องต้น: {preview.statusLabel}</Text>
              <Text variant="caption" style={{ color: statusColor(preview.status), marginLeft: 'auto' }}>{preview.display} {preview.unit}</Text>
            </View>
          ) : null}

          <Label>วัดเมื่อ</Label>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
            <Pressable onPress={() => setShowDate(true)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: t.colors.surface, borderWidth: 1.5, borderColor: t.colors.line, borderRadius: t.radius.md, paddingVertical: 12, paddingHorizontal: 12 }}>
              <CalendarDays size={18} color={t.colors.primaryStrong} strokeWidth={2} /><Text variant="bodyStrong" weight="600" style={{ flex: 1 }}>{dateStr}</Text>
            </Pressable>
            <Pressable onPress={() => setShowTime(true)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: t.colors.surface, borderWidth: 1.5, borderColor: t.colors.line, borderRadius: t.radius.md, paddingVertical: 12, paddingHorizontal: 12 }}>
              <Clock size={18} color={t.colors.primaryStrong} strokeWidth={2} /><Text variant="bodyStrong" weight="600" style={{ flex: 1 }}>{timeStr}</Text>
            </Pressable>
          </View>
          {showDate ? <DateTimePicker value={when} mode="date" maximumDate={new Date()} display={Platform.OS === 'ios' ? 'inline' : 'default'} onChange={(_e, d) => { if (Platform.OS !== 'ios') setShowDate(false); if (d) setDatePart(d); }} /> : null}
          {showTime ? <DateTimePicker value={when} mode="time" is24Hour display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(_e, d) => { if (Platform.OS !== 'ios') setShowTime(false); if (d) setTimePart(d); }} /> : null}

          <Field label="หมายเหตุ (ถ้ามี)" placeholder="เช่น มีอาการเวียนหัว" value={note} onChangeText={setNote} />

          {error ? (
            <View style={{ backgroundColor: t.colors.dangerSoft, borderRadius: t.radius.md, padding: 12, marginBottom: 12 }}>
              <Text variant="caption" weight="600" style={{ color: t.colors.dangerInk }}>{error}</Text>
            </View>
          ) : null}

          <Button label={isEdit ? 'บันทึกการแก้ไข' : 'บันทึกค่า'} block loading={busy} onPress={onSave} style={{ marginTop: 6 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
