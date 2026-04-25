import { computed, reactive, ref, type Ref } from 'vue';
import { fetchPreferenceSettings, updatePreferenceSettings } from '../api/preferences';
import {
  getAppSettings,
  getStoredDailyThemeKey,
  saveAppSettings,
  type AppSettings,
} from '../services/preferences';
import { getAuthToken } from '../services/session';
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

const sharedSettings = reactive<AppSettings>(getAppSettings());
const serverSyncing = ref(false);
let hydratedToken = '';
let syncPromise: Promise<void> | null = null;

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
  const settings = sharedSettings;

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

  function applySettings(nextSettings: AppSettings) {
    Object.assign(settings, nextSettings);
    saveAppSettings(nextSettings);
  }

  function patchSettings(
    patch: Partial<AppSettings>,
    options?: {
      persist?: boolean;
    },
  ) {
    const nextSettings: AppSettings = {
      ...settings,
      ...patch,
    };

    applySettings(nextSettings);

    if (options?.persist === false || !getAuthToken()) {
      return;
    }

    void updatePreferenceSettings(patch)
      .then((response) => {
        applySettings(response.data.settings);
      })
      .catch((error) => {
        console.warn('sync preference settings failed', error);
      });
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

  async function syncSettingsFromServer(force = false) {
    const token = getAuthToken();

    if (!token) {
      hydratedToken = '';
      return;
    }

    if (!force && hydratedToken === token) {
      return syncPromise ?? Promise.resolve();
    }

    serverSyncing.value = true;
    syncPromise = fetchPreferenceSettings()
      .then((response) => {
        applySettings(response.data.settings);
        hydratedToken = token;
      })
      .catch((error) => {
        console.warn('load preference settings failed', error);
      })
      .finally(() => {
        serverSyncing.value = false;
      });

    return syncPromise;
  }

  void syncSettingsFromServer();

  return {
    settings,
    dailyThemeKey,
    resolvedTheme,
    themePalette,
    themeVars,
    setThemeMode,
    setManualTheme,
    patchSettings,
    serverSyncing,
    syncSettingsFromServer,
  };
}
