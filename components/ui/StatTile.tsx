import React from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from './Text';

export type StatStatus = 'ok' | 'warn' | 'bad';

export type StatTileProps = {
  label: string;
  value: string;
  unit?: string;
  status?: StatStatus;
  statusLabel?: string;
  /** Optional leading icon (e.g. a lucide icon element). */
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function StatTile({
  label,
  value,
  unit,
  status = 'ok',
  statusLabel,
  icon,
  style,
}: StatTileProps) {
  const t = useTheme();
  const statusColor = {
    ok: t.colors.successInk,
    warn: t.colors.warningInk,
    bad: t.colors.dangerInk,
  }[status];
  const dotColor = {
    ok: t.colors.success,
    warn: t.colors.warning,
    bad: t.colors.danger,
  }[status];

  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: t.colors.surface,
          borderColor: t.colors.line,
          borderWidth: 1,
          borderRadius: t.radius.lg,
          padding: 14,
          ...t.shadows.e1,
        },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {icon}
        <Text variant="caption" weight="600" color="ink3">
          {label}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, marginTop: 6 }}>
        <Text variant="h1" weight="700" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>
          {value}
        </Text>
        {unit ? (
          <Text variant="caption" weight="600" color="ink3" style={{ marginBottom: 3 }}>
            {unit}
          </Text>
        ) : null}
      </View>
      {statusLabel ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }}>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: dotColor }} />
          <Text variant="micro" weight="600" style={{ color: statusColor }}>
            {statusLabel}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
