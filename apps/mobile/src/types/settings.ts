import type { ApiEnvelope } from './auth';

export interface FeedbackItem {
  id: string;
  userId: string | null;
  message: string;
  contact: string | null;
  category: string;
  source: string;
  status: 'open' | 'processing' | 'resolved' | 'closed';
  adminNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SettingsData {
  isLoggedIn: boolean;
  userPreferences: Record<string, unknown> | null;
  settings: {
    privacyVersion: string;
    privacySummary: string;
    feedbackCategories: Array<{ label: string; value: string }>;
    notificationScenes: Array<{ scene: string; title: string; enabled: boolean }>;
  };
  compliance: Record<string, unknown>;
}

export interface SubmitFeedbackPayload {
  message: string;
  contact?: string;
  category?: string;
  source?: string;
  clientInfo?: Record<string, unknown>;
}

export interface SubscribeNotificationPayload {
  scene: string;
  templateIds: string[];
  extra?: Record<string, unknown>;
}

export type SettingsResponse = ApiEnvelope<SettingsData>;
export type FeedbackResponse = ApiEnvelope<{ item: FeedbackItem }>;
export type FeedbackListResponse = ApiEnvelope<{ items: FeedbackItem[] }>;
export type SubscribeNotificationResponse = ApiEnvelope<{
  items: Array<{
    id: string;
    scene: string;
    templateId: string;
    status: string;
    lastSubscribedAt: string;
    expireAt: string | null;
  }>;
}>;
