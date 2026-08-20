import React from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from './Text';

export type BadgeTone = 'ok' | 'warn' | 'bad' | 'info' | 'neutral';

export type BadgeProps = {
  label: string;
  tone?: BadgeTone;
  /** Show a status dot before the label. */
  dot?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Badge({ label, tone = 'neutral', dot, style }: BadgeProps) {
  const t = useTheme();

  const map: Record<BadgeTone, { bg: string; fg: string; dot: string }> = {
    ok: { bg: t.colors.successSoft, fg: t.colors.successInk, dot: t.colors.success },
    warn: { bg: t.colors.warningSoft, fg: t.colors.warningInk, dot: t.colors.warning },
    bad: { bg: t.colors.dangerSoft, fg: t.colors.dangerInk, dot: t.colors.danger },
    info: { bg: t.colors.primarySoft, fg: t.colors.primaryStrong, dot: t.colors.primary },
    neutral: { bg: t.colors.surface2, fg: t.colors.ink2, dot: t.colors.ink3 },
  };
  const c = map[tone];

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          alignSelf: 'flex-start',
          backgroundColor: c.bg,
          paddingVertical: 5,
          paddingHorizontal: 11,
          borderRadius: t.radius.pill,
        },
        style,
      ]}
    >
      {dot ? (
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.dot }} />
      ) : null}
      <Text variant="caption" weight="600" style={{ color: c.fg }}>
        {label}
      </Text>
    </View>
  );
}
