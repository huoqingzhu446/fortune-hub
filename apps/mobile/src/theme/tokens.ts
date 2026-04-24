export const THEME_KEYS = [
  'mist_blue',
  'sakura_pink',
  'turquoise',
  'lavender',
  'milk_apricot',
  'champagne_gold',
  'moon_silver',
  'peach_orange',
  'rose_dust',
  'mint_cyan',
  'sea_salt',
  'jade_white',
  'amber_honey',
  'cloud_gray_purple',
] as const;

export type ThemeKey = (typeof THEME_KEYS)[number];

export type ThemeMode = 'auto' | 'manual';

export interface ThemePalette {
  key: ThemeKey;
  name: string;
  description: string;
  primary: string;
  soft: string;
  accent: string;
  pageTop: string;
  pageBottom: string;
  surface: string;
  surfaceStrong: string;
  surfaceMuted: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  tagBg: string;
  glow: string;
  shadowColor: string;
}

export interface ResolvedThemeState {
  mode: ThemeMode;
  manualThemeKey: ThemeKey | '';
  dailyThemeKey: ThemeKey | '';
  effectiveThemeKey: ThemeKey;
  source: 'manual' | 'daily' | 'fallback';
}

export const DEFAULT_THEME_KEY: ThemeKey = 'mist_blue';
