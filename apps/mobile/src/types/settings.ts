import type { ApiEnvelope } from './auth';

export interface FeedbackItem {
  id: string;
  userId: string | null;
  message: string;
  contact: string | null;
  category: string;
  source: string;
  status: 'open' | 'processing' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assignee: string | null;
  adminNote: string | null;
  adminReply: string | null;
  attachments: Array<Record<string, unknown>>;
  repliedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserConsentItem {
  id: string;
  userId: string;
  consentType: string;
  version: string;
  status: 'agreed' | 'revoked';
  source: string;
  agreedAt: string;
  revokedAt: string | null;
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
  consents: UserConsentItem[];
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
export type UserConsentResponse = ApiEnvelope<{ item: UserConsentItem }>;
export type UserConsentListResponse = ApiEnvelope<{ items: UserConsentItem[] }>;
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
