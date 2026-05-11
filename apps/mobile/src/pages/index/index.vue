<template>
  <view class="page-shell" :style="themeVars">
    <view class="home-page">
      <view class="ambient ambient--paper"></view>
      <view class="ambient ambient--glow"></view>
      <view class="ambient ambient--mist-left"></view>
      <view class="ambient ambient--mist-right"></view>

      <template v-for="section in homeSections" :key="section.id">
        <HomeHero
          v-if="section.id === 'hero'"
          class="home-page__section home-page__section--hero home-page__hero"
          :title="pageTitle"
          :subtitle="pageSubtitle"
          :display-date="displayDate"
          :lunar-date="lunarDate"
          :theme-name="themePalette.name"
          :status-text="heroStatusText"
        />

        <view
          v-else-if="section.id === 'today_state'"
          class="home-page__section home-page__section--today-state home-page__main-card"
          :class="{ 'home-page__main-card--after-hero': isSectionAfter('today_state', 'hero') }"
        >
          <StatusIndexCard
            :label="fortuneCardLabel"
            :score="fortuneScore"
            :status="fortuneStatus"
            :title="fortuneTitle"
            :summary="fortuneSummary"
            :tags="fortuneTags"
            :evidence="stateOverview.evidenceLabel"
            :disclaimer="stateOverview.disclaimer"
            :primary-action-text="statusPrimaryAction.label"
            :secondary-action-text="statusSecondaryAction.label"
            @primary="handleRouteWithTracking(statusPrimaryAction.route, 'home_state_action_click', { actionType: 'primary' })"
            @secondary="handleRouteWithTracking(statusSecondaryAction.route, 'home_state_action_click', { actionType: 'secondary' })"
          />
        </view>

        <view
          v-else-if="section.id === 'today_action'"
          class="home-page__section home-page__section--today-action home-page__action"
        >
          <TodayActionCard
            :badge="todayAction.badge"
            :title="todayAction.title"
            :summary="todayAction.summary"
            :action-text="todayAction.actionText"
            :secondary-text="todayAction.secondaryText"
            @action="handleRouteWithTracking(todayAction.route, 'home_today_action_click', { actionCode: todayAction.actionCode, actionType: 'primary' })"
            @secondary="handleRouteWithTracking(todayAction.secondaryRoute, 'home_today_action_click', { actionCode: todayAction.actionCode, actionType: 'secondary' })"
          />
        </view>

        <view
          v-else-if="section.id === 'state_insights'"
          class="home-page__section home-page__section--state-insights"
        >
          <view class="home-page__section-head">
            <text class="home-page__section-title">{{ section.title }}</text>
            <text class="home-page__section-note">{{ section.note }}</text>
          </view>

          <view class="insight-grid">
            <InsightMiniCard
              v-for="(card, index) in visibleHomeCards"
              :key="card.id"
              class="insight-grid__item"
              :style="{ animationDelay: `${180 + index * 45}ms` }"
              :variant="card.variant"
              :icon-color="card.iconColor"
              :title="card.title"
              :subtitle="card.subtitle"
              :value="card.value"
              :metric-mode="card.metricMode"
              :suffix="card.suffix"
              :badge="card.badge"
              :description="card.description"
              :progress="card.progress"
              :stars="card.stars"
              :action-text="card.actionText"
              @select="handleRouteWithTracking(card.route, 'home_insight_tap', { cardId: card.id })"
            />
          </view>
        </view>

        <view
          v-else-if="section.id === 'fortune_actions'"
          class="home-page__section home-page__section--fortune-actions home-page__explore"
        >
          <FortuneActionCard
            :eyebrow="section.title"
            title="今日占卜"
            summary="把当下问题拆成一条更容易执行的提醒。"
            :tags="divinationTags"
            button-text="开始占卜"
            @open="openDivinationHome"
            @action="startHomeDivination"
          />
        </view>

        <view
          v-else-if="section.id === 'quick_tools'"
          class="home-page__section home-page__section--quick-tools"
        >
          <view class="home-page__section-head home-page__section-head--tools">
            <text class="home-page__section-title">{{ section.title }}</text>
            <text class="home-page__section-note">{{ section.note }}</text>
          </view>

          <view class="home-page__tools">
            <QuickToolStrip
              :items="quickTools"
              @select="(route, toolId) => handleRouteWithTracking(route, 'home_quick_tool_click', { toolId })"
            />
          </view>
        </view>
      </template>
    </view>

    <HomeTabBar current-tab="home" />
  </view>
</template>

<script setup lang="ts">
import { onLoad, onPullDownRefresh, onShow } from '@dcloudio/uni-app';
import { computed, nextTick } from 'vue';
import FortuneActionCard from '../../components/FortuneActionCard.vue';
import HomeHero from '../../components/HomeHero.vue';
import HomeTabBar from '../../components/HomeTabBar.vue';
import InsightMiniCard from '../../components/InsightMiniCard.vue';
import QuickToolStrip, { type QuickToolItem } from '../../components/QuickToolStrip.vue';
import StatusIndexCard, { type StatusIndexTag } from '../../components/StatusIndexCard.vue';
import TodayActionCard from '../../components/TodayActionCard.vue';
import { useThemePreference } from '../../composables/useThemePreference';
import { useDashboardStore } from '../../stores/dashboard';
import { usePageStateStore } from '../../stores/page-state';
import { trackEvent } from '../../services/analytics';
import {
  createTodayDivinationRequest,
  setPendingDivinationRequest,
} from '../../services/divination';
import type {
  DashboardHomeLayoutQuickTool,
  DashboardHomeLayoutSection,
  DashboardStateFactor,
} from '../../types/dashboard';
import type { ThemeKey } from '../../theme/tokens';

type InsightCard = {
  id: string;
  variant: 'lotus' | 'mind' | 'bagua' | 'stars';
  iconColor: string;
  title: string;
  subtitle: string;
  value: string;
  metricMode: 'score' | 'level' | 'stars';
  suffix: string;
  badge: string;
  description: string;
  note: string;
  progress: number;
  stars: number;
  actionText: string;
  route: string;
};

type HomeRouteAction = {
  label: string;
  route: string;
};

type TodayAction = {
  actionCode: string;
  badge: string;
  title: string;
  summary: string;
  actionText: string;
  route: string;
  secondaryText: string;
  secondaryRoute: string;
};

const dashboardStore = useDashboardStore();
const pageStateStore = usePageStateStore();
let lastHomeVersion = pageStateStore.versionOf('home');
const rootPageRoutes = new Set([
  '/pages/index/index',
  '/pages/explore/index',
  '/pages/records/index',
  '/pages/profile/index',
]);
const supportedSectionIds = new Set<DashboardHomeLayoutSection['id']>([
  'hero',
  'today_state',
  'today_action',
  'state_insights',
  'fortune_actions',
  'quick_tools',
]);
const supportedQuickToolIcons: DashboardHomeLayoutQuickTool['icon'][] = [
  'leaf',
  'journal',
  'orbit',
  'compass',
  'poster',
];

const dashboard = computed(() => dashboardStore.dashboard);
const userSummary = computed(() => dashboard.value.userSummary);
const todayLuckyScore = computed(() => dashboard.value.todayLuckyScore);
const annualLuckyScore = computed(() => dashboard.value.annualLuckyScore);
const luckySign = computed(() => dashboard.value.todayLuckySign);
const stateOverview = computed(() => dashboard.value.stateOverview);
const homeLayout = computed(() => dashboard.value.homeLayout);
const dailyThemeKey = computed<ThemeKey | ''>(
  () => (dashboard.value.dailyThemeKey as ThemeKey | undefined) || '',
);
const { themePalette, themeVars } = useThemePreference(dailyThemeKey);

const factorMap = computed(() => {
  const map = new Map<string, DashboardStateFactor>();

  for (const item of stateOverview.value.factors) {
    map.set(item.id, item);
  }

  return map;
});

const homeSections = computed<DashboardHomeLayoutSection[]>(() =>
  [...(homeLayout.value.sections || [])]
    .filter(
      (section) =>
        section.enabled &&
        supportedSectionIds.has(section.id) &&
        sectionAudienceMatches(section),
    )
    .sort((left, right) => left.order - right.order),
);

const userAudienceTokens = computed(() => {
  const tokens = ['all'];

  if (!userSummary.value.isLoggedIn) {
    tokens.push('logged_out');
    return tokens;
  }

  tokens.push('logged_in');

  if (userSummary.value.profileCompleted) {
    tokens.push('active');
  } else {
    tokens.push('profile_incomplete');
  }

  if (userSummary.value.vipStatus === 'active') {
    tokens.push('vip');
  }

  if (completionScore.value < 62) {
    tokens.push('low_confidence');
  }

  if (todayAction.value.actionCode === 'steady_breath') {
    tokens.push('pressure');
  }

  return tokens;
});

const fortuneScore = computed(() => {
  const parsed = Number(todayLuckyScore.value.value);
  return Number.isFinite(parsed) ? clamp(Math.round(parsed), 0, 100) : 86;
});

const emotionScore = computed(() =>
  resolveNumericFactor(['emotion'], clamp(fortuneScore.value - 4, 0, 100)),
);

const resilienceScore = computed(() =>
  resolveNumericFactor(['personality'], resolveFallbackResilienceScore()),
);

const completionScore = computed(() =>
  resolveNumericFactor(['completion'], resolveFallbackCompletionScore()),
);

const pageTitle = computed(
  () => dashboard.value.headline?.title || stateOverview.value.title || '今日气运',
);

const pageSubtitle = computed(
  () =>
    dashboard.value.headline?.subtitle ||
    stateOverview.value.summary ||
    '把今日状态整理成一个清晰的下一步。',
);

const heroStatusText = computed(
  () => userSummary.value.welcomeNote || stateOverview.value.confidenceLabel || '等待同步今日状态',
);

const displayDate = computed(() => {
  const now = new Date();
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${weekdays[now.getDay()]}`;
});

const lunarDate = computed(() => {
  try {
    const formatted = new Intl.DateTimeFormat('zh-Hans-CN-u-ca-chinese', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date());
    return `农历 ${formatLunarText(formatted)}`;
  } catch (error) {
    console.warn('chinese calendar fallback', error);
    return `今日宜 · ${resolveLuckyDo(stateOverview.value.basisTags)}`;
  }
});

const fortuneCardLabel = computed(() => todayLuckyScore.value.label || '当前状态指数');

const fortuneTitle = computed(
  () => stateOverview.value.title || todayLuckyScore.value.hint || '状态平稳，适合把节奏收回来',
);

const fortuneSummary = computed(
  () => stateOverview.value.summary || stateOverview.value.primarySuggestion || '先看见当下状态，再决定今天推进多少。',
);

const fortuneStatus = computed(
  () => stateOverview.value.confidenceLabel || `依据 · ${resolveLuckyDo(stateOverview.value.basisTags)}`,
);

const fortuneTags = computed<StatusIndexTag[]>(() => [
  {
    label: '今日色',
    value: `${themePalette.value.name}色`,
  },
  {
    label: '幸运数',
    value: String(resolveLuckyNumber(fortuneScore.value)),
  },
  {
    label: '可信度',
    value: fortuneStatus.value,
  },
]);

const statusPrimaryAction = computed<HomeRouteAction>(() => {
  const primaryRoute = userSummary.value.primaryActionRoute;

  if (primaryRoute && primaryRoute !== '/pages/index/index') {
    return {
      label: normalizeActionLabel(userSummary.value.primaryActionTitle, '查看完整报告'),
      route: primaryRoute,
    };
  }

  return {
    label: '查看完整报告',
    route: '/pages/report/index',
  };
});

const statusSecondaryAction = computed<HomeRouteAction>(() => {
  if (!userSummary.value.isLoggedIn) {
    return {
      label: '隐私说明',
      route: '/pages/settings/privacy/index',
    };
  }

  if (completionScore.value < 72) {
    return {
      label: '记录心情',
      route: '/pages/journal/index',
    };
  }

  return {
    label: '开始冥想',
    route: '/pages/meditation/index',
  };
});

const todayAction = computed<TodayAction>(() => {
  const action = dashboard.value.todayAction;

  return {
    actionCode: action?.actionCode || 'view_report',
    badge: action?.badge || '可推进',
    title: action?.title || '把今日建议落成一步',
    summary:
      action?.summary ||
      stateOverview.value.primarySuggestion ||
      '先完成一件最重要的小事，再决定今天剩下的安排。',
    actionText: normalizeActionLabel(action?.primaryText, '查看报告'),
    route: action?.primaryRoute || '/pages/report/index',
    secondaryText: normalizeActionLabel(action?.secondaryText, '今日占卜'),
    secondaryRoute: action?.secondaryRoute || '/pages/divination/index/index',
  };
});

const homeCards = computed<InsightCard[]>(() => {
  const emotionFactor = findFactor('emotion');
  const personalityFactor = findFactor('personality');
  const completionFactor = findFactor('completion');
  const baziFactor = findFactor('bazi');
  const personalizedLevel = baziFactor?.value || resolveBaziLevel(fortuneScore.value);

  return [
    {
      id: 'emotion',
      variant: 'lotus',
      iconColor: themePalette.value.primary,
      title: '情绪温度',
      subtitle: emotionFactor?.label || '近期心绪',
      value: String(emotionScore.value),
      metricMode: 'score',
      suffix: '分',
      badge: resolveScoreBadge(emotionScore.value),
      description: emotionFactor?.hint || '还没有足够近期记录，先保持保守观察。',
      note: '',
      progress: emotionScore.value,
      stars: 0,
      actionText: '去自检',
      route: '/pages/emotion/index',
    },
    {
      id: 'resilience',
      variant: 'mind',
      iconColor: themePalette.value.primary,
      title: '节奏复原力',
      subtitle: personalityFactor?.label || '长期画像',
      value: String(resilienceScore.value),
      metricMode: 'score',
      suffix: '分',
      badge: resolveScoreBadge(resilienceScore.value),
      description: personalityFactor?.hint || '完成性格测评后，会更清楚你自然的恢复方式。',
      note: '',
      progress: resilienceScore.value,
      stars: 0,
      actionText: '做测评',
      route: '/pages/personality/index',
    },
    {
      id: 'completion',
      variant: 'bagua',
      iconColor: themePalette.value.accent,
      title: '状态可信度',
      subtitle: completionFactor?.label || '依据完整度',
      value: String(completionScore.value),
      metricMode: 'score',
      suffix: '分',
      badge: resolveCompletionBadge(completionScore.value),
      description: completionFactor?.hint || annualLuckyScore.value.hint || '补齐近期状态后，首页判断会更稳定。',
      note: '',
      progress: completionScore.value,
      stars: 0,
      actionText: completionScore.value < 72 ? '补资料' : '看记录',
      route: completionScore.value < 72 ? '/pages/profile/index' : '/pages/records/index',
    },
    {
      id: 'personalized',
      variant: 'stars',
      iconColor: themePalette.value.primary,
      title: '个性化参考',
      subtitle: '八字 / 星座',
      value: personalizedLevel,
      metricMode: 'level',
      suffix: '',
      badge: userSummary.value.profileCompleted ? '已接入' : '待完善',
      description: baziFactor?.hint || '生日、星座与主题色会作为轻量参考，不替代现实判断。',
      note: '',
      progress: 0,
      stars: 0,
      actionText: userSummary.value.profileCompleted ? '看八字' : '完善资料',
      route: userSummary.value.profileCompleted ? '/pages/bazi/index' : '/pages/profile/index',
    },
  ];
});

const visibleHomeCards = computed(() =>
  homeCards.value.slice(0, getSectionMaxItems('state_insights', 4)),
);

const divinationTags = ['当下问题', '行动提醒'];

const quickTools = computed<QuickToolItem[]>(() =>
  resolveQuickTools().slice(0, getSectionMaxItems('quick_tools', 4)),
);

let skipFirstShowRefresh = true;

async function refreshDashboard() {
  await dashboardStore.loadDashboard();
  lastHomeVersion = pageStateStore.versionOf('home');
  trackHomeEvent('home_view', {
    sections: homeSections.value.map((section) => section.id),
    actionCode: todayAction.value.actionCode,
  });
  homeSections.value.forEach((section) => {
    trackHomeEvent('home_section_view', {
      sectionId: section.id,
      order: section.order,
      actionCode: todayAction.value.actionCode,
    });
  });
}

function resetScrollTop() {
  nextTick(() => {
    setTimeout(() => {
      uni.pageScrollTo({
        scrollTop: 0,
        duration: 0,
      });
    }, 0);
  });
}

function handleRoute(route: string) {
  if (!route) {
    return;
  }

  if (rootPageRoutes.has(route)) {
    uni.redirectTo({
      url: route,
    });
    return;
  }

  uni.navigateTo({
    url: route,
  });
}

function handleRouteWithTracking(
  route: string,
  eventName: string,
  payload: Record<string, unknown> = {},
) {
  trackHomeEvent(eventName, {
    ...payload,
    route,
  });
  handleRoute(route);
}

function trackHomeEvent(eventName: string, payload: Record<string, unknown>) {
  trackEvent(eventName, {
    page: 'home',
    userStage: resolveUserStage(),
    vipStatus: userSummary.value.vipStatus,
    confidenceLevel: resolveConfidenceLevel(),
    ...payload,
  });
}

function sectionAudienceMatches(section: DashboardHomeLayoutSection) {
  const audience = section.audience || ['all'];

  return audience.some((item) => userAudienceTokens.value.includes(item));
}

function getSectionMaxItems(
  sectionId: DashboardHomeLayoutSection['id'],
  fallback: number,
) {
  const section = homeSections.value.find((item) => item.id === sectionId);
  const maxItems = Number(section?.maxItems);

  return Number.isFinite(maxItems) ? clamp(Math.round(maxItems), 1, 12) : fallback;
}

function isSectionAfter(
  sectionId: DashboardHomeLayoutSection['id'],
  previousSectionId: DashboardHomeLayoutSection['id'],
) {
  const currentIndex = homeSections.value.findIndex(
    (section) => section.id === sectionId,
  );
  const previousIndex = homeSections.value.findIndex(
    (section) => section.id === previousSectionId,
  );

  return currentIndex > 0 && previousIndex === currentIndex - 1;
}

function resolveQuickTools(): QuickToolItem[] {
  const configuredTools = [...(homeLayout.value.quickTools || [])]
    .filter((item) => item.enabled && item.route)
    .sort((left, right) => left.order - right.order)
    .map((item) => ({
      id: item.id,
      title: item.title || '入口',
      description: item.description || item.badge || '打开',
      icon: resolveQuickToolIcon(item.icon),
      route: item.route,
    }));

  if (configuredTools.length) {
    return configuredTools;
  }

  return dashboard.value.quickEntries
    .filter((item) => item.enabled !== false && item.route)
    .map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description || item.badge || '打开',
      icon: resolveQuickToolIcon(item.icon),
      route: item.route,
    }));
}

function resolveQuickToolIcon(
  value?: DashboardHomeLayoutQuickTool['icon'],
): QuickToolItem['icon'] {
  return supportedQuickToolIcons.includes(
    value as DashboardHomeLayoutQuickTool['icon'],
  )
    ? (value as QuickToolItem['icon'])
    : 'compass';
}

function resolveUserStage() {
  if (!userSummary.value.isLoggedIn) {
    return 'logged_out';
  }

  if (!userSummary.value.profileCompleted) {
    return 'profile_incomplete';
  }

  if (todayAction.value.actionCode === 'record_mood') {
    return 'low_confidence';
  }

  if (todayAction.value.actionCode === 'steady_breath') {
    return 'pressure';
  }

  return userSummary.value.vipStatus === 'active' ? 'vip' : 'active';
}

function resolveConfidenceLevel() {
  if (completionScore.value >= 82) {
    return 'high';
  }

  if (completionScore.value >= 62) {
    return 'medium';
  }

  return 'low';
}

function openDivinationHome() {
  handleRouteWithTracking('/pages/divination/index/index', 'home_divination_open');
}

function startHomeDivination() {
  trackHomeEvent('home_divination_start', {
    source: 'fortune_action_card',
  });
  setPendingDivinationRequest(createTodayDivinationRequest('general'));
  handleRoute('/pages/divination/loading/index');
}

function findFactor(...ids: string[]) {
  for (const id of ids) {
    const match = factorMap.value.get(id);
    if (match) {
      return match;
    }
  }

  return undefined;
}

function resolveNumericFactor(ids: string[], fallback: number) {
  for (const id of ids) {
    const value = Number(findFactor(id)?.value);
    if (Number.isFinite(value)) {
      return clamp(Math.round(value), 0, 100);
    }
  }

  return fallback;
}

function resolveFallbackResilienceScore() {
  const parsed = Number(annualLuckyScore.value.value);
  if (Number.isFinite(parsed) && annualLuckyScore.value.label !== '状态可信度') {
    return clamp(Math.round(parsed), 0, 100);
  }

  return clamp(fortuneScore.value - 10, 48, 88);
}

function resolveFallbackCompletionScore() {
  const parsed = Number(annualLuckyScore.value.value);
  return Number.isFinite(parsed) ? clamp(Math.round(parsed), 0, 100) : 36;
}

function normalizeActionLabel(value: string | undefined, fallback: string) {
  const next = value?.trim();
  if (!next) {
    return fallback;
  }

  return next.length > 8 ? next.slice(0, 8) : next;
}

function resolveLuckyNumber(score: number) {
  const next = score % 9;
  return next === 0 ? 9 : next;
}

function resolveLuckyDo(tags: string[]) {
  const source = tags.filter(Boolean).slice(0, 3);
  if (source.length) {
    return source.join(' · ');
  }

  return '静心 · 整理 · 呼吸';
}

function formatLunarText(input: string) {
  const withoutEra = input.replace(/^\d+/, '').trim();
  const dayMatch = withoutEra.match(/(\d{1,2})$/);

  if (!dayMatch) {
    return withoutEra.replace(/年(?=\S)/, '年 ');
  }

  return withoutEra
    .replace(dayMatch[1], formatLunarDay(Number(dayMatch[1])))
    .replace(/年(?=\S)/, '年 ');
}

function formatLunarDay(day: number) {
  const digits = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

  if (day <= 0 || day > 30) {
    return String(day);
  }

  if (day <= 10) {
    return `初${digits[day - 1]}`;
  }

  if (day < 20) {
    return `十${digits[day - 11]}`;
  }

  if (day === 20) {
    return '二十';
  }

  if (day < 30) {
    return `廿${digits[day - 21]}`;
  }

  return '三十';
}

function resolveScoreBadge(score: number) {
  if (score >= 90) {
    return '极佳';
  }
  if (score >= 80) {
    return '良好';
  }
  if (score >= 70) {
    return '平稳';
  }
  if (score >= 60) {
    return '留意';
  }
  return '偏低';
}

function resolveCompletionBadge(score: number) {
  if (score >= 82) {
    return '较完整';
  }
  if (score >= 62) {
    return '可参考';
  }
  return '待补充';
}

function resolveBaziLevel(score: number) {
  if (score >= 90) {
    return '上吉';
  }
  if (score >= 80) {
    return '中上';
  }
  if (score >= 68) {
    return '平稳';
  }
  if (score >= 58) {
    return '小顺';
  }
  return '守静';
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

onLoad(() => {
  resetScrollTop();
  void refreshDashboard();
});

onShow(() => {
  if (skipFirstShowRefresh) {
    skipFirstShowRefresh = false;
    return;
  }

  if (pageStateStore.versionOf('home') !== lastHomeVersion) {
    void refreshDashboard();
  }
});

onPullDownRefresh(async () => {
  await refreshDashboard();
  uni.stopPullDownRefresh();
});
</script>

<style lang="scss">
.page-shell {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at 12% 0%, rgba(var(--theme-accent-rgb), 0.12), transparent 22%),
    linear-gradient(180deg, var(--theme-page-top) 0%, rgba(255, 255, 255, 0.86) 48%, var(--theme-page-bottom) 100%);
}

.home-page {
  position: relative;
  min-height: 100vh;
  --home-page-gutter: 32rpx;
  box-sizing: border-box;
  padding: 0 0 calc(env(safe-area-inset-bottom) + 168rpx);
  overflow: hidden;
}

.ambient {
  position: absolute;
  pointer-events: none;
}

.ambient--paper {
  inset: 0;
  background:
    radial-gradient(circle at 18% 10%, rgba(255, 255, 255, 0.36), transparent 32%),
    repeating-linear-gradient(
      125deg,
      rgba(80, 88, 104, 0.026) 0,
      rgba(80, 88, 104, 0.026) 2rpx,
      transparent 2rpx,
      transparent 24rpx
    );
}

.ambient--glow {
  top: 238rpx;
  left: -84rpx;
  width: 260rpx;
  height: 160rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(var(--theme-primary-rgb), 0.1) 0%, rgba(255, 255, 255, 0) 76%);
  filter: blur(12rpx);
}

.ambient--mist-left {
  top: 520rpx;
  left: -34rpx;
  width: 286rpx;
  height: 128rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(var(--theme-primary-rgb), 0.055) 0%, rgba(255, 255, 255, 0) 72%);
  filter: blur(8rpx);
}

.ambient--mist-right {
  right: -40rpx;
  top: 780rpx;
  width: 320rpx;
  height: 180rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(var(--theme-accent-rgb), 0.075) 0%, rgba(255, 255, 255, 0) 76%);
  filter: blur(10rpx);
}

.home-page__section,
.home-page__section-head,
.insight-grid,
.home-page__tools {
  position: relative;
  z-index: 1;
}

.home-page__hero {
  margin: 0 0 2rpx;
}

.home-page__main-card,
.home-page__action,
.home-page__explore {
  box-sizing: border-box;
  padding: 0 var(--home-page-gutter);
}

.home-page__main-card {
  margin: 0 0 24rpx;
}

.home-page__main-card--after-hero {
  margin-top: -26rpx;
}

.home-page__action {
  margin: 0 0 30rpx;
}

.home-page__section-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 20rpx;
  margin: 0 var(--home-page-gutter) 18rpx;
}

.home-page__section-head--tools {
  margin-top: 30rpx;
}

.home-page__section-title {
  flex: 0 0 auto;
  font-size: 30rpx;
  line-height: 1.2;
  font-weight: 650;
  color: rgba(var(--theme-text-primary-rgb), 0.88);
}

.home-page__section-note {
  overflow: hidden;
  font-size: 21rpx;
  line-height: 1.35;
  color: rgba(var(--theme-text-secondary-rgb), 0.68);
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.insight-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18rpx;
  margin: 0 var(--home-page-gutter);
}

.insight-grid__item {
  min-width: 0;
  height: auto;
  animation: homeInsightIn 420ms ease both;
}

.home-page__explore {
  margin: 30rpx 0 0;
}

.home-page__tools {
  margin: 0 var(--home-page-gutter);
}

@keyframes homeInsightIn {
  from {
    opacity: 0;
    transform: translateY(18rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 360px) {
  .home-page {
    --home-page-gutter: 26rpx;
  }

  .insight-grid {
    gap: 14rpx;
  }

  .home-page__section-head {
    display: grid;
    gap: 8rpx;
  }

  .home-page__section-note {
    text-align: left;
  }
}
</style>
