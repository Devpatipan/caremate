import React from 'react';
import { Text as RNText, TextProps, TextStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { typography } from '../../theme/tokens';
import { FONTS_ENABLED, familyForWeight } from '../../theme/fonts';

type Variant = keyof Omit<typeof typography, 'family'>;

export type AppTextProps = TextProps & {
  variant?: Variant;
  /** Token color key เช่น 'ink' | 'ink2' | 'ink3' | 'primaryStrong' | 'dangerInk' (ค่าเริ่มต้น 'ink') */
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
    // เมื่อใช้ฟอนต์ที่ฝังน้ำหนักไว้ในชื่อแล้ว ห้ามตั้ง fontWeight ซ้ำ (กันฟอนต์เพี้ยนบน Android)
    fontWeight: FONTS_ENABLED ? undefined : (resolvedWeight as TextStyle['fontWeight']),
    // เผื่อพื้นที่วรรณยุกต์/สระบน-ล่างของไทย ไม่ให้ถูกตัด
    includeFontPadding: true,
    color: resolvedColor,
    textAlign: center ? 'center' : undefined,
  };

  return <RNText {...rest} style={[base, style]} />;
}
