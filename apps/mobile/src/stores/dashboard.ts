import { defineStore } from 'pinia';
import { appEnv } from '../config/env';
import { http } from '../services/request';
import type {
  MobileDashboardPayload,
  MobileDashboardResponse,
} from '../types/dashboard';

const fallbackDashboard: MobileDashboardPayload = {
  headline: {
    title: '先用测评和资料，重新认识今天的自己',
    subtitle:
      '首页会优先参考情绪、性格和资料完整度来判断当前状态，不再只给一个抽象的幸运分。',
  },
  todayLuckyScore: {
    label: '当前状态指数',
    value: '78',
    hint: '更适合单线程推进，把注意力放回一件真正重要的事。',
  },
  annualLuckyScore: {
    label: '自我认知完成度',
    value: '54',
    hint: '补齐资料并完成性格、情绪两项短测后，首页判断会更稳定。',
  },
  todayLuckySign: {
    bizCode: 'sign-breeze-open',
    title: '今日幸运签',
    summary: '慢下来一点，答案会在下一次呼吸里浮现。',
    tag: '静观有得',
  },
  todayFortuneSummary:
    '这版首页会把情绪自检权重放得更高，再结合性格、资料完整度和轻量个性化标签来解释你当前的状态。',
  stateOverview: {
    title: '今天适合先稳住节奏，再推进重点',
    summary:
      '最近还没有足够多的测评依据时，首页会先给出保守判断，避免把玄学标签直接当成健康结论。',
    primarySuggestion: '先完成一件最重要的小事，再决定今天还要不要继续加码。',
    confidenceLabel: '依据中等：先补 1-2 项测评会更准',
    evidenceLabel: '当前主要基于基础资料和完成情况做估算。',
    disclaimer: '指数用于帮助你观察当前节奏与自我认知进度，不构成医学或心理诊断。',
    basisTags: ['状态观察中', '资料待补齐'],
    factors: [
      {
        id: 'emotion',
        label: '情绪稳定度',
        value: '68',
        hint: '还没有最近的情绪自检，建议先做一次 3 分钟短测。',
        tone: 'steady',
      },
      {
        id: 'personality',
        label: '节奏掌控度',
        value: '66',
        hint: '还没有最近的性格测评结果，完成后会更清楚你更适合怎样推进事情。',
        tone: 'steady',
      },
      {
        id: 'completion',
        label: '认知完善度',
        value: '54',
        hint: '还差补齐生日资料、完成情绪自检，首页判断会更完整。',
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
      label: '当前状态指数',
      value: '78',
      hint: '更适合单线程推进，把注意力放回一件真正重要的事。',
    },
    {
      label: '情绪稳定度',
      value: '68',
      hint: '最近还没有情绪自检，建议先做一次 3 分钟短测。',
    },
    {
      label: '自我认知完成度',
      value: '54',
      hint: '补齐资料并完成两项核心测评后，首页判断会更稳定。',
    },
    {
      label: '今日幸运签',
      value: '静观有得',
      hint: '慢下来一点，答案会在下一次呼吸里浮现。',
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
    secondaryActionTitle: '看看设置与说明',
    secondaryActionRoute: '/pages/settings/index',
    welcomeNote: '登录后会把历史、幸运推荐和会员状态都绑定到当前账号。',
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
        this.dashboard = {
          ...fallbackDashboard,
          ...response.data,
          stateOverview: response.data.stateOverview || fallbackDashboard.stateOverview,
        };
      } catch (error) {
        console.warn('load dashboard fallback', error);
        this.dashboard = fallbackDashboard;
      } finally {
        this.loading = false;
      }
    },
  },
});
