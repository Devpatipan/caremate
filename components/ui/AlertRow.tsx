import React from 'react';
import { View, Pressable } from 'react-native';
import { AlertTriangle, Heart, Check, Calendar, WifiOff, Bell } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from './Text';

export type AlertType = 'missed' | 'vital' | 'taken' | 'appointment' | 'offline' | 'info';

export type AlertRowProps = {
  type: AlertType;
  title: string;
  detail?: string;
  time?: string;
  unread?: boolean;
  onPress?: () => void;
};

export function AlertRow({ type, title, detail, time, unread, onPress }: AlertRowProps) {
  const t = useTheme();

  const config: Record<AlertType, { bg: string; fg: string; Icon: any }> = {
    missed: { bg: t.colors.dangerSoft, fg: t.colors.dangerInk, Icon: AlertTriangle },
    vital: { bg: t.colors.warningSoft, fg: t.colors.warningInk, Icon: Heart },
    taken: { bg: t.colors.successSoft, fg: t.colors.successInk, Icon: Check },
    appointment: { bg: t.colors.primarySoft, fg: t.colors.primaryStrong, Icon: Calendar },
    offline: { bg: t.colors.surface2, fg: t.colors.ink3, Icon: WifiOff },
    info: { bg: t.colors.primarySoft, fg: t.colors.primaryStrong, Icon: Bell },
  };
  const c = config[type];

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        gap: 12,
        alignItems: 'flex-start',
        backgroundColor: t.colors.surface,
        borderColor: t.colors.line,
        borderWidth: 1,
        borderLeftWidth: unread ? 3 : 1,
        borderLeftColor: unread ? t.colors.primary : t.colors.line,
        borderRadius: t.radius.lg,
        padding: 13,
        marginBottom: 9,
        ...t.shadows.e1,
      }}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 11,
          backgroundColor: c.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <c.Icon size={19} color={c.fg} strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong" weight="600" style={{ fontSize: 14 }}>
          {title}
        </Text>
        {detail ? (
          <Text variant="caption" color="ink2" style={{ marginTop: 2 }}>
            {detail}
          </Text>
        ) : null}
      </View>
      {time ? (
        <Text variant="micro" color="ink3">
          {time}
        </Text>
      ) : null}
    </Pressable>
  );
}
