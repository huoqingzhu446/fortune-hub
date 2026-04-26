import type { ApiEnvelope } from './auth';

export interface FeedbackAttachment {
  fileId: string | null;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  relativePath: string;
}

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
  attachments: FeedbackAttachment[];
  slaDueAt: string | null;
  slaStatus: 'ok' | 'risk' | 'overdue' | 'done' | 'unset';
  slaHoursRemaining: number | null;
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
  attachments?: FeedbackAttachment[];
}

export interface SubscribeNotificationPayload {
  scene: string;
  templateIds: string[];
  extra?: Record<string, unknown>;
}

export type SettingsResponse = ApiEnvelope<SettingsData>;
export type FeedbackResponse = ApiEnvelope<{ item: FeedbackItem }>;
export type FeedbackAttachmentResponse = ApiEnvelope<{ item: FeedbackAttachment }>;
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
