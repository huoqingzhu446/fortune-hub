import { http } from './http';

export interface AdminDashboardData {
  totals: {
    users: number;
    orders: number;
    openFeedback: number;
    shareRecords: number;
    vipUsers: number;
  };
  today: {
    newUsers: number;
    newOrders: number;
  };
  revenue: {
    totalFen: number;
    totalYuan: number;
    thisMonthFen: number;
    thisMonthYuan: number;
    paidOrderCount: number;
  };
  charts: {
    userGrowth: { date: string; count: number }[];
    orderTrend: { date: string; count: number }[];
    recentUsers: number;
  };
  recentOrders: {
    orderNo: string;
    amountFen: number;
    amountYuan: number;
    createdAt: string;
  }[];
}

export interface AdminDashboardResponse {
  code: number;
  message: string;
  data: AdminDashboardData;
  timestamp: string;
}

export async function fetchAdminDashboard() {
  const { data } = await http.get<AdminDashboardResponse>('/admin/dashboard');
  return data.data;
}
