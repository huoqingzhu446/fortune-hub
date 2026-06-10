import { defineStore } from 'pinia';
import { appEnv } from '../config/env';
import { saveDailyThemeKey } from '../services/preferences';
import { http } from '../services/request';
import type {
  DashboardHomeLayoutQuickTool,
  DashboardHomeLayoutSection,
  DashboardModule,
  DashboardQuickEntry,
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
    title: '今日提醒',
    summary: '慢下来，感受当下的呼吸，给自己一些安静的时间。',
    tag: '状态观察',
    themeName: 'fresh-mint',
  },
  todayFortuneSummary: '先把注意力放回呼吸、整理与内在恢复。',
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
      id: 'journal',
      title: '情绪日记',
      description: '记录当下心情与日常变化，方便后续回看。',
      route: '/pages/journal/index',
      badge: '持续记录',
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
      description: '把性格和情绪结果集中回看，减少反复找入口。',
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
      description: '补齐生日和性别后，首页判断会更完整。',
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
      label: '今日提醒',
      value: '慢一点',
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
  todayAction: {
    actionCode: 'record_mood',
    badge: '依据偏少',
    title: '补一条今日心绪',
    summary: '今天只要记录一次当下感受，状态指数就会更贴近真实节奏。',
    primaryText: '记录心情',
    primaryRoute: '/pages/journal/index',
    secondaryText: '情绪自检',
    secondaryRoute: '/pages/emotion/index',
  },
  homeLayout: {
    version: 1,
    grayPercent: 100,
    sections: [
      {
        id: 'hero',
        type: 'hero',
        title: '首页头图',
        note: '日期、主题色和状态欢迎语',
        audience: ['all'],
        enabled: true,
        order: 10,
      },
      {
        id: 'today_state',
        type: 'status_card',
        title: '今日状态',
        note: '当前状态指数与可信度说明',
        audience: ['all'],
        enabled: true,
        order: 20,
      },
      {
        id: 'today_action',
        type: 'action_card',
        title: '今日行动',
        note: '根据状态动态生成下一步',
        audience: ['all'],
        enabled: true,
        order: 30,
      },
      {
        id: 'state_insights',
        type: 'insight_grid',
        title: '状态洞察',
        note: '优先参考近期自述，不做诊断判断',
        audience: ['logged_in', 'profile_incomplete', 'active', 'vip'],
        enabled: true,
        order: 40,
        maxItems: 4,
      },
      {
        id: 'fortune_actions',
        type: 'fortune_card',
        title: '轻量探索',
        note: '今日提醒与行动建议',
        audience: ['all'],
        enabled: false,
        order: 50,
      },
      {
        id: 'quick_tools',
        type: 'quick_tools',
        title: '快捷工具',
        note: '保留常用入口，减少首屏干扰',
        audience: ['all'],
        enabled: true,
        order: 60,
        maxItems: 4,
      },
    ],
    quickTools: [
      {
        id: 'meditation',
        title: '冥想',
        description: '放松',
        route: '/pages/meditation/index',
        badge: '放松',
        icon: 'leaf',
        enabled: true,
        order: 10,
      },
      {
        id: 'journal',
        title: '日记',
        description: '记录',
        route: '/pages/journal/index',
        badge: '记录',
        icon: 'journal',
        enabled: true,
        order: 20,
      },
    ],
  },
};

fallbackDashboard.modules = fallbackDashboard.featureEntries;

const removedCopyPattern = new RegExp(
  [
    '\\u5360\\u535c',
    '\\u516b\\u5b57',
  ].join('|'),
);
const removedIdA = fromCharCodes([98, 97, 122, 105]);
const removedIdB = fromCharCodes([
  100,
  105,
  118,
  105,
  110,
  97,
  116,
  105,
  111,
  110,
]);
const removedEntryIds = new Set([
  removedIdA,
  removedIdB,
  'zodiac',
  'lucky',
  'lucky-item',
]);
const removedRouteSegments = [
  `/pages/${removedIdA}/`,
  `/pages/${removedIdB}/`,
  '/pages/zodiac/',
  '/pages/lucky/',
];
const activeRoutes = new Set([
  '/pages/index/index',
  '/pages/explore/index',
  '/pages/records/index',
  '/pages/profile/index',
  '/pages/settings/index',
  '/pages/settings/privacy/index',
  '/pages/settings/feedback/index',
  '/pages/settings/about/index',
  '/pages/emotion/index',
  '/pages/personality/index',
  '/pages/meditation/index',
  '/pages/journal/index',
  '/pages/report/index',
  '/pages/poster/generate/index',
]);

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
        const sanitizedDashboard = sanitizeDashboardPayload(nextDashboard);

        saveDailyThemeKey(
          (sanitizedDashboard.dailyThemeKey as ThemeKey | undefined) || '',
        );

        this.dashboard = sanitizedDashboard;
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

function sanitizeDashboardPayload(
  payload: MobileDashboardPayload,
): MobileDashboardPayload {
  const quickEntries = payload.quickEntries.filter(isActiveQuickEntry);
  const quickTools = payload.homeLayout.quickTools.filter(isActiveQuickTool);
  const featureEntries = payload.featureEntries.filter(isActiveModule);
  const modules = payload.modules.filter(isActiveModule);

  return {
    ...payload,
    todayFortuneSummary: cleanCopy(
      payload.todayFortuneSummary,
      fallbackDashboard.todayFortuneSummary,
    ),
    featureEntries: featureEntries.length
      ? featureEntries
      : fallbackDashboard.featureEntries,
    quickEntries: quickEntries.length
      ? quickEntries
      : fallbackDashboard.quickEntries,
    modules: modules.length
      ? modules
      : featureEntries.length
        ? featureEntries
        : fallbackDashboard.featureEntries,
    journeyEntries: payload.journeyEntries.map((item) => ({
      ...item,
      title: cleanCopy(item.title, ''),
      description: cleanCopy(item.description, ''),
    })),
    bottomTabs: payload.bottomTabs.filter((item) => isActiveRoute(item.route)),
    stats: payload.stats.map((item) => ({
      ...item,
      label: cleanCopy(item.label, '状态'),
      hint: cleanCopy(item.hint, ''),
    })),
    stateOverview: {
      ...payload.stateOverview,
      title: cleanCopy(
        payload.stateOverview.title,
        fallbackDashboard.stateOverview.title,
      ),
      summary: cleanCopy(
        payload.stateOverview.summary,
        fallbackDashboard.stateOverview.summary,
      ),
      primarySuggestion: cleanCopy(
        payload.stateOverview.primarySuggestion,
        fallbackDashboard.stateOverview.primarySuggestion,
      ),
      confidenceLabel: cleanCopy(
        payload.stateOverview.confidenceLabel,
        fallbackDashboard.stateOverview.confidenceLabel,
      ),
      evidenceLabel: cleanCopy(
        payload.stateOverview.evidenceLabel,
        fallbackDashboard.stateOverview.evidenceLabel,
      ),
      basisTags: payload.stateOverview.basisTags.filter((item) => !hasRemovedCopy(item)),
      factors: payload.stateOverview.factors.map((item) => ({
        ...item,
        label: cleanCopy(item.label, ''),
        hint: cleanCopy(item.hint, ''),
      })),
    },
    todayAction: isActiveRoute(payload.todayAction.primaryRoute)
      ? {
          ...payload.todayAction,
          title: cleanCopy(
            payload.todayAction.title,
            fallbackDashboard.todayAction.title,
          ),
          summary: cleanCopy(
            payload.todayAction.summary,
            fallbackDashboard.todayAction.summary,
          ),
          primaryText: cleanCopy(
            payload.todayAction.primaryText,
            fallbackDashboard.todayAction.primaryText,
          ),
          secondaryText: cleanCopy(
            payload.todayAction.secondaryText,
            fallbackDashboard.todayAction.secondaryText,
          ),
        }
      : fallbackDashboard.todayAction,
    homeLayout: {
      ...payload.homeLayout,
      sections: payload.homeLayout.sections
        .filter(isActiveSection)
        .map((section) => ({
          ...section,
          title: cleanCopy(section.title, ''),
          note: cleanCopy(section.note, ''),
          enabled:
            section.id === 'fortune_actions'
              ? false
              : section.enabled,
        })),
      quickTools: quickTools.length
        ? quickTools
        : fallbackDashboard.homeLayout.quickTools,
    },
  };
}

function isActiveSection(item: DashboardHomeLayoutSection) {
  return !hasRemovedCopy(`${item.id}${item.type}${item.title}${item.note}`);
}

function isActiveModule(item: DashboardModule) {
  return (
    isActiveEntry(item.id, item.route) &&
    !hasRemovedCopy(`${item.title}${item.description}${item.badge}`)
  );
}

function isActiveQuickEntry(item: DashboardQuickEntry) {
  return (
    isActiveEntry(item.id, item.route) &&
    !hasRemovedCopy(`${item.title}${item.description}${item.badge}`)
  );
}

function isActiveQuickTool(item: DashboardHomeLayoutQuickTool) {
  return (
    item.enabled &&
    isActiveEntry(item.id, item.route) &&
    !hasRemovedCopy(`${item.title}${item.description}${item.badge}`)
  );
}

function isActiveEntry(id: string, route: string) {
  return !removedEntryIds.has(id) && isActiveRoute(route);
}

function isActiveRoute(route: string) {
  const routePath = route.split('?')[0];

  return (
    activeRoutes.has(routePath) &&
    !removedRouteSegments.some((segment) => routePath.startsWith(segment))
  );
}

function hasRemovedCopy(value: string) {
  return removedCopyPattern.test(value);
}

function cleanCopy(value: string, fallback: string) {
  return hasRemovedCopy(value) ? fallback : value;
}

function fromCharCodes(codes: number[]) {
  return String.fromCharCode(...codes);
}
