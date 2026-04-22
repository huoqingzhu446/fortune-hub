import { http } from './http';

export interface FortuneContentItem {
  id: string;
  contentType: string;
  bizCode: string;
  publishDate: string | null;
  title: string;
  summary: string | null;
  status: 'draft' | 'published';
  contentJson: Record<string, unknown>;
  updatedAt: string;
}

interface FortuneContentListResponse {
  code: number;
  message: string;
  data: {
    items: FortuneContentItem[];
  };
  timestamp: string;
}

interface FortuneContentDetailResponse {
  code: number;
  message: string;
  data: {
    item: FortuneContentItem;
  };
  timestamp: string;
}

export interface SaveFortuneContentPayload {
  contentType: string;
  bizCode: string;
  publishDate?: string | null;
  title: string;
  summary?: string;
  status: 'draft' | 'published';
  contentJson: Record<string, unknown>;
}

export async function fetchFortuneContents(params?: {
  contentType?: string;
  keyword?: string;
}) {
  const { data } = await http.get<FortuneContentListResponse>('/admin/fortune-contents', {
    params,
  });
  return data;
}

export async function createFortuneContent(payload: SaveFortuneContentPayload) {
  const { data } = await http.post<FortuneContentDetailResponse>(
    '/admin/fortune-contents',
    payload,
  );
  return data;
}

export async function updateFortuneContent(id: string, payload: SaveFortuneContentPayload) {
  const { data } = await http.put<FortuneContentDetailResponse>(
    `/admin/fortune-contents/${id}`,
    payload,
  );
  return data;
}

export async function deleteFortuneContent(id: string) {
  const { data } = await http.delete(`/admin/fortune-contents/${id}`);
  return data;
}
