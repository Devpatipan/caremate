import React from 'react';
import { View, ViewProps, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

export type CardProps = ViewProps & {
  padded?: boolean;
  elevation?: 'e1' | 'e2' | 'e3' | 'none';
  style?: StyleProp<ViewStyle>;
};

export function Card({ padded = true, elevation = 'e1', style, children, ...rest }: CardProps) {
  const t = useTheme();
  const shadow = elevation === 'none' ? undefined : t.shadows[elevation];
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: t.colors.surface,
          borderColor: t.colors.line,
          borderWidth: 1,
          borderRadius: t.radius.lg,
          padding: padded ? t.spacing.lg : 0,
        },
        shadow,
        style,
      ]}
    >
      {children}
    </View>
  );
}
