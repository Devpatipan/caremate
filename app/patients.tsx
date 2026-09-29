import React from 'react';
import { View, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { X, Plus, Check, UserRound, Trash2, Camera, Info, HeartPulse } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme, useThemeControls } from '../theme/ThemeProvider';
import { Text } from '../components/ui/Text';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Avatar } from '../components/ui/Avatar';
import { useCurrentPatient } from '../lib/patient-context';
import { useDeletePatient } from '../lib/patients';
import { useChangePatientPhoto } from '../lib/photo';

export default function PatientsScreen() {
  const t = useTheme();
  const { scheme } = useThemeControls();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { patients, currentPatientId, setCurrentPatient, isLoading } = useCurrentPatient();
  const delPatient = useDeletePatient();
  const changePhoto = useChangePatientPhoto();
  const ageOf = (birthdate?: string | null) => birthdate ? Math.floor((Date.now() - new Date(birthdate).getTime()) / (365.25 * 24 * 3600 * 1000)) : null;

  const select = (id: string) => { setCurrentPatient(id); router.back(); };
  const onDelete = (id: string, name: string) => {
    Alert.alert('ลบผู้ป่วย', `ลบ "${name}" และข้อมูลทั้งหมด (ยา/ค่าสุขภาพ/นัดหมาย/กล่อง)?\nการลบนี้ย้อนกลับไม่ได้`, [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ลบทั้งหมด', style: 'destructive', onPress: () => delPatient.mutate(id) },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.canvas }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.line, alignItems: 'center', justifyContent: 'center' }}>
          <X size={20} color={t.colors.ink2} strokeWidth={2} />
        </Pressable>
        <Text variant="h2" weight="700" style={{ flex: 1 }}>ผู้ป่วยที่ดูแล</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: insets.bottom + 24, paddingTop: 8 }} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={{ paddingTop: 40, alignItems: 'center' }}><ActivityIndicator color={t.colors.primary} /></View>
        ) : patients.length === 0 ? (
          <EmptyState icon={<UserRound size={24} color={t.colors.ink3} strokeWidth={1.8} />} title="ยังไม่มีผู้ป่วย" description="เพิ่มผู้สูงอายุคนแรกที่คุณดูแลเพื่อเริ่มใช้งาน" />
        ) : (
          patients.map((p) => {
            const active = p.id === currentPatientId;
            const changing = changePhoto.isPending && (changePhoto.variables as any) === p.id;
            const age = ageOf(p.birthdate);
            const brief = [p.gender, age != null ? `อายุ ${age} ปี` : null, p.blood_type ? `กรุ๊ป ${p.blood_type}` : null].filter(Boolean).join(' · ') || 'ไม่มีข้อมูลพื้นฐาน';
            return (
              <Pressable key={p.id} onPress={() => select(p.id)} style={{ backgroundColor: active ? t.colors.primarySoft : t.colors.surface, borderWidth: 1.5, borderColor: active ? t.colors.primary : t.colors.line, borderRadius: t.radius.xl, padding: 14, marginBottom: 12, ...t.shadows.e1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
                  <Pressable onPress={() => changePhoto.mutate(p.id)} hitSlop={6}>
                    <Avatar name={p.name} photoUrl={p.photo_url} size={50} />
                    <View style={{ position: 'absolute', right: -2, bottom: -2, width: 20, height: 20, borderRadius: 10, backgroundColor: t.colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: active ? t.colors.primarySoft : t.colors.surface }}>
                      {changing ? <ActivityIndicator size="small" color="#fff" /> : <Camera size={10} color="#fff" strokeWidth={2.4} />}
                    </View>
                  </Pressable>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong" weight="700">{p.name}</Text>
                    <Text variant="caption" color="ink3" numberOfLines={1}>{brief}</Text>
                  </View>
                  {active ? (
                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: t.colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={16} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  ) : null}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: active ? 'rgba(30,136,233,0.18)' : t.colors.line2 }}>
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                    <HeartPulse size={15} color={p.diseases ? t.colors.warningInk : t.colors.successInk} strokeWidth={2} />
                    <Text variant="caption" color="ink2" numberOfLines={1}>{p.diseases || 'ยังไม่มีโรคประจำตัวที่ระบุ'}</Text>
                  </View>
                  <Pressable onPress={() => router.push({ pathname: '/patient-profile', params: { id: p.id } })} hitSlop={8} style={{ padding: 6 }}>
                    <Info size={18} color={t.colors.primaryStrong} strokeWidth={2} />
                  </Pressable>
                  <Pressable onPress={() => onDelete(p.id, p.name)} hitSlop={8} style={{ padding: 6 }}>
                    <Trash2 size={17} color={t.colors.ink3} strokeWidth={2} />
                  </Pressable>
                </View>
              </Pressable>
            );
          })
        )}

        <Button label="เพิ่มผู้ป่วยใหม่" variant="secondary" block icon={<Plus size={18} color={t.colors.primaryStrong} strokeWidth={2.4} />} onPress={() => router.push('/add-patient')} style={{ marginTop: 6 }} />
      </ScrollView>
    </View>
  );
}
