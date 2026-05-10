import { defineStore } from 'pinia';
import { fetchAdminDashboard, type AdminDashboardData } from '../api/dashboard';

const fallbackDashboard: AdminDashboardData = {
  totals: { users: 0, orders: 0, openFeedback: 0, shareRecords: 0, vipUsers: 0 },
  today: { newUsers: 0, newOrders: 0 },
  revenue: {
    totalFen: 0,
    totalYuan: 0,
    thisMonthFen: 0,
    thisMonthYuan: 0,
    paidOrderCount: 0,
  },
  charts: {
    userGrowth: [],
    orderTrend: [],
    recentUsers: 0,
  },
  recentOrders: [],
};

export const useDashboardStore = defineStore('admin-dashboard', {
  state: () => ({
    loading: false,
    dashboard: fallbackDashboard as AdminDashboardData,
  }),
  actions: {
    async load() {
      this.loading = true;
      try {
        this.dashboard = await fetchAdminDashboard();
      } catch {
        this.dashboard = fallbackDashboard;
      } finally {
        this.loading = false;
      }
    },
  },
});
