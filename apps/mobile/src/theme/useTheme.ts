import { computed, type ComputedRef, type MaybeRefOrGetter, toValue } from 'vue';
import { getThemePalette } from './themes';
import {
  DEFAULT_THEME_KEY,
  THEME_KEYS,
  type ResolvedThemeState,
  type ThemeKey,
  type ThemeMode,
} from './tokens';

function isThemeKey(value: unknown): value is ThemeKey {
  return typeof value === 'string' && THEME_KEYS.includes(value as ThemeKey);
}

export function normalizeThemeKey(value: unknown, fallback: ThemeKey = DEFAULT_THEME_KEY): ThemeKey {
  return isThemeKey(value) ? value : fallback;
}

export function resolveEffectiveTheme(input: {
  themeMode: ThemeMode;
  manualThemeKey?: ThemeKey | '';
  dailyThemeKey?: ThemeKey | '';
  fallbackThemeKey?: ThemeKey;
}): ResolvedThemeState {
  const fallbackThemeKey = normalizeThemeKey(input.fallbackThemeKey, DEFAULT_THEME_KEY);
  const manualThemeKey = input.manualThemeKey && isThemeKey(input.manualThemeKey) ? input.manualThemeKey : '';
  const dailyThemeKey = input.dailyThemeKey && isThemeKey(input.dailyThemeKey) ? input.dailyThemeKey : '';

  if (input.themeMode === 'manual' && manualThemeKey) {
    return {
      mode: 'manual',
      manualThemeKey,
      dailyThemeKey,
      effectiveThemeKey: manualThemeKey,
      source: 'manual',
    };
  }

  if (dailyThemeKey) {
    return {
      mode: input.themeMode,
      manualThemeKey,
      dailyThemeKey,
      effectiveThemeKey: dailyThemeKey,
      source: 'daily',
    };
  }

  return {
    mode: input.themeMode,
    manualThemeKey,
    dailyThemeKey,
    effectiveThemeKey: fallbackThemeKey,
    source: 'fallback',
  };
}

export function buildThemeCssVars(themeKey: ThemeKey) {
  const palette = getThemePalette(themeKey);

  return {
    '--theme-primary': palette.primary,
    '--theme-soft': palette.soft,
    '--theme-accent': palette.accent,
    '--theme-page-top': palette.pageTop,
    '--theme-page-bottom': palette.pageBottom,
    '--theme-surface': palette.surface,
    '--theme-surface-strong': palette.surfaceStrong,
    '--theme-surface-muted': palette.surfaceMuted,
    '--theme-text-primary': palette.textPrimary,
    '--theme-text-secondary': palette.textSecondary,
    '--theme-text-tertiary': palette.textTertiary,
    '--theme-border': palette.border,
    '--theme-tag-bg': palette.tagBg,
    '--theme-glow': palette.glow,
    '--theme-shadow': `0 16rpx 48rpx ${palette.shadowColor}`,
    '--theme-shadow-soft': `0 8rpx 24rpx ${palette.shadowColor}`,
  } as Record<string, string>;
}

export function useTheme(themeKey: MaybeRefOrGetter<ThemeKey>): {
  palette: ComputedRef<ReturnType<typeof getThemePalette>>;
  cssVars: ComputedRef<Record<string, string>>;
} {
  const palette = computed(() => getThemePalette(normalizeThemeKey(toValue(themeKey))));
  const cssVars = computed(() => buildThemeCssVars(palette.value.key));

  return {
    palette,
    cssVars,
  };
}
