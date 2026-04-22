import { http } from './http';
import type { AdminDashboardResponse } from '../stores/dashboard';

export async function fetchAdminDashboard() {
  const { data } = await http.get<AdminDashboardResponse>('/dashboard/admin');
  return data;
}
