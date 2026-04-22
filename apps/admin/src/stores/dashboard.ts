import { defineStore } from 'pinia';
import { fetchAdminDashboard } from '../api/dashboard';

export interface AdminDashboardStat {
  label: string;
  value: string;
  hint: string;
}

export interface AdminDashboardModule {
  id: string;
  title: string;
  owner: string;
  status: string;
  summary: string;
}

export interface AdminDashboardResponse {
  headline: {
    title: string;
    subtitle: string;
  };
  stats: AdminDashboardStat[];
  modules: AdminDashboardModule[];
  integrations: {
    mysqlStatus: string;
    redisStatus: string;
    fileServiceBaseUrl: string;
  };
}

const fallbackDashboard: AdminDashboardResponse = {
  headline: {
    title: '控制台骨架已经就位',
    subtitle: '下一步可以从题库管理、幸运物内容库和测评报告模板开始填充后台能力。',
  },
  stats: [
    {
      label: '小程序端',
      value: 'uni-app',
      hint: '微信小程序优先',
    },
    {
      label: 'API',
      value: 'NestJS',
      hint: '预留 MySQL 与 Redis',
    },
    {
      label: '文件服务',
      value: '独立接入',
      hint: '复用外部上传中心',
    },
    {
      label: '部署方式',
      value: 'Compose',
      hint: 'Nginx + HTTPS',
    },
  ],
  modules: [
    {
      id: 'question-bank',
      title: '题库管理',
      owner: '运营后台',
      status: '待接入',
      summary: '星座、性格、情绪筛查都从这里配置题目和结果维度。',
    },
    {
      id: 'fortune-content',
      title: '运势内容中心',
      owner: '内容编辑',
      status: '待接入',
      summary: '今日幸运指数、年度幸运物、星座日签都在这里维护。',
    },
    {
      id: 'user-report',
      title: '报告中心',
      owner: '数据服务',
      status: '待接入',
      summary: '结果页模板、会员报告和分享海报统一在这里出图和追踪。',
    },
  ],
  integrations: {
    mysqlStatus: '等待 API 返回',
    redisStatus: '等待 API 返回',
    fileServiceBaseUrl:
      import.meta.env.VITE_FILE_SERVICE_BASE_URL || 'http://8.152.214.57:3000/api',
  },
};

export const useDashboardStore = defineStore('admin-dashboard', {
  state: () => ({
    loading: false,
    dashboard: fallbackDashboard,
  }),
  actions: {
    async load() {
      this.loading = true;

      try {
        this.dashboard = await fetchAdminDashboard();
      } catch (error) {
        console.warn('dashboard fallback', error);
        this.dashboard = fallbackDashboard;
      } finally {
        this.loading = false;
      }
    },
  },
});
