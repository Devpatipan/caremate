import React from 'react';
import { View, Pressable } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from './Text';

export type SectionLabelProps = {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export function SectionLabel({ title, actionLabel, onActionPress }: SectionLabelProps) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 20,
        marginBottom: 10,
        paddingHorizontal: 2,
      }}
    >
      <Text variant="title" weight="700">
        {title}
      </Text>
      {actionLabel ? (
        <Pressable onPress={onActionPress} hitSlop={8}>
          <Text variant="caption" weight="600" style={{ color: t.colors.primaryStrong }}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
