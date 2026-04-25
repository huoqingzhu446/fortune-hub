import { http } from './http';

export type LifecycleStatus = 'draft' | 'published' | 'archived';

type ListResponse<T> = {
  code: number;
  message: string;
  data: {
    items: T[];
  };
  timestamp: string;
};

type DetailResponse<T> = {
  code: number;
  message: string;
  data: {
    item: T;
  };
  timestamp: string;
};

export interface FortuneContentItem {
  id: string;
  contentType: string;
  bizCode: string;
  publishDate: string | null;
  title: string;
  summary: string | null;
  status: LifecycleStatus;
  contentJson: Record<string, unknown>;
  publishedAt: string | null;
  archivedAt: string | null;
  updatedAt: string;
}

export interface LuckyItem {
  id: string;
  bizCode: string;
  title: string;
  summary: string | null;
  category: string;
  publishDate: string | null;
  sortOrder: number;
  status: LifecycleStatus;
  contentJson: Record<string, unknown>;
  publishedAt: string | null;
  archivedAt: string | null;
  updatedAt: string;
}

export interface ReportTemplateItem {
  id: string;
  templateType: string;
  bizCode: string;
  title: string;
  description: string | null;
  engine: string;
  sortOrder: number;
  status: LifecycleStatus;
  payloadJson: Record<string, unknown>;
  publishedAt: string | null;
  archivedAt: string | null;
  updatedAt: string;
}

export interface ConfigEntryItem {
  id: string;
  namespace: string;
  configKey: string;
  title: string;
  description: string | null;
  valueType: 'string' | 'number' | 'boolean' | 'json';
  valueJson: Record<string, unknown>;
  status: LifecycleStatus;
  publishedAt: string | null;
  archivedAt: string | null;
  updatedAt: string;
}

export interface UploadedAdminFile {
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  relativePath: string;
}

export interface SaveFortuneContentPayload {
  contentType: string;
  bizCode: string;
  publishDate?: string | null;
  title: string;
  summary?: string;
  status: LifecycleStatus;
  contentJson: Record<string, unknown>;
}

export interface SaveLuckyItemPayload {
  bizCode: string;
  title: string;
  summary?: string;
  category: string;
  publishDate?: string | null;
  sortOrder: number;
  status: LifecycleStatus;
  contentJson: Record<string, unknown>;
}

export interface SaveReportTemplatePayload {
  templateType: string;
  bizCode: string;
  title: string;
  description?: string;
  engine?: string;
  sortOrder: number;
  status: LifecycleStatus;
  payloadJson: Record<string, unknown>;
}

export interface SaveConfigEntryPayload {
  namespace: string;
  configKey: string;
  title: string;
  description?: string;
  valueType?: 'string' | 'number' | 'boolean' | 'json';
  status: LifecycleStatus;
  valueJson: Record<string, unknown>;
}

export async function fetchFortuneContents(params?: {
  contentType?: string;
  keyword?: string;
  status?: string;
}) {
  const { data } = await http.get<ListResponse<FortuneContentItem>>(
    '/admin/fortune-contents',
    {
      params,
    },
  );
  return data;
}

export async function createFortuneContent(payload: SaveFortuneContentPayload) {
  const { data } = await http.post<DetailResponse<FortuneContentItem>>(
    '/admin/fortune-contents',
    payload,
  );
  return data;
}

export async function updateFortuneContent(
  id: string,
  payload: SaveFortuneContentPayload,
) {
  const { data } = await http.put<DetailResponse<FortuneContentItem>>(
    `/admin/fortune-contents/${id}`,
    payload,
  );
  return data;
}

export async function updateFortuneContentStatus(
  id: string,
  status: LifecycleStatus,
) {
  const { data } = await http.post<DetailResponse<FortuneContentItem>>(
    `/admin/fortune-contents/${id}/status`,
    { status },
  );
  return data;
}

export async function deleteFortuneContent(id: string) {
  const { data } = await http.delete(`/admin/fortune-contents/${id}`);
  return data;
}

export async function fetchLuckyItems(params?: {
  keyword?: string;
  status?: string;
}) {
  const { data } = await http.get<ListResponse<LuckyItem>>('/admin/lucky-items', {
    params,
  });
  return data;
}

export async function createLuckyItem(payload: SaveLuckyItemPayload) {
  const { data } = await http.post<DetailResponse<LuckyItem>>(
    '/admin/lucky-items',
    payload,
  );
  return data;
}

export async function updateLuckyItem(id: string, payload: SaveLuckyItemPayload) {
  const { data } = await http.put<DetailResponse<LuckyItem>>(
    `/admin/lucky-items/${id}`,
    payload,
  );
  return data;
}

export async function updateLuckyItemStatus(id: string, status: LifecycleStatus) {
  const { data } = await http.post<DetailResponse<LuckyItem>>(
    `/admin/lucky-items/${id}/status`,
    { status },
  );
  return data;
}

export async function deleteLuckyItem(id: string) {
  const { data } = await http.delete(`/admin/lucky-items/${id}`);
  return data;
}

export async function fetchReportTemplates(params?: {
  templateType?: string;
  keyword?: string;
  status?: string;
}) {
  const { data } = await http.get<ListResponse<ReportTemplateItem>>(
    '/admin/report-templates',
    {
      params,
    },
  );
  return data;
}

export async function createReportTemplate(payload: SaveReportTemplatePayload) {
  const { data } = await http.post<DetailResponse<ReportTemplateItem>>(
    '/admin/report-templates',
    payload,
  );
  return data;
}

export async function updateReportTemplate(
  id: string,
  payload: SaveReportTemplatePayload,
) {
  const { data } = await http.put<DetailResponse<ReportTemplateItem>>(
    `/admin/report-templates/${id}`,
    payload,
  );
  return data;
}

export async function updateReportTemplateStatus(
  id: string,
  status: LifecycleStatus,
) {
  const { data } = await http.post<DetailResponse<ReportTemplateItem>>(
    `/admin/report-templates/${id}/status`,
    { status },
  );
  return data;
}

export async function deleteReportTemplate(id: string) {
  const { data } = await http.delete(`/admin/report-templates/${id}`);
  return data;
}

export async function fetchConfigEntries(params?: {
  namespace?: string;
  keyword?: string;
  status?: string;
}) {
  const { data } = await http.get<ListResponse<ConfigEntryItem>>('/admin/configs', {
    params,
  });
  return data;
}

export async function createConfigEntry(payload: SaveConfigEntryPayload) {
  const { data } = await http.post<DetailResponse<ConfigEntryItem>>(
    '/admin/configs',
    payload,
  );
  return data;
}

export async function updateConfigEntry(
  id: string,
  payload: SaveConfigEntryPayload,
) {
  const { data } = await http.put<DetailResponse<ConfigEntryItem>>(
    `/admin/configs/${id}`,
    payload,
  );
  return data;
}

export async function updateConfigEntryStatus(
  id: string,
  status: LifecycleStatus,
) {
  const { data } = await http.post<DetailResponse<ConfigEntryItem>>(
    `/admin/configs/${id}/status`,
    { status },
  );
  return data;
}

export async function deleteConfigEntry(id: string) {
  const { data } = await http.delete(`/admin/configs/${id}`);
  return data;
}

export async function uploadAdminAudio(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await http.post<DetailResponse<UploadedAdminFile>>(
    '/admin/uploads/audio',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000,
    },
  );

  return data;
}
