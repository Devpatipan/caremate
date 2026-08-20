import React from 'react';
import { Pressable, View, ViewStyle, ActivityIndicator, StyleProp } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { MIN_TOUCH } from '../../theme/tokens';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'sm';

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  disabled?: boolean;
  loading?: boolean;
  /** Optional leading icon element (e.g. a lucide icon). */
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  block,
  disabled,
  loading,
  icon,
  style,
}: ButtonProps) {
  const t = useTheme();

  const bg: Record<ButtonVariant, string> = {
    primary: t.colors.primaryStrong,
    secondary: t.colors.primarySoft,
    ghost: 'transparent',
    danger: t.colors.dangerSoft,
  };
  const fg: Record<ButtonVariant, string> = {
    primary: t.colors.onPrimary,
    secondary: t.colors.primaryStrong,
    ghost: t.colors.ink2,
    danger: t.colors.dangerInk,
  };
  const border: Record<ButtonVariant, string> = {
    primary: 'transparent',
    secondary: 'transparent',
    ghost: t.colors.line,
    danger: 'transparent',
  };

  const padV = size === 'sm' ? 8 : 12;
  const padH = size === 'sm' ? 14 : 20;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          minHeight: size === 'sm' ? 36 : MIN_TOUCH,
          paddingVertical: padV,
          paddingHorizontal: padH,
          borderRadius: t.radius.pill,
          backgroundColor: bg[variant],
          borderWidth: 1,
          borderColor: border[variant],
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          alignSelf: block ? 'stretch' : 'flex-start',
          opacity: disabled ? 0.5 : pressed ? 0.9 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg[variant]} />
      ) : (
        <>
          {icon ? <View>{icon}</View> : null}
          <Text
            variant={size === 'sm' ? 'caption' : 'bodyStrong'}
            weight="600"
            style={{ color: fg[variant] }}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}
