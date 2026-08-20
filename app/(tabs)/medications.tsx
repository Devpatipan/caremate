import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Plus, AlertTriangle } from 'lucide-react-native';
import { Screen, Text, Badge, SegmentedControl } from '../../components/ui';
import { DoseRow } from '../../components/app/DoseRow';
import { useTheme } from '../../theme/ThemeProvider';
import { doses, todayMed } from '../../lib/mockData';

type Tab = 'today' | 'all' | 'history';

export default function Medications() {
  const t = useTheme();
  const [tab, setTab] = useState<Tab>('today');

  return (
    <View style={{ flex: 1 }}>
      <Screen>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <Text variant="h1" weight="700" style={{ flex: 1 }}>
            ยาและการเตือน
          </Text>
          <Badge label={`${todayMed.adherence7d}% · 7 วัน`} tone="ok" />
        </View>

        <SegmentedControl<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'today', label: 'วันนี้' },
            { value: 'all', label: 'ทั้งหมด' },
            { value: 'history', label: 'ประวัติ' },
          ]}
        />

        <View style={{ marginTop: 14 }}>
          {doses.map((d) => (
            <DoseRow key={d.id} dose={d} highlight={d.status === 'due'} />
          ))}
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            backgroundColor: t.colors.warningSoft,
            borderRadius: t.radius.lg,
            padding: 12,
            marginTop: 4,
          }}
        >
          <AlertTriangle size={20} color={t.colors.warningInk} strokeWidth={2} />
          <Text variant="caption" style={{ flex: 1, color: t.colors.warningInk }}>
            <Text variant="caption" weight="700" style={{ color: t.colors.warningInk }}>
              เมื่อวาน{' '}
            </Text>
            พลาดยามื้อ 21:00 — แนะนำเตือนซ้ำ
          </Text>
        </View>
      </Screen>

      {/* FAB */}
      <Pressable
        onPress={() => {}}
        style={{
          position: 'absolute',
          right: 18,
          bottom: 24,
          width: 56,
          height: 56,
          borderRadius: 18,
          backgroundColor: t.colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          ...t.shadows.e3,
        }}
      >
        <Plus size={26} color="#FFFFFF" strokeWidth={2.4} />
      </Pressable>
    </View>
  );
}
