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
    title: '正在同步今日状态',
    subtitle: '先以保守分数展示，连接成功后会更新',
  },
  todayLuckyScore: {
    label: '当前状态指数',
    value: '60',
    hint: '缺少近期自述状态，分数先保持保守。',
  },
  annualLuckyScore: {
    label: '状态可信度',
    value: '20',
    hint: '等待同步今日心情、情绪自检和资料状态。',
  },
  todayLuckySign: {
    bizCode: 'sign-breeze-open',
    title: '今日幸运签',
    summary: '慢下来，感受当下的呼吸，给自己一些安静的时间。',
    tag: '雾蓝色',
    themeName: 'fresh-mint',
  },
  todayFortuneSummary: '等待同步前，先把注意力放回呼吸、整理与内在恢复。',
  stateOverview: {
    title: '先同步近期状态，再判断今天节奏',
    summary: '当前缺少近期自述状态，首页会先保持保守估算。',
    primarySuggestion: '先记录今日心情或完成一次情绪自检。',
    confidenceLabel: '依据偏少：等待同步',
    evidenceLabel: '当前缺少近期自述状态，只做保守估算。',
    disclaimer: '内容仅作自我观察参考，不替代医疗或心理诊断。',
    basisTags: ['状态观察中', '先记录心情', '慢一点推进'],
    factors: [
      {
        id: 'emotion',
        label: '当下情绪温度',
        value: '60',
        hint: '还没有今日心情或最近情绪自检，当前指数会保持保守估算。',
        tone: 'steady',
      },
      {
        id: 'personality',
        label: '节奏复原力',
        value: '58',
        hint: '还没有最近的性格测评结果，暂时不把长期性格当成当前状态依据。',
        tone: 'steady',
      },
      {
        id: 'completion',
        label: '状态可信度',
        value: '20',
        hint: '还差 记录今日心情、完成情绪自检，当前指数会更贴近真实状态。',
        tone: 'watch',
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
      description:
        '补齐生日、出生时间、出生地和性别后，首页和幸运体系会更完整。',
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
      label: '当前状态指数',
      value: '60',
      hint: '缺少近期自述状态，分数先保持保守。',
    },
    {
      label: '当下情绪温度',
      value: '60',
      hint: '等待今日心情或情绪自检同步。',
    },
    {
      label: '状态可信度',
      value: '20',
      hint: '等待 API 返回后更新。',
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
    isLoggedIn: false,
    nickname: null,
    profileCompleted: false,
    vipStatus: 'inactive',
    primaryActionTitle: '去个人中心登录',
    primaryActionRoute: '/pages/profile/index',
    secondaryActionTitle: '记录心情',
    secondaryActionRoute: '/pages/journal/index',
    welcomeNote: '等待同步后会把近期心情、测评和资料状态合并判断。',
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
        const response = await http.get<MobileDashboardResponse>('/home/index');

        const nextDashboard: MobileDashboardPayload = {
          ...fallbackDashboard,
          ...response.data,
          todayLuckySign: {
            ...fallbackDashboard.todayLuckySign,
            ...response.data.todayLuckySign,
          },
          stateOverview:
            response.data.stateOverview || fallbackDashboard.stateOverview,
        };

        saveDailyThemeKey(
          (nextDashboard.dailyThemeKey as ThemeKey | undefined) || '',
        );

        this.dashboard = nextDashboard;
      } catch (error) {
        console.warn('load dashboard fallback', error);
        saveDailyThemeKey(
          (fallbackDashboard.dailyThemeKey as ThemeKey | undefined) || '',
        );
        this.dashboard = fallbackDashboard;
      } finally {
        this.loading = false;
      }
    },
  },
});
