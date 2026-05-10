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

export interface AdminOrderItem {
  id: string;
  userId: string;
  orderNo: string;
  productCode: string;
  productTitle: string;
  amountFen: number;
  amountYuan: string;
  orderType: string;
  status: string;
  transactionNo: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface AdminOrderStats {
  totalOrders: number;
  paidOrders: number;
  totalRevenueFen: number;
  totalRevenueYuan: string;
  thisMonthRevenueFen: number;
  thisMonthRevenueYuan: string;
  conversionRate: string;
}

interface ListResponse<T> {
  code: number;
  message: string;
  data: { items: T[] };
  timestamp: string;
}

interface ItemResponse<T> {
  code: number;
  message: string;
  data: { item: T };
  timestamp: string;
}

interface OrderListResponse {
  code: number;
  message: string;
  data: { items: AdminOrderItem[]; total: number; page: number; pageSize: number };
  timestamp: string;
}

interface OrderStatsResponse {
  code: number;
  message: string;
  data: AdminOrderStats;
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

// ---- Products ----
export async function fetchMembershipProducts() {
  const { data } = await http.get<ListResponse<MembershipProductItem>>('/admin/membership-products');
  return data;
}

export async function createMembershipProduct(payload: SaveMembershipProductPayload) {
  const { data } = await http.post<ItemResponse<MembershipProductItem>>(
    '/admin/membership-products',
    payload,
  );
  return data;
}

export async function updateMembershipProduct(code: string, payload: SaveMembershipProductPayload) {
  const { data } = await http.put<ItemResponse<MembershipProductItem>>(
    `/admin/membership-products/${encodeURIComponent(code)}`,
    payload,
  );
  return data;
}

export async function deleteMembershipProduct(code: string) {
  const { data } = await http.delete(`/admin/membership-products/${encodeURIComponent(code)}`);
  return data;
}

export async function updateMembershipProductStatus(code: string, status: string) {
  const { data } = await http.post<ItemResponse<MembershipProductItem>>(
    `/admin/membership-products/${encodeURIComponent(code)}/status`,
    { status },
  );
  return data;
}

// ---- Orders ----
export async function fetchOrders(query: {
  page?: number;
  pageSize?: number;
  status?: string;
} = {}) {
  const { data } = await http.get<OrderListResponse>('/admin/orders', { params: query });
  return data;
}

export async function fetchOrderStats() {
  const { data } = await http.get<OrderStatsResponse>('/admin/orders/stats');
  return data;
}
