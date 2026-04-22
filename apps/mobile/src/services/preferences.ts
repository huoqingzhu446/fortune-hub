export interface AppSettings {
  dailyReminderEnabled: boolean;
  luckyPushEnabled: boolean;
  quietModeEnabled: boolean;
  saveHistoryCardsEnabled: boolean;
}

export interface FeedbackEntry {
  id: string;
  message: string;
  contact: string;
  createdAt: string;
}

const APP_SETTINGS_KEY = 'fortune-hub-app-settings';
const FEEDBACK_HISTORY_KEY = 'fortune-hub-feedback-history';

const DEFAULT_SETTINGS: AppSettings = {
  dailyReminderEnabled: true,
  luckyPushEnabled: true,
  quietModeEnabled: false,
  saveHistoryCardsEnabled: true,
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
