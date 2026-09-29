import React from 'react';
import { View, Pressable, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from './Text';

export type ChipOption = { value: string; label: string };

const chipStyle = (t: any, on: boolean) => ({
  paddingVertical: 9,
  paddingHorizontal: 15,
  borderRadius: 999,
  borderWidth: 1.5,
  borderColor: on ? t.colors.primary : t.colors.line,
  backgroundColor: on ? t.colors.primarySoft : t.colors.surface,
});

/** เลือกได้ค่าเดียว */
export function Chips({
  options,
  value,
  onChange,
  style,
}: {
  options: ChipOption[];
  value: string;
  onChange: (v: string) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  return (
    <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, style]}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable key={o.value} onPress={() => onChange(o.value)} style={chipStyle(t, on)}>
            <Text variant="caption" weight="600" style={{ color: on ? t.colors.primaryStrong : t.colors.ink2 }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** เลือกได้หลายค่า */
export function MultiChips({
  options,
  value,
  onChange,
  style,
}: {
  options: ChipOption[];
  value: string[];
  onChange: (v: string[]) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const toggle = (v: string) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, style]}>
      {options.map((o) => {
        const on = value.includes(o.value);
        return (
          <Pressable key={o.value} onPress={() => toggle(o.value)} style={chipStyle(t, on)}>
            <Text variant="caption" weight="600" style={{ color: on ? t.colors.primaryStrong : t.colors.ink2 }}>
              {on ? '✓ ' : ''}{o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
