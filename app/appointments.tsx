import React, { useState } from 'react';
import { View, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { X, Plus, Trash2, CalendarDays, Clock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme, useThemeControls } from '../theme/ThemeProvider';
import { Text } from '../components/ui/Text';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { useCurrentPatient } from '../lib/patient-context';
import { useAppointments, useDeleteAppointment, apptDay, apptMonth, apptTime, apptTitle, apptPlace } from '../lib/appointments';

export default function AppointmentsScreen() {
  const t = useTheme();
  const { scheme } = useThemeControls();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentPatientId, currentPatient } = useCurrentPatient();
  const appts = useAppointments(currentPatientId);
  const del = useDeleteAppointment(currentPatientId);
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');

  const now = Date.now();
  const all = appts.data ?? [];
  const upcomingCount = all.filter((a) => new Date(a.datetime).getTime() >= now).length;
  const pastCount = all.length - upcomingCount;
  const list =
    filter === 'upcoming'
      ? all.filter((a) => new Date(a.datetime).getTime() >= now)
      : filter === 'past'
      ? all.filter((a) => new Date(a.datetime).getTime() < now).sort((x, y) => new Date(y.datetime).getTime() - new Date(x.datetime).getTime())
      : all;

  const onDelete = (id: string, label: string) => {
    Alert.alert('ลบนัดหมาย', `ลบ "${label}"?`, [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ลบ', style: 'destructive', onPress: () => del.mutate(id) },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.canvas }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.line, alignItems: 'center', justifyContent: 'center' }}>
          <X size={20} color={t.colors.ink2} strokeWidth={2} />
        </Pressable>
        <Text variant="h2" weight="700" style={{ flex: 1 }}>นัดหมาย</Text>
      </View>

      {currentPatient ? (
        <View style={{ paddingHorizontal: 18, paddingBottom: 10 }}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: t.colors.primarySoft }}>
            <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: t.colors.surface, alignItems: 'center', justifyContent: 'center' }}>
              <CalendarDays size={22} color={t.colors.primaryStrong} strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong" weight="700">{currentPatient.name}</Text>
              <Text variant="caption" color="ink2">ติดตามนัดหมายแพทย์และประวัตินัดของผู้ป่วยคนนี้</Text>
            </View>
          </Card>
        </View>
      ) : null}

      {all.length > 0 ? (
        <View style={{ flexDirection: 'row', paddingHorizontal: 18, paddingBottom: 10, gap: 8 }}>
          {([['upcoming', 'กำลังจะถึง', upcomingCount], ['past', 'ผ่านมาแล้ว', pastCount], ['all', 'ทั้งหมด', all.length]] as const).map(([key, label, count]) => {
            const active = filter === key;
            return (
              <Pressable key={key} onPress={() => setFilter(key)} style={{ paddingVertical: 6, paddingHorizontal: 13, borderRadius: 999, backgroundColor: active ? t.colors.primary : t.colors.surface2 }}>
                <Text variant="micro" weight="700" style={{ color: active ? '#fff' : t.colors.ink2 }}>{label} {count}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <View style={{ flex: 1, paddingHorizontal: 18 }}>
        {appts.isLoading ? (
          <ActivityIndicator color={t.colors.primary} style={{ marginTop: 30 }} />
        ) : all.length === 0 ? (
          <EmptyState icon={<CalendarDays size={24} color={t.colors.ink3} strokeWidth={1.8} />} title="ยังไม่มีนัดหมาย" description="แตะปุ่ม + เพื่อเพิ่มนัดหมายแพทย์" />
        ) : list.length === 0 ? (
          <EmptyState icon={<CalendarDays size={24} color={t.colors.ink3} strokeWidth={1.8} />} title={filter === 'upcoming' ? 'ไม่มีนัดหมายที่กำลังจะถึง' : 'ไม่มีนัดหมายที่ผ่านมาแล้ว'} description={filter === 'upcoming' ? 'นัดหมายในอนาคตจะแสดงที่นี่' : 'นัดหมายที่ผ่านไปแล้วจะแสดงที่นี่'} />
        ) : (
          <View style={{ paddingTop: 6 }}>
            {list.map((a) => {
              const past = new Date(a.datetime).getTime() < now;
              const place = apptPlace(a);
              return (
                <Card key={a.id} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 13, marginBottom: 10, opacity: past ? 0.55 : 1 }}>
                  <View style={{ width: 48, height: 50, borderRadius: 13, backgroundColor: t.colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                    <Text variant="title" weight="700" style={{ color: t.colors.primaryStrong }}>{apptDay(a.datetime)}</Text>
                    <Text variant="micro" weight="600" style={{ color: t.colors.primaryStrong }}>{apptMonth(a.datetime)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong" weight="700">{apptTitle(a)}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 }}>
                      <Clock size={12} color={t.colors.ink2} strokeWidth={2} />
                      <Text variant="caption" color="ink2">{apptTime(a.datetime)}{a.doctor ? ` · ${a.doctor}` : ''}</Text>
                    </View>
                    {place ? <Text variant="caption" color="ink3" style={{ marginTop: 1 }}>{place}</Text> : null}
                    {a.note ? <Text variant="micro" style={{ marginTop: 3, color: t.colors.warningInk }}>📌 {a.note}</Text> : null}
                  </View>
                  <Pressable onPress={() => onDelete(a.id, apptTitle(a))} hitSlop={8} style={{ padding: 4 }}>
                    <Trash2 size={18} color={t.colors.ink3} strokeWidth={2} />
                  </Pressable>
                </Card>
              );
            })}
          </View>
        )}
      </View>

      <Pressable onPress={() => router.push('/add-appointment')} style={{ position: 'absolute', right: 18, bottom: insets.bottom + 20, width: 56, height: 56, borderRadius: 18, backgroundColor: t.colors.primary, alignItems: 'center', justifyContent: 'center', ...t.shadows.e3 }}>
        <Plus size={26} color="#FFFFFF" strokeWidth={2.4} />
      </Pressable>
    </View>
  );
}
