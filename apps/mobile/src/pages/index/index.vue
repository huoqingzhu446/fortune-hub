<template>
  <view class="page-shell">
    <view class="home-page">
      <view class="ambient ambient--blue"></view>
      <view class="ambient ambient--mint"></view>

      <view class="topbar">
        <view class="brand-block">
          <text class="brand-block__eyebrow">FORTUNE HUB</text>
          <text class="brand-block__title">运势中枢</text>
        </view>
        <view class="sync-chip">
          <view class="sync-chip__dot" :class="{ 'sync-chip__dot--loading': loading }"></view>
          <text>{{ topbarStatus }}</text>
        </view>
      </view>

      <view class="hero-card">
        <view class="hero-copy">
          <text class="hero-copy__eyebrow">今日总览</text>
          <text class="hero-copy__title">{{ dashboard.headline.title }}</text>
          <text class="hero-copy__summary">{{ heroSummary }}</text>

          <view class="hero-actions">
            <button class="hero-button hero-button--primary" @tap="goToLuckySign">
              查看幸运签
            </button>
            <button class="hero-button hero-button--secondary" @tap="goToLuckyCenter">
              幸运物推荐
            </button>
          </view>
        </view>

        <view class="score-panel">
          <text class="score-panel__label">{{ todayLuckyScore.label }}</text>
          <text class="score-panel__value">{{ todayLuckyScore.value }}</text>
          <text class="score-panel__hint">{{ todayLuckyScore.hint }}</text>

          <view class="score-panel__annual">
            <text class="score-panel__annual-label">{{ annualLuckyScore.label }}</text>
            <text class="score-panel__annual-value">{{ annualLuckyScore.value }}</text>
          </view>
        </view>
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
            <text class="section-head__eyebrow">常用功能</text>
            <text class="section-head__title">首页入口</text>
          </view>
          <text class="section-head__side">{{ moduleCards.length }} 个</text>
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

      <view class="refresh-bar">
        <text class="refresh-bar__text">内容会在资料更新后自动同步，也可以手动刷新一次。</text>
        <button class="hero-button hero-button--ghost" :loading="loading" @tap="refreshDashboard">
          刷新首页
        </button>
      </view>
    </view>

    <AppTabBar current-tab="home" />
  </view>
</template>

<script setup lang="ts">
import { onLoad, onPullDownRefresh, onShow } from '@dcloudio/uni-app';
import { computed, nextTick } from 'vue';
import AppTabBar from '../../components/AppTabBar.vue';
import { useDashboardStore } from '../../stores/dashboard';

const dashboardStore = useDashboardStore();

const dashboard = computed(() => dashboardStore.dashboard);
const loading = computed(() => dashboardStore.loading);
const todayLuckyScore = computed(() => dashboard.value.todayLuckyScore);
const annualLuckyScore = computed(() => dashboard.value.annualLuckyScore);
const luckySign = computed(() => dashboard.value.todayLuckySign);
const heroSummary = computed(() => {
  const summary = dashboard.value.todayFortuneSummary?.trim() || '';
  return summary.length > 34 ? `${summary.slice(0, 34)}...` : summary;
});
const posterCardSummary = computed(() => {
  const summary = `综合星座、气运和生日资料，生成适合微信分享的高清图片`;
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
  background: linear-gradient(180deg, #f8fbff 0%, #eef4f9 100%);
}

.home-page {
  position: relative;
  min-height: 100vh;
  padding: 28rpx 24rpx 0;
  overflow: hidden;
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
  background: rgba(129, 178, 255, 0.2);
}

.ambient--mint {
  top: 360rpx;
  left: -60rpx;
  width: 220rpx;
  height: 220rpx;
  background: rgba(133, 214, 189, 0.16);
}

.topbar,
.brand-block,
.hero-card,
.hero-copy,
.hero-actions,
.section-block {
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
.module-grid {
  position: relative;
  z-index: 1;
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
  .hero-card {
    grid-template-columns: minmax(0, 1fr);
  }

  .hero-copy__title {
    font-size: 42rpx;
  }
}
</style>
