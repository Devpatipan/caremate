import React, { useState } from 'react';
import { View, TextInput, TextInputProps, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { typography } from '../../theme/tokens';
import { Text } from './Text';

export type FieldProps = TextInputProps & {
  label?: string;
  hint?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

export function Field({ label, hint, containerStyle, style, ...rest }: FieldProps) {
  const t = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={[{ marginBottom: t.spacing.md }, containerStyle]}>
      {label ? (
        <Text variant="caption" weight="600" color="ink2" style={{ marginBottom: 6 }}>
          {label}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor={t.colors.ink3}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        {...rest}
        style={[
          {
            fontFamily: typography.family.regular,
            fontSize: 15,
            color: t.colors.ink,
            backgroundColor: t.colors.surface2,
            borderWidth: 1.5,
            borderColor: focused ? t.colors.primary : t.colors.line,
            borderRadius: t.radius.md,
            paddingVertical: 12,
            paddingHorizontal: 14,
          },
          style,
        ]}
      />
      {hint ? (
        <Text variant="micro" color="ink3" style={{ marginTop: 5 }}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
