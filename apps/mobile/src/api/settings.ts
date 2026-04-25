import { http } from '../services/request';
import type {
  FeedbackListResponse,
  FeedbackResponse,
  SettingsResponse,
  SubmitFeedbackPayload,
  UserConsentListResponse,
  UserConsentResponse,
} from '../types/settings';

export function fetchSettings() {
  return http.get<SettingsResponse>('/settings');
}

export function submitFeedback(payload: SubmitFeedbackPayload) {
  return http.post<FeedbackResponse, SubmitFeedbackPayload>('/feedback', payload);
}

export function fetchMyFeedback() {
  return http.get<FeedbackListResponse>('/feedback/my');
}

export function fetchMyConsents() {
  return http.get<UserConsentListResponse>('/me/consents');
}

export function agreeConsent(payload: {
  consentType: string;
  version: string;
  source?: string;
  clientInfo?: Record<string, unknown>;
}) {
  return http.post<UserConsentResponse, typeof payload>('/me/consents', payload);
}

export function revokeConsent(consentType: string) {
  return http.post<UserConsentResponse>(
    `/me/consents/${encodeURIComponent(consentType)}/revoke`,
  );
}
