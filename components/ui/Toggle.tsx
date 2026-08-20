import React from 'react';
import { Pressable, View, Animated, useAnimatedValue } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

export type ToggleProps = {
  value: boolean;
  onValueChange?: (v: boolean) => void;
  disabled?: boolean;
};

export function Toggle({ value, onValueChange, disabled }: ToggleProps) {
  const t = useTheme();
  const anim = useAnimatedValue(value ? 1 : 0);

  React.useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 160,
      useNativeDriver: false,
    }).start();
  }, [value, anim]);

  const left = anim.interpolate({ inputRange: [0, 1], outputRange: [3, 21] });

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      hitSlop={8}
      disabled={disabled}
      onPress={() => onValueChange?.(!value)}
      style={{
        width: 46,
        height: 28,
        borderRadius: 999,
        backgroundColor: value ? t.colors.primary : t.colors.line,
        justifyContent: 'center',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Animated.View
        style={{
          position: 'absolute',
          left,
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: '#FFFFFF',
          ...t.shadows.e1,
        }}
      />
    </Pressable>
  );
}
