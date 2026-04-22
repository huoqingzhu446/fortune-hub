import { http } from './http';

export interface MembershipProductItem {
  code: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  priceFen: number;
  durationDays: number;
  benefits: string[];
  sortOrder: number;
  status: 'draft' | 'published';
}

export interface AdConfigItem {
  id: string;
  slotCode: string;
  title: string;
  placement: string;
  rewardType: string;
  rewardDescription: string | null;
  enabled: boolean;
  configJson: Record<string, unknown>;
  updatedAt: string;
}

interface MembershipProductsResponse {
  code: number;
  message: string;
  data: {
    items: MembershipProductItem[];
  };
  timestamp: string;
}

interface MembershipProductResponse {
  code: number;
  message: string;
  data: {
    item: MembershipProductItem;
  };
  timestamp: string;
}

interface AdConfigsResponse {
  code: number;
  message: string;
  data: {
    items: AdConfigItem[];
  };
  timestamp: string;
}

interface AdConfigResponse {
  code: number;
  message: string;
  data: {
    item: AdConfigItem;
  };
  timestamp: string;
}

export interface SaveMembershipProductPayload {
  code: string;
  title: string;
  subtitle?: string;
  description?: string;
  priceFen: number;
  durationDays: number;
  benefits: string[];
  sortOrder: number;
  status: 'draft' | 'published';
}

export interface SaveAdConfigPayload {
  slotCode: string;
  title: string;
  placement: string;
  rewardType: string;
  rewardDescription?: string;
  enabled: boolean;
  configJson?: Record<string, unknown>;
}

export async function fetchMembershipProducts() {
  const { data } = await http.get<MembershipProductsResponse>('/admin/membership-products');
  return data;
}

export async function createMembershipProduct(payload: SaveMembershipProductPayload) {
  const { data } = await http.post<MembershipProductResponse>(
    '/admin/membership-products',
    payload,
  );
  return data;
}

export async function updateMembershipProduct(
  code: string,
  payload: SaveMembershipProductPayload,
) {
  const { data } = await http.put<MembershipProductResponse>(
    `/admin/membership-products/${code}`,
    payload,
  );
  return data;
}

export async function fetchAdConfigs() {
  const { data } = await http.get<AdConfigsResponse>('/admin/ad-configs');
  return data;
}

export async function updateAdConfig(id: string, payload: SaveAdConfigPayload) {
  const { data } = await http.put<AdConfigResponse>(`/admin/ad-configs/${id}`, payload);
  return data;
}
