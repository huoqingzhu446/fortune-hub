import { computed, reactive, type Ref } from 'vue';
import {
  getAppSettings,
  getStoredDailyThemeKey,
  saveAppSettings,
  type AppSettings,
} from '../services/preferences';
import {
  buildThemeCssVars,
  normalizeThemeKey,
  resolveEffectiveTheme,
} from '../theme/useTheme';
import { getThemePalette } from '../theme/themes';
import {
  DEFAULT_THEME_KEY,
  type ThemeKey,
  type ThemeMode,
} from '../theme/tokens';

type DailyThemeSource = Ref<ThemeKey | '' | undefined> | ThemeKey | '' | undefined;

function readDailyThemeKey(source?: DailyThemeSource) {
  if (typeof source === 'string') {
    return source;
  }

  if (source && typeof source === 'object' && 'value' in source) {
    return source.value;
  }

  return '';
}

export function useThemePreference(dailyThemeSource?: DailyThemeSource) {
  const settings = reactive<AppSettings>(getAppSettings());

  const dailyThemeKey = computed<ThemeKey | ''>(() => {
    const input = readDailyThemeKey(dailyThemeSource);
    const candidate = input || getStoredDailyThemeKey();

    return candidate ? normalizeThemeKey(candidate) : '';
  });

  const resolvedTheme = computed(() =>
    resolveEffectiveTheme({
      themeMode: settings.themeMode,
      manualThemeKey: settings.manualThemeKey,
      dailyThemeKey: dailyThemeKey.value,
      fallbackThemeKey: DEFAULT_THEME_KEY,
    }),
  );

  const themePalette = computed(() => getThemePalette(resolvedTheme.value.effectiveThemeKey));
  const themeVars = computed(() => buildThemeCssVars(themePalette.value.key));

  function patchSettings(patch: Partial<AppSettings>) {
    const nextSettings: AppSettings = {
      ...settings,
      ...patch,
    };

    Object.assign(settings, nextSettings);
    saveAppSettings(nextSettings);
  }

  function setThemeMode(mode: ThemeMode) {
    if (mode === 'manual') {
      const nextManualTheme =
        settings.manualThemeKey ||
        resolvedTheme.value.dailyThemeKey ||
        DEFAULT_THEME_KEY;

      patchSettings({
        themeMode: 'manual',
        manualThemeKey: nextManualTheme,
      });
      return;
    }

    patchSettings({
      themeMode: 'auto',
    });
  }

  function setManualTheme(themeKey: ThemeKey) {
    patchSettings({
      themeMode: 'manual',
      manualThemeKey: themeKey,
    });
  }

  return {
    settings,
    dailyThemeKey,
    resolvedTheme,
    themePalette,
    themeVars,
    setThemeMode,
    setManualTheme,
    patchSettings,
  };
}
