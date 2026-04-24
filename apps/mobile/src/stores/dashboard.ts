import { defineStore } from 'pinia';
import { appEnv } from '../config/env';
import { saveDailyThemeKey } from '../services/preferences';
import { http } from '../services/request';
import type {
  MobileDashboardPayload,
  MobileDashboardResponse,
} from '../types/dashboard';
import type { ThemeKey } from '../theme/tokens';

const fallbackDashboard: MobileDashboardPayload = {
  dailyThemeKey: 'mist_blue',
  headline: {
    title: '今日气运',
    subtitle: '身心和谐 · 顺势而为',
  },
  todayLuckyScore: {
    label: '综合气运指数',
    value: '86',
    hint: '保持平和与专注，温柔地对待自己。',
  },
  annualLuckyScore: {
    label: '心理健康分数',
    value: '68',
    hint: '略有压力，注意休息，适当放松并寻求支持。',
  },
  todayLuckySign: {
    bizCode: 'sign-breeze-open',
    title: '今日幸运签',
    summary: '慢下来，感受当下的呼吸，给自己一些安静的时间。',
    tag: '雾蓝色',
    themeName: 'fresh-mint',
  },
  todayFortuneSummary:
    '今天更适合把步调放缓，把注意力放回呼吸、整理与内在恢复。',
  stateOverview: {
    title: '状态平稳，适合自我疗愈与整理内心',
    summary: '保持平和与专注，温柔地对待自己。',
    primarySuggestion: '慢下来，感受当下的呼吸。',
    confidenceLabel: '中等依据',
    evidenceLabel: '情绪状态、资料完整度与轻量个性标签共同生成。',
    disclaimer: '内容仅作自我观察参考，不替代医疗或心理诊断。',
    basisTags: ['静心', '整理', '呼吸'],
    factors: [
      {
        id: 'emotion',
        label: '心情情绪评分',
        value: '82',
        hint: '情绪稳定，内心平和，保持呼吸与觉察会更顺畅。',
        tone: 'positive',
      },
      {
        id: 'mental',
        label: '心理健康',
        value: '68',
        hint: '略有压力，注意休息，适当放松并寻求支持。',
        tone: 'steady',
      },
      {
        id: 'bazi',
        label: '八字气运',
        value: '中上',
        hint: '五行平衡，运势稳中有升，宜静不宜动，守成待时。',
        tone: 'positive',
      },
      {
        id: 'zodiac',
        label: '星座运势',
        value: '4',
        hint: '机会会在细节中出现，相信直觉，勇敢向前。',
        tone: 'positive',
      },
    ],
  },
  featureEntries: [
    {
      id: 'personality',
      title: '性格测评',
      description: '识别你更自然的推进方式，帮助理解自己为什么会这样反应。',
      route: '/pages/personality/index',
      badge: '先做这个',
    },
    {
      id: 'emotion',
      title: '情绪自检',
      description: '用 3 分钟观察近一周的紧张或低落变化，优先看当前状态。',
      route: '/pages/emotion/index',
      badge: '当前状态',
    },
    {
      id: 'bazi',
      title: '八字解读',
      description: '把生日资料转成节奏参考，用来补充个性化表达和提示。',
      route: '/pages/bazi/index',
      badge: '个性化参考',
    },
    {
      id: 'zodiac',
      title: '星座运势',
      description: '把星座当作轻量标签，提供更容易阅读的节律化提示。',
      route: '/pages/zodiac/index',
      badge: '轻量标签',
    },
    {
      id: 'lucky-item',
      title: '幸运物',
      description: '把当前状态翻译成更轻松的内容化表达、分享图和日常提醒。',
      route: '/pages/lucky/index',
      badge: '内容化',
    },
  ],
  quickEntries: [
    {
      id: 'profile',
      title: '先去登录',
      description: '从个人中心发起登录，后续历史和状态变化都会绑定到账号。',
      route: '/pages/profile/index',
      badge: '立即开始',
    },
    {
      id: 'records',
      title: '查看历史',
      description: '把八字、性格和情绪结果集中回看，减少反复找入口。',
      route: '/pages/records/index',
      badge: '回看结果',
    },
    {
      id: 'settings',
      title: '设置中心',
      description: '统一管理提醒偏好、隐私说明、反馈和关于我们。',
      route: '/pages/settings/index',
      badge: '基础配置',
    },
    {
      id: 'membership',
      title: '会员权益',
      description: '查看 VIP 权益、套餐和当前订单状态。',
      route: '/pages/membership/index',
      badge: '权益说明',
    },
  ],
  journeyEntries: [
    {
      id: 'login',
      title: '登录账号',
      description: '先从个人中心发起登录，避免结果只停留在当前设备。',
      completed: false,
    },
    {
      id: 'profile',
      title: '完善资料',
      description: '补齐生日、出生时间和性别后，首页和幸运体系会更完整。',
      completed: false,
    },
    {
      id: 'assessment',
      title: '建立状态基线',
      description: '先做性格和情绪两项短测，首页分数才会开始更有依据。',
      completed: false,
    },
  ],
  bottomTabs: [
    {
      id: 'home',
      label: '首页',
      route: '/pages/index/index',
      iconText: '今',
      active: true,
    },
    {
      id: 'explore',
      label: '探索',
      route: '/pages/explore/index',
      iconText: '探',
      active: false,
    },
    {
      id: 'record',
      label: '记录',
      route: '/pages/records/index',
      iconText: '记',
      active: false,
    },
    {
      id: 'mine',
      label: '我的',
      route: '/pages/profile/index',
      iconText: '我',
      active: false,
    },
  ],
  stats: [
    {
      label: '综合气运指数',
      value: '86',
      hint: '状态平稳，适合自我疗愈与整理内心。',
    },
    {
      label: '心情情绪评分',
      value: '82',
      hint: '情绪稳定，内心平和，保持呼吸与觉察会更顺畅。',
    },
    {
      label: '心理健康分数',
      value: '68',
      hint: '略有压力，注意休息，适当放松并寻求支持。',
    },
    {
      label: '今日幸运签',
      value: '雾蓝色',
      hint: '慢下来，感受当下的呼吸，给自己一些安静的时间。',
    },
  ],
  modules: [],
  integrations: {
    apiBaseUrl: appEnv.apiBaseUrl,
    fileServiceBaseUrl: appEnv.fileServiceBaseUrl,
    redisStatus: '等待 API 返回',
  },
  userSummary: {
    isLoggedIn: true,
    nickname: '今日旅人',
    profileCompleted: true,
    vipStatus: 'inactive',
    primaryActionTitle: '开始冥想',
    primaryActionRoute: '/pages/meditation/index',
    secondaryActionTitle: '记录心情',
    secondaryActionRoute: '/pages/journal/index',
    welcomeNote: '保持平和与专注，把今日的感受和节奏慢慢沉淀下来。',
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

        const nextDashboard: MobileDashboardPayload = {
          ...fallbackDashboard,
          ...response.data,
          todayLuckySign: {
            ...fallbackDashboard.todayLuckySign,
            ...response.data.todayLuckySign,
          },
          stateOverview: response.data.stateOverview || fallbackDashboard.stateOverview,
        };

        saveDailyThemeKey((nextDashboard.dailyThemeKey as ThemeKey | undefined) || '');

        this.dashboard = nextDashboard;
      } catch (error) {
        console.warn('load dashboard fallback', error);
        saveDailyThemeKey((fallbackDashboard.dailyThemeKey as ThemeKey | undefined) || '');
        this.dashboard = fallbackDashboard;
      } finally {
        this.loading = false;
      }
    },
  },
});
