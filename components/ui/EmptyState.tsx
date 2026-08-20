import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from './Text';

export type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
};

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  const t = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: 28, paddingHorizontal: 18 }}>
      {icon ? (
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            backgroundColor: t.colors.surface2,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
          }}
        >
          {icon}
        </View>
      ) : null}
      <Text variant="bodyStrong" weight="600" color="ink2" center>
        {title}
      </Text>
      {description ? (
        <Text variant="caption" color="ink3" center style={{ marginTop: 4 }}>
          {description}
        </Text>
      ) : null}
    </View>
  );
}
