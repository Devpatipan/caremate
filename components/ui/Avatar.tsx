import React from 'react';
import { View, Image } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from './Text';

function initialOf(name?: string | null): string {
  if (!name) return '?';
  const clean = name.replace(/^(นาย|นาง|นางสาว|เด็กชาย|เด็กหญิง|คุณ)\s*/, '').trim();
  return (clean[0] ?? name[0] ?? '?').toUpperCase();
}

export type AvatarProps = {
  name?: string | null;
  photoUrl?: string | null;
  size?: number;
  /** สีพื้น/ตัวอักษร กรณีไม่มีรูป (ใช้ตัวย่อ) */
  bg?: string;
  fg?: string;
};

export function Avatar({ name, photoUrl, size = 44, bg, fg }: AvatarProps) {
  const t = useTheme();
  const s = size;
  if (photoUrl) {
    return (
      <Image
        source={{ uri: photoUrl }}
        style={{ width: s, height: s, borderRadius: s / 2, backgroundColor: t.colors.surface2 }}
      />
    );
  }
  return (
    <View style={{ width: s, height: s, borderRadius: s / 2, backgroundColor: bg ?? t.blue[200], alignItems: 'center', justifyContent: 'center' }}>
      <Text weight="700" style={{ color: fg ?? t.blue[800], fontSize: Math.round(s * 0.4), lineHeight: Math.round(s * 0.5) }}>
        {initialOf(name)}
      </Text>
    </View>
  );
}
