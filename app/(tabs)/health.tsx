import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Plus, FileText } from 'lucide-react-native';
import { Screen, Text, Badge, SegmentedControl, SectionLabel, Card } from '../../components/ui';
import { TrendChart } from '../../components/charts/TrendChart';
import { useTheme } from '../../theme/ThemeProvider';
import { bpTrend, bpReadings } from '../../lib/mockData';

type VitalTab = 'bp' | 'sugar' | 'hr';

export default function Health() {
  const t = useTheme();
  const [tab, setTab] = useState<VitalTab>('bp');

  return (
    <View style={{ flex: 1 }}>
      <Screen>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <Text variant="h1" weight="700" style={{ flex: 1 }}>
            สุขภาพ
          </Text>
          <Pressable
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: t.colors.surface,
              borderColor: t.colors.line,
              borderWidth: 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FileText size={20} color={t.colors.ink2} strokeWidth={2} />
          </Pressable>
        </View>

        <SegmentedControl<VitalTab>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'bp', label: 'ความดัน' },
            { value: 'sugar', label: 'น้ำตาล' },
            { value: 'hr', label: 'หัวใจ' },
          ]}
        />

        {/* Big current value */}
        <Card elevation="e1" style={{ alignItems: 'center', paddingVertical: 18, marginTop: 14 }}>
          <Text variant="caption" weight="600" color="ink3">
            ความดันโลหิตล่าสุด
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
            <Text variant="display" weight="700" style={{ fontSize: 40, lineHeight: 46, letterSpacing: -1 }}>
              128
            </Text>
            <Text variant="h2" weight="600" color="ink3" style={{ marginBottom: 6 }}>
              /82
            </Text>
          </View>
          <Badge label="อยู่ในเกณฑ์ปกติ" tone="ok" dot style={{ marginTop: 4 }} />
          <Text variant="micro" color="ink3" style={{ marginTop: 8 }}>
            วัดเมื่อ 07:15 น. วันนี้ · จากกล่อง
          </Text>
        </Card>

        {/* Trend chart */}
        <SectionLabel title="แนวโน้ม 7 วัน" />
        <TrendChart
          xLabels={bpTrend.xLabels}
          domain={[70, 160]}
          yTicks={[70, 100, 130, 160]}
          series={[
            {
              label: 'ตัวบน (Systolic)',
              color: t.blue[700],
              points: bpTrend.systolic,
              endLabel: String(bpTrend.systolic[bpTrend.systolic.length - 1]),
            },
            {
              label: 'ตัวล่าง (Diastolic)',
              color: t.blue[300],
              points: bpTrend.diastolic,
              endLabel: String(bpTrend.diastolic[bpTrend.diastolic.length - 1]),
            },
          ]}
        />

        {/* Recent readings */}
        <SectionLabel title="บันทึกล่าสุด" />
        <Card padded={false} style={{ paddingHorizontal: 14 }}>
          {bpReadings.map((r, i) => (
            <View
              key={r.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 12,
                borderBottomWidth: i === bpReadings.length - 1 ? 0 : 1,
                borderBottomColor: t.colors.line2,
              }}
            >
              <View>
                <Text variant="bodyStrong" weight="600">
                  {r.value}
                </Text>
                <Text variant="caption" color="ink3">
                  {r.when}
                </Text>
              </View>
              <Badge label={r.label} tone={r.status === 'ok' ? 'ok' : 'warn'} />
            </View>
          ))}
        </Card>
      </Screen>

      {/* FAB */}
      <Pressable
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
