import { http } from './http';

interface ListResponse<T> {
  code: number;
  message: string;
  data: {
    items: T[];
  };
  timestamp: string;
}

interface DetailResponse<T> {
  code: number;
  message: string;
  data: {
    item: T;
  };
  timestamp: string;
}

export interface AdminUserItem {
  id: string;
  openid: string;
  nickname: string | null;
  zodiac: string | null;
  vipStatus: string;
  vipExpiredAt: string | null;
  lastLoginAt: string | null;
  updatedAt: string;
}

export interface AdminUserDetailData {
  user: AdminUserItem;
  orders: AdminOrderItem[];
  records: Array<{
    id: string;
    recordType: string;
    sourceCode: string;
    resultTitle: string;
    resultLevel: string | null;
    score: string | null;
    isFullReportUnlocked: boolean;
    unlockType: string | null;
    createdAt: string;
  }>;
}

export interface AdminOrderItem {
  id: string;
  userId: string;
  orderNo: string;
  productTitle: string;
  amountLabel: string;
  status: string;
  transactionNo: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface AdminFeedbackItem {
  id: string;
  userId: string | null;
  message: string;
  contact: string | null;
  category: string;
  status: string;
  priority: string;
  assignee: string | null;
  adminNote: string | null;
  adminReply: string | null;
  repliedAt: string | null;
  createdAt: string;
}

export interface AdminAuditLogItem {
  id: string;
  actorType: string;
  actorId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  createdAt: string;
}

export interface AdminAdUnlockItem {
  id: string;
  userId: string;
  recordType: string;
  resultTitle: string;
  unlockedAt: string;
}

export interface AdminNotificationLogItem {
  id: string;
  userId: string;
  scene: string;
  status: string;
  retryCount: number;
  errorMessage: string | null;
  sentAt: string | null;
  createdAt: string;
}

export interface ZhipuImageStatus {
  configured: boolean;
  modelEnv: string;
  timeoutEnv: string;
  fetchTimeoutEnv: string;
}

export function fetchAdminUsers(params?: {
  keyword?: string;
  vipStatus?: string;
}) {
  return http.get<ListResponse<AdminUserItem>>('/admin/ops/users', { params }).then((r) => r.data);
}

export function fetchAdminUserDetail(id: string) {
  return http
    .get<{
      code: number;
      message: string;
      data: AdminUserDetailData;
      timestamp: string;
    }>(`/admin/ops/users/${id}`)
    .then((r) => r.data);
}

export function updateAdminUserMembership(
  id: string,
  payload: {
    vipStatus: string;
    vipExpiredAt?: string | null;
  },
) {
  return http
    .put<DetailResponse<AdminUserItem>>(`/admin/ops/users/${id}/membership`, payload)
    .then((r) => r.data);
}

export function fetchAdminOrders(params?: {
  keyword?: string;
  status?: string;
}) {
  return http.get<ListResponse<AdminOrderItem>>('/admin/ops/orders', { params }).then((r) => r.data);
}

export function fetchAdminFeedback(params?: {
  keyword?: string;
  status?: string;
}) {
  return http.get<ListResponse<AdminFeedbackItem>>('/admin/feedback', { params }).then((r) => r.data);
}

export function updateAdminFeedbackStatus(
  id: string,
  payload: {
    status: string;
    adminNote?: string;
    adminReply?: string;
    assignee?: string;
    priority?: string;
  },
) {
  return http
    .put<DetailResponse<AdminFeedbackItem>>(`/admin/feedback/${id}/status`, payload)
    .then((r) => r.data);
}

export function fetchAdminAuditLogs() {
  return http.get<ListResponse<AdminAuditLogItem>>('/admin/ops/audit-logs').then((r) => r.data);
}

export function fetchAdminAdUnlocks() {
  return http.get<ListResponse<AdminAdUnlockItem>>('/admin/ops/ad-unlocks').then((r) => r.data);
}

export function fetchAdminNotificationLogs() {
  return http
    .get<ListResponse<AdminNotificationLogItem>>('/admin/ops/notification-logs')
    .then((r) => r.data);
}

export function fetchZhipuImageStatus() {
  return http
    .get<{
      code: number;
      message: string;
      data: ZhipuImageStatus;
      timestamp: string;
    }>('/admin/ops/zhipu-image/status')
    .then((r) => r.data);
}

export function testZhipuImage(prompt?: string) {
  return http
    .post<{
      code: number;
      message: string;
      data: {
        item: {
          provider: string;
          model: string;
          status: string;
          requestId: string | null;
          providerImageUrl: string | null;
          imageDataUrl: string;
        };
      };
      timestamp: string;
    }>('/admin/ops/zhipu-image/test', { prompt })
    .then((r) => r.data);
}
