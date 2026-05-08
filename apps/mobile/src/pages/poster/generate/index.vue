<template>
  <view class="page" :style="themeVars">
    <view class="hero-panel">
      <text class="eyebrow">share poster</text>
      <text class="title">{{ pageTitle }}</text>
      <text class="summary">{{ pageSummary }}</text>

      <view class="source-grid">
        <view v-for="item in sourceDetails" :key="item.label" class="source-item">
          <text class="source-item__label">{{ item.label }}</text>
          <text class="source-item__value">{{ item.value }}</text>
        </view>
      </view>

      <button
        class="primary-button"
        :loading="contextLoading || generating"
        @tap="handlePrimaryAction"
      >
        {{ primaryActionLabel }}
      </button>
    </view>

    <view class="preview-panel">
      <view class="section-head">
        <view>
          <text class="section-kicker">poster preview</text>
          <text class="section-title">{{ previewTitle }}</text>
        </view>
        <text class="section-side">{{ posterSizeLabel }}</text>
      </view>

      <view v-if="posterImageSource" class="poster-stage">
        <image
          class="poster-image"
          :src="posterImageSource"
          mode="widthFix"
          @tap="previewGeneratedPoster"
        />
      </view>
      <view v-else class="empty-preview">
        <text class="empty-preview__title">{{ emptyPreviewTitle }}</text>
        <text class="empty-preview__text">{{ emptyPreviewText }}</text>
      </view>

      <view v-if="hasPoster" class="action-grid">
        <button class="tool-button tool-button--secondary" @tap="previewGeneratedPoster">
          全屏预览
        </button>
        <button class="tool-button tool-button--primary" @tap="saveGeneratedPoster">
          保存到手机
        </button>
        <button
          v-if="isMpWeixin"
          class="tool-button tool-button--ghost"
          @tap="shareGeneratedPoster"
        >
          微信发好友
        </button>
      </view>
    </view>

    <view class="detail-panel">
      <text class="section-title">生成信息</text>
      <view class="detail-list">
        <text class="detail-item">来源：{{ sourceTitle }}</text>
        <text class="detail-item">主题：{{ sourceThemeLabel }}</text>
        <text class="detail-item">状态：{{ statusText }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad, onShow } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import { fetchMe } from '../../../api/auth';
import { fetchLuckySignDetail } from '../../../api/lucky';
import {
  generateLuckySignPosterAsync,
  generateReportPosterAsync,
  generateTodayIndexPosterAsync,
  generateZodiacTodayPosterAsync,
} from '../../../api/posters';
import { fetchReport } from '../../../api/reports';
import { fetchZodiacToday } from '../../../api/zodiac';
import { useThemePreference } from '../../../composables/useThemePreference';
import { useDashboardStore } from '../../../stores/dashboard';
import { getErrorMessage, handleAuthExpired } from '../../../services/errors';
import {
  formatDivinationDate,
  getDivinationResult,
  getOrCreateTodayDivinationResult,
} from '../../../services/divination';
import {
  DIVINATION_POSTER_HEIGHT,
  DIVINATION_POSTER_WIDTH,
  generateDivinationSharePoster,
  getWechatPosterRuntime,
} from '../../../services/divination-poster';
import {
  handlePosterImageError,
  previewPosterImage,
  resolvePreferredImageSource,
  savePosterImage,
  sharePosterImageToWechat,
} from '../../../services/poster-image';
import {
  getAuthToken,
  getCachedUser,
  setCachedUser,
} from '../../../services/session';
import type { UserProfile } from '../../../types/auth';
import type { DivinationResult } from '../../../types/divination';
import type { GeneratedPoster } from '../../../types/poster';
import type { UnifiedReport } from '../../../types/report';

type PosterGenerateType = 'today' | 'report' | 'zodiac' | 'lucky_sign' | 'divination';
type PosterSize = GeneratedPoster['size'];

const typeLabels: Record<PosterGenerateType, string> = {
  today: '今日综合',
  report: '报告海报',
  zodiac: '星座海报',
  lucky_sign: '幸运签',
  divination: '占卜海报',
};
const allowedTypes: PosterGenerateType[] = [
  'today',
  'report',
  'zodiac',
  'lucky_sign',
  'divination',
];
const allowedSizes: PosterSize[] = ['1280x1280', '1080x1440', '1088x1472', '941x1672'];

const dashboardStore = useDashboardStore();
const { themeVars } = useThemePreference();
const authToken = ref(getAuthToken());
const profile = ref<UserProfile | null>(getCachedUser());
const posterType = ref<PosterGenerateType>('today');
const recordId = ref('');
const bizCode = ref('');
const resultId = ref('');
const requestedSize = ref<PosterSize | ''>('');
const autoGenerate = ref(false);
const autoTriggered = ref(false);
const contextLoading = ref(false);
const generating = ref(false);
const sourceTitle = ref('生成分享海报');
const sourceSummary = ref('一张适合保存、分享和发给好友的高清图片。');
const sourceMeta = ref('准备生成');
const sourceTheme = ref('');
const report = ref<UnifiedReport | null>(null);
const divinationResult = ref<DivinationResult | null>(null);
const remotePoster = ref<GeneratedPoster | null>(null);
const localPosterPath = ref('');

const isMpWeixin = String(
  (uni.getSystemInfoSync() as { uniPlatform?: string }).uniPlatform ?? '',
).toLowerCase() === 'mp-weixin';

const dashboard = computed(() => dashboardStore.dashboard);
const isLoggedIn = computed(() => Boolean(authToken.value));
const profileReady = computed(() =>
  Boolean(
    profile.value?.birthday &&
      profile.value?.birthTime &&
      profile.value?.birthPlace &&
      profile.value?.zodiac &&
      profile.value?.gender !== 'unknown',
  ),
);
const posterImageSource = computed(() => {
  if (localPosterPath.value) {
    return localPosterPath.value;
  }

  return remotePoster.value ? resolvePreferredImageSource(remotePoster.value) : '';
});
const hasPoster = computed(() => Boolean(posterImageSource.value));
const pageTitle = computed(() => {
  const mapping: Record<PosterGenerateType, string> = {
    today: '生成今日分享海报',
    report: '生成专属报告海报',
    zodiac: '生成星座分享海报',
    lucky_sign: '生成幸运签海报',
    divination: '生成占卜结果海报',
  };

  return mapping[posterType.value];
});
const pageSummary = computed(() => sourceSummary.value);
const previewTitle = computed(() =>
  hasPoster.value ? remotePoster.value?.title || sourceTitle.value : sourceTitle.value,
);
const sourceThemeLabel = computed(() => sourceTheme.value || remotePoster.value?.themeName || '跟随当前主题');
const statusText = computed(() => {
  if (generating.value) {
    return '正在生成高清图片';
  }

  if (hasPoster.value) {
    return '已生成，可预览或保存';
  }

  if (contextLoading.value) {
    return '正在整理来源内容';
  }

  return '等待生成';
});
const posterSizeLabel = computed(() => {
  if (remotePoster.value) {
    return `${remotePoster.value.width} × ${remotePoster.value.height}`;
  }

  if (posterType.value === 'divination') {
    return `${DIVINATION_POSTER_WIDTH} × ${DIVINATION_POSTER_HEIGHT}`;
  }

  return requestedSize.value || defaultSizeLabel.value;
});
const defaultSizeLabel = computed(() => {
  if (posterType.value === 'report' && report.value?.recordType === 'bazi') {
    return '941x1672';
  }

  if (posterType.value === 'zodiac') {
    return '941x1672';
  }

  return '1088x1472';
});
const sourceDetails = computed(() =>
  [
    { label: '类型', value: typeLabels[posterType.value] },
    { label: '来源', value: sourceMeta.value },
    { label: '尺寸', value: posterSizeLabel.value },
  ].filter((item) => item.value),
);
const emptyPreviewTitle = computed(() => {
  if (contextLoading.value) {
    return '正在准备海报内容';
  }

  if (!canGenerate.value) {
    return '还差一点信息';
  }

  return '点击生成分享海报';
});
const emptyPreviewText = computed(() => {
  if (posterType.value === 'today' && !isLoggedIn.value) {
    return '登录后会把今日指数、幸运签和个人资料组合成一张高清分享图。';
  }

  if (posterType.value === 'today' && !profileReady.value) {
    return '补齐生日、出生时间、出生地和星座后，可以生成更完整的今日海报。';
  }

  if (posterType.value === 'report' && !recordId.value) {
    return '需要从一份已保存的结果进入，才能生成报告海报。';
  }

  return '生成后会在这里展示高清预览，并提供保存和微信发送。';
});
const canGenerate = computed(() => {
  if (posterType.value === 'today') {
    return isLoggedIn.value && profileReady.value;
  }

  if (posterType.value === 'report') {
    return isLoggedIn.value && Boolean(recordId.value);
  }

  if (posterType.value === 'divination') {
    return Boolean(divinationResult.value);
  }

  return Boolean(bizCode.value);
});
const primaryActionLabel = computed(() => {
  if (contextLoading.value) {
    return '正在准备';
  }

  if (generating.value) {
    return '正在生成';
  }

  if ((posterType.value === 'today' || posterType.value === 'report') && !isLoggedIn.value) {
    return '去登录';
  }

  if (posterType.value === 'today' && !profileReady.value) {
    return '去完善资料';
  }

  if (!canGenerate.value) {
    return '返回来源页面';
  }

  return hasPoster.value ? '重新生成海报' : '生成分享海报';
});

function decodeRouteValue(value: unknown) {
  if (typeof value !== 'string') {
    return '';
  }

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizePosterType(value: unknown): PosterGenerateType {
  const normalized = decodeRouteValue(value) as PosterGenerateType;
  return allowedTypes.includes(normalized) ? normalized : 'today';
}

function normalizePosterSize(value: unknown) {
  const normalized = decodeRouteValue(value) as PosterSize;
  return allowedSizes.includes(normalized) ? normalized : '';
}

async function hydrateSource() {
  contextLoading.value = true;

  try {
    switch (posterType.value) {
      case 'report':
        await hydrateReportSource();
        break;
      case 'zodiac':
        await hydrateZodiacSource();
        break;
      case 'lucky_sign':
        await hydrateLuckySignSource();
        break;
      case 'divination':
        hydrateDivinationSource();
        break;
      default:
        await hydrateTodaySource();
        break;
    }
  } finally {
    contextLoading.value = false;
    await triggerAutoGenerate();
  }
}

async function hydrateTodaySource() {
  sourceTitle.value = '今日分享海报';
  sourceSummary.value = dashboard.value.todayFortuneSummary || '把今日指数、幸运签和个人状态整理成一张高清分享图。';
  sourceMeta.value = '今日综合状态';
  sourceTheme.value = dashboard.value.todayLuckySign.themeName || '';

  if (!dashboardStore.loading) {
    await dashboardStore.loadDashboard();
  }

  sourceSummary.value = dashboard.value.todayFortuneSummary || sourceSummary.value;
  sourceTheme.value = dashboard.value.todayLuckySign.themeName || sourceTheme.value;

  authToken.value = getAuthToken();
  profile.value = getCachedUser();

  if (!isLoggedIn.value) {
    return;
  }

  try {
    const response = await fetchMe();
    profile.value = response.data.user;
    setCachedUser(response.data.user);
  } catch (error) {
    handleAuthExpired(error, false);
  }

  const displayName = profile.value?.nickname || profile.value?.zodiac || '你';
  sourceTitle.value = `${displayName}的今日分享海报`;
  sourceMeta.value = profileReady.value ? '资料已完整' : '资料待完善';
}

async function hydrateReportSource() {
  sourceTitle.value = '专属报告海报';
  sourceSummary.value = '从已保存的结果里提炼重点，生成适合分享的报告海报。';
  sourceMeta.value = recordId.value ? '已选中报告' : '缺少报告';

  if (!recordId.value || !isLoggedIn.value) {
    return;
  }

  try {
    const response = await fetchReport(recordId.value);
    report.value = response.data.report;
    sourceTitle.value = response.data.report.sharePoster.title || response.data.report.title;
    sourceSummary.value = response.data.report.sharePoster.subtitle || response.data.report.summary;
    sourceMeta.value = resolveReportTypeLabel(response.data.report.recordType);
    sourceTheme.value = response.data.report.sharePoster.themeName;
  } catch (error) {
    if (handleAuthExpired(error, false)) {
      return;
    }

    uni.showToast({
      title: getErrorMessage(error, '报告读取失败'),
      icon: 'none',
    });
  }
}

async function hydrateZodiacSource() {
  if (!bizCode.value) {
    bizCode.value = profile.value?.zodiac || '狮子座';
  }

  sourceTitle.value = `${bizCode.value}分享海报`;
  sourceSummary.value = '把今日星座重点整理成一张适合保存和分享的海报。';
  sourceMeta.value = bizCode.value;

  try {
    const response = await fetchZodiacToday(bizCode.value);
    sourceTitle.value = response.data.sharePoster.title || `${response.data.zodiac}今日海报`;
    sourceSummary.value = response.data.sharePoster.subtitle || response.data.theme.summary;
    sourceMeta.value = `${response.data.zodiac} · ${response.data.score.overall}分`;
    sourceTheme.value = response.data.sharePoster.themeName;
  } catch (error) {
    console.warn('load zodiac poster source failed', error);
  }
}

async function hydrateLuckySignSource() {
  if (!bizCode.value) {
    bizCode.value = 'sign-breeze-open';
  }

  sourceTitle.value = '幸运签海报';
  sourceSummary.value = '把今日签语和行动提醒生成一张轻量分享图。';
  sourceMeta.value = bizCode.value;

  try {
    const response = await fetchLuckySignDetail(bizCode.value);
    sourceTitle.value = response.data.sign.sharePoster.title || response.data.sign.title;
    sourceSummary.value = response.data.sign.sharePoster.subtitle || response.data.sign.summary;
    sourceMeta.value = response.data.sign.tag;
    sourceTheme.value = response.data.sign.sharePoster.themeName;
  } catch (error) {
    console.warn('load lucky sign poster source failed', error);
  }
}

function hydrateDivinationSource() {
  divinationResult.value = getDivinationResult(resultId.value) || getOrCreateTodayDivinationResult();
  const result = divinationResult.value;

  if (!result) {
    sourceTitle.value = '占卜结果海报';
    sourceSummary.value = '需要先完成一次占卜，才能生成对应海报。';
    sourceMeta.value = '缺少占卜结果';
    return;
  }

  sourceTitle.value = `${result.hexagram.name}占卜海报`;
  sourceSummary.value = result.summary;
  sourceMeta.value = formatDivinationDate(result.createdAt);
  sourceTheme.value = result.keywords.slice(0, 2).join(' · ');
}

function resolveReportTypeLabel(recordType: string) {
  const mapping: Record<string, string> = {
    personality: '性格测评',
    emotion: '情绪自检',
    bazi: '八字解读',
  };

  return mapping[recordType] || '结果报告';
}

async function triggerAutoGenerate() {
  if (!autoGenerate.value || autoTriggered.value || !canGenerate.value) {
    return;
  }

  autoTriggered.value = true;
  await generatePoster();
}

function handlePrimaryAction() {
  if (contextLoading.value || generating.value) {
    return;
  }

  if ((posterType.value === 'today' || posterType.value === 'report') && !isLoggedIn.value) {
    goProfile();
    return;
  }

  if (posterType.value === 'today' && !profileReady.value) {
    goProfile();
    return;
  }

  if (!canGenerate.value) {
    returnToPreviousPage();
    return;
  }

  void generatePoster();
}

async function generatePoster() {
  if (generating.value) {
    return;
  }

  try {
    generating.value = true;

    if (posterType.value === 'divination') {
      await generateLocalDivinationPoster();
    } else {
      await generateRemotePoster();
    }

    uni.showToast({
      title: '海报已生成',
      icon: 'success',
    });

    setTimeout(() => {
      uni.pageScrollTo({
        scrollTop: 420,
        duration: 260,
      });
    }, 80);
  } catch (error) {
    if (handleAuthExpired(error, true)) {
      return;
    }

    uni.showToast({
      title: getErrorMessage(error, '海报生成失败'),
      icon: 'none',
    });
  } finally {
    generating.value = false;
  }
}

async function generateRemotePoster() {
  localPosterPath.value = '';

  if (posterType.value === 'today') {
    remotePoster.value = await generateTodayIndexPosterAsync();
    return;
  }

  if (posterType.value === 'report') {
    remotePoster.value = await generateReportPosterAsync(recordId.value, resolveReportSize());
    return;
  }

  if (posterType.value === 'zodiac') {
    remotePoster.value = await generateZodiacTodayPosterAsync(bizCode.value);
    return;
  }

  remotePoster.value = await generateLuckySignPosterAsync(bizCode.value);
}

async function generateLocalDivinationPoster() {
  if (!divinationResult.value) {
    throw new Error('缺少占卜结果，请先完成占卜');
  }

  remotePoster.value = null;
  const file = await generateDivinationSharePoster(divinationResult.value);
  localPosterPath.value = file.tempFilePath;
}

function resolveReportSize() {
  if (requestedSize.value) {
    return requestedSize.value;
  }

  return report.value?.recordType === 'bazi' ? '941x1672' : undefined;
}

async function previewGeneratedPoster() {
  if (!posterImageSource.value) {
    return;
  }

  try {
    if (localPosterPath.value) {
      uni.previewImage({
        urls: [localPosterPath.value],
        current: localPosterPath.value,
      });
      return;
    }

    await previewPosterImage(posterImageSource.value, remotePoster.value?.downloadFileName || 'fortune-hub-poster.png');
  } catch (error) {
    uni.showToast({
      title: handlePosterImageError(error, '预览失败，请稍后再试'),
      icon: 'none',
    });
  }
}

async function saveGeneratedPoster() {
  if (!posterImageSource.value) {
    return;
  }

  try {
    if (localPosterPath.value) {
      await saveLocalPoster();
    } else {
      await savePosterImage(posterImageSource.value, remotePoster.value?.downloadFileName || 'fortune-hub-poster.png');
    }

    uni.showToast({
      title: typeof window !== 'undefined' && !localPosterPath.value ? '已开始下载' : '已保存到相册',
      icon: 'success',
    });
  } catch (error) {
    uni.showToast({
      title: handlePosterImageError(error, '保存失败，请稍后再试'),
      icon: 'none',
    });
  }
}

function saveLocalPoster() {
  if (typeof window !== 'undefined') {
    throw new Error('当前平台请先全屏预览后保存图片');
  }

  return new Promise<void>((resolve, reject) => {
    uni.saveImageToPhotosAlbum({
      filePath: localPosterPath.value,
      success: () => resolve(),
      fail: reject,
    });
  });
}

async function shareGeneratedPoster() {
  if (!posterImageSource.value) {
    return;
  }

  try {
    if (localPosterPath.value) {
      await shareLocalPoster();
    } else {
      await sharePosterImageToWechat(
        posterImageSource.value,
        remotePoster.value?.downloadFileName || 'fortune-hub-poster.png',
      );
    }
  } catch (error) {
    uni.showToast({
      title: handlePosterImageError(error, '当前微信版本暂不支持直接发图，请先保存到相册'),
      icon: 'none',
    });
  }
}

function shareLocalPoster() {
  const wxRuntime = getWechatPosterRuntime();

  if (typeof wxRuntime?.showShareImageMenu !== 'function') {
    throw new Error('当前微信版本暂不支持直接发送图片');
  }

  return new Promise<void>((resolve, reject) => {
    wxRuntime.showShareImageMenu?.({
      path: localPosterPath.value,
      success: () => resolve(),
      fail: reject,
    });
  });
}

function goProfile() {
  uni.navigateTo({
    url: '/pages/profile/index',
  });
}

function returnToPreviousPage() {
  if (getCurrentPages().length > 1) {
    uni.navigateBack();
    return;
  }

  uni.reLaunch({
    url: '/pages/index/index',
  });
}

onLoad((options) => {
  posterType.value = normalizePosterType(options?.type);
  recordId.value = decodeRouteValue(options?.recordId);
  bizCode.value = decodeRouteValue(options?.bizCode);
  resultId.value = decodeRouteValue(options?.id);
  requestedSize.value = normalizePosterSize(options?.size);
  autoGenerate.value = decodeRouteValue(options?.auto) === '1';

  void hydrateSource();
});

onShow(() => {
  authToken.value = getAuthToken();
});
</script>

<style lang="scss">
.page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 24rpx 24rpx 56rpx;
  background:
    linear-gradient(180deg, var(--theme-page-top) 0%, #f7fbfa 48%, var(--theme-page-bottom) 100%);
}

.hero-panel,
.preview-panel,
.detail-panel {
  display: grid;
  gap: 18rpx;
  margin-bottom: 20rpx;
  padding: 28rpx;
  border: 1rpx solid rgba(var(--theme-text-primary-rgb), 0.08);
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 18rpx 44rpx rgba(var(--theme-text-primary-rgb), 0.08);
}

.hero-panel {
  padding-top: 34rpx;
}

.eyebrow,
.section-kicker,
.source-item__label {
  display: block;
  font-size: 20rpx;
  text-transform: uppercase;
  color: var(--theme-text-tertiary);
}

.title {
  display: block;
  font-size: 48rpx;
  line-height: 1.15;
  font-weight: 760;
  color: var(--theme-text-primary);
}

.summary,
.empty-preview__text,
.detail-item {
  display: block;
  font-size: 26rpx;
  line-height: 1.7;
  color: var(--theme-text-secondary);
}

.source-grid,
.action-grid,
.detail-list {
  display: grid;
  gap: 14rpx;
}

.source-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.source-item {
  display: grid;
  gap: 8rpx;
  min-height: 92rpx;
  padding: 18rpx;
  border-radius: 20rpx;
  background: rgba(var(--theme-primary-rgb), 0.08);
}

.source-item__value {
  display: block;
  font-size: 24rpx;
  line-height: 1.35;
  color: var(--theme-text-primary);
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.section-title {
  display: block;
  margin-top: 4rpx;
  font-size: 34rpx;
  line-height: 1.25;
  font-weight: 700;
  color: var(--theme-text-primary);
}

.section-side {
  flex-shrink: 0;
  font-size: 22rpx;
  color: var(--theme-text-tertiary);
}

.poster-stage {
  padding: 18rpx;
  border-radius: 28rpx;
  background: rgba(var(--theme-primary-rgb), 0.08);
}

.poster-image {
  width: 100%;
  border-radius: 22rpx;
  overflow: hidden;
  vertical-align: top;
}

.empty-preview {
  display: grid;
  place-items: center;
  gap: 12rpx;
  min-height: 620rpx;
  padding: 34rpx;
  border: 2rpx dashed rgba(var(--theme-primary-rgb), 0.28);
  border-radius: 28rpx;
  text-align: center;
  background:
    linear-gradient(150deg, rgba(255, 255, 255, 0.78) 0%, rgba(var(--theme-primary-rgb), 0.08) 100%);
}

.empty-preview__title {
  display: block;
  font-size: 34rpx;
  font-weight: 700;
  color: var(--theme-text-primary);
}

.primary-button,
.tool-button {
  min-height: 86rpx;
  border-radius: 999rpx;
  line-height: 86rpx;
  font-size: 28rpx;
  font-weight: 650;
}

.primary-button::after,
.tool-button::after {
  border: none;
}

.primary-button,
.tool-button--primary {
  color: #ffffff;
  background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-accent) 100%);
}

.tool-button--secondary {
  color: var(--theme-text-primary);
  background: rgba(247, 250, 252, 0.96);
}

.tool-button--ghost {
  color: var(--theme-primary);
  background: rgba(var(--theme-primary-rgb), 0.1);
}

.detail-list {
  padding-top: 4rpx;
}
</style>
