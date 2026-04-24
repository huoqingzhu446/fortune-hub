<template>
  <view class="page-shell" :style="themeVars">
    <view class="home-page">
      <view class="ambient ambient--blue"></view>
      <view class="ambient ambient--mint"></view>

      <view class="page-header">
        <view class="page-header__copy">
          <text class="page-header__title">今日气运</text>
          <text class="page-header__subtitle">{{ pageSubtitle }}</text>
        </view>
        <view class="page-header__date">
          <text class="page-header__date-line">{{ displayDate }}</text>
          <text class="page-header__date-line">{{ dateHint }}</text>
        </view>
      </view>

      <view class="state-stage">
        <view class="state-stage__copy">
          <text class="state-stage__eyebrow">综合状态</text>
          <text class="state-stage__title">{{ stateOverview.title }}</text>
          <text class="state-stage__summary">{{ stateOverview.summary }}</text>
        </view>

        <view class="state-stage__board">
          <view class="state-stage__primary">
            <text class="state-stage__label">{{ todayLuckyScore.label }}</text>
            <text class="state-stage__value">{{ todayLuckyScore.value }}</text>
            <text class="state-stage__hint">{{ stateOverview.confidenceLabel }}</text>
          </view>

          <view class="state-stage__secondary">
            <text class="state-stage__secondary-label">{{ annualLuckyScore.label }}</text>
            <text class="state-stage__secondary-value">{{ annualLuckyScore.value }}</text>
            <text class="state-stage__secondary-hint">{{ annualLuckyScore.hint }}</text>
          </view>
        </view>

        <view v-if="stateOverview.basisTags.length" class="state-stage__tags">
          <text v-for="tag in stateOverview.basisTags" :key="tag" class="state-stage__tag">
            {{ tag }}
          </text>
        </view>
      </view>

      <view class="factor-grid">
        <view
          v-for="factor in stateOverview.factors"
          :key="factor.id"
          class="factor-card"
          :class="`factor-card--${factor.tone}`"
        >
          <text class="factor-card__label">{{ factor.label }}</text>
          <text class="factor-card__value">{{ factor.value }}</text>
          <text class="factor-card__hint">{{ factor.hint }}</text>
        </view>
      </view>

      <view class="evidence-panel">
        <view class="evidence-panel__head">
          <text class="evidence-panel__eyebrow">本次依据</text>
          <text class="evidence-panel__meta">{{ stateOverview.evidenceLabel }}</text>
        </view>
        <text class="evidence-panel__suggestion">{{ stateOverview.primarySuggestion }}</text>
        <text class="evidence-panel__disclaimer">{{ stateOverview.disclaimer }}</text>
      </view>

      <view class="insight-grid">
        <view class="insight-card" @tap="goToLuckySign">
          <text class="insight-card__eyebrow">今日幸运签</text>
          <text class="insight-card__title">{{ luckySign.tag }}</text>
          <text class="insight-card__text">{{ luckySign.summary }}</text>
          <text class="insight-card__link">查看详情</text>
        </view>

        <view class="insight-card insight-card--soft" @tap="goToTodayPoster">
          <text class="insight-card__eyebrow">今日分享图</text>
          <text class="insight-card__metric">{{ todayLuckyScore.value }}</text>
          <text class="insight-card__text">{{ posterCardSummary }}</text>
          <text class="insight-card__link">生成高清图</text>
        </view>
      </view>

      <view class="section-block">
        <view class="section-head">
          <view>
            <text class="section-head__eyebrow">探索入口</text>
          </view>
<!--          <text class="section-head__side">{{ moduleCards.length }} 个</text>-->
        </view>

        <view class="module-grid">
          <view
            v-for="module in moduleCards"
            :key="module.id"
            class="module-card"
            :class="module.toneClass"
            @tap="handleRoute(module.route)"
          >
            <text class="module-card__badge">{{ module.badge }}</text>
            <text class="module-card__title">{{ module.title }}</text>
            <text class="module-card__description">{{ module.description }}</text>
          </view>
        </view>
      </view>
    </view>

    <AppTabBar current-tab="home" />
  </view>
</template>

<script setup lang="ts">
import { onLoad, onPullDownRefresh, onShow } from '@dcloudio/uni-app';
import { computed, nextTick } from 'vue';
import AppTabBar from '../../components/AppTabBar.vue';
import { useThemePreference } from '../../composables/useThemePreference';
import { useDashboardStore } from '../../stores/dashboard';
import type { ThemeKey } from '../../theme/tokens';

const dashboardStore = useDashboardStore();

const dashboard = computed(() => dashboardStore.dashboard);
const loading = computed(() => dashboardStore.loading);
const todayLuckyScore = computed(() => dashboard.value.todayLuckyScore);
const annualLuckyScore = computed(() => dashboard.value.annualLuckyScore);
const luckySign = computed(() => dashboard.value.todayLuckySign);
const stateOverview = computed(() => dashboard.value.stateOverview);
const dailyThemeKey = computed<ThemeKey | ''>(
  () => (dashboard.value.dailyThemeKey as ThemeKey | undefined) || '',
);
const { themeVars } = useThemePreference(dailyThemeKey);
const pageSubtitle = computed(
  () => dashboard.value.headline.subtitle || '身心和谐 · 顺势而为',
);
const displayDate = computed(() => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  return `${year}年${month}月${day}日`;
});
const dateHint = computed(() => (loading.value ? '今日主题同步中' : '跟随今日幸运色'));
const posterCardSummary = computed(() => {
  const summary = `把当前状态指数转成一张适合微信分享的高清图片`;
  return summary.length > 34 ? `${summary.slice(0, 34)}...` : summary;
});

const moduleCards = computed(() =>
  dashboard.value.featureEntries.map((module, index) => ({
    ...module,
    toneClass: `module-card--tone-${(index % 5) + 1}`,
  })),
);

const topbarStatus = computed(() => (loading.value ? '同步中' : '今日已就绪'));

let skipFirstShowRefresh = true;

async function refreshDashboard() {
  await dashboardStore.loadDashboard();
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

  uni.navigateTo({
    url: route,
  });
}

function goToLuckySign() {
  const bizCode = dashboard.value.todayLuckySign.bizCode || 'sign-breeze-open';

  uni.navigateTo({
    url: `/pages/lucky/sign/index?bizCode=${encodeURIComponent(bizCode)}`,
  });
}

function goToLuckyCenter() {
  handleRoute('/pages/lucky/index');
}

function goToTodayPoster() {
  uni.navigateTo({
    url: '/pages/poster/today/index?auto=1',
  });
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

  resetScrollTop();
  void refreshDashboard();
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
  padding-bottom: 144rpx;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, var(--theme-glow), transparent 30%),
    linear-gradient(180deg, var(--theme-page-top) 0%, var(--theme-page-bottom) 100%);
}

.home-page {
  position: relative;
  min-height: 100vh;
  padding: 28rpx 24rpx 0;
  overflow: hidden;
}

.page-header {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 20rpx;
  align-items: start;
  margin-bottom: 24rpx;
}

.page-header__copy,
.page-header__date {
  display: grid;
  gap: 10rpx;
}

.page-header__title {
  font-size: 64rpx;
  font-weight: 500;
  color: var(--theme-text-primary);
}

.page-header__subtitle,
.page-header__date-line {
  font-size: 24rpx;
  line-height: 1.7;
  color: var(--theme-text-secondary);
}

.page-header__date {
  justify-items: end;
  margin-top: 10rpx;
}

.ambient {
  position: absolute;
  border-radius: 999rpx;
  pointer-events: none;
  filter: blur(24rpx);
}

.ambient--blue {
  top: 40rpx;
  right: -64rpx;
  width: 260rpx;
  height: 260rpx;
  background: var(--theme-glow);
}

.ambient--mint {
  top: 360rpx;
  left: -60rpx;
  width: 220rpx;
  height: 220rpx;
  background: rgba(255, 255, 255, 0.72);
}

.topbar,
.brand-block,
.hero-card,
.hero-copy,
.hero-actions,
.section-block,
.state-stage,
.state-stage__copy,
.state-stage__board,
.factor-grid,
.evidence-panel {
  display: grid;
  gap: 18rpx;
}

.topbar {
  position: relative;
  z-index: 1;
  grid-template-columns: 1fr auto;
  align-items: center;
  margin-bottom: 24rpx;
}

.brand-block__eyebrow,
.hero-copy__eyebrow,
.insight-card__eyebrow,
.section-head__eyebrow,
.module-card__badge,
.score-panel__label,
.score-panel__annual-label {
  font-size: 20rpx;
  letter-spacing: 0.12em;
  color: var(--apple-subtle);
}

.brand-block__title {
  font-size: 40rpx;
  font-weight: 700;
  color: var(--apple-text);
}

.sync-chip {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 12rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.78);
  border: 1rpx solid rgba(255, 255, 255, 0.82);
  box-shadow: 0 10rpx 24rpx rgba(96, 124, 164, 0.08);
  font-size: 22rpx;
  color: var(--apple-muted);
}

.sync-chip__dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #7ccfb0;
}

.sync-chip__dot--loading {
  background: var(--apple-blue);
}

.hero-card,
.insight-grid,
.module-grid,
.state-stage,
.factor-grid,
.evidence-panel {
  position: relative;
  z-index: 1;
}

.state-stage {
  margin-bottom: 18rpx;
  padding: 28rpx;
  border-radius: 36rpx;
  background:
    radial-gradient(circle at top right, rgba(121, 176, 255, 0.18), transparent 34%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.96) 0%, rgba(243, 248, 255, 0.98) 100%);
  border: 1rpx solid rgba(255, 255, 255, 0.92);
  box-shadow: 0 28rpx 80rpx rgba(93, 118, 153, 0.14);
}

.state-stage__eyebrow,
.evidence-panel__eyebrow,
.factor-card__label {
  font-size: 20rpx;
  letter-spacing: 0.28em;
  color: var(--apple-subtle);
  text-transform: uppercase;
}

.state-stage__title {
  font-size: 48rpx;
  line-height: 1.16;
  font-weight: 700;
  color: var(--apple-text);
}

.state-stage__summary,
.evidence-panel__meta,
.evidence-panel__disclaimer,
.factor-card__hint {
  font-size: 24rpx;
  line-height: 1.65;
  color: var(--apple-muted);
}

.state-stage__board {
  grid-template-columns: 1.08fr 0.92fr;
  gap: 16rpx;
}

.state-stage__primary,
.state-stage__secondary,
.factor-card {
  display: grid;
  gap: 10rpx;
  padding: 22rpx;
  border-radius: 26rpx;
  background: rgba(255, 255, 255, 0.78);
}

.state-stage__label,
.state-stage__secondary-label {
  font-size: 22rpx;
  color: var(--apple-subtle);
}

.state-stage__value {
  font-size: 84rpx;
  line-height: 0.95;
  font-weight: 700;
  color: var(--apple-text);
}

.state-stage__secondary-value,
.factor-card__value {
  font-size: 44rpx;
  line-height: 1;
  font-weight: 700;
  color: var(--apple-text);
}

.state-stage__hint,
.state-stage__secondary-hint {
  font-size: 22rpx;
  line-height: 1.5;
  color: var(--apple-muted);
}

.state-stage__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.state-stage__tag {
  padding: 12rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(233, 242, 255, 0.92);
  color: #5377b1;
  font-size: 22rpx;
}

.factor-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-bottom: 18rpx;
}

.factor-card {
  min-height: 188rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.86);
  box-shadow: 0 18rpx 48rpx rgba(93, 118, 153, 0.08);
}

.factor-card--positive {
  background: linear-gradient(180deg, rgba(237, 248, 243, 0.98) 0%, rgba(255, 255, 255, 0.92) 100%);
}

.factor-card--steady {
  background: linear-gradient(180deg, rgba(236, 244, 255, 0.98) 0%, rgba(255, 255, 255, 0.92) 100%);
}

.factor-card--watch {
  background: linear-gradient(180deg, rgba(255, 246, 233, 0.98) 0%, rgba(255, 255, 255, 0.92) 100%);
}

.evidence-panel {
  margin-bottom: 24rpx;
  padding: 24rpx;
  border-radius: 30rpx;
  background: rgba(255, 255, 255, 0.82);
  border: 1rpx solid rgba(255, 255, 255, 0.86);
  box-shadow: 0 18rpx 48rpx rgba(93, 118, 153, 0.08);
}

.evidence-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
}

.evidence-panel__suggestion {
  font-size: 28rpx;
  line-height: 1.68;
  color: var(--apple-text);
}

.hero-card {
  grid-template-columns: 1.08fr 0.92fr;
  align-items: stretch;
  margin-bottom: 16rpx;
  padding: 24rpx;
  border-radius: 32rpx;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.92) 0%, rgba(245, 249, 255, 0.98) 100%);
  border: 1rpx solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 24rpx 70rpx rgba(93, 118, 153, 0.12);
}

.hero-copy__title {
  font-size: 46rpx;
  line-height: 1.18;
  font-weight: 700;
  color: var(--apple-text);
}

.hero-copy__summary,
.insight-card__text,
.module-card__description,
.refresh-bar__text,
.score-panel__hint {
  font-size: 24rpx;
  line-height: 1.6;
  color: var(--apple-muted);
}

.hero-actions {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12rpx;
}

.hero-button {
  min-height: 76rpx;
  padding: 0 24rpx;
  border-radius: 999rpx;
  line-height: 76rpx;
  font-size: 26rpx;
  font-weight: 600;
}

.hero-button::after {
  border: none;
}

.hero-button--primary {
  color: #ffffff;
  background: linear-gradient(135deg, #72a7ff 0%, #5b8def 100%);
  box-shadow: 0 16rpx 34rpx rgba(91, 141, 239, 0.22);
}

.hero-button--secondary,
.hero-button--ghost {
  color: var(--apple-text);
  background: rgba(240, 245, 251, 0.96);
}

.score-panel {
  display: grid;
  gap: 10rpx;
  align-content: start;
  padding: 20rpx;
  border-radius: 26rpx;
  background:
    radial-gradient(circle at top right, rgba(170, 207, 255, 0.32), transparent 32%),
    linear-gradient(180deg, rgba(236, 244, 255, 0.98) 0%, rgba(248, 251, 255, 0.98) 100%);
}

.score-panel__value,
.insight-card__metric {
  font-size: 60rpx;
  line-height: 1;
  font-weight: 700;
  color: var(--apple-text);
}

.score-panel__annual {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6rpx;
  padding: 14rpx 18rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.78);
}

.score-panel__annual-value {
  font-size: 32rpx;
  font-weight: 700;
  color: var(--apple-blue);
}

.insight-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18rpx;
  margin-bottom: 24rpx;
}

.insight-card,
.module-card,
.refresh-bar {
  border-radius: 30rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.86);
  box-shadow: 0 18rpx 48rpx rgba(93, 118, 153, 0.08);
}

.insight-card {
  display: grid;
  gap: 14rpx;
  min-height: 220rpx;
  padding: 26rpx;
  background: rgba(255, 255, 255, 0.9);
}

.insight-card--soft {
  background: linear-gradient(180deg, rgba(239, 247, 255, 0.94) 0%, rgba(255, 255, 255, 0.9) 100%);
}

.insight-card__title,
.section-head__title,
.module-card__title {
  font-size: 34rpx;
  line-height: 1.24;
  font-weight: 700;
  color: var(--apple-text);
}

.insight-card__link {
  align-self: end;
  font-size: 24rpx;
  color: var(--apple-blue);
}

.section-block {
  position: relative;
  z-index: 1;
  margin-bottom: 22rpx;
}

.section-head {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: end;
  gap: 18rpx;
  margin-bottom: 18rpx;
}

.section-head__side {
  font-size: 24rpx;
  color: var(--apple-muted);
}

.module-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
}

.module-card {
  display: grid;
  gap: 12rpx;
  min-height: 210rpx;
  padding: 24rpx;
  background: rgba(255, 255, 255, 0.92);
}

.module-card--tone-1 {
  background: linear-gradient(180deg, rgba(236, 244, 255, 0.98) 0%, rgba(255, 255, 255, 0.92) 100%);
}

.module-card--tone-2 {
  background: linear-gradient(180deg, rgba(237, 248, 243, 0.98) 0%, rgba(255, 255, 255, 0.92) 100%);
}

.module-card--tone-3 {
  background: linear-gradient(180deg, rgba(255, 246, 233, 0.98) 0%, rgba(255, 255, 255, 0.92) 100%);
}

.module-card--tone-4 {
  background: linear-gradient(180deg, rgba(242, 245, 252, 0.98) 0%, rgba(255, 255, 255, 0.92) 100%);
}

.module-card--tone-5 {
  background: linear-gradient(180deg, rgba(239, 248, 250, 0.98) 0%, rgba(255, 255, 255, 0.92) 100%);
}

.refresh-bar {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 18rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  background: rgba(255, 255, 255, 0.78);
}

@media (max-width: 720px) {
  .state-stage__board,
  .hero-card {
    grid-template-columns: minmax(0, 1fr);
  }

  .factor-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .hero-copy__title {
    font-size: 42rpx;
  }

  .state-stage__title {
    font-size: 42rpx;
  }
}
</style>
