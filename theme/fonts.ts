/**
 * Font configuration.
 *
 * The design uses **LINE Seed Sans TH**. To enable it:
 *  1. Drop the .ttf files into `assets/fonts/`:
 *       LINESeedSansTH-Regular.ttf, LINESeedSansTH-Medium.ttf, LINESeedSansTH-Bold.ttf
 *  2. Uncomment the `useFonts` block in `app/_layout.tsx`.
 *  3. Set `FONTS_ENABLED = true` below.
 *
 * Until then the app runs on the system font (which renders Thai correctly
 * on both iOS and Android), so nothing crashes if the files are missing.
 */
export const FONTS_ENABLED = false;

export const fontFamilies = {
  regular: 'LINESeedSansTH-Regular',
  medium: 'LINESeedSansTH-Medium',
  bold: 'LINESeedSansTH-Bold',
} as const;

export function familyForWeight(weight?: string): string | undefined {
  if (!FONTS_ENABLED) return undefined; // system font
  if (weight === '700') return fontFamilies.bold;
  if (weight === '600' || weight === '500') return fontFamilies.medium;
  return fontFamilies.regular;
}
