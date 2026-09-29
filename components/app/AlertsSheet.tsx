import React, { useState } from 'react';
import { View, Modal, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BellOff } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from '../ui/Text';
import { AlertRow } from '../ui/AlertRow';
import { EmptyState } from '../ui/EmptyState';
import { AppDialog, DialogConfig } from '../ui';
import { useAlerts, useMarkAllSeen, useMarkSeen, alertTypeLabel, AlertRecord } from '../../lib/alerts';

const TH_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const timeLabel = (iso: string) => { const d = new Date(iso); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
const fullDate = (iso: string) => { const d = new Date(iso); return `${d.getDate()} ${TH_MONTHS[d.getMonth()]} ${d.getFullYear() + 543} · ${timeLabel(iso)} น.`; };
function bucket(iso: string): string {
  const d = new Date(iso), now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const ts = d.getTime();
  if (ts >= startToday) return 'วันนี้';
  if (ts >= startToday - 86400000) return 'เมื่อวาน';
  return 'ก่อนหน้านี้';
}

export function AlertsSheet({ visible, onClose, patientId }: { visible: boolean; onClose: () => void; patientId?: string | null }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const alerts = useAlerts(patientId);
  const markAll = useMarkAllSeen(patientId);
  const markSeen = useMarkSeen(patientId);
  const [dialog, setDialog] = useState<DialogConfig | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

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

  const goto = (path: string) => { onClose(); setTimeout(() => router.push(path as any), 250); };
  const openDetail = (a: AlertRecord) => {
    if (!a.seen) markSeen.mutate(a.id);
    const actions: DialogConfig['actions'] = [{ label: 'ปิด', style: 'cancel' }];
    if (a.type === 'missed' || a.type === 'taken') actions.unshift({ label: 'ไปหน้ายา', onPress: () => goto('/medications') });
    else if (a.type === 'vital') actions.unshift({ label: 'ไปหน้าสุขภาพ', onPress: () => goto('/health') });
    else if (a.type === 'appointment') actions.unshift({ label: 'ดูนัดหมาย', onPress: () => goto('/appointments') });
    else if (a.type === 'offline') actions.unshift({ label: 'ดูอุปกรณ์', onPress: () => goto('/device') });
    setDialog({ title: alertTypeLabel(a.type), message: `${a.message}\n\n🕒 ${fullDate(a.created_at)}`, actions });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(15,37,64,0.5)', justifyContent: 'flex-end' }}>
        <Pressable onPress={() => {}} style={{ backgroundColor: t.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 10, paddingBottom: insets.bottom + 16, paddingHorizontal: 18, maxHeight: '82%' }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: t.colors.line, alignSelf: 'center', marginBottom: 12 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Text variant="title" weight="700" style={{ flex: 1 }}>การแจ้งเตือน</Text>
            {unreadCount > 0 ? (
              <Pressable onPress={() => markAll.mutate()} hitSlop={8}>
                <Text variant="caption" weight="700" style={{ color: t.colors.primaryStrong }}>อ่านทั้งหมด</Text>
              </Pressable>
            ) : null}
          </View>

          {all.length > 0 ? (
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
              {([['all', 'ทั้งหมด', all.length], ['unread', 'ยังไม่อ่าน', unreadCount]] as const).map(([key, label, count]) => {
                const active = filter === key;
                return (
                  <Pressable key={key} onPress={() => setFilter(key)} style={{ paddingVertical: 5, paddingHorizontal: 12, borderRadius: 999, backgroundColor: active ? t.colors.primary : t.colors.surface2 }}>
                    <Text variant="micro" weight="700" style={{ color: active ? '#fff' : t.colors.ink2 }}>{label} {count}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <ScrollView showsVerticalScrollIndicator={false}>
            {alerts.isLoading ? (
              <ActivityIndicator color={t.colors.primary} style={{ marginTop: 24 }} />
            ) : all.length === 0 ? (
              <EmptyState icon={<BellOff size={24} color={t.colors.ink3} strokeWidth={1.8} />} title="ยังไม่มีการแจ้งเตือน" description="เมื่อมีเหตุการณ์ เช่น พลาดยา จะแสดงที่นี่" />
            ) : list.length === 0 ? (
              <EmptyState icon={<BellOff size={24} color={t.colors.ink3} strokeWidth={1.8} />} title="อ่านครบแล้ว" description="ไม่มีการแจ้งเตือนที่ยังไม่อ่าน" />
            ) : (
              groups.map((g) => (
                <View key={g.key}>
                  <Text variant="micro" weight="600" color="ink3" style={{ marginTop: 12, marginBottom: 8, marginLeft: 2, letterSpacing: 0.6 }}>{g.key}</Text>
                  {g.items.map((a) => (
                    <Pressable key={a.id} onPress={() => openDetail(a)}>
                      <AlertRow type={a.type} title={a.message} time={timeLabel(a.created_at)} unread={!a.seen} />
                    </Pressable>
                  ))}
                </View>
              ))
            )}
            <View style={{ height: 8 }} />
          </ScrollView>

          <AppDialog visible={!!dialog} config={dialog} onClose={() => setDialog(null)} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
