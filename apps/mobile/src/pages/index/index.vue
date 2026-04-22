<template>
  <view class="page-shell">
    <view class="page">
      <view class="page-orb page-orb--mint"></view>
      <view class="page-orb page-orb--blue"></view>

      <view class="topbar">
        <view class="topbar__brand">
          <text class="topbar__eyebrow">fortune hub</text>
          <text class="topbar__edition">P0 closed-loop edition</text>
        </view>
        <view class="topbar__status">
          <text class="topbar__status-dot"></text>
          <text>{{ topbarStatus }}</text>
        </view>
      </view>

      <view class="hero-card">
        <view class="hero-card__content">
          <text class="hero-card__eyebrow">Daily flow</text>
          <text class="hero-card__title">{{ dashboard.headline.title }}</text>
          <text class="hero-card__subtitle">{{ dashboard.headline.subtitle }}</text>
          <text class="hero-card__note">{{ dashboard.userSummary.welcomeNote }}</text>

          <view class="hero-card__actions">
            <button
              class="hero-button hero-button--primary"
              :loading="loading"
              @tap="goPrimaryAction"
            >
              {{ dashboard.userSummary.primaryActionTitle }}
            </button>
            <button class="hero-button hero-button--secondary" @tap="goSecondaryAction">
              {{ dashboard.userSummary.secondaryActionTitle }}
            </button>
          </view>
        </view>

        <view class="hero-card__spotlight">
          <text class="spotlight__label">{{ todayLuckyScore.label }}</text>
          <text class="spotlight__value">{{ todayLuckyScore.value }}</text>
          <text class="spotlight__hint">{{ todayLuckyScore.hint }}</text>

          <view class="spotlight__footer">
            <view class="capsule capsule--blue">
              <text class="capsule__key">{{ annualLuckyScore.label }}</text>
              <text class="capsule__value">{{ annualLuckyScore.value }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="ambient-strip" @tap="goToLuckySign">
        <text class="ambient-strip__label">{{ luckySign.tag }}</text>
        <text class="ambient-strip__title">{{ luckySign.title }}</text>
        <text class="ambient-strip__text">{{ noticeText }}</text>
      </view>

      <view class="stats-grid">
        <view
          v-for="(stat, index) in dashboard.stats"
          :key="stat.label"
          class="stat-card"
          :class="`stat-card--tone-${(index % 3) + 1}`"
        >
          <text class="stat-card__label">{{ stat.label }}</text>
          <text class="stat-card__value">{{ stat.value }}</text>
          <text class="stat-card__hint">{{ stat.hint }}</text>
        </view>
      </view>

      <view class="section-card">
        <view class="section-header">
          <view>
            <text class="section-header__eyebrow">Journey</text>
            <text class="section-header__title">今日闭环</text>
          </view>
          <text class="section-header__side">{{ completedJourneyCount }}/{{ dashboard.journeyEntries.length }}</text>
        </view>

        <view class="journey-list">
          <view
            v-for="item in dashboard.journeyEntries"
            :key="item.id"
            class="journey-card"
            :class="{ 'journey-card--done': item.completed }"
          >
            <view class="journey-card__top">
              <text class="journey-card__title">{{ item.title }}</text>
              <text class="journey-card__status">{{ item.completed ? '已完成' : '待处理' }}</text>
            </view>
            <text class="journey-card__text">{{ item.description }}</text>
          </view>
        </view>
      </view>

      <view class="section-card">
        <view class="section-header">
          <view>
            <text class="section-header__eyebrow">Core modules</text>
            <text class="section-header__title">核心功能入口</text>
          </view>
          <text class="section-header__side">全部可达</text>
        </view>

        <view class="module-list">
          <view
            v-for="module in moduleCards"
            :key="module.id"
            class="module-card"
            :class="module.toneClass"
            @tap="handleRoute(module.route)"
          >
            <view class="module-card__top">
              <view class="module-card__copy">
                <text class="module-card__badge">{{ module.badge }}</text>
                <text class="module-card__title">{{ module.title }}</text>
              </view>
              <text class="module-card__index">{{ module.indexLabel }}</text>
            </view>

            <text class="module-card__description">{{ module.description }}</text>
          </view>
        </view>
      </view>

      <view class="section-card section-card--soft">
        <view class="section-header">
          <view>
            <text class="section-header__eyebrow">Quick access</text>
            <text class="section-header__title">个人中心入口</text>
          </view>
          <text class="section-header__side">
            {{ dashboard.userSummary.isLoggedIn ? '已登录' : '待登录' }}
          </text>
        </view>

        <view class="quick-grid">
          <view
            v-for="item in dashboard.quickEntries"
            :key="item.id"
            class="quick-card"
            @tap="handleRoute(item.route)"
          >
            <text class="quick-card__badge">{{ item.badge }}</text>
            <text class="quick-card__title">{{ item.title }}</text>
            <text class="quick-card__text">{{ item.description }}</text>
          </view>
        </view>
      </view>

      <view class="section-card section-card--plain">
        <view class="section-header">
          <view>
            <text class="section-header__eyebrow">Refresh</text>
            <text class="section-header__title">首页同步</text>
          </view>
          <text class="section-header__side">{{ syncStatus }}</text>
        </view>
        <text class="footer-note">
          当前首页会跟随登录态动态刷新；如果刚完成登录或资料更新，回到首页后会自动重新加载。
        </text>
        <button class="hero-button hero-button--secondary" :loading="loading" @tap="refreshDashboard">
          手动刷新首页
        </button>
      </view>
    </view>

    <AppTabBar current-tab="home" />
  </view>
</template>

<script setup lang="ts">
import { onLoad, onPullDownRefresh, onShow } from '@dcloudio/uni-app';
import { computed } from 'vue';
import AppTabBar from '../../components/AppTabBar.vue';
import { useDashboardStore } from '../../stores/dashboard';

const dashboardStore = useDashboardStore();

const dashboard = computed(() => dashboardStore.dashboard);
const loading = computed(() => dashboardStore.loading);
const todayLuckyScore = computed(() => dashboard.value.todayLuckyScore);
const annualLuckyScore = computed(() => dashboard.value.annualLuckyScore);
const luckySign = computed(() => dashboard.value.todayLuckySign);
const noticeText = computed(
  () => `${luckySign.value.summary} ${dashboard.value.todayFortuneSummary}`,
);
const moduleCards = computed(() =>
  dashboard.value.featureEntries.map((module, index) => ({
    ...module,
    indexLabel: `${index + 1}`.padStart(2, '0'),
    toneClass: `module-card--tone-${(index % 3) + 1}`,
  })),
);
const completedJourneyCount = computed(
  () => dashboard.value.journeyEntries.filter((item) => item.completed).length,
);
const topbarStatus = computed(() =>
  dashboard.value.userSummary.isLoggedIn ? 'Profile linked' : 'Waiting for login',
);
const syncStatus = computed(() => (loading.value ? '同步中' : '已就绪'));

async function refreshDashboard() {
  await dashboardStore.loadDashboard();
}

function handleRoute(route: string) {
  if (!route) {
    return;
  }

  uni.navigateTo({
    url: route,
  });
}

function goPrimaryAction() {
  handleRoute(dashboard.value.userSummary.primaryActionRoute);
}

function goSecondaryAction() {
  handleRoute(dashboard.value.userSummary.secondaryActionRoute);
}

function goToLuckySign() {
  const bizCode = dashboard.value.todayLuckySign.bizCode || 'sign-breeze-open';
  uni.navigateTo({
    url: `/pages/lucky/sign/index?bizCode=${encodeURIComponent(bizCode)}`,
  });
}

onLoad(() => {
  void refreshDashboard();
});

onShow(() => {
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
  padding-bottom: 138rpx;
  overflow-x: hidden;
}

.page {
  position: relative;
  min-height: 100vh;
  padding: 28rpx 24rpx 0;
  overflow-x: hidden;
}

.page-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(18rpx);
}

.page-orb--mint {
  top: 40rpx;
  left: -60rpx;
  width: 220rpx;
  height: 220rpx;
  background: rgba(119, 214, 177, 0.22);
}

.page-orb--blue {
  top: 220rpx;
  right: -90rpx;
  width: 300rpx;
  height: 300rpx;
  background: rgba(111, 156, 255, 0.18);
}

.topbar,
.section-header,
.module-card__top,
.journey-card__top,
.hero-card,
.hero-card__actions,
.stats-grid,
.module-list,
.quick-grid,
.journey-list {
  display: grid;
  gap: 16rpx;
}

.topbar {
  position: relative;
  z-index: 1;
  grid-template-columns: 1fr auto;
  align-items: center;
  margin-bottom: 20rpx;
}

.topbar__eyebrow,
.section-header__eyebrow,
.ambient-strip__label,
.stat-card__label,
.module-card__badge,
.quick-card__badge {
  font-size: 20rpx;
  text-transform: uppercase;
  letter-spacing: 0.26em;
  color: var(--apple-subtle);
}

.topbar__edition,
.topbar__status,
.section-header__side,
.journey-card__status,
.footer-note {
  font-size: 24rpx;
  color: var(--apple-muted);
}

.topbar__status {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 12rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.74);
  backdrop-filter: blur(12rpx);
}

.topbar__status-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 999rpx;
  background: #58c990;
}

.hero-card,
.section-card,
.ambient-strip {
  position: relative;
  z-index: 1;
  margin-bottom: 20rpx;
  padding: 28rpx;
  border-radius: 32rpx;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: var(--apple-shadow);
}

.hero-card {
  grid-template-columns: 1.4fr 0.9fr;
  align-items: stretch;
}

.hero-card__content,
.hero-card__spotlight {
  display: grid;
  gap: 18rpx;
}

.hero-card__eyebrow,
.spotlight__label {
  font-size: 20rpx;
  text-transform: uppercase;
  letter-spacing: 0.3em;
  color: var(--apple-subtle);
}

.hero-card__title,
.section-header__title,
.module-card__title,
.quick-card__title,
.journey-card__title {
  font-size: 40rpx;
  font-weight: 700;
  color: var(--apple-text);
}

.hero-card__subtitle,
.hero-card__note,
.ambient-strip__text,
.stat-card__hint,
.module-card__description,
.quick-card__text,
.journey-card__text {
  font-size: 26rpx;
  line-height: 1.7;
  color: var(--apple-muted);
}

.hero-card__actions {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.hero-button {
  min-height: 82rpx;
  border-radius: 999rpx;
  line-height: 82rpx;
  font-size: 28rpx;
}

.hero-button::after {
  border: none;
}

.hero-button--primary {
  color: #ffffff;
  background: linear-gradient(135deg, var(--apple-blue) 0%, #7ba7ff 100%);
}

.hero-button--secondary {
  color: var(--apple-text);
  background: rgba(244, 247, 250, 0.92);
}

.hero-card__spotlight {
  padding: 24rpx;
  border-radius: 28rpx;
  background:
    linear-gradient(160deg, rgba(111, 156, 255, 0.18) 0%, rgba(119, 214, 177, 0.16) 100%),
    rgba(245, 249, 253, 0.92);
}

.spotlight__value,
.stat-card__value {
  font-size: 56rpx;
  font-weight: 700;
  color: var(--apple-text);
}

.capsule {
  display: grid;
  gap: 8rpx;
  padding: 16rpx 18rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.74);
}

.capsule__key,
.capsule__value {
  color: var(--apple-text);
}

.capsule__key {
  font-size: 22rpx;
}

.capsule__value {
  font-size: 32rpx;
  font-weight: 700;
}

.ambient-strip {
  display: grid;
  gap: 10rpx;
  background:
    linear-gradient(145deg, rgba(111, 156, 255, 0.12) 0%, rgba(119, 214, 177, 0.18) 100%),
    rgba(255, 255, 255, 0.92);
}

.ambient-strip__title {
  font-size: 36rpx;
  font-weight: 700;
  color: var(--apple-text);
}

.stats-grid,
.quick-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.stat-card,
.module-card,
.quick-card,
.journey-card {
  padding: 22rpx;
  border-radius: 24rpx;
  background: rgba(246, 249, 252, 0.92);
}

.stat-card--tone-1,
.module-card--tone-1 {
  background: rgba(239, 245, 255, 0.94);
}

.stat-card--tone-2,
.module-card--tone-2 {
  background: rgba(241, 250, 246, 0.94);
}

.stat-card--tone-3,
.module-card--tone-3 {
  background: rgba(250, 245, 238, 0.94);
}

.journey-list,
.module-list {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.module-card__top,
.journey-card__top {
  grid-template-columns: 1fr auto;
  align-items: start;
}

.module-card__copy {
  display: grid;
  gap: 10rpx;
}

.module-card__index {
  font-size: 30rpx;
  color: rgba(82, 104, 130, 0.58);
}

.journey-card--done {
  background: rgba(229, 246, 237, 0.94);
}

.section-card--soft {
  background: rgba(248, 251, 255, 0.9);
}

.section-card--plain {
  background: rgba(255, 255, 255, 0.74);
}

@media (max-width: 720px) {
  .hero-card,
  .hero-card__actions,
  .stats-grid,
  .journey-list,
  .module-list,
  .quick-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
