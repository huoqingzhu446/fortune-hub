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

      <view
        v-if="hasPoster"
        class="action-grid"
        :class="{ 'action-grid--three': isMpWeixin }"
      >
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
import { generateReportPosterAsync } from '../../../api/posters';
import { fetchReport } from '../../../api/reports';
import { useThemePreference } from '../../../composables/useThemePreference';
import { getErrorMessage, handleAuthExpired } from '../../../services/errors';
import {
  handlePosterImageError,
  previewPosterImage,
  resolvePreferredImageSource,
  savePosterImage,
  sharePosterImageToWechat,
} from '../../../services/poster-image';
import {
  getAuthToken,
} from '../../../services/session';
import type { GeneratedPoster } from '../../../types/poster';
import type { UnifiedReport } from '../../../types/report';

type PosterGenerateType = 'report';
type PosterSize = GeneratedPoster['size'];

const typeLabels: Record<PosterGenerateType, string> = {
  report: '报告海报',
};
const allowedTypes: PosterGenerateType[] = ['report'];
const allowedSizes: PosterSize[] = ['1280x1280', '1080x1440', '1088x1472', '941x1672'];
const posterThemeLabelMap: Record<string, string> = {
  'calm-amber': '安静琥珀',
  'earth-sand': '厚土砂金',
  'fresh-mint': '清新薄荷',
  'moon-silver': '月光银',
  'ocean-water': '海水蓝',
  'oriental-gold': '东方金韵',
  'sage-stone': '鼠尾草石色',
  'sky-current': '星空流光',
  'sunset-ember': '夕照暖焰',
  'verdant-mint': '草木薄荷',
  'warm-amber': '暖阳琥珀',
};

const { themeVars } = useThemePreference();
const authToken = ref(getAuthToken());
const posterType = ref<PosterGenerateType>('report');
const recordId = ref('');
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
const remotePoster = ref<GeneratedPoster | null>(null);
const localPosterPath = ref('');
const isMpWeixin = String(
  (uni.getSystemInfoSync() as { uniPlatform?: string }).uniPlatform ?? '',
).toLowerCase() === 'mp-weixin';
const isLoggedIn = computed(() => Boolean(authToken.value));
const posterImageSource = computed(() => {
  if (localPosterPath.value) {
    return localPosterPath.value;
  }

  return remotePoster.value ? resolvePreferredImageSource(remotePoster.value) : '';
});
const hasPoster = computed(() => Boolean(posterImageSource.value));
const pageTitle = computed(() => {
  const mapping: Record<PosterGenerateType, string> = {
    report: '生成专属报告海报',
  };

  return mapping[posterType.value];
});
const pageSummary = computed(() => sourceSummary.value);
const previewTitle = computed(() =>
  hasPoster.value ? remotePoster.value?.title || sourceTitle.value : sourceTitle.value,
);
const sourceThemeLabel = computed(() => {
  const themeName = sourceTheme.value || remotePoster.value?.themeName || '';
  return formatPosterThemeLabel(themeName) || '跟随当前主题';
});
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

  return requestedSize.value || defaultSizeLabel.value;
});
const defaultSizeLabel = computed(() => {
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
  if (posterType.value === 'report' && !recordId.value) {
    return '需要从一份已保存的结果进入，才能生成报告海报。';
  }

  return '生成后会在这里展示高清预览，并提供保存和微信发送。';
});
const canGenerate = computed(() => {
  return isLoggedIn.value && Boolean(recordId.value);
});
const primaryActionLabel = computed(() => {
  if (contextLoading.value) {
    return '正在准备';
  }

  if (generating.value) {
    return '正在生成';
  }

  if (posterType.value === 'report' && !isLoggedIn.value) {
    return '去登录';
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
  return allowedTypes.includes(normalized) ? normalized : 'report';
}

function normalizePosterSize(value: unknown) {
  const normalized = decodeRouteValue(value) as PosterSize;
  return allowedSizes.includes(normalized) ? normalized : '';
}

function formatPosterThemeLabel(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    return '';
  }

  if (/[^\x00-\x7F]/.test(normalized)) {
    return normalized;
  }

  const key = normalized.toLowerCase().replace(/_/g, '-');

  if (posterThemeLabelMap[key]) {
    return posterThemeLabelMap[key];
  }

  return key.includes('-') ? '自定义视觉' : normalized;
}

async function hydrateSource() {
  contextLoading.value = true;

  try {
    await hydrateReportSource();
  } finally {
    contextLoading.value = false;
    await triggerAutoGenerate();
  }
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
    if (!['emotion', 'personality'].includes(response.data.report.recordType)) {
      sourceTitle.value = '该报告海报已下线';
      sourceSummary.value = '当前审核版不再提供该类报告海报生成能力。';
      sourceMeta.value = '不可生成';
      return;
    }
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

function resolveReportTypeLabel(recordType: string) {
  const mapping: Record<string, string> = {
    personality: '性格测评',
    emotion: '情绪自检',
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

  if (posterType.value === 'report' && !isLoggedIn.value) {
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

    await generateRemotePoster();

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
  remotePoster.value = await generateReportPosterAsync(recordId.value, resolveReportSize());
}

function resolveReportSize() {
  if (requestedSize.value) {
    return requestedSize.value;
  }

  return undefined;
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
  throw new Error('当前版本不支持本地海报直接发送');
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

.action-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.action-grid--three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
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
  font-size: 28rpx;
  font-weight: 650;
}

.primary-button {
  line-height: 86rpx;
}

.tool-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 78rpx;
  box-sizing: border-box;
  margin: 0;
  padding: 0 10rpx;
  font-size: 25rpx;
  line-height: 1.2;
  white-space: nowrap;
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
