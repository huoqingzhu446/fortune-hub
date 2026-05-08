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
