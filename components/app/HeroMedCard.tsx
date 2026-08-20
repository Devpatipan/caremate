import React from 'react';
import { View } from 'react-native';
import { Clock } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text, MedRing } from '../ui';

export type HeroMedCardProps = {
  taken: number;
  total: number;
  nextDose?: { time: string; name: string };
};

export function HeroMedCard({ taken, total, nextDose }: HeroMedCardProps) {
  const t = useTheme();
  const done = taken >= total;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 18,
        backgroundColor: t.blue[700],
        borderRadius: t.radius.xl,
        padding: 20,
        ...t.shadows.e2,
      }}
    >
      <MedRing taken={taken} total={total} />
      <View style={{ flex: 1 }}>
        <Text variant="caption" style={{ color: '#FFFFFF', opacity: 0.85 }}>
          การทานยาวันนี้
        </Text>
        <Text variant="title" weight="700" style={{ color: '#FFFFFF', marginTop: 3, marginBottom: 8 }}>
          {done ? 'ครบแล้ววันนี้ 🎉' : `ทานแล้ว ${taken} มื้อ 👍`}
        </Text>
        {nextDose ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 7,
              alignSelf: 'flex-start',
              backgroundColor: 'rgba(255,255,255,0.16)',
              paddingVertical: 6,
              paddingHorizontal: 11,
              borderRadius: t.radius.pill,
            }}
          >
            <Clock size={14} color="#FFFFFF" strokeWidth={2.2} />
            <Text variant="caption" weight="600" style={{ color: '#FFFFFF' }}>
              มื้อถัดไป {nextDose.time} · {nextDose.name}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
