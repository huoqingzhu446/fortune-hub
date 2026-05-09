<template>
  <view class="page-shell" :style="themeVars">
    <view class="home-page">
      <view class="ambient ambient--paper"></view>
      <view class="ambient ambient--glow"></view>
      <view class="ambient ambient--mist-left"></view>
      <view class="ambient ambient--mist-right"></view>

      <HomeHero
        class="home-page__hero"
        :title="pageTitle"
        :subtitle="pageSubtitle"
        :display-date="displayDate"
        :lunar-date="lunarDate"
      />

      <StatusIndexCard
        class="home-page__main-card"
        :label="fortuneCardLabel"
        :score="fortuneScore"
        :status="fortuneStatus"
        :title="fortuneTitle"
        :summary="fortuneSummary"
        :tags="fortuneTags"
        @select="goToReport"
      />

      <FortuneActionCard
        class="home-page__divination"
        eyebrow="周易占卜"
        title="今日占卜"
        summary="结合八字、星座与心情，给当下一个温柔方向。"
        :tags="divinationTags"
        button-text="立即占卜"
        @open="openDivinationHome"
        @action="startHomeDivination"
      />

      <view class="insight-grid">
        <InsightMiniCard
          v-for="(card, index) in homeCards"
          :key="card.id"
          class="insight-grid__item"
          :style="{ animationDelay: `${220 + index * 55}ms` }"
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
          @select="handleRoute(card.route)"
        />
      </view>

      <TodayAdviceCard
        class="home-page__advice"
        :title="adviceTitle"
        :summary="adviceSummary"
        :action-text="adviceAction.label"
        @action="handleRoute(adviceAction.route)"
      />

      <QuickToolStrip
        class="home-page__tools"
        :items="quickTools"
        @select="handleRoute"
      />
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
import TodayAdviceCard from '../../components/TodayAdviceCard.vue';
import { useThemePreference } from '../../composables/useThemePreference';
import { useDashboardStore } from '../../stores/dashboard';
import { usePageStateStore } from '../../stores/page-state';
import {
  createTodayDivinationRequest,
  setPendingDivinationRequest,
} from '../../services/divination';
import type { DashboardStateFactor } from '../../types/dashboard';
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

const dashboardStore = useDashboardStore();
const pageStateStore = usePageStateStore();
let lastHomeVersion = pageStateStore.versionOf('home');
const rootPageRoutes = new Set([
  '/pages/index/index',
  '/pages/explore/index',
  '/pages/records/index',
  '/pages/profile/index',
]);

const dashboard = computed(() => dashboardStore.dashboard);
const todayLuckyScore = computed(() => dashboard.value.todayLuckyScore);
const annualLuckyScore = computed(() => dashboard.value.annualLuckyScore);
const luckySign = computed(() => dashboard.value.todayLuckySign);
const stateOverview = computed(() => dashboard.value.stateOverview);
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

const fortuneScore = computed(() => {
  const parsed = Number(todayLuckyScore.value.value);
  return Number.isFinite(parsed) ? clamp(Math.round(parsed), 0, 100) : 86;
});
// dashboard.value.headline.title ||
const pageTitle = computed(() =>  '今日气运');
// dashboard.value.headline.subtitle ||
const pageSubtitle = computed(
  () =>  '身心和谐 · 顺势而为',
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

const fortuneCardLabel = computed(() => todayLuckyScore.value.label || '综合气运指数');

const fortuneTitle = computed(
  () => stateOverview.value.title || todayLuckyScore.value.hint || '状态平稳，适合自我疗愈与整理内心',
);

const fortuneSummary = computed(
  () => stateOverview.value.summary || stateOverview.value.primarySuggestion || '保持平和与专注，温柔地对待自己。',
);

const fortuneStatus = computed(
  () => stateOverview.value.confidenceLabel || `今日宜 · ${resolveLuckyDo(stateOverview.value.basisTags)}`,
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
    label: '今日节奏',
    value: fortuneStatus.value,
  },
]);

const divinationTags = ['宜沟通', '忌冲动'];

const emotionScore = computed(() =>
  resolveNumericFactor(['emotion'], clamp(fortuneScore.value - 4, 0, 100)),
);

const mentalScore = computed(() =>
  resolveNumericFactor(['mental'], resolveFallbackMentalScore()),
);

const homeCards = computed<InsightCard[]>(() => {
  const emotionFactor = findFactor('emotion');
  const mentalFactor = findFactor('mental');
  const baziFactor = findFactor('bazi', 'personality');
  const zodiacFactor = findFactor('zodiac');
  const zodiacStars = resolveZodiacStars(zodiacFactor?.value, fortuneScore.value);
  const baziLevel = baziFactor?.value || resolveBaziLevel(fortuneScore.value);

  return [
    {
      id: 'emotion',
      variant: 'lotus',
      iconColor: themePalette.value.primary,
      title: '心情情绪评分',
      subtitle: emotionFactor?.label || '情绪稳定度',
      value: '',
      metricMode: 'stars',
      suffix: '',
      badge: resolveScoreBadge(emotionScore.value),
      description: emotionFactor?.hint || '情绪稳定，内心平和。',
      note: '保持呼吸，继续保持哦',
      progress: emotionScore.value,
      stars: resolveScoreStars(emotionScore.value),
      actionText: '记录心情',
      route: '/pages/emotion/index',
    },
    {
      id: 'mental',
      variant: 'mind',
      iconColor: themePalette.value.primary,
      title: '心理健康',
      subtitle: mentalFactor?.label || resolveMentalSubtitle(),
      value: '',
      metricMode: 'stars',
      suffix: '',
      badge: resolveMentalBadge(mentalScore.value),
      description: mentalFactor?.hint || todayLuckyScore.value.hint || '完成一次情绪自检后，会给出更贴近你的心理状态参考。',
      note: '适当放松，寻找支持',
      progress: mentalScore.value,
      stars: resolveScoreStars(mentalScore.value),
      actionText: '了解更多',
      route: '/pages/emotion/index',
    },
    {
      id: 'bazi',
      variant: 'bagua',
      iconColor: themePalette.value.accent,
      title: '八字气运',
      subtitle: '',
      value: '',
      metricMode: 'stars',
      suffix: '',
      badge: baziLevel || resolveBaziBadge(fortuneScore.value),
      description: baziFactor?.hint || '五行平衡，运势稳中有升。',
      note: '宜静不宜动，守成待时',
      progress: 0,
      stars: resolveScoreStars(fortuneScore.value),
      actionText: '查看八字',
      route: '/pages/bazi/index',
    },
    {
      id: 'zodiac',
      variant: 'stars',
      iconColor: themePalette.value.primary,
      title: '星座运势',
      subtitle: '',
      value: '',
      metricMode: 'stars',
      suffix: '',
      badge: resolveZodiacBadge(zodiacStars),
      description: zodiacFactor?.hint || '机会会在细节中出现。',
      note: '相信直觉，勇敢向前',
      progress: 0,
      stars: zodiacStars,
      actionText: '查看星座',
      route: '/pages/zodiac/index',
    },
  ];
});

const adviceTitle = computed(
  () => luckySign.value.summary || stateOverview.value.primarySuggestion || '慢下来，感受当下的呼吸',
);

const adviceSummary = computed(() => {
  const detail = stateOverview.value.summary || '给自己一些安静的时间。';
  return `${detail} 放下焦虑，整理思绪，温柔地爱自己。`;
});

const adviceAction = computed(() => ({
  label: '开始冥想',
  route: '/pages/meditation/index',
}));

const quickTools = computed<QuickToolItem[]>(() => [
  {
    id: 'meditation',
    title: '每日冥想',
    description: '放松身心',
    icon: 'leaf',
    route: '/pages/meditation/index',
  },
  {
    id: 'journal',
    title: '情绪日记',
    description: '记录心情',
    icon: 'journal',
    route: '/pages/journal/index',
  },
  {
    id: 'compatibility',
    title: '合盘合性',
    description: '关系解析',
    icon: 'orbit',
    route: '/pages/explore/index',
  },
  {
    id: 'poster',
    title: '今日海报',
    description: '一键分享',
    icon: 'poster',
    route: '/pages/poster/generate/index?type=today&auto=1',
  },
]);

let skipFirstShowRefresh = true;

async function refreshDashboard() {
  await dashboardStore.loadDashboard();
  lastHomeVersion = pageStateStore.versionOf('home');
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

function goToReport() {
  handleRoute('/pages/report/index');
}

function openDivinationHome() {
  handleRoute('/pages/divination/index/index');
}

function startHomeDivination() {
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

function resolveFallbackMentalScore() {
  const annualLabel = annualLuckyScore.value.label || '';
  const annualParsed = Number(annualLuckyScore.value.value);

  if (/心理|健康|压力|抑郁/.test(annualLabel) && Number.isFinite(annualParsed)) {
    return clamp(Math.round(annualParsed), 0, 100);
  }

  const currentParsed = Number(todayLuckyScore.value.value);
  if (Number.isFinite(currentParsed)) {
    return clamp(Math.round(currentParsed), 0, 100);
  }

  return clamp(fortuneScore.value - 18, 48, 92);
}

function resolveMentalSubtitle() {
  const annualLabel = annualLuckyScore.value.label || '';

  if (/心理|健康|压力|抑郁/.test(annualLabel)) {
    return annualLabel;
  }

  return '心理状态参考';
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

function resolveMentalBadge(score: number) {
  if (score >= 80) {
    return '轻松';
  }
  if (score >= 65) {
    return '轻度';
  }
  if (score >= 50) {
    return '留意';
  }
  return '关注';
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

function resolveBaziBadge(score: number) {
  if (score >= 88) {
    return '向上';
  }
  if (score >= 72) {
    return '平稳';
  }
  return '收束';
}

function resolveZodiacStars(rawValue: string | undefined, score: number) {
  const parsed = Number(rawValue);
  if (Number.isFinite(parsed)) {
    return clamp(Math.round(parsed), 1, 5);
  }
  if (score >= 88) {
    return 5;
  }
  if (score >= 72) {
    return 4;
  }
  if (score >= 56) {
    return 3;
  }
  return 2;
}

function resolveScoreStars(score: number) {
  if (score >= 88) {
    return 5;
  }
  if (score >= 72) {
    return 4;
  }
  if (score >= 56) {
    return 3;
  }
  if (score >= 42) {
    return 2;
  }
  return 1;
}

function resolveZodiacBadge(stars: number) {
  if (stars >= 5) {
    return '极佳';
  }
  if (stars >= 4) {
    return '较好';
  }
  if (stars >= 3) {
    return '平稳';
  }
  return '观察';
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
    radial-gradient(circle at 12% 0%, rgba(var(--theme-accent-rgb), 0.18), transparent 22%),
    radial-gradient(circle at 90% 18%, rgba(var(--theme-primary-rgb), 0.12), transparent 28%),
    linear-gradient(180deg, var(--theme-page-top) 0%, rgba(255, 255, 255, 0.78) 46%, var(--theme-page-bottom) 100%);
}

.home-page {
  position: relative;
  min-height: 100vh;
  padding: calc(env(safe-area-inset-top) + 18rpx) 32rpx 278rpx;
  overflow: hidden;
}

.ambient {
  position: absolute;
  pointer-events: none;
}

.ambient--paper {
  inset: 0;
  background:
    radial-gradient(circle at 18% 10%, rgba(255, 255, 255, 0.42), transparent 32%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0)),
    repeating-linear-gradient(
      125deg,
      rgba(80, 88, 104, 0.035) 0,
      rgba(80, 88, 104, 0.035) 2rpx,
      transparent 2rpx,
      transparent 22rpx
    );
}

.ambient--glow {
  top: 180rpx;
  left: -84rpx;
  width: 260rpx;
  height: 160rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(var(--theme-primary-rgb), 0.14) 0%, rgba(255, 255, 255, 0) 76%);
  filter: blur(12rpx);
}

.ambient--mist-left {
  top: 360rpx;
  left: -34rpx;
  width: 286rpx;
  height: 128rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(var(--theme-primary-rgb), 0.08) 0%, rgba(255, 255, 255, 0) 72%);
  filter: blur(8rpx);
}

.ambient--mist-right {
  right: -40rpx;
  top: 520rpx;
  width: 320rpx;
  height: 180rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(var(--theme-accent-rgb), 0.1) 0%, rgba(255, 255, 255, 0) 76%);
  filter: blur(10rpx);
}

.home-page__hero,
.home-page__main-card,
.home-page__divination,
.insight-grid,
.home-page__advice,
.home-page__tools {
  position: relative;
  z-index: 1;
}

.home-page__hero {
  margin: -6rpx 0 8rpx;
}

.home-page__main-card {
  margin: 0 0 28rpx;
}

.home-page__divination {
  margin: 0 0 28rpx;
}

.insight-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18rpx;
  margin: 0;
}

.insight-grid__item {
  min-width: 0;
  height: auto;
  animation: homeInsightIn 440ms ease both;
}

.home-page__advice {
  margin-top: 28rpx;
}

.home-page__tools {
  margin-top: 24rpx;
}

@keyframes homeInsightIn {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 360px) {
  .home-page {
    padding-left: 26rpx;
    padding-right: 26rpx;
  }

  .insight-grid {
    gap: 14rpx;
  }
}
</style>
