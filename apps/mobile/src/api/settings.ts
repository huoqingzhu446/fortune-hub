import { http } from '../services/request';
import { appEnv } from '../config/env';
import { getAuthToken } from '../services/session';
import type {
  FeedbackAttachmentResponse,
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

export function uploadFeedbackAttachment(filePath: string) {
  const token = getAuthToken();

  return new Promise<FeedbackAttachmentResponse>((resolve, reject) => {
    uni.uploadFile({
      url: `${appEnv.apiBaseUrl.replace(/\/$/, '')}/feedback/attachments`,
      filePath,
      name: 'file',
      header: token ? { Authorization: `Bearer ${token}` } : undefined,
      success: (response) => {
        const statusCode = response.statusCode ?? 0;
        const payload = parseUploadResponse(response.data);

        if (statusCode >= 200 && statusCode < 300 && payload) {
          resolve(payload);
          return;
        }

        reject({
          statusCode,
          message: payload?.message || '附件上传失败，请稍后再试',
          raw: response.data,
        });
      },
      fail: (error) => {
        reject({
          statusCode: 0,
          message: (error as { errMsg?: string }).errMsg || '附件上传失败，请稍后再试',
          raw: error,
        });
      },
    });
  });
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

function parseUploadResponse(value: unknown) {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as FeedbackAttachmentResponse & { message?: string };
    } catch {
      return null;
    }
  }

  return value as (FeedbackAttachmentResponse & { message?: string }) | null;
}
