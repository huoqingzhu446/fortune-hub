import { http } from '../services/request';
import type { ApiEnvelope } from '../types/auth';
import type {
  AppSettings,
  PreferenceSettingsResponseData,
} from '../services/preferences';

export function fetchPreferenceSettings() {
  return http.get<ApiEnvelope<PreferenceSettingsResponseData>>('/me/preferences');
}

export function updatePreferenceSettings(payload: Partial<AppSettings>) {
  return http.put<ApiEnvelope<PreferenceSettingsResponseData>, Partial<AppSettings>>(
    '/me/preferences',
    payload,
  );
}
