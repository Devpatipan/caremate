import React, { useCallback, useState } from 'react';
import { View, Pressable, Modal, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Bell, ChevronDown, ChevronRight, Heart, Droplet, Activity, Tablet, UserPlus, CalendarPlus, Check, Users, Pill, HeartPulse, CalendarDays, BellRing } from 'lucide-react-native';
import { Screen, Text, StatTile, SectionLabel, Card, Button, Avatar } from '../../components/ui';
import { HeroMedCard } from '../../components/app/HeroMedCard';
import { AlertBanner } from '../../components/app/AlertBanner';
import { useTheme } from '../../theme/ThemeProvider';
import { useCurrentPatient } from '../../lib/patient-context';
import { useTodayDoses } from '../../lib/medications';
import { useLatestVitals, interpretVital, VitalType } from '../../lib/vitals';
import { useNextAppointment, apptDay, apptMonth, apptTime, apptTitle, apptPlace } from '../../lib/appointments';
import { useUnreadCount } from '../../lib/alerts';
import { useDevices, isOnline, deviceState } from '../../lib/devices';
import { getWeather } from '../../lib/weather';
import { useQuery } from '@tanstack/react-query';
import { AlertsSheet } from '../../components/app/AlertsSheet';

export default function Dashboard() {
  const t = useTheme();
  const router = useRouter();
  const { currentPatient, isLoading, patients, currentPatientId, setCurrentPatient } = useCurrentPatient();
  const insets = useSafeAreaInsets();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'สวัสดีตอนเช้า ☀️' : hour < 17 ? 'สวัสดีตอนบ่าย 🌤️' : hour < 20 ? 'สวัสดีตอนเย็น 🌆' : 'สวัสดีตอนค่ำ 🌙';
  const weather = useQuery({ queryKey: ['weather'], queryFn: getWeather, staleTime: 30 * 60 * 1000, retry: false });
  const ageOf = (b?: string | null) => (b ? Math.floor((Date.now() - new Date(b).getTime()) / (365.25 * 24 * 3600 * 1000)) : null);
  const briefOf = (p: any) => [p.gender, ageOf(p.birthdate) != null ? `${ageOf(p.birthdate)} ปี` : null, p.diseases].filter(Boolean).join(' · ') || 'ไม่มีข้อมูลเพิ่มเติม';
  const doses = useTodayDoses(currentPatient?.id);
  const latest = useLatestVitals(currentPatient?.id);
  const nextAppt = useNextAppointment(currentPatient?.id);
  const { count: unread } = useUnreadCount(currentPatient?.id);
  const devicesQ = useDevices(currentPatient?.id);

  // ดึงข้อมูลใหม่ทุกครั้งที่กลับเข้าหน้าหลัก
  useFocusEffect(useCallback(() => {
    doses.refetch();
    latest.refetch();
    nextAppt.refetch();
    devicesQ.refetch();
  }, [currentPatient?.id]));

  const list = doses.data ?? [];
  const taken = list.filter((d) => d.status === 'taken').length;
  const total = list.length;
  const next = list.find((d) => d.status !== 'taken');
  const overdue = list.find((d) => d.status === 'overdue');

  const tile = (type: VitalType) => {
    const v = latest.data?.[type];
    if (!v) return { value: '—', status: 'ok' as const, statusLabel: 'ยังไม่มี' };
    const info = interpretVital(type, v.value_json);
    return { value: info.display, status: info.status, statusLabel: info.statusLabel };
  };
  const bp = tile('bp'), sugar = tile('sugar'), hr = tile('hr');
  const appt = nextAppt.data;
  const boxes = devicesQ.data ?? [];
  const anyOnline = boxes.some((b) => isOnline(b));
  const anyProvisioning = boxes.some((b) => deviceState(b) === 'provisioning');
  const quickActions = [
    { label: 'ข้อมูลสุขภาพ', icon: <HeartPulse size={22} color={t.colors.primaryStrong} strokeWidth={2.2} />, onPress: () => router.push('/health') },
    { label: 'ยาและการเตือน', icon: <Pill size={22} color={t.colors.primaryStrong} strokeWidth={2.2} />, onPress: () => router.push('/medications') },
    { label: 'นัดหมาย', icon: <CalendarDays size={22} color={t.colors.primaryStrong} strokeWidth={2.2} />, onPress: () => router.push('/appointments') },
    { label: 'แจ้งเตือน', icon: <BellRing size={22} color={t.colors.primaryStrong} strokeWidth={2.2} />, onPress: () => router.push('/alerts') },
  ];

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <View style={{ flex: 1 }}>
          <Text variant="caption" color="ink3">{greet}{weather.data != null ? ` · ${weather.data}°C` : ''}</Text>
          {currentPatient ? (
            <Pressable onPress={() => setPickerOpen(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', marginTop: 5, backgroundColor: t.colors.surface, borderColor: t.colors.line, borderWidth: 1, paddingVertical: 6, paddingLeft: 6, paddingRight: 12, borderRadius: t.radius.pill, ...t.shadows.e1 }}>
              <Avatar name={currentPatient.name} photoUrl={currentPatient.photo_url} size={28} />
              <Text variant="caption" weight="600">{currentPatient.name}</Text>
              <ChevronDown size={14} color={t.colors.ink2} strokeWidth={2.4} />
            </Pressable>
          ) : (
            <Text variant="h2" weight="700" style={{ marginTop: 4 }}>หน้าหลัก</Text>
          )}
        </View>
        <Pressable onPress={() => setAlertsOpen(true)} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.colors.surface, borderColor: t.colors.line, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Bell size={20} color={t.colors.ink2} strokeWidth={2} />
          {unread > 0 ? <View style={{ position: 'absolute', top: 7, right: 8, width: 9, height: 9, borderRadius: 5, backgroundColor: t.colors.danger, borderWidth: 2, borderColor: t.colors.surface }} /> : null}
        </Pressable>
      </View>

      {!isLoading && !currentPatient ? (
        <Card style={{ alignItems: 'center', paddingVertical: 28, marginTop: 16 }}>
          <View style={{ width: 60, height: 60, borderRadius: 18, backgroundColor: t.colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <UserPlus size={28} color={t.colors.primaryStrong} strokeWidth={2} />
          </View>
          <Text variant="h2" weight="700" center style={{ marginBottom: 6 }}>เริ่มต้นด้วยการเพิ่มผู้ป่วย</Text>
          <Text variant="body" color="ink3" center style={{ marginBottom: 18, paddingHorizontal: 10 }}>เพิ่มผู้สูงอายุที่คุณดูแล เพื่อเริ่มตั้งยา ดูสถานะ และค่าสุขภาพ</Text>
          <Button label="เพิ่มผู้ป่วยคนแรก" icon={<UserPlus size={18} color={t.colors.onPrimary} strokeWidth={2.2} />} onPress={() => router.push('/add-patient')} />
        </Card>
      ) : currentPatient ? (
        <>
          <View style={{ marginTop: 10 }}>
            <HeroMedCard taken={taken} total={total} nextDose={next ? { time: next.time, name: next.medName } : undefined} />
          </View>

          {overdue ? <AlertBanner title={`ยังไม่ทานยา ${overdue.time}`} detail={`${overdue.medName} · แตะเพื่อดู`} onPress={() => router.push('/medications')} /> : null}

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14, marginBottom: 4 }}>
            {quickActions.map((item) => (
              <Pressable
                key={item.label}
                onPress={item.onPress}
                style={({ pressed }) => ({
                  flexBasis: '48%',
                  flexGrow: 1,
                  minHeight: 82,
                  backgroundColor: t.colors.surface,
                  borderWidth: 1,
                  borderColor: t.colors.line,
                  borderRadius: t.radius.lg,
                  padding: 13,
                  opacity: pressed ? 0.88 : 1,
                  ...t.shadows.e1,
                })}
              >
                <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: t.colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 9 }}>
                  {item.icon}
                </View>
                <Text variant="caption" weight="700" color="ink2">{item.label}</Text>
              </Pressable>
            ))}
          </View>

          <SectionLabel title="ค่าสุขภาพล่าสุด" actionLabel="ดูทั้งหมด" onActionPress={() => router.push('/health')} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <StatTile label="ความดัน" value={bp.value} status={bp.status} statusLabel={bp.statusLabel} icon={<Heart size={14} color={t.colors.danger} strokeWidth={2} />} />
            <StatTile label="น้ำตาล" value={sugar.value} status={sugar.status} statusLabel={sugar.statusLabel} icon={<Droplet size={14} color={t.colors.primary} strokeWidth={2} />} />
            <StatTile label="หัวใจ" value={hr.value} status={hr.status} statusLabel={hr.statusLabel} icon={<Activity size={14} color={t.colors.warning} strokeWidth={2} />} />
          </View>

          <SectionLabel title="นัดหมายถัดไป" actionLabel="ทั้งหมด" onActionPress={() => router.push('/appointments')} />
          {appt ? (
            <Pressable onPress={() => router.push('/appointments')}>
              <Card style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 13 }}>
                <View style={{ width: 46, height: 46, borderRadius: 12, backgroundColor: t.colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Text variant="title" weight="700" style={{ color: t.colors.primaryStrong }}>{apptDay(appt.datetime)}</Text>
                  <Text variant="micro" weight="600" style={{ color: t.colors.primaryStrong }}>{apptMonth(appt.datetime)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong" weight="600">{apptTitle(appt)}</Text>
                  <Text variant="caption" color="ink3">{apptTime(appt.datetime)}{appt.doctor ? ` · ${appt.doctor}` : ''}</Text>
                  {apptPlace(appt) ? <Text variant="micro" color="ink3" style={{ marginTop: 1 }}>{apptPlace(appt)}</Text> : null}
                </View>
                <ChevronRight size={18} color={t.colors.ink3} strokeWidth={2.4} />
              </Card>
            </Pressable>
          ) : (
            <Pressable onPress={() => router.push('/add-appointment')}>
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 40, height: 40, borderRadius: 11, backgroundColor: t.colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                  <CalendarPlus size={20} color={t.colors.primaryStrong} strokeWidth={2} />
                </View>
                <Text variant="bodyStrong" weight="600" color="ink2" style={{ flex: 1 }}>เพิ่มนัดหมายแพทย์</Text>
                <ChevronRight size={18} color={t.colors.ink3} strokeWidth={2.4} />
              </Card>
            </Pressable>
          )}

          <Pressable onPress={() => router.push('/device')} style={{ marginTop: 10 }}>
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 11, backgroundColor: anyOnline ? t.colors.successSoft : t.colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
                <Tablet size={20} color={anyOnline ? t.colors.successInk : t.colors.ink3} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong" weight="600" style={{ fontSize: 14 }}>กล่องเตือนยา KidBright</Text>
                <Text variant="caption" color="ink3">
                  {boxes.length === 0 ? 'ยังไม่ได้ผูกกล่อง — แตะเพื่อตั้งค่า'
                    : `${boxes.length} กล่อง · ${anyOnline ? 'ออนไลน์' : anyProvisioning ? 'กำลังตั้งค่า' : 'ออฟไลน์'}`}
                </Text>
              </View>
              {boxes.length > 0 ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: anyOnline ? t.colors.success : anyProvisioning ? t.colors.warning : t.colors.ink3 }} /> : <ChevronRight size={18} color={t.colors.ink3} strokeWidth={2.4} />}
            </Card>
          </Pressable>
        </>
      ) : null}

      {/* Popup เลือกผู้ป่วย */}
      <Modal visible={pickerOpen} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setPickerOpen(false)}>
        <Pressable onPress={() => setPickerOpen(false)} style={{ flex: 1, backgroundColor: 'rgba(15,37,64,0.5)', justifyContent: 'flex-end' }}>
          <Pressable onPress={() => {}} style={{ backgroundColor: t.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 10, paddingBottom: insets.bottom + 18, paddingHorizontal: 18 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: t.colors.line, alignSelf: 'center', marginBottom: 14 }} />
            <Text variant="title" weight="700" style={{ marginBottom: 12 }}>เลือกผู้ป่วยที่ดูแล</Text>
            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {patients.map((p) => {
                const sel = p.id === currentPatientId;
                return (
                  <Pressable key={p.id} onPress={() => { setCurrentPatient(p.id); setPickerOpen(false); }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: t.radius.lg, marginBottom: 8, borderWidth: 1.5, borderColor: sel ? t.colors.primary : t.colors.line, backgroundColor: sel ? t.colors.primarySoft : t.colors.surface }}>
                    <Avatar name={p.name} photoUrl={p.photo_url} size={44} />
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong" weight="700" numberOfLines={1}>{p.name}</Text>
                      <Text variant="caption" color="ink3" numberOfLines={1}>{briefOf(p)}</Text>
                    </View>
                    {sel ? <Check size={18} color={t.colors.primaryStrong} strokeWidth={3} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
            <Button label="จัดการผู้ป่วยทั้งหมด" variant="secondary" block icon={<Users size={18} color={t.colors.primaryStrong} strokeWidth={2} />} onPress={() => { setPickerOpen(false); router.push('/patients'); }} style={{ marginTop: 6 }} />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Popup แจ้งเตือน (จากกระดิ่ง) */}
      <AlertsSheet visible={alertsOpen} onClose={() => setAlertsOpen(false)} patientId={currentPatient?.id} />
    </Screen>
  );
}
