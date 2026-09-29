import React from 'react';
import { View, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Camera, Trash2, Check, Heart, Droplet, Activity, Pill, CalendarDays } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme, useThemeControls } from '../theme/ThemeProvider';
import { Text } from '../components/ui/Text';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { StatTile } from '../components/ui/StatTile';
import { useCurrentPatient } from '../lib/patient-context';
import { useDeletePatient } from '../lib/patients';
import { useChangePatientPhoto } from '../lib/photo';
import { useAdherence7d, useMedications } from '../lib/medications';
import { useLatestVitals, interpretVital } from '../lib/vitals';
import { useNextAppointment, apptDay, apptMonth, apptTime, apptTitle } from '../lib/appointments';

const TH_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

function Row({ label, value }: { label: string; value: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: t.colors.line2, gap: 12 }}>
      <Text variant="caption" color="ink3">{label}</Text>
      <Text variant="bodyStrong" weight="600" style={{ flex: 1, textAlign: 'right' }}>{value || '-'}</Text>
    </View>
  );
}

export default function PatientProfile() {
  const t = useTheme();
  const { scheme } = useThemeControls();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { patients, currentPatientId, setCurrentPatient } = useCurrentPatient();

  const id = params.id ?? currentPatientId ?? undefined;
  const patient = patients.find((p) => p.id === id) ?? null;

  const adherence = useAdherence7d(id);
  const latest = useLatestVitals(id);
  const meds = useMedications(id);
  const nextAppt = useNextAppointment(id);
  const delPatient = useDeletePatient();
  const changePhoto = useChangePatientPhoto();

  if (!patient) {
    return (
      <View style={{ flex: 1, backgroundColor: t.colors.canvas, paddingTop: insets.top + 40, alignItems: 'center' }}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <Text color="ink3">ไม่พบข้อมูลผู้ป่วย</Text>
        <Button label="กลับ" variant="ghost" onPress={() => router.back()} style={{ marginTop: 16 }} />
      </View>
    );
  }

  const isCurrent = patient.id === currentPatientId;
  const age = patient.birthdate ? Math.floor((Date.now() - new Date(patient.birthdate).getTime()) / (365.25 * 24 * 3600 * 1000)) : null;
  const birthStr = patient.birthdate ? (() => { const d = new Date(patient.birthdate!); return `${d.getDate()} ${TH_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`; })() : '-';
  const appt = nextAppt.data;

  const tile = (type: 'bp' | 'sugar' | 'hr') => {
    const v = latest.data?.[type];
    if (!v) return { value: '—', status: 'ok' as const, statusLabel: 'ยังไม่มี' };
    const info = interpretVital(type, v.value_json);
    return { value: info.display, status: info.status, statusLabel: info.statusLabel };
  };
  const bp = tile('bp'), sugar = tile('sugar'), hr = tile('hr');

  const onSelect = () => { setCurrentPatient(patient.id); router.back(); };
  const onDelete = () => {
    Alert.alert('ลบผู้ป่วย', `ลบ "${patient.name}" และข้อมูลทั้งหมด?\nการลบนี้ย้อนกลับไม่ได้`, [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ลบทั้งหมด', style: 'destructive', onPress: async () => { await delPatient.mutateAsync(patient.id); router.back(); } },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.canvas }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.line, alignItems: 'center', justifyContent: 'center' }}>
          <X size={20} color={t.colors.ink2} strokeWidth={2} />
        </Pressable>
        <Text variant="h2" weight="700" style={{ flex: 1 }}>โปรไฟล์ผู้ป่วย</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: insets.bottom + 24, paddingTop: 8 }} showsVerticalScrollIndicator={false}>
        {/* หัวโปรไฟล์ */}
        <View style={{ alignItems: 'center', marginBottom: 18 }}>
          <Pressable onPress={() => changePhoto.mutate(patient.id)}>
            <Avatar name={patient.name} photoUrl={patient.photo_url} size={96} />
            <View style={{ position: 'absolute', right: -2, bottom: -2, width: 30, height: 30, borderRadius: 15, backgroundColor: t.colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: t.colors.canvas }}>
              {changePhoto.isPending ? <ActivityIndicator size="small" color="#fff" /> : <Camera size={15} color="#fff" strokeWidth={2.2} />}
            </View>
          </Pressable>
          <Text variant="h1" weight="700" style={{ marginTop: 12 }}>{patient.name}</Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
            {patient.gender ? <View style={{ backgroundColor: t.colors.surface2, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 11 }}><Text variant="caption" weight="600" color="ink2">{patient.gender}</Text></View> : null}
            {age != null ? <View style={{ backgroundColor: t.colors.surface2, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 11 }}><Text variant="caption" weight="600" color="ink2">อายุ {age} ปี</Text></View> : null}
            {isCurrent ? <View style={{ backgroundColor: t.colors.successSoft, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 4 }}><Check size={12} color={t.colors.successInk} strokeWidth={3} /><Text variant="caption" weight="600" style={{ color: t.colors.successInk }}>กำลังดูแล</Text></View> : null}
          </View>
        </View>

        {/* สรุปเร็ว */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          <View style={{ flex: 1, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.line, borderRadius: t.radius.lg, padding: 14, ...t.shadows.e1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Pill size={14} color={t.colors.primaryStrong} strokeWidth={2} /><Text variant="caption" color="ink3">ทานยา 7 วัน</Text></View>
            <Text variant="h1" weight="700" style={{ marginTop: 4 }}>{adherence.data == null ? '—' : `${adherence.data}%`}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.line, borderRadius: t.radius.lg, padding: 14, ...t.shadows.e1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Pill size={14} color={t.colors.primaryStrong} strokeWidth={2} /><Text variant="caption" color="ink3">รายการยา</Text></View>
            <Text variant="h1" weight="700" style={{ marginTop: 4 }}>{meds.data?.length ?? 0}</Text>
          </View>
        </View>

        {/* ค่าสุขภาพล่าสุด */}
        <Text variant="title" weight="700" style={{ marginBottom: 10 }}>ค่าสุขภาพล่าสุด</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          <StatTile label="ความดัน" value={bp.value} status={bp.status} statusLabel={bp.statusLabel} icon={<Heart size={14} color={t.colors.danger} strokeWidth={2} />} />
          <StatTile label="น้ำตาล" value={sugar.value} status={sugar.status} statusLabel={sugar.statusLabel} icon={<Droplet size={14} color={t.colors.primary} strokeWidth={2} />} />
          <StatTile label="หัวใจ" value={hr.value} status={hr.status} statusLabel={hr.statusLabel} icon={<Activity size={14} color={t.colors.warning} strokeWidth={2} />} />
        </View>

        {/* นัดถัดไป */}
        {appt ? (
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 16 }}>
            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: t.colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
              <Text variant="title" weight="700" style={{ color: t.colors.primaryStrong }}>{apptDay(appt.datetime)}</Text>
              <Text variant="micro" weight="600" style={{ color: t.colors.primaryStrong }}>{apptMonth(appt.datetime)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong" weight="600">{apptTitle(appt)}</Text>
              <Text variant="caption" color="ink3">นัดถัดไป · {apptTime(appt.datetime)}</Text>
            </View>
            <CalendarDays size={18} color={t.colors.ink3} strokeWidth={2} />
          </Card>
        ) : null}

        {/* ข้อมูลผู้ป่วย */}
        <Text variant="title" weight="700" style={{ marginBottom: 6 }}>ข้อมูลผู้ป่วย</Text>
        <Card style={{ paddingVertical: 2, marginBottom: 20 }}>
          <Row label="เพศ" value={patient.gender || '-'} />
          <Row label="วันเกิด" value={birthStr} />
          <Row label="กรุ๊ปเลือด" value={patient.blood_type || '-'} />
          <Row label="โรคประจำตัว" value={patient.diseases || '-'} />
          <Row label="ประวัติแพ้ยา" value={patient.allergies || '-'} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, gap: 12 }}>
            <Text variant="caption" color="ink3">รหัสผู้ป่วย (HN)</Text>
            <Text variant="bodyStrong" weight="600">{patient.id.slice(0, 8).toUpperCase()}</Text>
          </View>
        </Card>

        {/* ปุ่มจัดการ */}
        {!isCurrent ? <Button label="เลือกดูแลคนนี้" block onPress={onSelect} style={{ marginBottom: 10 }} /> : null}
        <Button label="เปลี่ยนรูปโปรไฟล์" variant="secondary" block loading={changePhoto.isPending} icon={<Camera size={18} color={t.colors.primaryStrong} strokeWidth={2} />} onPress={() => changePhoto.mutate(patient.id)} style={{ marginBottom: 10 }} />
        <Button label="ลบผู้ป่วยนี้" variant="danger" block icon={<Trash2 size={18} color={t.colors.dangerInk} strokeWidth={2} />} onPress={onDelete} />
      </ScrollView>
    </View>
  );
}
