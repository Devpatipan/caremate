import React from 'react';
import { View, Pressable } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from './Text';

export function Stepper({
  value,
  onChange,
  min = 1,
  max = 99,
  step = 1,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  const t = useTheme();
  const btn = (dir: -1 | 1, disabled: boolean, Icon: any) => (
    <Pressable
      onPress={() => onChange(Math.min(max, Math.max(min, value + dir * step)))}
      disabled={disabled}
      style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: t.colors.line,
        backgroundColor: t.colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <Icon size={20} color={t.colors.primaryStrong} strokeWidth={2.4} />
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      {btn(-1, value <= min, Minus)}
      <Text variant="h2" weight="700" style={{ minWidth: 74, textAlign: 'center' }}>
        {value}{suffix ? ` ${suffix}` : ''}
      </Text>
      {btn(1, value >= max, Plus)}
    </View>
  );
}
