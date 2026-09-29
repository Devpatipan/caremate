import React, { useState, useCallback } from 'react';
import { View, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Plus, Check, Pill, ChevronRight, UserPlus, Clock3 } from 'lucide-react-native';
import { Screen, Text, SegmentedControl, Card, Button, EmptyState } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import { useCurrentPatient } from '../../lib/patient-context';
import { useTodayDoses, useMedications, useMarkDose, useAdherence7d, TodayDose } from '../../lib/medications';

type Tab = 'today' | 'all';

export default function Medications() {
  const t = useTheme();
  const router = useRouter();
  const { currentPatientId, currentPatient } = useCurrentPatient();
  const [tab, setTab] = useState<Tab>('today');

  const doses = useTodayDoses(currentPatientId);
  const meds = useMedications(currentPatientId);
  const markDose = useMarkDose(currentPatientId);
  const adherence = useAdherence7d(currentPatientId);

  // ดึงข้อมูลใหม่ทุกครั้งที่กลับเข้าหน้านี้ (เช่น กลับจากหน้าเพิ่มยา)
  useFocusEffect(useCallback(() => {
    doses.refetch();
    meds.refetch();
    adherence.refetch();
  }, [currentPatientId]));

  const takenCount = (doses.data ?? []).filter((d) => d.status === 'taken').length;
  const totalCount = (doses.data ?? []).length;

  if (!currentPatient) {
    return (
      <Screen>
        <Text variant="h1" weight="700" style={{ marginBottom: 20 }}>ยาและการเตือน</Text>
        <Card style={{ alignItems: 'center', paddingVertical: 28, marginTop: 8 }}>
          <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: t.colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <UserPlus size={26} color={t.colors.primaryStrong} strokeWidth={2} />
          </View>
          <Text variant="h2" weight="700" center style={{ marginBottom: 6 }}>เพิ่มผู้ป่วยก่อน</Text>
          <Text variant="body" color="ink3" center style={{ marginBottom: 16 }}>ต้องมีผู้ป่วยก่อนจึงจะตั้งยาได้</Text>
          <Button label="เพิ่มผู้ป่วย" onPress={() => router.push('/add-patient')} />
        </Card>
      </Screen>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Screen>
        <Text variant="h1" weight="700" style={{ marginBottom: 12 }}>ยาและการเตือน</Text>
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14, backgroundColor: t.colors.primarySoft }}>
          <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: t.colors.surface, alignItems: 'center', justifyContent: 'center' }}>
            <Pill size={22} color={t.colors.primaryStrong} strokeWidth={2.2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong" weight="700">{currentPatient.name}</Text>
            <Text variant="caption" color="ink2">จัดรายการยา เวลาเตือน และการทานวันนี้ในที่เดียว</Text>
          </View>
        </Card>

        {totalCount > 0 || adherence.data != null ? (
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
            <View style={{ flex: 1, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.line, borderRadius: t.radius.lg, padding: 13, ...t.shadows.e1 }}>
              <Text variant="caption" color="ink3">ความคืบหน้าวันนี้</Text>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginTop: 3 }}>
                <Text variant="h1" weight="700" style={{ color: t.colors.primaryStrong }}>{takenCount}</Text>
                <Text variant="bodyStrong" weight="600" color="ink3" style={{ marginBottom: 3 }}>/ {totalCount} มื้อ</Text>
              </View>
            </View>
            <View style={{ flex: 1, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.line, borderRadius: t.radius.lg, padding: 13, ...t.shadows.e1 }}>
              <Text variant="caption" color="ink3">สม่ำเสมอ 7 วัน</Text>
              <Text variant="h1" weight="700" style={{ color: adherence.data == null ? t.colors.ink3 : t.colors.successInk, marginTop: 3 }}>
                {adherence.data == null ? '—' : `${adherence.data}%`}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={{ marginBottom: 14 }}>
          <SegmentedControl value={tab} onChange={(v) => setTab(v as Tab)} options={[{ value: 'today', label: 'วันนี้' }, { value: 'all', label: 'รายการยา' }]} />
        </View>

        {tab === 'today' ? (
          <TodayList loading={doses.isLoading} doses={doses.data ?? []} markingId={markDose.isPending ? (markDose.variables as string) : null} onMark={(id) => markDose.mutate(id)} />
        ) : (
          <AllList
            loading={meds.isLoading}
            meds={meds.data ?? []}
            onEdit={(m) => {
              const times = (m.reminders ?? []).map((r: any) => r.time.slice(0, 5)).sort().join(',');
              const days = m.reminders?.[0]?.days?.length ? m.reminders[0].days.join(',') : '';
              router.push({ pathname: '/add-medication', params: { id: m.id, name: m.name, dosage: m.dosage ?? '', note: m.note ?? '', times, days } });
            }}
          />
        )}
      </Screen>

      <Pressable onPress={() => router.push('/add-medication')} style={{ position: 'absolute', right: 18, bottom: 24, width: 56, height: 56, borderRadius: 18, backgroundColor: t.colors.primary, alignItems: 'center', justifyContent: 'center', ...t.shadows.e3 }}>
        <Plus size={26} color="#FFFFFF" strokeWidth={2.4} />
      </Pressable>
    </View>
  );
}

function statusStyle(t: any, s: TodayDose['status']) {
  if (s === 'taken') return { bg: t.colors.successSoft, fg: t.colors.successInk, label: 'ทานแล้ว' };
  if (s === 'overdue') return { bg: t.colors.dangerSoft, fg: t.colors.dangerInk, label: 'เกินเวลา' };
  return { bg: t.colors.surface2, fg: t.colors.ink3, label: 'รอ' };
}

function TodayList({ loading, doses, markingId, onMark }: { loading: boolean; doses: TodayDose[]; markingId: string | null; onMark: (id: string) => void }) {
  const t = useTheme();
  if (loading) return <ActivityIndicator color={t.colors.primary} style={{ marginTop: 30 }} />;
  if (doses.length === 0) return <EmptyState icon={<Pill size={24} color={t.colors.ink3} strokeWidth={1.8} />} title="ยังไม่มีมื้อยาวันนี้" description="แตะปุ่ม + เพื่อเพิ่มยาและตั้งเวลาเตือน" />;
  return (
    <>
      {doses.map((d) => {
        const st = statusStyle(t, d.status);
        return (
          <Card key={d.reminderId} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <View style={{ width: 52, alignItems: 'center' }}>
                <Text variant="title" weight="700">{d.time}</Text>
                <Text variant="micro" color="ink3">{d.period}</Text>
            </View>
            <View style={{ width: 1, alignSelf: 'stretch', backgroundColor: t.colors.line }} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong" weight="600">{d.medName}</Text>
              {d.dosage ? <Text variant="caption" color="ink3">{d.dosage}</Text> : null}
            </View>
            {d.status === 'taken' ? (
              <View style={{ backgroundColor: st.bg, borderRadius: t.radius.pill, paddingVertical: 6, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Check size={13} color={st.fg} strokeWidth={3} />
                <Text variant="caption" weight="600" style={{ color: st.fg }}>{st.label}</Text>
              </View>
            ) : (
              <Button label="ทานแล้ว" size="sm" loading={markingId === d.reminderId} onPress={() => onMark(d.reminderId)} />
            )}
          </Card>
        );
      })}
    </>
  );
}

function AllList({ loading, meds, onEdit }: { loading: boolean; meds: any[]; onEdit: (m: any) => void }) {
  const t = useTheme();
  if (loading) return <ActivityIndicator color={t.colors.primary} style={{ marginTop: 30 }} />;
  if (meds.length === 0) return <EmptyState icon={<Pill size={24} color={t.colors.ink3} strokeWidth={1.8} />} title="ยังไม่มีรายการยา" description="แตะปุ่ม + เพื่อเพิ่มยาตัวแรก" />;
  return (
    <>
      {meds.map((m) => {
        const times = (m.reminders ?? []).map((r: any) => r.time.slice(0, 5)).sort().join(' · ');
        return (
          <Pressable key={m.id} onPress={() => onEdit(m)}>
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <View style={{ width: 40, height: 40, borderRadius: 11, backgroundColor: t.colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                <Pill size={20} color={t.colors.primaryStrong} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong" weight="600">{m.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 }}>
                  <Clock3 size={12} color={t.colors.ink3} strokeWidth={2} />
                  <Text variant="caption" color="ink3" numberOfLines={1}>{[m.dosage, times || null].filter(Boolean).join(' · ') || 'ยังไม่ตั้งเวลา'}</Text>
                </View>
              </View>
              <ChevronRight size={18} color={t.colors.ink3} strokeWidth={2.4} />
            </Card>
          </Pressable>
        );
      })}
    </>
  );
}
