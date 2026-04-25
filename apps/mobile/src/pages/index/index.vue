<template>
  <view class="page-shell" :style="themeVars">
    <view class="home-page">
      <view class="ambient ambient--paper"></view>
      <view class="ambient ambient--glow"></view>
      <view class="ambient ambient--mist-left"></view>
      <view class="ambient ambient--mist-right"></view>
      <view class="ambient ambient--constellation"></view>

      <view class="hero">
        <view class="hero__top">
          <view class="hero__brand">


            <view class="hero__copy">
              <text class="hero__title">{{ pageTitle }}</text>
              <text class="hero__subtitle">{{ pageSubtitle }}</text>
            </view>
          </view>
        </view>

        <view class="hero__meta">
          <text class="hero__meta-line">{{ displayDate }}</text>
          <text class="hero__meta-line hero__meta-line--secondary">{{ lunarDate }}</text>
        </view>
      </view>

      <FortuneScoreCard
        class="home-page__main-card"
        :label="fortuneCardLabel"
        :score="fortuneScore"
        :status="fortuneStatus"
        :title="fortuneTitle"
        :summary="fortuneSummary"
        :tags="fortuneTags"
        @select="goToReport"
      />

      <view class="insight-grid">
        <view
          v-for="card in homeCards"
          :key="card.id"
          class="insight-grid__item"
          @tap="handleRoute(card.route)"
        >
            <HomeStatusCard
              :variant="card.variant"
              :icon-color="card.iconColor"
              :title="card.title"
              :subtitle="card.subtitle"
              :value="card.value"
              :metric-mode="card.metricMode"
              :suffix="card.suffix"
              :badge="card.badge"
              :description="card.description"
              :note="card.note"
              :progress="card.progress"
              :stars="card.stars"
            />
        </view>
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

    <AppTabBar current-tab="home" />
  </view>
</template>

<script setup lang="ts">
import { onLoad, onPullDownRefresh, onShow } from '@dcloudio/uni-app';
import { computed, nextTick } from 'vue';
import AppTabBar from '../../components/AppTabBar.vue';
import FortuneScoreCard, { type FortuneCardTag } from '../../components/FortuneScoreCard.vue';
import HomeStatusCard from '../../components/HomeStatusCard.vue';
import QuickToolStrip, { type QuickToolItem } from '../../components/QuickToolStrip.vue';
import TodayAdviceCard from '../../components/TodayAdviceCard.vue';
import { useThemePreference } from '../../composables/useThemePreference';
import { useDashboardStore } from '../../stores/dashboard';
import { usePageStateStore } from '../../stores/page-state';
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
    return new Intl.DateTimeFormat('zh-Hans-CN-u-ca-chinese', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date());
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

const fortuneTags = computed<FortuneCardTag[]>(() => [
  {
    label: '幸运色',
    value: `${themePalette.value.name}色`,
  },
  {
    label: '幸运数字',
    value: String(resolveLuckyNumber(fortuneScore.value)),
  },
  {
    label: '宜',
    value: resolveLuckyDo(stateOverview.value.basisTags),
  },
]);

const emotionScore = computed(() =>
  resolveNumericFactor(['emotion'], clamp(fortuneScore.value - 4, 0, 100)),
);

const mentalScore = computed(() =>
  resolveNumericFactor(['mental', 'completion'], resolveFallbackMentalScore()),
);

const homeCards = computed<InsightCard[]>(() => {
  const emotionFactor = findFactor('emotion');
  const mentalFactor = findFactor('mental', 'completion');
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
      value: String(emotionScore.value),
      metricMode: 'score',
      suffix: '分',
      badge: resolveScoreBadge(emotionScore.value),
      description: emotionFactor?.hint || '情绪稳定，内心平和。',
      note: '保持呼吸，继续保持哦',
      progress: emotionScore.value,
      stars: 0,
      route: '/pages/emotion/index',
    },
    {
      id: 'mental',
      variant: 'mind',
      iconColor: themePalette.value.primary,
      title: '心理健康',
      subtitle: mentalFactor?.label || annualLuckyScore.value.label || '抑郁测试分数',
      value: String(mentalScore.value),
      metricMode: 'score',
      suffix: '分',
      badge: resolveMentalBadge(mentalScore.value),
      description: mentalFactor?.hint || annualLuckyScore.value.hint || '略有压力，注意休息。',
      note: '适当放松，寻找支持',
      progress: mentalScore.value,
      stars: 0,
      route: '/pages/report/index',
    },
    {
      id: 'bazi',
      variant: 'bagua',
      iconColor: themePalette.value.accent,
      title: '八字气运',
      subtitle: '',
      value: baziLevel,
      metricMode: 'level',
      suffix: '',
      badge: resolveBaziBadge(fortuneScore.value),
      description: baziFactor?.hint || '五行平衡，运势稳中有升。',
      note: '宜静不宜动，守成待时',
      progress: 0,
      stars: 0,
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
    id: 'tools',
    title: '更多工具',
    description: '探索更多',
    icon: 'compass',
    route: '/pages/explore/index',
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
  const parsed = Number(annualLuckyScore.value.value);
  if (Number.isFinite(parsed)) {
    return clamp(Math.round(parsed), 0, 100);
  }

  return clamp(fortuneScore.value - 18, 48, 92);
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
    radial-gradient(circle at 16% 0%, rgba(var(--theme-accent-rgb), 0.26), transparent 22%),
    radial-gradient(circle at 88% 18%, rgba(var(--theme-primary-rgb), 0.18), transparent 28%),
    linear-gradient(180deg, var(--theme-page-top) 0%, rgba(255, 255, 255, 0.92) 52%, var(--theme-page-bottom) 100%);
}

.home-page {
  position: relative;
  min-height: 100vh;
  padding: calc(env(safe-area-inset-top) + 26rpx) 24rpx 250rpx;
  overflow: hidden;
}

.ambient {
  position: absolute;
  pointer-events: none;
}

.ambient--paper {
  inset: 0;
  background:
    radial-gradient(circle at 18% 10%, rgba(255, 255, 255, 0.86), transparent 34%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.26), rgba(255, 255, 255, 0)),
    repeating-linear-gradient(
      125deg,
      rgba(214, 205, 183, 0.05) 0,
      rgba(214, 205, 183, 0.05) 2rpx,
      transparent 2rpx,
      transparent 22rpx
    );
}

.ambient--glow {
  top: 196rpx;
  left: -84rpx;
  width: 260rpx;
  height: 160rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(var(--theme-primary-rgb), 0.24) 0%, rgba(255, 255, 255, 0) 76%);
  filter: blur(28rpx);
}

.ambient--mist-left {
  top: 290rpx;
  left: -34rpx;
  width: 286rpx;
  height: 128rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(var(--theme-primary-rgb), 0.16) 0%, rgba(255, 255, 255, 0) 72%);
  filter: blur(18rpx);
}

.ambient--mist-right {
  right: -40rpx;
  top: 444rpx;
  width: 320rpx;
  height: 180rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(var(--theme-accent-rgb), 0.18) 0%, rgba(255, 255, 255, 0) 76%);
  filter: blur(24rpx);
}

.ambient--constellation {
  top: 188rpx;
  right: 52rpx;
  width: 340rpx;
  height: 340rpx;
  border-radius: 50%;
  border: 1rpx solid rgba(var(--theme-accent-rgb), 0.24);
  box-shadow:
    0 0 0 36rpx rgba(var(--theme-accent-rgb), 0.08),
    0 0 0 72rpx rgba(var(--theme-accent-rgb), 0.03);
  opacity: 0.65;
}

.ambient--constellation::before,
.ambient--constellation::after {
  content: '';
  position: absolute;
  inset: 16rpx;
  border-radius: 50%;
  border: 1rpx solid rgba(var(--theme-accent-rgb), 0.18);
}

.ambient--constellation::after {
  inset: auto 54rpx 34rpx auto;
  width: 10rpx;
  height: 10rpx;
  border: 0;
  background: rgba(var(--theme-accent-rgb), 0.72);
  box-shadow:
    -86rpx -42rpx 0 rgba(var(--theme-accent-rgb), 0.46),
    -124rpx 26rpx 0 rgba(var(--theme-accent-rgb), 0.36),
    -184rpx -108rpx 0 rgba(var(--theme-accent-rgb), 0.24);
}

.hero,
.home-page__main-card,
.insight-grid,
.home-page__advice,
.home-page__tools {
  position: relative;
  z-index: 1;
}

.hero {
  display: grid;
  gap: 28rpx;
  margin-bottom: 26rpx;
}

.hero__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
}

.hero__brand {
  display: flex;
  align-items: flex-start;
  gap: 14rpx;
  min-width: 0;
  margin-top: 12rpx;
}

.hero__emblem {
  position: relative;
  flex: 0 0 62rpx;
  width: 62rpx;
  height: 62rpx;
  margin-top: 2rpx;
}

.hero__emblem-ring,
.hero__emblem-line {
  position: absolute;
}

.hero__emblem-ring {
  inset: 0;
  border-radius: 50%;
  border: 2rpx solid rgba(var(--theme-accent-rgb), 0.84);
}

.hero__emblem-line {
  background: rgba(var(--theme-accent-rgb), 0.72);
}

.hero__emblem-line--horizontal {
  left: 8rpx;
  right: 8rpx;
  top: 50%;
  height: 2rpx;
  transform: translateY(-50%);
}

.hero__emblem-line--vertical {
  top: 8rpx;
  bottom: 8rpx;
  left: 50%;
  width: 2rpx;
  transform: translateX(-50%);
}

.hero__copy {
  display: grid;
  gap: 10rpx;
}

.hero__title {
  font-size: 76rpx;
  line-height: 1;
  color: var(--theme-text-primary);
  font-family:
    'Iowan Old Style',
    'Times New Roman',
    'Noto Serif SC',
    serif;
}

.hero__subtitle {
  font-size: 24rpx;
  line-height: 1.6;
  letter-spacing: 0.18em;
  color: var(--theme-text-secondary);
}

.hero__actions {
  display: flex;
  align-items: center;
  gap: 18rpx;
  margin-top: 4rpx;
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.8);
  border: 1rpx solid rgba(220, 223, 228, 0.74);
  box-shadow: 0 12rpx 34rpx rgba(var(--theme-text-primary-rgb), 0.08);
}

.hero__action {
  display: grid;
  place-items: center;
  width: 40rpx;
  height: 40rpx;
}

.hero__divider {
  width: 1rpx;
  height: 36rpx;
  background: rgba(189, 194, 202, 0.72);
}

.hero__dots {
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  background: #111111;
  box-shadow:
    16rpx 0 0 #111111,
    32rpx 0 0 #111111;
}

.hero__target {
  position: relative;
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
  border: 3rpx solid #111111;
}

.hero__target::after {
  content: '';
  position: absolute;
  inset: 5rpx;
  border-radius: 50%;
  border: 3rpx solid #111111;
}

.hero__meta {
  display: grid;
  justify-items: end;
  gap: 10rpx;
}

.hero__meta-line {
  font-size: 24rpx;
  color: rgba(var(--theme-text-primary-rgb), 0.7);
}

.hero__meta-line--secondary {
  color: var(--theme-text-secondary);
}

.home-page__main-card {
  margin-bottom: 26rpx;
}

.insight-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18rpx;
}

.insight-grid__item {
  min-width: 0;
  height: 280rpx;
}

.home-page__advice {
  margin-top: 24rpx;
}

.home-page__tools {
  margin-top: 24rpx;
}
</style>
