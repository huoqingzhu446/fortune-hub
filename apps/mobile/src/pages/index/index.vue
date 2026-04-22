<template>
  <view class="page-shell">
    <view class="page">
      <view class="page-orb page-orb--mint"></view>
      <view class="page-orb page-orb--blue"></view>

      <view class="topbar">
        <view class="topbar__brand">
          <text class="topbar__eyebrow">fortune hub</text>
          <text class="topbar__edition">Fresh mobile edition</text>
        </view>
        <view class="topbar__status">
          <text class="topbar__status-dot"></text>
          <text>{{ serviceStatusLabel }}</text>
        </view>
      </view>

      <view class="hero-card">
        <view class="hero-card__content">
          <text class="hero-card__eyebrow">Daily flow</text>
          <text class="hero-card__title">{{ dashboard.headline.title }}</text>
          <text class="hero-card__subtitle">{{ dashboard.headline.subtitle }}</text>

          <view class="hero-card__actions">
            <button
              class="hero-button hero-button--primary"
              :loading="loading"
              @tap="refreshDashboard"
            >
              刷新内容
            </button>
            <button class="hero-button hero-button--secondary" @tap="copyFileServiceUrl">
              复制文件服务
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
            <text class="section-header__eyebrow">Assessment tracks</text>
            <text class="section-header__title">评估模块</text>
          </view>
          <text class="section-header__side">精选 {{ moduleCards.length }}</text>
        </view>

        <view class="module-list">
          <view
            v-for="module in moduleCards"
            :key="module.id"
            class="module-card"
            :class="module.toneClass"
            @tap="handleModulePress(module.route)"
          >
            <view class="module-card__top">
              <view class="module-card__copy">
                <text class="module-card__badge">{{ module.badge }}</text>
                <text class="module-card__title">{{ module.title }}</text>
              </view>
              <text class="module-card__index">{{ module.indexLabel }}</text>
            </view>

            <text class="module-card__description">{{ module.description }}</text>

            <view class="module-card__route">
              <text class="module-card__route-label">Route</text>
              <text class="module-card__route-value">{{ module.route }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="section-card section-card--soft">
        <view class="section-header">
          <view>
            <text class="section-header__eyebrow">Upload relay</text>
            <text class="section-header__title">文件服务联调</text>
          </view>
          <text class="section-header__side">{{ uploadStatusLabel }}</text>
        </view>

        <view class="upload-card">
          <text class="upload-card__description">
            这里直接调用独立文件服务，验证上传链路是否接通。
          </text>

          <view class="upload-card__actions">
            <button class="hero-button hero-button--primary" :loading="uploading" @tap="uploadCover">
              上传测试图片
            </button>
          </view>

          <view v-if="lastUploadUrl" class="upload-result">
            <text class="upload-result__label">最近上传</text>
            <text class="upload-result__link">{{ lastUploadUrl }}</text>
            <image class="upload-result__preview" :src="lastUploadUrl" mode="aspectFill" />
          </view>
        </view>
      </view>

      <view class="section-card">
        <view class="section-header">
          <view>
            <text class="section-header__eyebrow">Connections</text>
            <text class="section-header__title">环境联通</text>
          </view>
          <text class="section-header__side">实时读取</text>
        </view>

        <view class="integration-list">
          <view
            v-for="item in integrationCards"
            :key="item.label"
            class="integration-row"
          >
            <view class="integration-row__head">
              <text class="integration-row__label">{{ item.label }}</text>
              <text class="integration-row__status" :class="item.stateClass">
                {{ item.stateText }}
              </text>
            </view>
            <text class="integration-row__value">{{ item.value }}</text>
          </view>
        </view>
      </view>
    </view>

    <AppTabBar current-tab="home" />
  </view>
</template>

<script setup lang="ts">
import { onLoad, onPullDownRefresh } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import AppTabBar from '../../components/AppTabBar.vue';
import { useDashboardStore } from '../../stores/dashboard';

const dashboardStore = useDashboardStore();
const lastUploadUrl = ref('');
const uploading = ref(false);

const dashboard = computed(() => dashboardStore.dashboard);
const loading = computed(() => dashboardStore.loading);
const todayLuckyScore = computed(() => dashboard.value.todayLuckyScore);
const annualLuckyScore = computed(() => dashboard.value.annualLuckyScore);
const luckySign = computed(() => dashboard.value.todayLuckySign);
const noticeText = computed(
  () => `${luckySign.value.summary} ${dashboard.value.todayFortuneSummary}`,
);
const moduleCards = computed(() =>
  (dashboard.value.featureEntries.length
    ? dashboard.value.featureEntries
    : dashboard.value.modules
  ).map((module, index) => ({
    ...module,
    indexLabel: `${index + 1}`.padStart(2, '0'),
    toneClass: `module-card--tone-${(index % 3) + 1}`,
  })),
);
const serviceStatusLabel = computed(() =>
  isHealthyStatus(dashboard.value.integrations.redisStatus) ? 'Services ready' : 'Services syncing',
);
const uploadStatusLabel = computed(() =>
  lastUploadUrl.value ? '已完成上传验证' : '等待上传测试',
);
const integrationCards = computed(() => [
  {
    label: 'API',
    value: dashboard.value.integrations.apiBaseUrl,
    stateText: 'Live',
    stateClass: 'integration-row__status--good',
  },
  {
    label: 'File Service',
    value: dashboard.value.integrations.fileServiceBaseUrl,
    stateText: lastUploadUrl.value ? 'Uploaded' : 'Ready',
    stateClass: lastUploadUrl.value
      ? 'integration-row__status--good'
      : 'integration-row__status--soft',
  },
  {
    label: 'Redis',
    value: dashboard.value.integrations.redisStatus,
    stateText: isHealthyStatus(dashboard.value.integrations.redisStatus)
      ? 'Connected'
      : 'Waiting',
    stateClass: isHealthyStatus(dashboard.value.integrations.redisStatus)
      ? 'integration-row__status--good'
      : 'integration-row__status--soft',
  },
]);

function isHealthyStatus(status: string | undefined) {
  return ['up', 'pong', 'ready'].includes(status?.toLowerCase() ?? '');
}

async function refreshDashboard() {
  await dashboardStore.loadDashboard();
}

function handleModulePress(route: string) {
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

function copyFileServiceUrl() {
  uni.setClipboardData({
    data: dashboard.value.integrations.fileServiceBaseUrl,
    success: () => {
      uni.showToast({
        title: '已复制地址',
        icon: 'success',
      });
    },
  });
}

async function uploadCover() {
  try {
    uploading.value = true;
    const chooseResult = await uni.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
    });
    const filePath = chooseResult.tempFilePaths?.[0];

    if (!filePath) {
      return;
    }

    const uploadResult = await uni.uploadFile({
      url: '/files/upload',
      name: 'file',
      filePath,
      formData: {
        appCode: 'fortune-hub-mobile',
        bizType: 'avatar',
        visibility: 'public',
      },
    });

    const response = JSON.parse(uploadResult.data) as {
      contentUrl?: string;
      message?: string;
    };

    if (uploadResult.statusCode >= 400 || !response.contentUrl) {
      throw new Error(response.message || '文件服务上传失败');
    }

    lastUploadUrl.value = response.contentUrl;
    uni.showToast({
      title: '上传成功',
      icon: 'success',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '上传失败';
    uni.showToast({
      title: message,
      icon: 'none',
    });
  } finally {
    uploading.value = false;
  }
}

onLoad(() => {
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
  filter: blur(8rpx);
  opacity: 0.72;
  pointer-events: none;
}

.page-orb--mint {
  top: 40rpx;
  right: -80rpx;
  width: 280rpx;
  height: 280rpx;
  background: radial-gradient(circle, rgba(134, 209, 182, 0.76) 0%, rgba(134, 209, 182, 0) 72%);
}

.page-orb--blue {
  top: 340rpx;
  left: -120rpx;
  width: 320rpx;
  height: 320rpx;
  background: radial-gradient(circle, rgba(91, 141, 239, 0.24) 0%, rgba(91, 141, 239, 0) 74%);
}

.topbar,
.hero-card,
.ambient-strip,
.section-card,
.stat-card,
.module-card,
.upload-result,
.integration-row {
  position: relative;
  z-index: 1;
  animation: rise-in 480ms ease both;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  margin-bottom: 20rpx;
}

.topbar__brand {
  display: grid;
  gap: 4rpx;
}

.topbar__eyebrow,
.section-header__eyebrow,
.hero-card__eyebrow {
  letter-spacing: 0.32em;
  text-transform: uppercase;
  font-size: 20rpx;
  color: var(--apple-subtle);
}

.topbar__edition {
  font-size: 24rpx;
  color: var(--apple-muted);
}

.topbar__status {
  display: inline-flex;
  align-items: center;
  gap: 10rpx;
  padding: 12rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.65);
  border: 1rpx solid rgba(255, 255, 255, 0.74);
  box-shadow: var(--apple-shadow);
  font-size: 22rpx;
  color: var(--apple-text);
}

.topbar__status-dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--apple-mint) 0%, var(--apple-blue) 100%);
}

.hero-card {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(220rpx, 0.8fr);
  gap: 22rpx;
  padding: 28rpx;
  border-radius: 36rpx;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.93) 0%, rgba(244, 249, 255, 0.84) 100%);
  border: 1rpx solid var(--apple-border);
  box-shadow: var(--apple-shadow);
}

.hero-card__content {
  display: grid;
  gap: 18rpx;
}

.hero-card__title {
  font-size: 54rpx;
  line-height: 1.12;
  font-weight: 700;
  color: var(--apple-text);
}

.hero-card__subtitle {
  display: block;
  font-size: 27rpx;
  line-height: 1.72;
  color: var(--apple-muted);
}

.hero-card__actions,
.upload-card__actions {
  display: flex;
  gap: 16rpx;
  flex-wrap: wrap;
}

.hero-card__spotlight {
  display: grid;
  align-content: space-between;
  gap: 18rpx;
  padding: 22rpx;
  border-radius: 30rpx;
  background:
    linear-gradient(180deg, rgba(223, 238, 255, 0.92) 0%, rgba(255, 255, 255, 0.76) 100%);
  border: 1rpx solid rgba(255, 255, 255, 0.82);
}

.spotlight__label {
  font-size: 22rpx;
  color: var(--apple-muted);
}

.spotlight__value {
  font-size: 78rpx;
  line-height: 1;
  font-weight: 700;
  color: #1a3f84;
}

.spotlight__hint {
  font-size: 24rpx;
  line-height: 1.6;
  color: #46617d;
}

.spotlight__footer {
  display: flex;
}

.capsule {
  display: inline-flex;
  flex-direction: column;
  gap: 6rpx;
  width: 100%;
  padding: 16rpx 18rpx;
  border-radius: 24rpx;
}

.capsule--blue {
  background: rgba(255, 255, 255, 0.72);
}

.capsule__key {
  font-size: 20rpx;
  color: var(--apple-muted);
}

.capsule__value {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--apple-text);
}

.hero-button {
  margin: 0;
  min-width: 220rpx;
  padding: 0 28rpx;
  height: 78rpx;
  line-height: 78rpx;
  border-radius: 999rpx;
  font-size: 26rpx;
  font-weight: 600;
}

.hero-button::after {
  border: none;
}

.hero-button--primary {
  background: linear-gradient(135deg, var(--apple-blue) 0%, #7ba7ff 100%);
  color: #ffffff;
  box-shadow: 0 16rpx 36rpx rgba(91, 141, 239, 0.26);
}

.hero-button--secondary {
  background: rgba(255, 255, 255, 0.72);
  color: var(--apple-text);
  border: 1rpx solid rgba(255, 255, 255, 0.8);
}

.ambient-strip {
  display: grid;
  gap: 8rpx;
  margin: 22rpx 0 20rpx;
  padding: 22rpx 24rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.68);
  border: 1rpx solid rgba(255, 255, 255, 0.78);
  box-shadow: var(--apple-shadow);
}

.ambient-strip__label {
  font-size: 20rpx;
  text-transform: uppercase;
  letter-spacing: 0.24em;
  color: var(--apple-subtle);
}

.ambient-strip__title {
  font-size: 30rpx;
  font-weight: 700;
  color: var(--apple-text);
}

.ambient-strip__text {
  font-size: 25rpx;
  line-height: 1.6;
  color: var(--apple-text);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18rpx;
  margin-bottom: 22rpx;
}

.stat-card {
  display: grid;
  gap: 10rpx;
  min-height: 184rpx;
  padding: 22rpx;
  border-radius: 30rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.78);
  box-shadow: var(--apple-shadow);
}

.stat-card--tone-1 {
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.96) 0%, rgba(235, 244, 255, 0.82) 100%);
}

.stat-card--tone-2 {
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.96) 0%, rgba(227, 245, 238, 0.82) 100%);
}

.stat-card--tone-3 {
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.96) 0%, rgba(255, 246, 225, 0.84) 100%);
}

.stat-card__label {
  font-size: 24rpx;
  color: var(--apple-muted);
}

.stat-card__value {
  font-size: 48rpx;
  font-weight: 700;
  color: var(--apple-text);
}

.stat-card__hint {
  font-size: 24rpx;
  line-height: 1.55;
  color: var(--apple-subtle);
}

.section-card {
  display: grid;
  gap: 18rpx;
  margin-bottom: 22rpx;
  padding: 26rpx;
  border-radius: 36rpx;
  background: rgba(255, 255, 255, 0.82);
  border: 1rpx solid rgba(255, 255, 255, 0.76);
  box-shadow: var(--apple-shadow);
}

.section-card--soft {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.84) 0%, rgba(248, 251, 255, 0.9) 100%);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 18rpx;
}

.section-header__title {
  display: block;
  margin-top: 8rpx;
  font-size: 38rpx;
  font-weight: 700;
  color: var(--apple-text);
}

.section-header__side {
  font-size: 24rpx;
  color: var(--apple-subtle);
}

.module-list,
.integration-list {
  display: grid;
  gap: 16rpx;
}

.module-card {
  display: grid;
  gap: 16rpx;
  padding: 22rpx;
  border-radius: 28rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.72);
  transition: transform 180ms ease;
}

.module-card:active {
  transform: scale(0.985);
}

.module-card--tone-1 {
  background: linear-gradient(155deg, rgba(222, 237, 255, 0.78) 0%, rgba(255, 255, 255, 0.88) 100%);
}

.module-card--tone-2 {
  background: linear-gradient(155deg, rgba(221, 243, 236, 0.84) 0%, rgba(255, 255, 255, 0.88) 100%);
}

.module-card--tone-3 {
  background: linear-gradient(155deg, rgba(255, 243, 219, 0.86) 0%, rgba(255, 255, 255, 0.88) 100%);
}

.module-card__top,
.integration-row__head {
  display: flex;
  justify-content: space-between;
  gap: 16rpx;
}

.module-card__copy {
  display: grid;
  gap: 8rpx;
}

.module-card__badge {
  display: inline-flex;
  width: fit-content;
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.72);
  font-size: 20rpx;
  color: var(--apple-muted);
}

.module-card__title {
  font-size: 32rpx;
  font-weight: 700;
  color: var(--apple-text);
}

.module-card__index {
  font-size: 42rpx;
  line-height: 1;
  color: rgba(20, 32, 51, 0.18);
  font-weight: 700;
}

.module-card__description {
  font-size: 25rpx;
  line-height: 1.65;
  color: var(--apple-muted);
}

.module-card__route {
  display: grid;
  gap: 6rpx;
  padding: 18rpx;
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.72);
}

.module-card__route-label,
.upload-result__label,
.integration-row__label {
  font-size: 20rpx;
  color: var(--apple-subtle);
}

.module-card__route-value,
.integration-row__value {
  font-size: 24rpx;
  line-height: 1.58;
  color: var(--apple-text);
  word-break: break-all;
}

.upload-card {
  display: grid;
  gap: 18rpx;
  padding: 24rpx;
  border-radius: 28rpx;
  background:
    linear-gradient(155deg, rgba(255, 255, 255, 0.96) 0%, rgba(241, 247, 255, 0.84) 100%);
  border: 1rpx solid rgba(255, 255, 255, 0.8);
}

.upload-card__description {
  font-size: 26rpx;
  line-height: 1.65;
  color: var(--apple-muted);
}

.upload-result {
  display: grid;
  gap: 12rpx;
  padding: 20rpx;
  border-radius: 26rpx;
  background: rgba(255, 255, 255, 0.88);
  border: 1rpx solid rgba(255, 255, 255, 0.82);
}

.upload-result__link {
  font-size: 24rpx;
  line-height: 1.5;
  color: var(--apple-blue);
  word-break: break-all;
}

.upload-result__preview {
  width: 100%;
  height: 320rpx;
  border-radius: 24rpx;
  background: #f2f5f8;
}

.integration-row {
  display: grid;
  gap: 10rpx;
  padding: 20rpx;
  border-radius: 26rpx;
  background: rgba(255, 255, 255, 0.76);
  border: 1rpx solid rgba(255, 255, 255, 0.8);
}

.integration-row__status {
  display: inline-flex;
  align-items: center;
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  font-size: 20rpx;
}

.integration-row__status--good {
  background: rgba(134, 209, 182, 0.22);
  color: #227653;
}

.integration-row__status--soft {
  background: rgba(91, 141, 239, 0.12);
  color: #4a6ea8;
}

@keyframes rise-in {
  from {
    opacity: 0;
    transform: translateY(18rpx);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 520px) {
  .hero-card {
    grid-template-columns: 1fr;
  }
}
</style>
