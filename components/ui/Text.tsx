import React from 'react';
import { Text as RNText, TextProps, TextStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { typography } from '../../theme/tokens';
import { FONTS_ENABLED, familyForWeight } from '../../theme/fonts';

type Variant = keyof Omit<typeof typography, 'family'>;

export type AppTextProps = TextProps & {
  variant?: Variant;
  /** Token color key, e.g. 'ink' | 'ink2' | 'ink3' | 'primaryStrong' | 'dangerInk'. Defaults to 'ink'. */
  color?: keyof ReturnType<typeof useTheme>['colors'] | string;
  weight?: '400' | '500' | '600' | '700';
  center?: boolean;
};

export function Text({
  variant = 'body',
  color = 'ink',
  weight,
  center,
  style,
  ...rest
}: AppTextProps) {
  const theme = useTheme();
  const t = typography[variant];
  const resolvedWeight = (weight ?? (t as any).weight) as string;
  const resolvedColor =
    (theme.colors as Record<string, string>)[color as string] ?? (color as string);

  const base: TextStyle = {
    fontSize: t.fontSize,
    lineHeight: t.lineHeight,
    fontFamily: familyForWeight(resolvedWeight),
    // When the custom font (with weight baked into the family) is off,
    // fall back to the system font and apply the numeric weight instead.
    fontWeight: FONTS_ENABLED ? undefined : (resolvedWeight as TextStyle['fontWeight']),
    color: resolvedColor,
    textAlign: center ? 'center' : undefined,
  };

  return <RNText {...rest} style={[base, style]} />;
}
