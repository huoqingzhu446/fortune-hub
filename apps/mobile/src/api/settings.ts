import { http } from '../services/request';
import type {
  FeedbackListResponse,
  FeedbackResponse,
  SettingsResponse,
  SubmitFeedbackPayload,
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
