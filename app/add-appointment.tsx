import React, { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { X, CalendarDays, Clock } from 'lucide-react-native';
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
import { useCreateAppointment } from '../lib/appointments';

const TH_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const DEPTS = ['อายุรกรรม', 'ศัลยกรรม', 'กระดูก', 'หัวใจ', 'ตา', 'หู คอ จมูก', 'ฟัน', 'ผิวหนัง', 'ทั่วไป'];

function Label({ children }: { children: React.ReactNode }) {
  return <Text variant="caption" weight="600" color="ink2" style={{ marginBottom: 8 }}>{children}</Text>;
}

export default function AddAppointment() {
  const t = useTheme();
  const { scheme } = useThemeControls();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentPatientId } = useCurrentPatient();
  const createAppt = useCreateAppointment(currentPatientId);

  const [dept, setDept] = useState('อายุรกรรม');
  const [doctor, setDoctor] = useState('');
  const [hospital, setHospital] = useState('');
  const [building, setBuilding] = useState('');
  const [room, setRoom] = useState('');
  const [note, setNote] = useState('');
  const initial = new Date(); initial.setHours(9, 0, 0, 0);
  const [when, setWhen] = useState<Date>(initial);
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateStr = `${when.getDate()} ${TH_MONTHS[when.getMonth()]} ${when.getFullYear() + 543}`;
  const timeStr = `${String(when.getHours()).padStart(2, '0')}:${String(when.getMinutes()).padStart(2, '0')} น.`;
  const setDatePart = (d: Date) => { const n = new Date(when); n.setFullYear(d.getFullYear(), d.getMonth(), d.getDate()); setWhen(n); };
  const setTimePart = (d: Date) => { const n = new Date(when); n.setHours(d.getHours(), d.getMinutes(), 0, 0); setWhen(n); };

  const onSave = async () => {
    setError(null);
    try {
      await createAppt.mutateAsync({
        department: dept,
        doctor: doctor.trim() || null,
        hospital: hospital.trim() || null,
        building: building.trim() || null,
        room: room.trim() || null,
        datetime: when.toISOString(),
        note: note.trim() || null,
      });
      router.back();
    } catch (e: any) { setError(e?.message ?? 'บันทึกไม่สำเร็จ'); }
  };

  const pickerRow = (icon: React.ReactNode, val: string, onPress: () => void) => (
    <Pressable onPress={onPress} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: t.colors.surface, borderWidth: 1.5, borderColor: t.colors.line, borderRadius: t.radius.md, paddingVertical: 12, paddingHorizontal: 12 }}>
      {icon}<Text variant="bodyStrong" weight="600" style={{ flex: 1 }}>{val}</Text>
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.canvas }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.line, alignItems: 'center', justifyContent: 'center' }}>
          <X size={20} color={t.colors.ink2} strokeWidth={2} />
        </Pressable>
        <Text variant="h2" weight="700" style={{ flex: 1 }}>เพิ่มนัดหมาย</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: insets.bottom + 24, paddingTop: 6 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Label>แผนก</Label>
          <Chips options={DEPTS.map((d) => ({ value: d, label: d }))} value={dept} onChange={setDept} style={{ marginBottom: 16 }} />

          <Card style={{ marginBottom: 16 }}>
            <Field label="แพทย์ผู้นัด (ถ้ามี)" placeholder="เช่น นพ.สมชาย" value={doctor} onChangeText={setDoctor} />
            <Field label="โรงพยาบาล" placeholder="เช่น รพ.ศรีสะเกษ" value={hospital} onChangeText={setHospital} />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}><Field label="ตึก/อาคาร" placeholder="เช่น อาคารผู้ป่วยนอก" value={building} onChangeText={setBuilding} containerStyle={{ marginBottom: 0 }} /></View>
              <View style={{ width: 110 }}><Field label="ห้อง/ชั้น" placeholder="เช่น 302" value={room} onChangeText={setRoom} containerStyle={{ marginBottom: 0 }} /></View>
            </View>
          </Card>

          <Label>วันและเวลา</Label>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
            {pickerRow(<CalendarDays size={18} color={t.colors.primaryStrong} strokeWidth={2} />, dateStr, () => setShowDate(true))}
            {pickerRow(<Clock size={18} color={t.colors.primaryStrong} strokeWidth={2} />, timeStr, () => setShowTime(true))}
          </View>
          {showDate ? <DateTimePicker value={when} mode="date" display={Platform.OS === 'ios' ? 'inline' : 'default'} onChange={(_e, d) => { if (Platform.OS !== 'ios') setShowDate(false); if (d) setDatePart(d); }} /> : null}
          {showTime ? <DateTimePicker value={when} mode="time" is24Hour display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(_e, d) => { if (Platform.OS !== 'ios') setShowTime(false); if (d) setTimePart(d); }} /> : null}

          <Field label="หมายเหตุ / จดกันลืม (ถ้ามี)" placeholder="เช่น งดน้ำงดอาหาร 8 ชม. · เอาบัตรผู้ป่วย · จอด P2" value={note} onChangeText={setNote} multiline />

          {error ? (
            <View style={{ backgroundColor: t.colors.dangerSoft, borderRadius: t.radius.md, padding: 12, marginBottom: 12 }}>
              <Text variant="caption" weight="600" style={{ color: t.colors.dangerInk }}>{error}</Text>
            </View>
          ) : null}

          <Button label="บันทึกนัดหมาย" block loading={createAppt.isPending} onPress={onSave} style={{ marginTop: 6 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
