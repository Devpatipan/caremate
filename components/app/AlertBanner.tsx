import React from 'react';
import { View, Pressable } from 'react-native';
import { AlertTriangle, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from '../ui';

export type AlertBannerProps = {
  title: string;
  detail?: string;
  onPress?: () => void;
};

/** High-priority inline banner for the dashboard (missed dose, etc.). */
export function AlertBanner({ title, detail, onPress }: AlertBannerProps) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: t.colors.dangerSoft,
        borderColor: t.colors.danger,
        borderWidth: 1,
        borderRadius: t.radius.lg,
        padding: 13,
        marginTop: 14,
      }}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 11,
          backgroundColor: t.colors.danger,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AlertTriangle size={20} color="#FFFFFF" strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong" weight="700" style={{ color: t.colors.dangerInk, fontSize: 14 }}>
          {title}
        </Text>
        {detail ? (
          <Text variant="caption" color="ink2">
            {detail}
          </Text>
        ) : null}
      </View>
      <ChevronRight size={18} color={t.colors.ink3} strokeWidth={2.4} />
    </Pressable>
  );
}
