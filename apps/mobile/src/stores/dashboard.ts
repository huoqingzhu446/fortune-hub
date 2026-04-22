import { defineStore } from 'pinia';
import { appEnv } from '../config/env';
import { http } from '../services/request';
import type {
  MobileDashboardPayload,
  MobileDashboardResponse,
} from '../types/dashboard';

const fallbackDashboard: MobileDashboardPayload = {
  headline: {
    title: '今天的好运正在刷新中',
    subtitle:
      '先把生日资料、幸运指数、功能入口和上传链路跑顺，再继续接八字与测评闭环。',
  },
  todayLuckyScore: {
    label: '今日幸运指数',
    value: '86',
    hint: '适合先完成一件最重要的小目标。',
  },
  annualLuckyScore: {
    label: '年度幸运指数',
    value: '92',
    hint: '适合持续建设长期表达与作品。',
  },
  todayLuckySign: {
    title: '今日幸运签',
    summary: '慢下来一点，答案会在下一次呼吸里浮现。',
    tag: '静观有得',
  },
  todayFortuneSummary:
    '运势整体平稳，适合先完成手头事务，再安排一次轻量社交或自我奖励。',
  featureEntries: [
    {
      id: 'zodiac',
      title: '星座运势',
      description: '查看今日、本周、年度运势与幸运提示。',
      route: '/pages/zodiac/index',
      badge: '主入口',
    },
    {
      id: 'bazi',
      title: '八字解读',
      description: '录入生日与时辰，生成简易排盘与五行解读。',
      route: '/pages/bazi/index',
      badge: '待完善',
    },
    {
      id: 'personality',
      title: '性格测评',
      description: '完成答题后生成精简报告与分享卡片。',
      route: '/pages/personality/index',
      badge: '长期留存',
    },
    {
      id: 'emotion',
      title: '情绪自检',
      description: '简化量表 + 风险提示 + 放松建议。',
      route: '/pages/emotion/index',
      badge: '合规重点',
    },
    {
      id: 'lucky-item',
      title: '幸运物',
      description: '结合幸运指数推荐每日幸运物与壁纸主题。',
      route: '/pages/lucky/index',
      badge: '内容化',
    },
  ],
  bottomTabs: [
    {
      id: 'home',
      label: '首页',
      route: '/pages/index/index',
      iconText: 'H',
      active: true,
    },
    {
      id: 'tests',
      label: '测评',
      route: '/pages/personality/index',
      iconText: 'T',
      active: false,
    },
    {
      id: 'lucky',
      label: '幸运物',
      route: '/pages/lucky/index',
      iconText: 'L',
      active: false,
    },
    {
      id: 'me',
      label: '我的',
      route: '/pages/profile/index',
      iconText: 'M',
      active: false,
    },
  ],
  stats: [
    {
      label: '今日幸运指数',
      value: '86',
      hint: '推荐先完成一件最重要的小目标。',
    },
    {
      label: '年度幸运指数',
      value: '92',
      hint: '适合持续建设长期表达与作品。',
    },
    {
      label: '今日幸运签',
      value: '静观有得',
      hint: '慢下来一点，答案会在下一次呼吸里浮现。',
    },
    {
      label: '功能入口',
      value: '5',
      hint: '星座、八字、测评、情绪、幸运物将逐步完善。',
    },
  ],
  modules: [],
  integrations: {
    apiBaseUrl: appEnv.apiBaseUrl,
    fileServiceBaseUrl: appEnv.fileServiceBaseUrl,
    redisStatus: '等待 API 返回',
  },
  userSummary: {
    profileCompleted: false,
    vipStatus: 'inactive',
  },
};

fallbackDashboard.modules = fallbackDashboard.featureEntries;

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    loading: false,
    dashboard: fallbackDashboard,
  }),
  actions: {
    async loadDashboard() {
      this.loading = true;

      try {
        const response = await http.get<MobileDashboardResponse>(
          '/home/index',
        );
        this.dashboard = response.data;
      } catch (error) {
        console.warn('load dashboard fallback', error);
        this.dashboard = fallbackDashboard;
      } finally {
        this.loading = false;
      }
    },
  },
});
