import type { ThemeKey, ThemeMode } from '../theme/tokens';

export interface AppSettings {
  dailyReminderEnabled: boolean;
  luckyPushEnabled: boolean;
  quietModeEnabled: boolean;
  saveHistoryCardsEnabled: boolean;
  themeMode: ThemeMode;
  manualThemeKey: ThemeKey | '';
}

export interface FeedbackEntry {
  id: string;
  message: string;
  contact: string;
  createdAt: string;
}

export interface PreferenceSettingsResponseData {
  settings: AppSettings;
}

const APP_SETTINGS_KEY = 'fortune-hub-app-settings';
const FEEDBACK_HISTORY_KEY = 'fortune-hub-feedback-history';
const DAILY_THEME_KEY = 'fortune-hub-daily-theme-key';

const DEFAULT_SETTINGS: AppSettings = {
  dailyReminderEnabled: true,
  luckyPushEnabled: true,
  quietModeEnabled: false,
  saveHistoryCardsEnabled: true,
  themeMode: 'auto',
  manualThemeKey: '',
};

export function getAppSettings() {
  const stored = (uni.getStorageSync(APP_SETTINGS_KEY) as Partial<AppSettings> | null) ?? null;

  return {
    ...DEFAULT_SETTINGS,
    ...(stored || {}),
  } satisfies AppSettings;
}

export function saveAppSettings(settings: AppSettings) {
  uni.setStorageSync(APP_SETTINGS_KEY, settings);
}

export function getStoredDailyThemeKey() {
  return (uni.getStorageSync(DAILY_THEME_KEY) as ThemeKey | '' | null) ?? '';
}

export function saveDailyThemeKey(themeKey: ThemeKey | '') {
  uni.setStorageSync(DAILY_THEME_KEY, themeKey);
}

export function getFeedbackHistory() {
  return (uni.getStorageSync(FEEDBACK_HISTORY_KEY) as FeedbackEntry[] | null) ?? [];
}

export function appendFeedbackEntry(entry: Omit<FeedbackEntry, 'id' | 'createdAt'>) {
  const nextItem: FeedbackEntry = {
    id: `feedback-${Date.now()}`,
    createdAt: new Date().toISOString(),
    message: entry.message,
    contact: entry.contact,
  };
  const history = getFeedbackHistory();
  const nextHistory = [nextItem, ...history].slice(0, 10);
  uni.setStorageSync(FEEDBACK_HISTORY_KEY, nextHistory);
  return nextItem;
}
