<template>
  <view class="page" :class="report ? `page--${statusTone}` : ''" :style="themeVars">
    <template v-if="report">
      <view class="hero" :class="`hero--${statusTone}`">
        <view class="hero__top">
          <view>
            <text class="hero__hello">完整报告</text>
            <text class="hero__title">这次状态怎么样？</text>
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

        <view class="hero__body">
          <view class="hero__copy">
            <view class="status-chip" :class="`status-chip--${statusTone}`">
              <view class="status-chip__dot"></view>
              <text>{{ report.statusIndex.levelLabel }}</text>
            </view>
            <text class="hero__summary">{{ report.summary || report.subtitle }}</text>
          </view>

          <view class="hero-art">
            <view class="hero-art__orb">
              <view class="hero-art__face">
                <view class="hero-art__eye"></view>
                <view class="hero-art__eye"></view>
                <view class="hero-art__mouth"></view>
              </view>
            </view>
            <view class="hero-art__sprout">
              <view class="hero-art__stem"></view>
              <view class="hero-art__leaf hero-art__leaf--left"></view>
              <view class="hero-art__leaf hero-art__leaf--right"></view>
              <view class="hero-art__leaf hero-art__leaf--top"></view>
            </view>
            <view class="hero-art__moss"></view>
          </view>
        </view>
      </view>

      <button class="hero-cta" @tap="openPosterGenerate">
        <view>
          <text class="hero-cta__title">生成分享海报</text>
          <text class="hero-cta__meta">{{ report.sharePoster.themeName }}</text>
        </view>
        <text class="hero-cta__icon">›</text>
      </button>
    </template>

    <view v-else class="empty-hero">
      <text class="empty-hero__label">报告</text>
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
      <view class="status-board">
        <view class="section-head">
          <text class="section-head__title">今日状态</text>
          <text class="section-head__side">{{ completedAtLabel }}</text>
        </view>

        <view class="status-grid">
          <view class="score-tile">
            <text class="score-tile__label">{{ report.statusIndex.label }}</text>
            <view class="score-tile__number-line">
              <text class="score-tile__number">{{ report.statusIndex.value }}</text>
              <text class="score-tile__denominator">/ {{ report.statusIndex.maxValue }}</text>
            </view>
            <view class="score-tile__track">
              <view class="score-tile__fill" :style="{ width: `${statusPercent}%` }"></view>
            </view>
            <view class="mini-chip" :class="`mini-chip--${statusTone}`">
              <view class="mini-chip__dot"></view>
              <text>{{ report.statusIndex.levelLabel }}</text>
            </view>
          </view>

          <view class="advice-tile">
            <text class="advice-tile__label">建议</text>
            <text class="advice-tile__text">{{ primaryActionText }}</text>
            <view class="tiny-plant">
              <view class="tiny-plant__leaf tiny-plant__leaf--left"></view>
              <view class="tiny-plant__leaf tiny-plant__leaf--right"></view>
              <view class="tiny-plant__pot"></view>
            </view>
          </view>
        </view>
      </view>

      <view class="report-section report-section--source">
        <view class="section-head">
          <text class="section-head__title">指数来源</text>
          <text class="section-head__side">{{ report.statusIndex.sourceLabel }}</text>
        </view>

        <view class="formula-card">
          <text class="formula-card__label">{{ report.statusIndex.rawLabel }}</text>
          <text class="formula-card__value">{{ report.statusIndex.formula }}</text>
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

        <view class="dimension-grid">
          <view
            v-for="item in visibleDimensions"
            :key="item.key"
            class="dimension-card"
            :class="`dimension-card--${item.tone}`"
          >
            <view class="dimension-card__orb">
              <view class="dimension-card__mark"></view>
            </view>
            <text class="dimension-card__title">{{ item.label }}</text>
            <text class="dimension-card__summary">{{ item.summary }}</text>
            <view class="dimension-card__track">
              <view class="dimension-card__fill" :style="{ width: `${item.percent}%` }"></view>
            </view>
            <text class="dimension-card__meta">{{ item.value }} / {{ item.maxValue }}</text>
            <text class="dimension-card__evidence">{{ item.evidence }}</text>
          </view>
        </view>
      </view>

      <view class="guide-banner">
        <view>
          <text class="guide-banner__kicker">{{ accessLabel }}</text>
          <text class="guide-banner__title">{{ primaryActionTitle }}</text>
          <text class="guide-banner__text">{{ actionItems[0] || primaryActionText }}</text>
        </view>
        <button class="guide-banner__button" @tap="goMembership">
          <text>{{ report.access.isFullReportUnlocked ? '查看' : '解锁' }}</text>
          <text>›</text>
        </button>
      </view>

      <view class="report-section">
        <view class="section-head">
          <text class="section-head__title">深度拆解</text>
          <text class="section-head__side">{{ report.access.isFullReportUnlocked ? '已解锁' : '预览' }}</text>
        </view>

        <view v-if="report.access.isFullReportUnlocked" class="detail-list">
          <view v-for="item in report.fullSections" :key="item.title" class="detail-row">
            <text class="detail-row__title">{{ item.title }}</text>
            <text class="detail-row__summary">{{ item.summary }}</text>
            <text v-for="bullet in item.bullets" :key="bullet" class="detail-row__bullet">
              {{ bullet }}
            </text>
          </view>
        </view>

        <view v-else class="detail-list">
          <view
            v-for="item in report.lockedPreviewSections"
            :key="item.title"
            class="detail-row"
          >
            <text class="detail-row__title">{{ item.title }}</text>
            <text class="detail-row__summary">{{ item.summary }}</text>
          </view>
        </view>
      </view>

      <view class="support-strip">
        <view class="support-strip__icon">
          <view class="support-strip__heart"></view>
        </view>
        <view>
          <text class="support-strip__title">需要帮助？</text>
          <text class="support-strip__text">{{ supportText }}</text>
        </view>
        <button class="support-strip__button" @tap="goEmotion">›</button>
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

  return Math.max(
    8,
    Math.min(100, Math.round((statusIndex.value / statusIndex.maxValue) * 100)),
  );
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
const completedAtLabel = computed(() =>
  formatDate(report.value?.statusIndex.updatedAt || report.value?.completedAt),
);
const accessLabel = computed(() =>
  report.value?.access.isFullReportUnlocked ? '完整版' : '基础版',
);
const primaryActionSection = computed<ReportSection | null>(
  () => report.value?.baseSections[0] ?? null,
);
const primaryActionTitle = computed(
  () => primaryActionSection.value?.title || '现在先做什么',
);
const primaryActionText = computed(
  () =>
    primaryActionSection.value?.summary ||
    report.value?.summary ||
    '先处理最关键的一步。',
);
const actionItems = computed(() => {
  const sections = report.value?.baseSections ?? [];
  const items = sections.flatMap((section) => section.bullets);
  const uniqueItems = Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));

  return uniqueItems.slice(0, 4);
});
const visibleDimensions = computed(() => report.value?.stateDimensions.slice(0, 4) ?? []);
const supportText = computed(() => {
  const supportItem = report.value?.stateDimensions.find((item) => item.key === 'support');

  return (
    supportItem?.evidence ||
    '如果状态持续影响睡眠、情绪或日常安排，请及时寻求现实支持。'
  );
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
  padding: 28rpx 24rpx 48rpx;
  background:
    radial-gradient(circle at 18% 4%, rgba(178, 223, 194, 0.64), transparent 34%),
    radial-gradient(circle at 82% 0%, rgba(231, 242, 226, 0.9), transparent 30%),
    linear-gradient(180deg, #eef7f1 0%, #f8faf7 48%, #f2f6f1 100%);
  color: #172636;
}

.page--positive {
  background:
    radial-gradient(circle at 18% 4%, rgba(157, 229, 183, 0.72), transparent 34%),
    radial-gradient(circle at 84% 0%, rgba(220, 248, 224, 0.92), transparent 30%),
    linear-gradient(180deg, #e9f9ef 0%, #f8fbf6 50%, #eff8f0 100%);
}

.page--watch {
  background:
    radial-gradient(circle at 18% 4%, rgba(251, 198, 128, 0.46), transparent 34%),
    radial-gradient(circle at 84% 0%, rgba(255, 234, 203, 0.74), transparent 30%),
    linear-gradient(180deg, #fff4e5 0%, #fffaf4 48%, #f7efe5 100%);
}

.hero {
  position: relative;
  min-height: 520rpx;
  overflow: hidden;
}

.hero__top {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
}

.hero__hello,
.hero__title,
.hero__summary,
.empty-hero__label,
.empty-hero__title,
.empty-hero__text,
.section-head__title,
.section-head__side,
.state-section__title,
.state-section__text,
.score-tile__label,
.advice-tile__label,
.formula-card__label,
.formula-card__value,
.basis-row__text,
.dimension-card__title,
.dimension-card__summary,
.dimension-card__meta,
.dimension-card__evidence,
.guide-banner__kicker,
.guide-banner__title,
.guide-banner__text,
.detail-row__title,
.detail-row__summary,
.detail-row__bullet,
.support-strip__title,
.support-strip__text {
  display: block;
}

.hero__hello {
  margin-bottom: 12rpx;
  font-size: 32rpx;
  line-height: 1.25;
  font-weight: 700;
  color: #183044;
}

.hero__title {
  max-width: 410rpx;
  font-size: 48rpx;
  line-height: 1.18;
  font-weight: 760;
  letter-spacing: 0;
  color: #183044;
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
  color: #315845;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 10rpx 26rpx rgba(39, 73, 54, 0.08);
}

.page--watch .favorite-button {
  color: #9b6630;
  background: rgba(255, 250, 242, 0.88);
}

.favorite-button--active {
  color: #ffffff;
  background: #2f8b60;
}

.page--watch .favorite-button--active {
  background: #d78237;
}

.hero__body {
  position: relative;
  min-height: 392rpx;
}

.hero__copy {
  position: relative;
  z-index: 2;
  width: 360rpx;
  padding-top: 34rpx;
}

.status-chip,
.mini-chip {
  display: inline-flex;
  align-items: center;
  gap: 12rpx;
  width: fit-content;
  color: #2f8b60;
  background: rgba(255, 255, 255, 0.84);
  box-shadow: 0 12rpx 26rpx rgba(48, 111, 77, 0.08);
}

.status-chip {
  padding: 14rpx 24rpx;
  border-radius: 999rpx;
  font-size: 28rpx;
  line-height: 1;
  font-weight: 700;
}

.status-chip__dot,
.mini-chip__dot,
.basis-row__dot {
  flex: 0 0 auto;
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: #63c895;
}

.status-chip--watch,
.mini-chip--watch {
  color: #9b6630;
}

.status-chip--watch .status-chip__dot,
.mini-chip--watch .mini-chip__dot {
  background: #eea75e;
}

.status-chip--steady,
.mini-chip--steady {
  color: #3d7e67;
}

.hero__summary {
  margin-top: 26rpx;
  font-size: 28rpx;
  line-height: 1.75;
  color: #425366;
}

.hero-art {
  position: absolute;
  right: -22rpx;
  bottom: -10rpx;
  width: 390rpx;
  height: 360rpx;
}

.hero-art__orb {
  position: absolute;
  right: 90rpx;
  top: 20rpx;
  width: 190rpx;
  height: 190rpx;
  border-radius: 50%;
  background:
    radial-gradient(circle at 34% 28%, rgba(255, 255, 255, 0.96), transparent 22%),
    radial-gradient(circle at 62% 70%, rgba(246, 205, 179, 0.34), transparent 24%),
    radial-gradient(circle, rgba(222, 245, 229, 0.96) 0%, rgba(234, 248, 238, 0.86) 58%, rgba(255, 255, 255, 0.92) 100%);
  border: 8rpx solid rgba(255, 255, 255, 0.74);
  box-shadow:
    0 28rpx 72rpx rgba(75, 121, 94, 0.18),
    0 0 0 10rpx rgba(255, 255, 255, 0.4) inset;
}

.hero--positive .hero-art__orb {
  background:
    radial-gradient(circle at 34% 28%, rgba(255, 255, 255, 0.98), transparent 22%),
    radial-gradient(circle at 64% 70%, rgba(251, 209, 181, 0.32), transparent 24%),
    radial-gradient(circle, rgba(202, 244, 213, 0.98) 0%, rgba(224, 249, 230, 0.88) 58%, rgba(255, 255, 255, 0.94) 100%);
  box-shadow:
    0 30rpx 76rpx rgba(53, 136, 82, 0.2),
    0 0 0 10rpx rgba(255, 255, 255, 0.46) inset;
}

.hero--watch .hero-art__orb {
  background:
    radial-gradient(circle at 34% 28%, rgba(255, 255, 255, 0.96), transparent 22%),
    radial-gradient(circle at 64% 72%, rgba(247, 173, 95, 0.32), transparent 26%),
    radial-gradient(circle, rgba(255, 239, 213, 0.98) 0%, rgba(255, 247, 229, 0.88) 58%, rgba(255, 255, 255, 0.95) 100%);
  box-shadow:
    0 30rpx 76rpx rgba(178, 112, 48, 0.18),
    0 0 0 10rpx rgba(255, 255, 255, 0.46) inset;
}

.hero-art__face {
  position: absolute;
  left: 62rpx;
  top: 86rpx;
  display: flex;
  gap: 22rpx;
}

.hero-art__eye {
  width: 20rpx;
  height: 14rpx;
  border-bottom: 5rpx solid #226f51;
  border-radius: 0 0 20rpx 20rpx;
}

.hero-art__mouth {
  position: absolute;
  left: 29rpx;
  top: 34rpx;
  width: 28rpx;
  height: 16rpx;
  border-bottom: 5rpx solid #226f51;
  border-radius: 0 0 28rpx 28rpx;
  opacity: 0.72;
}

.hero--positive .hero-art__eye {
  width: 18rpx;
  height: 18rpx;
  border-bottom-width: 6rpx;
  border-radius: 0 0 20rpx 20rpx;
}

.hero--positive .hero-art__mouth {
  left: 30rpx;
  top: 38rpx;
  width: 36rpx;
  height: 20rpx;
  border-bottom-width: 6rpx;
  opacity: 1;
}

.hero--watch .hero-art__face {
  top: 78rpx;
}

.hero--watch .hero-art__eye {
  width: 16rpx;
  height: 16rpx;
  border: none;
  border-radius: 50%;
  background: #a2672e;
}

.hero--watch .hero-art__eye:first-child {
  transform: translateY(3rpx);
}

.hero--watch .hero-art__eye:nth-child(2) {
  transform: translateY(-3rpx);
}

.hero--watch .hero-art__mouth {
  left: 26rpx;
  top: 40rpx;
  width: 36rpx;
  height: 18rpx;
  border-bottom: none;
  border-top: 5rpx solid #a2672e;
  border-radius: 28rpx 28rpx 0 0;
  opacity: 0.92;
}

.hero-art__sprout {
  position: absolute;
  right: 18rpx;
  top: 34rpx;
  width: 120rpx;
  height: 234rpx;
}

.hero-art__stem {
  position: absolute;
  right: 54rpx;
  bottom: 18rpx;
  width: 8rpx;
  height: 178rpx;
  border-radius: 999rpx;
  background: linear-gradient(180deg, #78b75a 0%, #438c53 100%);
  transform: rotate(12deg);
  transform-origin: bottom center;
}

.hero--watch .hero-art__stem {
  background: linear-gradient(180deg, #d8a64d 0%, #996734 100%);
  transform: rotate(7deg);
}

.hero-art__leaf {
  position: absolute;
  width: 74rpx;
  height: 46rpx;
  border-radius: 74rpx 4rpx 74rpx 4rpx;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.32) 0%, transparent 42%),
    linear-gradient(135deg, #96cf58 0%, #4f9b3f 100%);
  box-shadow: 0 12rpx 22rpx rgba(65, 127, 55, 0.16);
}

.hero--positive .hero-art__leaf {
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.34) 0%, transparent 42%),
    linear-gradient(135deg, #a8db5d 0%, #43a64b 100%);
}

.hero--watch .hero-art__leaf {
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, transparent 42%),
    linear-gradient(135deg, #e1b654 0%, #9b7436 100%);
  box-shadow: 0 12rpx 22rpx rgba(146, 93, 38, 0.14);
}

.hero-art__leaf--left {
  right: 70rpx;
  top: 88rpx;
  transform: rotate(-32deg);
}

.hero-art__leaf--right {
  right: 2rpx;
  top: 128rpx;
  transform: rotate(8deg) scale(0.86);
}

.hero-art__leaf--top {
  right: 42rpx;
  top: 22rpx;
  transform: rotate(-58deg) scale(0.92);
}

.hero-art__moss {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 360rpx;
  height: 118rpx;
  border-radius: 60% 42% 18rpx 18rpx;
  background:
    radial-gradient(circle at 30% 4%, rgba(255, 255, 255, 0.36), transparent 18%),
    linear-gradient(180deg, #8ab063 0%, #547d44 58%, #3c6136 100%);
  box-shadow: 0 28rpx 56rpx rgba(61, 102, 54, 0.18);
}

.hero--positive .hero-art__moss {
  background:
    radial-gradient(circle at 30% 4%, rgba(255, 255, 255, 0.38), transparent 18%),
    linear-gradient(180deg, #92bc65 0%, #4f8a43 58%, #356735 100%);
}

.hero--watch .hero-art__moss {
  background:
    radial-gradient(circle at 30% 4%, rgba(255, 255, 255, 0.34), transparent 18%),
    linear-gradient(180deg, #c7a15c 0%, #906e39 58%, #674b2c 100%);
  box-shadow: 0 28rpx 56rpx rgba(122, 80, 38, 0.18);
}

.hero-cta {
  position: relative;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 136rpx;
  margin: -14rpx 0 24rpx;
  padding: 0 30rpx 0 38rpx;
  border-radius: 20rpx;
  color: #ffffff;
  background: linear-gradient(135deg, #3d8c67 0%, #24734f 100%);
  box-shadow: 0 22rpx 48rpx rgba(33, 99, 68, 0.22);
}

.page--positive .hero-cta {
  background: linear-gradient(135deg, #42a875 0%, #237c54 100%);
}

.page--watch .hero-cta {
  background: linear-gradient(135deg, #d98f43 0%, #9a6330 100%);
  box-shadow: 0 22rpx 48rpx rgba(150, 91, 38, 0.2);
}

.hero-cta__title {
  display: block;
  font-size: 34rpx;
  line-height: 1.3;
  font-weight: 730;
}

.hero-cta__meta {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.82);
}

.hero-cta__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 68rpx;
  height: 68rpx;
  border-radius: 50%;
  color: #195136;
  font-size: 52rpx;
  line-height: 1;
  background: rgba(255, 255, 255, 0.88);
}

.page--watch .hero-cta__icon {
  color: #8b5629;
}

.empty-hero,
.state-section,
.status-board,
.report-section,
.support-strip {
  box-sizing: border-box;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 18rpx 54rpx rgba(55, 83, 70, 0.08);
}

.empty-hero,
.state-section {
  display: grid;
  gap: 18rpx;
  padding: 32rpx;
}

.empty-hero__label {
  font-size: 24rpx;
  color: #4f8e6c;
}

.empty-hero__title,
.state-section__title,
.section-head__title {
  font-size: 32rpx;
  line-height: 1.32;
  font-weight: 720;
  color: #172636;
}

.empty-hero__text,
.state-section__text {
  font-size: 26rpx;
  line-height: 1.68;
  color: #627283;
}

.status-board,
.report-section {
  display: grid;
  gap: 22rpx;
  margin-bottom: 24rpx;
  padding: 28rpx 24rpx;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
}

.section-head__side {
  flex: 0 0 auto;
  font-size: 23rpx;
  color: #8a98a6;
}

.status-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 18rpx;
}

.score-tile,
.advice-tile,
.formula-card,
.dimension-card {
  position: relative;
  overflow: hidden;
  border-radius: 20rpx;
  background:
    radial-gradient(circle at 84% 18%, rgba(187, 225, 194, 0.34), transparent 30%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.92) 0%, rgba(244, 249, 246, 0.9) 100%);
}

.page--watch .score-tile,
.page--watch .advice-tile,
.page--watch .formula-card {
  background:
    radial-gradient(circle at 84% 18%, rgba(248, 192, 112, 0.28), transparent 30%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.94) 0%, rgba(255, 249, 241, 0.92) 100%);
}

.score-tile,
.advice-tile {
  min-height: 218rpx;
  padding: 24rpx;
}

.score-tile__label,
.advice-tile__label,
.formula-card__label {
  font-size: 24rpx;
  line-height: 1.4;
  color: #405467;
}

.score-tile__number-line {
  display: flex;
  align-items: baseline;
  margin-top: 24rpx;
}

.score-tile__number {
  font-size: 82rpx;
  line-height: 0.9;
  font-weight: 340;
  color: #327454;
  font-family:
    'Iowan Old Style',
    'Times New Roman',
    'Noto Serif SC',
    serif;
}

.page--watch .score-tile__number {
  color: #b26b30;
}

.score-tile__denominator {
  margin-left: 8rpx;
  font-size: 28rpx;
  color: #8795a3;
}

.score-tile__track,
.dimension-card__track {
  height: 10rpx;
  margin-top: 18rpx;
  border-radius: 999rpx;
  overflow: hidden;
  background: rgba(44, 86, 66, 0.1);
}

.score-tile__fill,
.dimension-card__fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #72ce97 0%, #2f8b60 100%);
}

.page--watch .score-tile__fill {
  background: linear-gradient(90deg, #f2b160 0%, #d78237 100%);
}

.mini-chip {
  margin-top: 16rpx;
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
}

.advice-tile__text {
  position: relative;
  z-index: 2;
  margin-top: 22rpx;
  padding-right: 52rpx;
  font-size: 26rpx;
  line-height: 1.58;
  color: #253648;
}

.tiny-plant {
  position: absolute;
  right: 18rpx;
  bottom: 18rpx;
  width: 82rpx;
  height: 88rpx;
}

.tiny-plant__pot {
  position: absolute;
  left: 18rpx;
  bottom: 0;
  width: 46rpx;
  height: 32rpx;
  border-radius: 0 0 20rpx 20rpx;
  background: linear-gradient(180deg, #ffffff 0%, #dbe2dc 100%);
  box-shadow: 0 10rpx 22rpx rgba(59, 79, 65, 0.12);
}

.tiny-plant__leaf {
  position: absolute;
  width: 38rpx;
  height: 28rpx;
  border-radius: 38rpx 4rpx 38rpx 4rpx;
  background: linear-gradient(135deg, #c7e78f 0%, #6fb66e 100%);
}

.page--watch .tiny-plant__leaf {
  background: linear-gradient(135deg, #f0cc79 0%, #c3893e 100%);
}

.tiny-plant__leaf--left {
  left: 12rpx;
  top: 32rpx;
  transform: rotate(-34deg);
}

.tiny-plant__leaf--right {
  right: 8rpx;
  top: 18rpx;
  transform: rotate(16deg);
}

.formula-card {
  display: grid;
  gap: 10rpx;
  padding: 24rpx;
}

.formula-card__value {
  font-size: 30rpx;
  line-height: 1.45;
  font-weight: 660;
  color: #172636;
}

.basis-list,
.detail-list {
  display: grid;
  gap: 16rpx;
}

.basis-row {
  display: flex;
  align-items: flex-start;
  gap: 14rpx;
}

.basis-row__dot {
  width: 10rpx;
  height: 10rpx;
  margin-top: 16rpx;
}

.page--watch .basis-row__dot {
  background: #e6a45a;
}

.basis-row__text,
.detail-row__summary,
.detail-row__bullet,
.support-strip__text {
  font-size: 25rpx;
  line-height: 1.62;
  color: #617181;
}

.dimension-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18rpx;
}

.dimension-card {
  display: grid;
  min-height: 302rpx;
  padding: 24rpx;
  align-content: start;
}

.dimension-card__orb {
  position: relative;
  width: 86rpx;
  height: 86rpx;
  margin: 0 auto 18rpx;
  border-radius: 50%;
  background:
    radial-gradient(circle at 34% 28%, rgba(255, 255, 255, 0.95), transparent 24%),
    linear-gradient(145deg, rgba(208, 240, 183, 0.96) 0%, rgba(144, 211, 155, 0.76) 100%);
  box-shadow: 0 16rpx 30rpx rgba(72, 128, 86, 0.16);
}

.dimension-card--steady .dimension-card__orb {
  background:
    radial-gradient(circle at 34% 28%, rgba(255, 255, 255, 0.95), transparent 24%),
    linear-gradient(145deg, rgba(201, 205, 250, 0.96) 0%, rgba(139, 127, 226, 0.74) 100%);
}

.dimension-card--watch .dimension-card__orb {
  background:
    radial-gradient(circle at 34% 28%, rgba(255, 255, 255, 0.95), transparent 24%),
    linear-gradient(145deg, rgba(255, 208, 159, 0.96) 0%, rgba(240, 136, 57, 0.78) 100%);
}

.dimension-card__mark {
  position: absolute;
  left: 29rpx;
  top: 36rpx;
  width: 26rpx;
  height: 18rpx;
  border-bottom: 6rpx solid rgba(27, 95, 67, 0.8);
  border-radius: 0 0 24rpx 24rpx;
}

.dimension-card__title {
  min-height: 42rpx;
  text-align: center;
  font-size: 27rpx;
  line-height: 1.3;
  font-weight: 700;
  color: #1d3042;
}

.dimension-card__summary {
  min-height: 72rpx;
  margin-top: 8rpx;
  text-align: center;
  font-size: 24rpx;
  line-height: 1.5;
  color: #617181;
}

.dimension-card__meta {
  margin-top: 10rpx;
  text-align: center;
  font-size: 23rpx;
  color: #2f8b60;
}

.dimension-card__evidence {
  margin-top: 8rpx;
  font-size: 21rpx;
  line-height: 1.42;
  color: #8996a2;
}

.dimension-card--steady .dimension-card__fill {
  background: linear-gradient(90deg, #9c93ed 0%, #7669d9 100%);
}

.dimension-card--watch .dimension-card__fill {
  background: linear-gradient(90deg, #ffb765 0%, #f08332 100%);
}

.guide-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
  min-height: 150rpx;
  margin-bottom: 24rpx;
  padding: 26rpx 28rpx;
  border-radius: 24rpx;
  background:
    radial-gradient(circle at 86% 30%, rgba(255, 224, 172, 0.52), transparent 24%),
    linear-gradient(135deg, #ece6ff 0%, #dcd5ff 52%, #eef2ff 100%);
  box-shadow: 0 18rpx 48rpx rgba(99, 92, 176, 0.12);
}

.page--watch .guide-banner {
  background:
    radial-gradient(circle at 86% 30%, rgba(255, 214, 150, 0.6), transparent 24%),
    linear-gradient(135deg, #fff0dc 0%, #ffe2bd 52%, #fff7ec 100%);
  box-shadow: 0 18rpx 48rpx rgba(150, 91, 38, 0.1);
}

.guide-banner__kicker {
  font-size: 24rpx;
  color: #705fe0;
}

.page--watch .guide-banner__kicker,
.page--watch .guide-banner__title,
.page--watch .guide-banner__button {
  color: #a2612d;
}

.page--watch .guide-banner__text {
  color: #8f6a4d;
}

.guide-banner__title {
  margin-top: 8rpx;
  font-size: 32rpx;
  line-height: 1.3;
  font-weight: 760;
  color: #5b50d8;
}

.guide-banner__text {
  margin-top: 8rpx;
  font-size: 24rpx;
  line-height: 1.48;
  color: #6968a3;
}

.guide-banner__button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
  flex: 0 0 auto;
  min-width: 128rpx;
  min-height: 62rpx;
  margin: 0;
  padding: 0 20rpx;
  border-radius: 999rpx;
  line-height: 62rpx;
  font-size: 24rpx;
  color: #5b50d8;
  background: rgba(255, 255, 255, 0.84);
}

.detail-row {
  display: grid;
  gap: 8rpx;
  padding: 0 0 18rpx;
  border-bottom: 1rpx solid rgba(38, 58, 76, 0.08);
}

.detail-row:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.detail-row__title {
  font-size: 28rpx;
  line-height: 1.4;
  font-weight: 700;
  color: #1d3042;
}

.support-strip {
  display: grid;
  grid-template-columns: 86rpx minmax(0, 1fr) 60rpx;
  gap: 20rpx;
  align-items: center;
  padding: 26rpx 24rpx;
}

.support-strip__icon {
  position: relative;
  width: 76rpx;
  height: 76rpx;
  border-radius: 50%;
  background: rgba(74, 166, 129, 0.12);
}

.page--watch .support-strip__icon {
  background: rgba(215, 130, 55, 0.12);
}

.support-strip__heart {
  position: absolute;
  left: 25rpx;
  top: 24rpx;
  width: 28rpx;
  height: 28rpx;
  background: #4aa681;
  transform: rotate(45deg);
}

.page--watch .support-strip__heart,
.page--watch .support-strip__heart::before,
.page--watch .support-strip__heart::after {
  background: #d78237;
}

.support-strip__heart::before,
.support-strip__heart::after {
  content: '';
  position: absolute;
  width: 28rpx;
  height: 28rpx;
  border-radius: 50%;
  background: #4aa681;
}

.support-strip__heart::before {
  left: -14rpx;
  top: 0;
}

.support-strip__heart::after {
  left: 0;
  top: -14rpx;
}

.support-strip__title {
  margin-bottom: 6rpx;
  font-size: 28rpx;
  font-weight: 720;
  color: #1d3042;
}

.support-strip__button {
  width: 58rpx;
  height: 58rpx;
  margin: 0;
  padding: 0;
  border-radius: 18rpx;
  line-height: 58rpx;
  font-size: 42rpx;
  color: #2f7454;
  background: rgba(47, 139, 96, 0.1);
}

.page--watch .support-strip__button {
  color: #a2612d;
  background: rgba(215, 130, 55, 0.12);
}

.button-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
}

.action-button {
  min-height: 76rpx;
  margin: 0;
  border-radius: 999rpx;
  line-height: 76rpx;
  font-size: 27rpx;
}

.action-button--primary {
  color: #ffffff;
  background: #2f8b60;
}

.page--watch .action-button--primary {
  background: #d78237;
}

.action-button--secondary {
  color: #2f8b60;
  background: rgba(47, 139, 96, 0.1);
}

.page--watch .action-button--secondary {
  color: #a2612d;
  background: rgba(215, 130, 55, 0.1);
}

.favorite-button::after,
.hero-cta::after,
.guide-banner__button::after,
.support-strip__button::after,
.action-button::after {
  border: none;
}
</style>
