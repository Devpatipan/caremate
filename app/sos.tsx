import React from 'react';
import { View, Pressable, ActivityIndicator, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { X, Plus, Trash2, Phone, PhoneCall } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme, useThemeControls } from '../theme/ThemeProvider';
import { Text } from '../components/ui/Text';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { useCurrentPatient } from '../lib/patient-context';
import { useEmergencyContacts, useDeleteContact } from '../lib/contacts';

export default function Sos() {
  const t = useTheme();
  const { scheme } = useThemeControls();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentPatientId } = useCurrentPatient();
  const contacts = useEmergencyContacts(currentPatientId);
  const del = useDeleteContact(currentPatientId);

  const call = (phone: string) => {
    Linking.openURL(`tel:${phone.replace(/[^0-9+]/g, '')}`).catch(() => Alert.alert('โทรไม่ได้', 'อุปกรณ์นี้โทรออกไม่ได้'));
  };
  const onDelete = (id: string, name: string) => {
    Alert.alert('ลบผู้ติดต่อ', `ลบ "${name}"?`, [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ลบ', style: 'destructive', onPress: () => del.mutate(id) },
    ]);
  };

  const list = contacts.data ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.canvas }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.line, alignItems: 'center', justifyContent: 'center' }}>
          <X size={20} color={t.colors.ink2} strokeWidth={2} />
        </Pressable>
        <Text variant="h2" weight="700" style={{ flex: 1 }}>ผู้ติดต่อฉุกเฉิน (SOS)</Text>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 18 }}>
        {contacts.isLoading ? (
          <ActivityIndicator color={t.colors.primary} style={{ marginTop: 30 }} />
        ) : list.length === 0 ? (
          <EmptyState icon={<Phone size={24} color={t.colors.ink3} strokeWidth={1.8} />} title="ยังไม่มีผู้ติดต่อฉุกเฉิน" description="เพิ่มเบอร์คนที่ควรติดต่อเมื่อเกิดเหตุ" />
        ) : (
          <View style={{ paddingTop: 6 }}>
            {list.map((c) => (
              <Card key={c.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.colors.dangerSoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Phone size={20} color={t.colors.dangerInk} strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong" weight="600">{c.name}</Text>
                  <Text variant="caption" color="ink3">{[c.relation, c.phone].filter(Boolean).join(' · ')}</Text>
                  {c.note ? <Text variant="micro" color="ink3" style={{ marginTop: 2 }}>📝 {c.note}</Text> : null}
                </View>
                <Pressable onPress={() => onDelete(c.id, c.name)} hitSlop={8} style={{ padding: 6 }}>
                  <Trash2 size={17} color={t.colors.ink3} strokeWidth={2} />
                </Pressable>
                <Pressable onPress={() => call(c.phone)} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: t.colors.success, alignItems: 'center', justifyContent: 'center' }}>
                  <PhoneCall size={19} color="#FFFFFF" strokeWidth={2.2} />
                </Pressable>
              </Card>
            ))}
          </View>
        )}
      </View>

      <Pressable onPress={() => router.push('/add-contact')} style={{ position: 'absolute', right: 18, bottom: insets.bottom + 20, width: 56, height: 56, borderRadius: 18, backgroundColor: t.colors.primary, alignItems: 'center', justifyContent: 'center', ...t.shadows.e3 }}>
        <Plus size={26} color="#FFFFFF" strokeWidth={2.4} />
      </Pressable>
    </View>
  );
}
