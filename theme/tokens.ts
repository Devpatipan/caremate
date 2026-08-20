/**
 * CareMate 2.0 — Design Tokens
 * ------------------------------------------------------------
 * Single source of truth for the whole app. Ported 1:1 from the
 * design-system showcase. All colors verified for WCAG AA on the
 * pairs actually used in the UI.
 *
 * Usage: prefer `useTheme()` (see ThemeProvider) instead of importing
 * `light`/`dark` directly, so components react to theme changes.
 */

/** Brand blue ramp — primary is 500 (#1E88E9), matches the logo. */
export const blue = {
  50: '#EAF4FE',
  100: '#D2E8FD',
  200: '#A9D2FA',
  300: '#6FB6F5',
  400: '#3D9BF0',
  500: '#1E88E9',
  600: '#1670C7',
  700: '#135BA1',
  800: '#124A82',
  900: '#0F3B69',
} as const;

/** Spacing scale — 4px base. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
} as const;

/** Corner radius. */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

/** Type scale. Font family is applied globally via ThemeProvider. */
export const typography = {
  family: {
    // LINE Seed Sans TH is loaded in app/_layout via expo-font.
    regular: 'LINESeedSansTH-Regular',
    medium: 'LINESeedSansTH-Medium',
    bold: 'LINESeedSansTH-Bold',
  },
  // size / lineHeight / weight
  display: { fontSize: 30, lineHeight: 34, weight: '700' as const },
  h1: { fontSize: 22, lineHeight: 28, weight: '700' as const },
  h2: { fontSize: 18, lineHeight: 24, weight: '700' as const },
  title: { fontSize: 16, lineHeight: 22, weight: '700' as const },
  body: { fontSize: 15, lineHeight: 22, weight: '400' as const },
  bodyStrong: { fontSize: 15, lineHeight: 22, weight: '600' as const },
  caption: { fontSize: 12.5, lineHeight: 18, weight: '500' as const },
  micro: { fontSize: 10.5, lineHeight: 14, weight: '600' as const },
} as const;

/** Minimum hit target for any tappable element. */
export const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };
export const MIN_TOUCH = 44;

type ColorTokens = {
  bg: string;
  canvas: string;
  surface: string;
  surface2: string;
  surfaceSunken: string;
  ink: string;
  ink2: string;
  ink3: string;
  inkInverse: string;
  line: string;
  line2: string;

  primary: string;
  primaryStrong: string;
  primarySoft: string;
  onPrimary: string;

  success: string;
  successInk: string;
  successSoft: string;
  warning: string;
  warningInk: string;
  warningSoft: string;
  danger: string;
  dangerInk: string;
  dangerSoft: string;
};

export const lightColors: ColorTokens = {
  bg: '#EEF2F7',
  canvas: '#F6F8FB',
  surface: '#FFFFFF',
  surface2: '#F4F7FB',
  surfaceSunken: '#EEF3F9',
  ink: '#101B2D',
  ink2: '#45566E',
  ink3: '#5E6D82', // AA-adjusted (5.27:1 on surface)
  inkInverse: '#FFFFFF',
  line: '#E4E9F1',
  line2: '#EDF1F6',

  primary: '#1E88E9',
  primaryStrong: '#1670C7', // use for text/labels on light (AA: 5.03:1)
  primarySoft: '#EAF4FE',
  onPrimary: '#FFFFFF',

  success: '#16A34A',
  successInk: '#0E7A38',
  successSoft: '#E7F6EC',
  warning: '#E08600',
  warningInk: '#B45309',
  warningSoft: '#FEF4E3',
  danger: '#E5484D',
  dangerInk: '#B42318',
  dangerSoft: '#FDEBEC',
};

export const darkColors: ColorTokens = {
  bg: '#0A0F16',
  canvas: '#0E141B',
  surface: '#172230',
  surface2: '#1E2A3A',
  surfaceSunken: '#111A25',
  ink: '#EAF1F8',
  ink2: '#A6B6C9',
  ink3: '#8496AB',
  inkInverse: '#0E141B',
  line: '#2A3849',
  line2: '#233142',

  primary: '#3D9BF0',
  primaryStrong: '#6FB6F5',
  primarySoft: '#14283C',
  onPrimary: '#06121F',

  success: '#31C065',
  successInk: '#7EE0A3',
  successSoft: '#12271B',
  warning: '#F6B44C',
  warningInk: '#F8CE8A',
  warningSoft: '#2B2113',
  danger: '#F26D71',
  dangerInk: '#F7A9AB',
  dangerSoft: '#2E1618',
};

/** Elevation presets (cross-platform: iOS shadow + Android elevation). */
export const makeShadows = (dark: boolean) => {
  const c = dark ? '#000000' : '#101B2D';
  return {
    e1: {
      shadowColor: c,
      shadowOpacity: dark ? 0.4 : 0.06,
      shadowRadius: 3,
      shadowOffset: { width: 0, height: 1 },
      elevation: 1,
    },
    e2: {
      shadowColor: c,
      shadowOpacity: dark ? 0.5 : 0.1,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    e3: {
      shadowColor: c,
      shadowOpacity: dark ? 0.6 : 0.16,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
      elevation: 10,
    },
  };
};

export type Shadows = ReturnType<typeof makeShadows>;

export type Theme = {
  mode: 'light' | 'dark';
  colors: ColorTokens;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  shadows: Shadows;
  blue: typeof blue;
};

export const buildTheme = (mode: 'light' | 'dark'): Theme => ({
  mode,
  colors: mode === 'dark' ? darkColors : lightColors,
  spacing,
  radius,
  typography,
  shadows: makeShadows(mode === 'dark'),
  blue,
});
