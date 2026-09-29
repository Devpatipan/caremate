/**
 * Font configuration — CareMate
 *
 * ใช้ LINE Seed Sans TH (ฟอนต์ทางการของ LINE — ฟรี ใช้เชิงพาณิชย์ได้)
 * ไฟล์ .ttf อยู่ใน assets/fonts/ โหลดใน app/_layout.tsx
 *
 * น้ำหนักที่ LINE Seed มี: Thin / Regular / Bold / ExtraBold / Heavy
 * แมปกับ weight ในแอป:
 *   400,500 -> Regular   |   600 -> Bold   |   700 -> ExtraBold
 */
export const FONTS_ENABLED = true;

export const fontFamilies = {
  regular: 'LINESeedSansTH-Regular',
  medium: 'LINESeedSansTH-Regular',
  semibold: 'LINESeedSansTH-Bold',
  bold: 'LINESeedSansTH-ExtraBold',
} as const;

export function familyForWeight(weight?: string): string | undefined {
  if (!FONTS_ENABLED) return undefined; // system font
  if (weight === '700') return fontFamilies.bold;
  if (weight === '600') return fontFamilies.semibold;
  if (weight === '500') return fontFamilies.medium;
  return fontFamilies.regular;
}
