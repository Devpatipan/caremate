import React from 'react';
import { View } from 'react-native';
import { Check, Clock } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text, Badge } from '../ui';
import type { Dose } from '../../lib/mockData';

const badgeToneFor = (s: Dose['status']) =>
  s === 'taken' ? 'ok' : s === 'missed' ? 'bad' : s === 'due' ? 'info' : 'neutral';

export function DoseRow({ dose, highlight }: { dose: Dose; highlight?: boolean }) {
  const t = useTheme();
  const taken = dose.status === 'taken';

  const iconBg = taken ? t.colors.successSoft : dose.status === 'due' ? t.colors.primarySoft : t.colors.surface2;
  const iconFg = taken ? t.colors.successInk : dose.status === 'due' ? t.colors.primaryStrong : t.colors.ink3;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 13,
        backgroundColor: t.colors.surface,
        borderColor: highlight ? t.colors.primary : t.colors.line,
        borderWidth: highlight ? 1.5 : 1,
        borderRadius: t.radius.lg,
        padding: 14,
        marginBottom: 10,
        ...t.shadows.e1,
      }}
    >
      <View style={{ width: 52, alignItems: 'center' }}>
        <Text variant="bodyStrong" weight="700">
          {dose.time}
        </Text>
        <Text variant="micro" color="ink3">
          {dose.period}
        </Text>
      </View>
      <View style={{ width: 1, alignSelf: 'stretch', backgroundColor: t.colors.line }} />
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 11,
          backgroundColor: iconBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {taken ? <Check size={20} color={iconFg} strokeWidth={2.4} /> : <Clock size={20} color={iconFg} strokeWidth={2.2} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong" weight="600">
          {dose.medName}
        </Text>
        <Text variant="caption" color="ink3">
          {dose.detail}
        </Text>
      </View>
      <Badge label={dose.statusLabel} tone={badgeToneFor(dose.status) as any} />
    </View>
  );
}
