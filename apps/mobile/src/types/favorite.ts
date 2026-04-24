import type { ApiEnvelope } from './auth';

export interface FavoriteItem {
  id: string;
  itemType: string;
  itemKey: string;
  title: string;
  summary: string;
  icon: string;
  route: string;
  createdAt: string;
}

export interface FavoriteListData {
  items: FavoriteItem[];
}

export interface ToggleFavoritePayload {
  itemType: string;
  itemKey: string;
  title: string;
  summary?: string;
  icon?: string;
  route: string;
  extraJson?: Record<string, unknown>;
}

export interface ToggleFavoriteData {
  active: boolean;
  item: FavoriteItem;
}

export type FavoriteListResponse = ApiEnvelope<FavoriteListData>;
export type ToggleFavoriteResponse = ApiEnvelope<ToggleFavoriteData>;
