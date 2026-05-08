<template>
  <view class="page" :style="themeVars">
    <template v-if="report">
      <view class="report-hero" :class="`report-hero--${statusTone}`">
        <view class="report-hero__top">
          <view class="report-hero__copy">
            <text class="eyebrow">{{ reportTypeLabel }}</text>
            <text class="report-hero__title">{{ report.statusIndex.levelLabel }}</text>
            <text class="report-hero__summary">{{ report.summary || report.subtitle }}</text>
          </view>

          <button
            class="favorite-button"
            :class="{ 'favorite-button--active': favoriteActive }"
            :loading="favoriteLoading"
            @tap="toggleReportFavorite"
          >
            {{ favoriteActive ? '已收藏' : '收藏' }}
          </button>
        </view>

        <view class="index-panel">
          <view>
            <text class="index-panel__label">{{ report.statusIndex.label }}</text>
            <view class="index-panel__number-line">
              <text class="index-panel__number">{{ report.statusIndex.value }}</text>
              <text class="index-panel__denominator">/ {{ report.statusIndex.maxValue }}</text>
            </view>
          </view>

          <view class="index-panel__meta">
            <text>{{ report.statusIndex.rawLabel }}</text>
            <text>{{ report.statusIndex.sourceLabel }}</text>
          </view>
        </view>

        <view class="score-track">
          <view class="score-track__fill" :style="{ width: `${statusPercent}%` }"></view>
        </view>
      </view>
    </template>

    <view v-else class="empty-hero">
      <text class="eyebrow">报告</text>
      <text class="empty-hero__title">{{ heroTitle }}</text>
      <text class="empty-hero__text">{{ heroSubtitle }}</text>
    </view>

    <view v-if="loading" class="state-section">
      <text class="state-section__title">正在读取报告</text>
      <text class="state-section__text">同步结果、权益和海报信息。</text>
    </view>

    <view v-else-if="!isLoggedIn" class="state-section">
      <text class="state-section__title">登录后查看报告</text>
      <text class="state-section__text">报告、历史记录和海报需要登录。</text>
      <button class="action-button action-button--primary" @tap="goProfile">去个人中心</button>
    </view>

    <view v-else-if="!recordId" class="state-section">
      <text class="state-section__title">没有选中报告</text>
      <text class="state-section__text">从一次自检或历史记录进入。</text>
      <view class="button-row">
        <button class="action-button action-button--primary" @tap="goEmotion">去自检</button>
        <button class="action-button action-button--secondary" @tap="goRecords">看记录</button>
      </view>
    </view>

    <view v-else-if="!report" class="state-section">
      <text class="state-section__title">报告读取失败</text>
      <text class="state-section__text">记录可能不存在，或当前账号无权访问。</text>
      <button class="action-button action-button--primary" @tap="goRecords">看记录</button>
    </view>

    <template v-else>
      <view class="report-section">
        <view class="section-head">
          <text class="section-head__title">指数怎么来</text>
          <text class="section-head__side">{{ completedAtLabel }}</text>
        </view>

        <view class="formula-row">
          <text class="formula-row__label">计算</text>
          <text class="formula-row__value">{{ report.statusIndex.formula }}</text>
        </view>

        <view class="basis-list">
          <view v-for="item in report.statusIndex.notes" :key="item" class="basis-row">
            <view class="basis-row__dot"></view>
            <text class="basis-row__text">{{ item }}</text>
          </view>
        </view>
      </view>

      <view class="report-section">
        <view class="section-head">
          <text class="section-head__title">状态维度</text>
          <text class="section-head__side">{{ report.stateDimensions.length }} 项</text>
        </view>

        <view class="dimension-list">
          <view
            v-for="item in report.stateDimensions"
            :key="item.key"
            class="dimension-row"
            :class="`dimension-row--${item.tone}`"
          >
            <view class="dimension-row__head">
              <view>
                <text class="dimension-row__label">{{ item.label }}</text>
                <text class="dimension-row__summary">{{ item.summary }}</text>
              </view>
              <text class="dimension-row__value">{{ item.value }}</text>
            </view>
            <view class="dimension-row__track">
              <view class="dimension-row__fill" :style="{ width: `${item.percent}%` }"></view>
            </view>
            <text class="dimension-row__evidence">{{ item.evidence }}</text>
          </view>
        </view>
      </view>

      <view class="report-section">
        <view class="section-head">
          <text class="section-head__title">现在处理</text>
          <text class="section-head__side">{{ accessLabel }}</text>
        </view>

        <view class="primary-action">
          <text class="primary-action__label">{{ primaryActionTitle }}</text>
          <text class="primary-action__text">{{ primaryActionText }}</text>
        </view>

        <view class="action-list">
          <text v-for="item in actionItems" :key="item" class="action-list__item">{{ item }}</text>
        </view>
      </view>

      <view v-if="report.access.isFullReportUnlocked" class="report-section">
        <view class="section-head">
          <text class="section-head__title">深度拆解</text>
          <text class="section-head__side">已解锁</text>
        </view>

        <view class="detail-list">
          <view v-for="item in report.fullSections" :key="item.title" class="detail-block">
            <text class="detail-block__title">{{ item.title }}</text>
            <text class="detail-block__summary">{{ item.summary }}</text>
            <text v-for="bullet in item.bullets" :key="bullet" class="detail-block__bullet">
              {{ bullet }}
            </text>
          </view>
        </view>
      </view>

      <view v-else class="report-section report-section--locked">
        <view class="section-head">
          <text class="section-head__title">深度拆解</text>
          <text class="section-head__side">未解锁</text>
        </view>

        <view class="detail-list">
          <view
            v-for="item in report.lockedPreviewSections"
            :key="item.title"
            class="detail-block"
          >
            <text class="detail-block__title">{{ item.title }}</text>
            <text class="detail-block__summary">{{ item.summary }}</text>
          </view>
        </view>

        <button class="action-button action-button--primary" @tap="goMembership">解锁完整拆解</button>
      </view>

      <view class="share-strip">
        <view>
          <text class="share-strip__title">分享海报</text>
          <text class="share-strip__text">{{ report.sharePoster.title }} · {{ report.sharePoster.themeName }}</text>
        </view>
        <button class="share-strip__button" @tap="openPosterGenerate">生成</button>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { onLoad, onShow } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import { fetchUnifiedHistory } from '../../api/records';
import { fetchReport } from '../../api/reports';
import { useFavoriteToggle } from '../../composables/useFavoriteToggle';
import { useThemePreference } from '../../composables/useThemePreference';
import { getErrorMessage } from '../../services/errors';
import { getAuthToken } from '../../services/session';
import type { ReportSection, UnifiedReport } from '../../types/report';

const authToken = ref(getAuthToken());
const recordId = ref('');
const loading = ref(false);
const report = ref<UnifiedReport | null>(null);
const {
  favoriteActive,
  favoriteLoading,
  syncFavoriteState,
  toggleCurrent,
} = useFavoriteToggle();
const { themeVars } = useThemePreference();

const isLoggedIn = computed(() => Boolean(authToken.value));
const heroTitle = computed(() => {
  if (report.value) {
    return report.value.statusIndex.levelLabel;
  }

  if (loading.value) {
    return '正在读取报告';
  }

  return recordId.value ? '报告' : '选择一份报告';
});
const heroSubtitle = computed(() => {
  if (report.value) {
    return report.value.summary || report.value.subtitle || '报告已生成。';
  }

  if (loading.value) {
    return '正在同步结果和权益。';
  }

  if (!isLoggedIn.value) {
    return '登录后查看报告、历史记录和海报。';
  }

  return recordId.value ? '正在整理这份报告。' : '先从自检或历史记录进入。';
});
const reportTypeLabel = computed(() => {
  const mapping: Record<string, string> = {
    personality: '性格测评',
    emotion: '情绪自检',
    bazi: '八字解读',
  };

  return mapping[report.value?.recordType || ''] || '结果报告';
});
const statusPercent = computed(() => {
  const statusIndex = report.value?.statusIndex;

  if (!statusIndex) {
    return 0;
  }

  return Math.max(8, Math.min(100, Math.round((statusIndex.value / statusIndex.maxValue) * 100)));
});
const statusTone = computed(() => {
  const value = report.value?.statusIndex.value ?? 0;

  if (value >= 72) {
    return 'positive';
  }

  if (value >= 48) {
    return 'steady';
  }

  return 'watch';
});
const completedAtLabel = computed(() => formatDate(report.value?.statusIndex.updatedAt || report.value?.completedAt));
const accessLabel = computed(() =>
  report.value?.access.isFullReportUnlocked ? '完整版' : '基础版',
);
const primaryActionSection = computed<ReportSection | null>(() => report.value?.baseSections[0] ?? null);
const primaryActionTitle = computed(() => primaryActionSection.value?.title || '优先处理');
const primaryActionText = computed(() => primaryActionSection.value?.summary || report.value?.summary || '先处理最关键的一步。');
const actionItems = computed(() => {
  const sections = report.value?.baseSections ?? [];
  const items = sections.flatMap((section) => section.bullets);
  const uniqueItems = Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));

  return uniqueItems.slice(0, 4);
});

async function loadReport() {
  if (!isLoggedIn.value) {
    report.value = null;
    favoriteActive.value = false;
    return;
  }

  try {
    loading.value = true;
    const targetRecordId = recordId.value || (await resolveLatestRecordId());

    if (!targetRecordId) {
      report.value = null;
      favoriteActive.value = false;
      return;
    }

    recordId.value = targetRecordId;
    const response = await fetchReport(targetRecordId);
    report.value = response.data.report;
    await syncFavoriteState(`report:${targetRecordId}`);
  } catch (error) {
    console.warn('load report failed', error);
    report.value = null;
    uni.showToast({
      title: getErrorMessage(error, '报告读取失败'),
      icon: 'none',
    });
  } finally {
    loading.value = false;
  }
}

async function resolveLatestRecordId() {
  const response = await fetchUnifiedHistory(1);
  return response.data.items[0]?.id || '';
}

async function toggleReportFavorite() {
  if (!report.value || !recordId.value) {
    return;
  }

  await toggleCurrent({
    itemType: 'report',
    itemKey: `report:${recordId.value}`,
    title: report.value.title,
    summary: report.value.summary,
    icon: '报',
    route: `/pages/report/index?recordId=${encodeURIComponent(recordId.value)}`,
    extraJson: {
      recordType: report.value.recordType,
    },
  });
}

function openPosterGenerate() {
  if (!recordId.value) {
    goRecords();
    return;
  }

  const size = report.value?.recordType === 'bazi' ? '941x1672' : '';
  const query = [
    'type=report',
    `recordId=${encodeURIComponent(recordId.value)}`,
    'auto=1',
    size ? `size=${size}` : '',
  ]
    .filter(Boolean)
    .join('&');

  uni.navigateTo({
    url: `/pages/poster/generate/index?${query}`,
  });
}

function formatDate(value: string | undefined) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hour = `${date.getHours()}`.padStart(2, '0');
  const minute = `${date.getMinutes()}`.padStart(2, '0');

  return `${month}.${day} ${hour}:${minute}`;
}

function goMembership() {
  uni.navigateTo({
    url: '/pages/membership/index',
  });
}

function goProfile() {
  uni.navigateTo({
    url: '/pages/profile/index',
  });
}

function goEmotion() {
  uni.navigateTo({
    url: '/pages/emotion/index',
  });
}

function goRecords() {
  uni.navigateTo({
    url: '/pages/records/index',
  });
}

onLoad((options) => {
  recordId.value =
    typeof options?.recordId === 'string' && options.recordId
      ? decodeURIComponent(options.recordId)
      : '';
  void loadReport();
});

onShow(() => {
  const previousToken = authToken.value;
  authToken.value = getAuthToken();

  if (loading.value) {
    return;
  }

  if (recordId.value || (authToken.value && authToken.value !== previousToken)) {
    void loadReport();
  }
});
</script>

<style lang="scss">
.page {
  min-height: 100vh;
  padding: 24rpx;
  background:
    radial-gradient(circle at 0% 0%, rgba(var(--theme-accent-rgb), 0.18), transparent 28%),
    linear-gradient(180deg, #f6f3ed 0%, #eef4f6 48%, #f7f8f4 100%);
  color: #182230;
}

.report-hero,
.empty-hero,
.report-section,
.state-section,
.share-strip {
  box-sizing: border-box;
  border-radius: 16rpx;
}

.report-hero {
  display: grid;
  gap: 28rpx;
  padding: 34rpx 30rpx 28rpx;
  overflow: hidden;
  color: #ffffff;
  background:
    linear-gradient(135deg, rgba(20, 31, 46, 0.96) 0%, rgba(34, 52, 66, 0.96) 58%, rgba(48, 91, 91, 0.94) 100%);
  box-shadow: 0 22rpx 52rpx rgba(31, 43, 57, 0.18);
}

.report-hero--watch {
  background:
    linear-gradient(135deg, rgba(38, 35, 32, 0.97) 0%, rgba(78, 54, 45, 0.96) 56%, rgba(134, 82, 50, 0.92) 100%);
}

.report-hero--positive {
  background:
    linear-gradient(135deg, rgba(20, 45, 48, 0.98) 0%, rgba(31, 77, 74, 0.96) 54%, rgba(64, 130, 104, 0.9) 100%);
}

.report-hero__top,
.index-panel,
.section-head,
.dimension-row__head,
.share-strip {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24rpx;
}

.report-hero__copy {
  display: grid;
  gap: 14rpx;
  min-width: 0;
}

.eyebrow {
  font-size: 20rpx;
  line-height: 1.3;
  letter-spacing: 0;
  color: rgba(255, 255, 255, 0.68);
}

.empty-hero .eyebrow,
.section-head__side {
  color: #6e7a86;
}

.report-hero__title,
.empty-hero__title {
  font-size: 46rpx;
  line-height: 1.15;
  font-weight: 760;
  letter-spacing: 0;
}

.report-hero__summary {
  font-size: 26rpx;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.74);
}

.favorite-button {
  flex: 0 0 auto;
  min-width: 104rpx;
  min-height: 60rpx;
  margin: 0;
  padding: 0 22rpx;
  border-radius: 999rpx;
  line-height: 60rpx;
  font-size: 24rpx;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.16);
}

.favorite-button--active {
  color: #17222d;
  background: #ffffff;
}

.index-panel {
  align-items: flex-end;
}

.index-panel__label,
.formula-row__label {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.66);
}

.index-panel__number-line {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
  margin-top: 4rpx;
}

.index-panel__number {
  font-size: 128rpx;
  line-height: 0.9;
  font-weight: 320;
  font-family:
    'Iowan Old Style',
    'Times New Roman',
    'Noto Serif SC',
    serif;
}

.index-panel__denominator {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.66);
}

.index-panel__meta {
  display: grid;
  gap: 8rpx;
  max-width: 286rpx;
  padding-bottom: 8rpx;
  text-align: right;
  font-size: 22rpx;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.74);
}

.score-track,
.dimension-row__track {
  height: 10rpx;
  border-radius: 999rpx;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.18);
}

.score-track__fill,
.dimension-row__fill {
  height: 100%;
  border-radius: inherit;
  background: #73d7b6;
}

.empty-hero,
.state-section,
.report-section,
.share-strip {
  display: grid;
  gap: 20rpx;
  margin-top: 20rpx;
  padding: 28rpx;
  background: rgba(255, 255, 255, 0.9);
  border: 1rpx solid rgba(255, 255, 255, 0.86);
  box-shadow: 0 14rpx 40rpx rgba(33, 45, 57, 0.08);
}

.empty-hero {
  margin-top: 0;
  background: #202b36;
  color: #ffffff;
}

.empty-hero__text,
.state-section__text,
.detail-block__summary,
.dimension-row__summary,
.dimension-row__evidence,
.share-strip__text {
  font-size: 24rpx;
  line-height: 1.62;
  color: #66727f;
}

.state-section__title,
.section-head__title,
.primary-action__label,
.detail-block__title,
.share-strip__title {
  font-size: 32rpx;
  line-height: 1.32;
  font-weight: 720;
  color: #182230;
}

.section-head {
  align-items: center;
}

.section-head__side {
  flex: 0 0 auto;
  font-size: 22rpx;
}

.formula-row {
  display: grid;
  grid-template-columns: 88rpx minmax(0, 1fr);
  gap: 16rpx;
  padding: 20rpx 0;
  border-top: 1rpx solid rgba(26, 38, 52, 0.08);
  border-bottom: 1rpx solid rgba(26, 38, 52, 0.08);
}

.formula-row__label {
  color: #87919d;
}

.formula-row__value {
  font-size: 26rpx;
  line-height: 1.5;
  color: #182230;
}

.basis-list,
.dimension-list,
.detail-list,
.action-list {
  display: grid;
  gap: 18rpx;
}

.basis-row {
  display: flex;
  align-items: flex-start;
  gap: 14rpx;
}

.basis-row__dot {
  flex: 0 0 auto;
  width: 10rpx;
  height: 10rpx;
  margin-top: 14rpx;
  border-radius: 50%;
  background: #50ad91;
}

.basis-row__text {
  font-size: 25rpx;
  line-height: 1.56;
  color: #354253;
}

.dimension-row {
  display: grid;
  gap: 12rpx;
  padding-bottom: 18rpx;
  border-bottom: 1rpx solid rgba(26, 38, 52, 0.08);
}

.dimension-row:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.dimension-row__head {
  align-items: flex-start;
}

.dimension-row__label {
  display: block;
  margin-bottom: 6rpx;
  font-size: 28rpx;
  font-weight: 680;
  color: #202b36;
}

.dimension-row__value {
  flex: 0 0 auto;
  min-width: 72rpx;
  text-align: right;
  font-size: 40rpx;
  line-height: 1;
  font-family:
    'Iowan Old Style',
    'Times New Roman',
    'Noto Serif SC',
    serif;
  color: #202b36;
}

.dimension-row__track {
  background: rgba(26, 38, 52, 0.08);
}

.dimension-row--positive .dimension-row__fill {
  background: #4fb694;
}

.dimension-row--steady .dimension-row__fill {
  background: #5d8fc5;
}

.dimension-row--watch .dimension-row__fill {
  background: #d2844a;
}

.primary-action {
  display: grid;
  gap: 10rpx;
  padding: 24rpx 0;
  border-top: 1rpx solid rgba(26, 38, 52, 0.08);
  border-bottom: 1rpx solid rgba(26, 38, 52, 0.08);
}

.primary-action__text {
  font-size: 28rpx;
  line-height: 1.58;
  color: #2a3747;
}

.action-list__item,
.detail-block__bullet {
  display: block;
  font-size: 25rpx;
  line-height: 1.58;
  color: #354253;
}

.action-list__item {
  padding-left: 22rpx;
  border-left: 4rpx solid #50ad91;
}

.detail-block {
  display: grid;
  gap: 10rpx;
  padding-bottom: 18rpx;
  border-bottom: 1rpx solid rgba(26, 38, 52, 0.08);
}

.detail-block:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.report-section--locked {
  background: rgba(255, 255, 255, 0.78);
}

.button-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
}

.action-button,
.share-strip__button {
  min-height: 76rpx;
  margin: 0;
  border-radius: 999rpx;
  line-height: 76rpx;
  font-size: 27rpx;
}

.action-button--primary,
.share-strip__button {
  color: #ffffff;
  background: #1d2b39;
}

.action-button--secondary {
  color: #1d2b39;
  background: rgba(29, 43, 57, 0.08);
}

.share-strip {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  margin-bottom: 32rpx;
  background: rgba(29, 43, 57, 0.94);
}

.share-strip__title {
  color: #ffffff;
}

.share-strip__text {
  color: rgba(255, 255, 255, 0.7);
}

.share-strip__button {
  min-width: 128rpx;
  color: #1d2b39;
  background: #ffffff;
}

.favorite-button::after,
.action-button::after,
.share-strip__button::after {
  border: none;
}
</style>
