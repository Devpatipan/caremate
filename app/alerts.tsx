import React, { useState } from 'react';
import { View, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, BellOff, BellRing } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme, useThemeControls } from '../theme/ThemeProvider';
import { Text } from '../components/ui/Text';
import { AlertRow } from '../components/ui/AlertRow';
import { EmptyState } from '../components/ui/EmptyState';
import { AppDialog, DialogConfig, Card } from '../components/ui';
import { useCurrentPatient } from '../lib/patient-context';
import { useAlerts, useMarkAllSeen, useMarkSeen, alertTypeLabel, AlertRecord } from '../lib/alerts';

const TH_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const timeLabel = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
const fullDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate()} ${TH_MONTHS[d.getMonth()]} ${d.getFullYear() + 543} · ${timeLabel(iso)} น.`;
};
function bucket(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const ts = d.getTime();
  if (ts >= startToday) return 'วันนี้';
  if (ts >= startToday - 86400000) return 'เมื่อวาน';
  return 'ก่อนหน้านี้';
}

export default function AlertsScreen() {
  const t = useTheme();
  const { scheme } = useThemeControls();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentPatientId, currentPatient } = useCurrentPatient();
  const alerts = useAlerts(currentPatientId);
  const markAll = useMarkAllSeen(currentPatientId);
  const markSeen = useMarkSeen(currentPatientId);
  const [dialog, setDialog] = useState<DialogConfig | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const openDetail = (a: AlertRecord) => {
    if (!a.seen) markSeen.mutate(a.id);
    const actions: DialogConfig['actions'] = [{ label: 'ปิด', style: 'cancel' }];
    if (a.type === 'missed' || a.type === 'taken') actions.unshift({ label: 'ไปหน้ายา', onPress: () => { router.back(); router.push('/medications'); } });
    else if (a.type === 'vital') actions.unshift({ label: 'ไปหน้าสุขภาพ', onPress: () => { router.back(); router.push('/health'); } });
    else if (a.type === 'appointment') actions.unshift({ label: 'ดูนัดหมาย', onPress: () => { router.back(); router.push('/appointments'); } });
    else if (a.type === 'offline') actions.unshift({ label: 'ดูอุปกรณ์', onPress: () => { router.back(); router.push('/device'); } });
    setDialog({ title: alertTypeLabel(a.type), message: `${a.message}\n\n🕒 ${fullDate(a.created_at)}`, actions });
  };

  const all = alerts.data ?? [];
  const unreadCount = all.filter((a) => !a.seen).length;
  const list = filter === 'unread' ? all.filter((a) => !a.seen) : all;
  const groups: { key: string; items: AlertRecord[] }[] = [];
  for (const a of list) {
    const b = bucket(a.created_at);
    let g = groups.find((x) => x.key === b);
    if (!g) { g = { key: b, items: [] }; groups.push(g); }
    g.items.push(a);
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.canvas }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.line, alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={22} color={t.colors.ink2} strokeWidth={2} />
        </Pressable>
        <Text variant="h2" weight="700" style={{ flex: 1 }}>แจ้งเตือน</Text>
        {unreadCount > 0 ? (
          <Pressable onPress={() => markAll.mutate()} hitSlop={8}>
            <Text variant="caption" weight="600" style={{ color: t.colors.primaryStrong }}>อ่านทั้งหมด</Text>
          </Pressable>
        ) : null}
      </View>

      {currentPatient ? (
        <View style={{ paddingHorizontal: 18, paddingBottom: 10 }}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: t.colors.surface }}>
            <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: unreadCount > 0 ? t.colors.dangerSoft : t.colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
              <BellRing size={22} color={unreadCount > 0 ? t.colors.dangerInk : t.colors.primaryStrong} strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong" weight="700">{currentPatient.name}</Text>
              <Text variant="caption" color="ink3">{unreadCount > 0 ? `มีแจ้งเตือนยังไม่อ่าน ${unreadCount} รายการ` : 'ไม่มีแจ้งเตือนที่ต้องจัดการตอนนี้'}</Text>
            </View>
          </Card>
        </View>
      ) : null}

      {all.length > 0 ? (
        <View style={{ flexDirection: 'row', paddingHorizontal: 18, paddingBottom: 6, gap: 8 }}>
          {([['all', 'ทั้งหมด', all.length], ['unread', 'ยังไม่อ่าน', unreadCount]] as const).map(([key, label, count]) => {
            const active = filter === key;
            return (
              <Pressable key={key} onPress={() => setFilter(key)} style={{ paddingVertical: 6, paddingHorizontal: 13, borderRadius: 999, backgroundColor: active ? t.colors.primary : t.colors.surface2 }}>
                <Text variant="micro" weight="700" style={{ color: active ? '#fff' : t.colors.ink2 }}>{label} {count}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: insets.bottom + 24, paddingTop: 6 }} showsVerticalScrollIndicator={false}>
        {alerts.isLoading ? (
          <ActivityIndicator color={t.colors.primary} style={{ marginTop: 30 }} />
        ) : all.length === 0 ? (
          <EmptyState icon={<BellOff size={24} color={t.colors.ink3} strokeWidth={1.8} />} title="ยังไม่มีการแจ้งเตือน" description="เมื่อมีเหตุการณ์ เช่น พลาดยา หรือค่าผิดปกติ จะแสดงที่นี่" />
        ) : list.length === 0 ? (
          <EmptyState icon={<BellOff size={24} color={t.colors.ink3} strokeWidth={1.8} />} title="อ่านครบทุกรายการแล้ว" description="ไม่มีการแจ้งเตือนที่ยังไม่อ่าน" />
        ) : (
          groups.map((g) => (
            <View key={g.key}>
              <Text variant="micro" weight="600" color="ink3" style={{ marginTop: 16, marginBottom: 8, marginLeft: 2, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                {g.key}
              </Text>
              {g.items.map((a) => (
                <Pressable key={a.id} onPress={() => openDetail(a)}>
                  <AlertRow type={a.type} title={a.message} time={timeLabel(a.created_at)} unread={!a.seen} />
                </Pressable>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      <AppDialog visible={!!dialog} config={dialog} onClose={() => setDialog(null)} />
    </View>
  );
}
