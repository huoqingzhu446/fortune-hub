<template>
  <view class="page" :style="themeVars">
    <view class="page-orb page-orb--blue"></view>
    <view class="page-orb page-orb--gold"></view>

    <view class="panel hero-panel">
      <text class="eyebrow">today share poster</text>
      <text class="title">{{ heroTitle }}</text>
      <text class="summary">{{ heroSummary }}</text>

      <view class="chip-row">
        <text v-for="item in profileChips" :key="item" class="chip">{{ item }}</text>
      </view>

      <view class="status-grid">
        <view class="status-card">
          <text class="status-card__label">{{ dashboard.todayLuckyScore.label }}</text>
          <text class="status-card__value">{{ dashboard.todayLuckyScore.value }}</text>
          <text class="status-card__hint">{{ dashboard.todayLuckyScore.hint }}</text>
        </view>
        <view class="status-card">
          <text class="status-card__label">{{ dashboard.annualLuckyScore.label }}</text>
          <text class="status-card__value">{{ dashboard.annualLuckyScore.value }}</text>
          <text class="status-card__hint">{{ dashboard.annualLuckyScore.hint }}</text>
        </view>
      </view>
    </view>

    <view class="panel panel--soft">
      <view class="section-head">
        <text class="section-title">会综合这些信息</text>
        <text class="section-side">{{ profileReady ? '已具备生成条件' : '还差资料' }}</text>
      </view>

      <view class="info-grid">
        <view class="info-card">
          <text class="info-card__label">星座</text>
          <text class="info-card__value">{{ profile?.zodiac || '未完善' }}</text>
        </view>
        <view class="info-card">
          <text class="info-card__label">主导元素</text>
          <text class="info-card__value">{{ dominantElement }}</text>
        </view>
        <view class="info-card">
          <text class="info-card__label">出生时间</text>
          <text class="info-card__value">{{ profile?.birthTime || '未填写' }}</text>
        </view>
        <view class="info-card">
          <text class="info-card__label">今日幸运签</text>
          <text class="info-card__value">{{ dashboard.todayLuckySign.tag }}</text>
        </view>
      </view>

      <text class="body-text">{{ profile?.baziSummary || '补齐生日与出生时间后，会生成更完整的命理摘要。' }}</text>
      <view class="tip-list">
        <text v-for="item in posterHighlights" :key="item" class="tip-item">{{ item }}</text>
      </view>
    </view>

    <view class="panel">
      <view class="section-head">
        <text class="section-title">生成高清分享图</text>
        <text class="section-side">智普背景 + 结构化文案</text>
      </view>

      <text class="body-text">
        生成时会优先结合你的星座、五行倾向、今日幸运指数与签语，再叠加适合社交传播的视觉布局，避免只有好看背景、没有内容重点。
      </text>

      <view class="action-row">
        <button
          class="hero-button hero-button--primary"
          :loading="loading || contextLoading"
          @tap="handlePrimaryAction"
        >
          {{ primaryActionLabel }}
        </button>
        <button class="hero-button hero-button--secondary" @tap="backHome">回到首页</button>
      </view>
    </view>

    <view v-if="poster" class="panel">
      <view class="section-head">
        <text class="section-title">海报预览</text>
        <text class="section-side">{{ poster.width }} × {{ poster.height }}</text>
      </view>

      <image class="poster-image" :src="poster.imageDataUrl" mode="widthFix" />

      <view class="action-row action-row--triple">
        <button class="hero-button hero-button--secondary" @tap="previewGeneratedPoster">
          大图预览
        </button>
        <button class="hero-button hero-button--primary" @tap="saveGeneratedPoster">
          保存到手机
        </button>
        <button
          v-if="isMpWeixin"
          class="hero-button hero-button--ghost"
          @tap="shareGeneratedPoster"
        >
          微信发好友
        </button>
      </view>
    </view>

    <view v-if="poster" class="panel panel--soft">
      <text class="section-title">生成信息</text>
      <text class="body-text">视觉主题：{{ poster.themeName }}</text>
      <text class="body-text">生成时间：{{ formatDateTime(poster.generatedAt) }}</text>
      <text class="helper-text">如果微信当前版本不支持直接发图，保存到相册后发送给好友会最稳。</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad, onShow } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import { fetchMe } from '../../../api/auth';
import { generateTodayIndexPosterAsync } from '../../../api/posters';
import { useThemePreference } from '../../../composables/useThemePreference';
import { getErrorMessage, handleAuthExpired } from '../../../services/errors';
import {
  handlePosterImageError,
  previewPosterImage,
  savePosterImage,
  sharePosterImageToWechat,
} from '../../../services/poster-image';
import { getAuthToken, getCachedUser, setCachedUser } from '../../../services/session';
import { useDashboardStore } from '../../../stores/dashboard';
import type { UserProfile } from '../../../types/auth';
import type { GeneratedPoster } from '../../../types/poster';

const dashboardStore = useDashboardStore();
const authToken = ref(getAuthToken());
const profile = ref<UserProfile | null>(getCachedUser());
const poster = ref<GeneratedPoster | null>(null);
const loading = ref(false);
const contextLoading = ref(false);
const autoGenerate = ref(false);
const { themeVars } = useThemePreference();
const isMpWeixin = String(
  (uni.getSystemInfoSync() as { uniPlatform?: string }).uniPlatform ?? '',
).toLowerCase() === 'mp-weixin';

const dashboard = computed(() => dashboardStore.dashboard);
const isLoggedIn = computed(() => Boolean(authToken.value));
const profileReady = computed(() => Boolean(profile.value?.birthday && profile.value?.zodiac));
const dominantElement = computed(() => {
  const entries = Object.entries(profile.value?.fiveElements ?? {});

  if (!entries.length) {
    return '木';
  }

  return entries.sort((left, right) => right[1] - left[1])[0][0];
});

const profileChips = computed(() => {
  const chips = [
    profile.value?.nickname || '',
    profile.value?.zodiac || '待完善星座',
    `${dominantElement.value}元素`,
    profile.value?.birthTime ? `${profile.value.birthTime} 出生` : '未填写出生时辰',
  ].filter(Boolean);

  return chips.slice(0, 4);
});

const posterHighlights = computed(() =>
  [
    dashboard.value.todayLuckyScore.hint,
    dashboard.value.annualLuckyScore.hint,
    dashboard.value.todayLuckySign.summary,
  ]
    .filter(Boolean)
    .slice(0, 3),
);

const heroTitle = computed(() => {
  if (!isLoggedIn.value) {
    return '先登录，再生成你的今日分享图';
  }

  if (!profileReady.value) {
    return '补齐生日资料后，才能生成专属分享图';
  }

  return `${profile.value?.nickname || profile.value?.zodiac || '你'}的今日指数分享图`;
});

const heroSummary = computed(() => {
  if (!isLoggedIn.value) {
    return '登录后会把你的今日幸运指数、幸运签、星座与简易八字信息一起拼成适合分享的高清图片。';
  }

  if (!profileReady.value) {
    return '至少补齐生日和星座资料后，系统才能把命理倾向、气运氛围和视觉主题对应起来。';
  }

  return '这张图会优先突出你今天的指数重点、幸运签提醒和适合采取的行动方向，既适合发微信，也适合直接保存。';
});

const primaryActionLabel = computed(() => {
  if (!isLoggedIn.value) {
    return '去登录';
  }

  if (!profileReady.value) {
    return '去完善资料';
  }

  return poster.value ? '重新生成高清图' : '生成今日分享图';
});

async function hydrateContext() {
  authToken.value = getAuthToken();
  profile.value = getCachedUser();

  if (!dashboardStore.loading) {
    await dashboardStore.loadDashboard();
  }

  if (!isLoggedIn.value) {
    return;
  }

  try {
    contextLoading.value = true;
    const response = await fetchMe();
    profile.value = response.data.user;
    setCachedUser(response.data.user);
  } catch (error) {
    if (handleAuthExpired(error, true)) {
      return;
    }

    uni.showToast({
      title: getErrorMessage(error, '资料读取失败'),
      icon: 'none',
    });
  } finally {
    contextLoading.value = false;
  }

  if (autoGenerate.value && profileReady.value && !poster.value) {
    autoGenerate.value = false;
    await generatePoster();
  }
}

function goProfile() {
  uni.navigateTo({
    url: '/pages/profile/index',
  });
}

async function handlePrimaryAction() {
  if (!isLoggedIn.value || !profileReady.value) {
    goProfile();
    return;
  }

  await generatePoster();
}

async function generatePoster() {
  try {
    loading.value = true;
    poster.value = await generateTodayIndexPosterAsync();
    uni.showToast({
      title: '高清分享图已生成',
      icon: 'success',
    });
  } catch (error) {
    if (handleAuthExpired(error, true)) {
      return;
    }

    uni.showToast({
      title: getErrorMessage(error, '分享图生成失败'),
      icon: 'none',
    });
  } finally {
    loading.value = false;
  }
}

async function previewGeneratedPoster() {
  if (!poster.value) {
    return;
  }

  try {
    await previewPosterImage(poster.value.imageDataUrl, poster.value.downloadFileName);
  } catch (error) {
    uni.showToast({
      title: handlePosterImageError(error, '预览失败，请稍后再试'),
      icon: 'none',
    });
  }
}

async function saveGeneratedPoster() {
  if (!poster.value) {
    return;
  }

  try {
    await savePosterImage(poster.value.imageDataUrl, poster.value.downloadFileName);
    uni.showToast({
      title: typeof window !== 'undefined' ? '已开始下载' : '已保存到相册',
      icon: 'success',
    });
  } catch (error) {
    uni.showToast({
      title: handlePosterImageError(error, '保存失败，请稍后再试'),
      icon: 'none',
    });
  }
}

async function shareGeneratedPoster() {
  if (!poster.value) {
    return;
  }

  try {
    await sharePosterImageToWechat(poster.value.imageDataUrl, poster.value.downloadFileName);
  } catch (error) {
    uni.showToast({
      title: handlePosterImageError(error, '当前微信版本暂不支持直接发图，请先保存到相册'),
      icon: 'none',
    });
  }
}

function backHome() {
  uni.reLaunch({
    url: '/pages/index/index',
  });
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hour = `${date.getHours()}`.padStart(2, '0');
  const minute = `${date.getMinutes()}`.padStart(2, '0');
  return `${month}-${day} ${hour}:${minute}`;
}

onLoad((options) => {
  autoGenerate.value = options?.auto === '1';
  void hydrateContext();
});

onShow(() => {
  void hydrateContext();
});
</script>

<style lang="scss">
.page {
  min-height: 100vh;
  padding: 24rpx;
  background:
    radial-gradient(circle at top left, var(--theme-glow), transparent 26%),
    linear-gradient(180deg, var(--theme-page-top) 0%, var(--theme-page-bottom) 100%);
}

.page-orb {
  position: fixed;
  border-radius: 999rpx;
  filter: blur(28rpx);
  pointer-events: none;
}

.page-orb--blue {
  top: 36rpx;
  right: -70rpx;
  width: 280rpx;
  height: 280rpx;
  background: rgba(125, 174, 255, 0.26);
}

.page-orb--gold {
  top: 480rpx;
  left: -48rpx;
  width: 220rpx;
  height: 220rpx;
  background: rgba(241, 191, 102, 0.18);
}

.panel {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 18rpx;
  margin-bottom: 20rpx;
  padding: 28rpx;
  border-radius: 32rpx;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: var(--apple-shadow);
}

.panel--soft {
  background: rgba(246, 249, 252, 0.94);
}

.hero-panel {
  background:
    radial-gradient(circle at top right, rgba(138, 194, 255, 0.24), transparent 34%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.96) 0%, rgba(244, 248, 255, 0.98) 100%);
}

.eyebrow,
.status-card__label,
.info-card__label,
.section-side,
.helper-text {
  font-size: 20rpx;
  letter-spacing: 0.24em;
  color: var(--apple-subtle);
}

.title,
.section-title {
  font-size: 42rpx;
  line-height: 1.2;
  font-weight: 700;
  color: var(--apple-text);
}

.summary,
.body-text,
.info-card__value,
.tip-item,
.status-card__hint {
  font-size: 28rpx;
  line-height: 1.68;
  color: var(--apple-text);
}

.chip-row,
.status-grid,
.info-grid,
.action-row,
.tip-list {
  display: grid;
  gap: 16rpx;
}

.chip-row {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.chip {
  padding: 12rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(233, 243, 255, 0.94);
  color: #4770ab;
  font-size: 22rpx;
  text-align: center;
}

.status-grid,
.info-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.status-card,
.info-card {
  display: grid;
  gap: 10rpx;
  padding: 22rpx;
  border-radius: 24rpx;
  background: rgba(247, 250, 253, 0.9);
}

.status-card__value {
  font-size: 52rpx;
  line-height: 1;
  font-weight: 700;
  color: var(--apple-text);
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.action-row {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.action-row--triple {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.hero-button {
  min-height: 78rpx;
  padding: 0 24rpx;
  border-radius: 999rpx;
  line-height: 78rpx;
  font-size: 26rpx;
  font-weight: 600;
}

.hero-button::after {
  border: none;
}

.hero-button--primary {
  color: #ffffff;
  background: linear-gradient(135deg, #72a7ff 0%, #5b8def 100%);
  box-shadow: 0 14rpx 32rpx rgba(91, 141, 239, 0.22);
}

.hero-button--secondary,
.hero-button--ghost {
  color: var(--apple-text);
  background: rgba(240, 245, 251, 0.96);
}

.poster-image {
  width: 100%;
  border-radius: 28rpx;
  overflow: hidden;
}

@media (max-width: 720px) {
  .action-row--triple {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
