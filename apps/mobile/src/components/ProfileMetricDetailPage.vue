<template>
  <view class="metric-page" :style="themeVars">
    <view class="metric-nav">
      <button class="metric-nav__back" @tap="goBack">‹</button>
      <text class="metric-nav__title">{{ pageTitle }}</text>
      <view></view>
    </view>

    <view class="metric-hero">
      <text class="metric-hero__eyebrow">我的数据</text>
      <view class="metric-hero__main">
        <text class="metric-hero__value">{{ metricValueText }}</text>
        <text class="metric-hero__unit">{{ detail?.metric.unit || '' }}</text>
      </view>
      <text class="metric-hero__label">{{ detail?.metric.label || '同步中' }}</text>
      <text class="metric-hero__summary">{{
        detail?.metric.summary || '正在同步你的历史数据。'
      }}</text>

      <view class="range-tabs">
        <view
          v-for="item in rangeOptions"
          :key="item.value"
          class="range-tabs__item"
          :class="{ 'range-tabs__item--active': item.value === activeRange }"
          @tap="changeRange(item.value)"
        >
          {{ item.label }}
        </view>
      </view>
    </view>

    <view class="metric-section">
      <view class="section-head">
        <text class="section-title">趋势</text>
        <text class="section-meta">{{ deltaText }}</text>
      </view>

      <view v-if="loading" class="empty-state">
        <text>正在同步历史数据...</text>
      </view>
      <view v-else class="trend-chart">
        <view
          v-for="point in trendPoints"
          :key="point.date"
          class="trend-chart__point"
        >
          <view class="trend-chart__bar-wrap">
            <view
              class="trend-chart__bar"
              :style="{ height: resolveBarHeight(point.value) }"
            ></view>
          </view>
          <text class="trend-chart__label">{{ formatShortDate(point.date) }}</text>
        </view>
      </view>
    </view>

    <view class="metric-section">
      <view class="section-head">
        <text class="section-title">数据拆解</text>
        <text class="section-meta">当前口径</text>
      </view>
      <view class="breakdown-list">
        <view
          v-for="item in detail?.breakdown || []"
          :key="item.label"
          class="breakdown-row"
        >
          <view>
            <text class="breakdown-row__label">{{ item.label }}</text>
            <text v-if="item.hint" class="breakdown-row__hint">{{
              item.hint
            }}</text>
          </view>
          <text class="breakdown-row__value">{{ item.value }}</text>
        </view>
      </view>
    </view>

    <view class="metric-section">
      <view class="section-head">
        <text class="section-title">历史明细</text>
        <text class="section-meta">已保存可回看</text>
      </view>

      <view v-if="!loading && !historyItems.length" class="empty-state">
        <text>暂无历史明细</text>
      </view>

      <view v-else class="history-list">
        <view
          v-for="item in historyItems"
          :key="item.id"
          class="history-row"
          @tap="openHistoryItem(item.route)"
        >
          <view class="history-row__badge">
            <text>{{ item.sourceTypeLabel.slice(0, 1) }}</text>
          </view>
          <view class="history-row__body">
            <view class="history-row__head">
              <text class="history-row__title">{{ item.title }}</text>
              <text class="history-row__date">{{ formatDate(item.date) }}</text>
            </view>
            <text class="history-row__summary">{{ item.summary }}</text>
            <text class="history-row__source">{{ item.sourceTypeLabel }}</text>
          </view>
          <text v-if="resolveHistoryValue(item)" class="history-row__value">{{
            resolveHistoryValue(item)
          }}</text>
          <text v-else class="history-row__arrow">›</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { fetchProfileMetricDetail } from '../api/profile-metrics';
import { useThemePreference } from '../composables/useThemePreference';
import { getErrorMessage, handleAuthExpired } from '../services/errors';
import type {
  ProfileMetricDetailData,
  ProfileMetricHistoryItem,
  ProfileMetricKey,
} from '../types/profile-metrics';

const props = defineProps<{
  metricKey: ProfileMetricKey;
}>();

const rangeOptions = [
  { label: '7天', value: '7d' },
  { label: '30天', value: '30d' },
  { label: '90天', value: '90d' },
] as const;

const { themeVars } = useThemePreference();
const loading = ref(false);
const activeRange = ref<(typeof rangeOptions)[number]['value']>('30d');
const detail = ref<ProfileMetricDetailData | null>(null);

const pageTitle = computed(() => detail.value?.metric.title || '数据详情');
const trendPoints = computed(() => detail.value?.trend.points || []);
const historyItems = computed(() => detail.value?.history.items || []);
const metricValueText = computed(() => {
  if (!detail.value) {
    return '--';
  }

  return detail.value.metric.hasData ? `${detail.value.metric.value}` : '--';
});
const deltaText = computed(() => {
  const delta = detail.value?.trend.delta ?? 0;
  if (!detail.value || delta === 0) {
    return '走势平稳';
  }

  return delta > 0 ? `较区间初 +${delta}` : `较区间初 ${delta}`;
});
const maxTrendValue = computed(() => {
  const values = trendPoints.value
    .map((item) => item.value)
    .filter((value): value is number => typeof value === 'number');

  return Math.max(1, ...values);
});

function resolveBarHeight(value: number | null) {
  if (value === null) {
    return '10%';
  }

  return `${Math.max(10, Math.round((value / maxTrendValue.value) * 100))}%`;
}

function formatShortDate(value: string) {
  return value.slice(5).replace('-', '/');
}

function formatDate(value: string) {
  return value.replace(/-/g, '.');
}

function resolveHistoryValue(item: ProfileMetricHistoryItem) {
  if (typeof item.valueDelta === 'number') {
    return `+${item.valueDelta}`;
  }

  if (typeof item.value === 'number') {
    return `${item.value}${item.unit || ''}`;
  }

  return '';
}

async function loadDetail() {
  try {
    loading.value = true;
    const response = await fetchProfileMetricDetail(
      props.metricKey,
      activeRange.value,
    );
    detail.value = response.data;
  } catch (error) {
    console.warn('load metric detail failed', error);
    if (handleAuthExpired(error, true)) {
      return;
    }
    uni.showToast({
      title: getErrorMessage(error, '数据同步失败'),
      icon: 'none',
    });
  } finally {
    loading.value = false;
  }
}

function changeRange(value: (typeof rangeOptions)[number]['value']) {
  if (value === activeRange.value) {
    return;
  }

  activeRange.value = value;
  void loadDetail();
}

function openHistoryItem(route: string) {
  if (!route) {
    return;
  }

  const redirectRoutes = new Set([
    '/pages/index/index',
    '/pages/explore/index',
    '/pages/records/index',
    '/pages/profile/index',
  ]);
  const navigate = redirectRoutes.has(route.split('?')[0])
    ? uni.redirectTo
    : uni.navigateTo;

  navigate({
    url: route,
  });
}

function goBack() {
  if (getCurrentPages().length > 1) {
    uni.navigateBack();
    return;
  }

  uni.redirectTo({
    url: '/pages/profile/index',
  });
}

onMounted(() => {
  void loadDetail();
});
</script>

<style lang="scss">
.metric-page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: calc(var(--status-bar-height) + 16rpx) 24rpx 48rpx;
  background:
    radial-gradient(circle at 15% 0%, rgba(var(--theme-accent-rgb), 0.18), transparent 28%),
    linear-gradient(180deg, var(--theme-page-top), var(--theme-page-bottom));
}

.metric-nav {
  display: grid;
  grid-template-columns: 72rpx minmax(0, 1fr) 72rpx;
  align-items: center;
  margin-bottom: 22rpx;
}

.metric-nav__back {
  width: 60rpx;
  height: 60rpx;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 50%;
  color: var(--theme-text-primary);
  font-size: 44rpx;
  line-height: 1;
  background: rgba(255, 255, 255, 0.72);
}

.metric-nav__back::after {
  border: none;
}

.metric-nav__title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
  font-size: 34rpx;
  font-weight: 700;
  color: var(--theme-text-primary);
}

.metric-hero,
.metric-section {
  border: 1rpx solid var(--theme-border);
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 18rpx 44rpx rgba(var(--theme-text-primary-rgb), 0.08);
}

.metric-hero {
  display: grid;
  gap: 14rpx;
  padding: 32rpx 30rpx 28rpx;
  background:
    radial-gradient(circle at 86% 12%, rgba(var(--theme-primary-rgb), 0.15), transparent 30%),
    rgba(255, 255, 255, 0.92);
}

.metric-hero__eyebrow {
  font-size: 22rpx;
  color: var(--theme-text-tertiary);
}

.metric-hero__main {
  display: flex;
  align-items: flex-end;
  gap: 12rpx;
}

.metric-hero__value {
  font-family: 'Iowan Old Style', 'Times New Roman', 'Noto Serif SC', serif;
  font-size: 88rpx;
  line-height: 0.95;
  color: var(--theme-text-primary);
}

.metric-hero__unit {
  padding-bottom: 8rpx;
  font-size: 28rpx;
  color: var(--theme-text-secondary);
}

.metric-hero__label {
  font-size: 28rpx;
  font-weight: 700;
  color: var(--theme-primary);
}

.metric-hero__summary,
.section-meta,
.breakdown-row__hint,
.history-row__summary,
.history-row__source,
.history-row__date,
.empty-state {
  font-size: 24rpx;
  line-height: 1.65;
  color: var(--theme-text-secondary);
}

.range-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10rpx;
  margin-top: 8rpx;
  padding: 8rpx;
  border-radius: 999rpx;
  background: rgba(var(--theme-text-secondary-rgb), 0.08);
}

.range-tabs__item {
  padding: 14rpx 0;
  border-radius: 999rpx;
  text-align: center;
  font-size: 24rpx;
  color: var(--theme-text-secondary);
}

.range-tabs__item--active {
  color: rgba(255, 255, 255, 0.96);
  font-weight: 700;
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-accent));
}

.metric-section {
  margin-top: 22rpx;
  padding: 26rpx;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 700;
  color: var(--theme-text-primary);
}

.trend-chart {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(18rpx, 1fr);
  gap: 8rpx;
  align-items: end;
  min-height: 220rpx;
  overflow: hidden;
}

.trend-chart__point {
  display: grid;
  gap: 8rpx;
  align-items: end;
  min-width: 0;
}

.trend-chart__bar-wrap {
  display: flex;
  align-items: flex-end;
  height: 176rpx;
  border-radius: 999rpx;
  background: rgba(var(--theme-primary-rgb), 0.08);
  overflow: hidden;
}

.trend-chart__bar {
  width: 100%;
  min-height: 8rpx;
  border-radius: 999rpx;
  background: linear-gradient(180deg, var(--theme-primary), var(--theme-accent));
}

.trend-chart__label {
  overflow: hidden;
  text-align: center;
  white-space: nowrap;
  font-size: 18rpx;
  color: var(--theme-text-tertiary);
}

.breakdown-list,
.history-list {
  display: grid;
  gap: 14rpx;
}

.breakdown-row,
.history-row {
  border: 1rpx solid rgba(var(--theme-text-primary-rgb), 0.08);
  border-radius: 22rpx;
  background: rgba(var(--theme-primary-rgb), 0.05);
}

.breakdown-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  padding: 18rpx 20rpx;
}

.breakdown-row__label,
.breakdown-row__value,
.history-row__title,
.history-row__value {
  color: var(--theme-text-primary);
  font-weight: 700;
}

.breakdown-row__label {
  display: block;
  font-size: 26rpx;
}

.breakdown-row__value {
  flex: 0 0 auto;
  font-size: 28rpx;
}

.history-row {
  display: grid;
  grid-template-columns: 64rpx minmax(0, 1fr) auto;
  align-items: center;
  gap: 16rpx;
  padding: 18rpx;
}

.history-row__badge {
  display: grid;
  place-items: center;
  width: 60rpx;
  height: 60rpx;
  border-radius: 20rpx;
  color: var(--theme-primary);
  font-size: 24rpx;
  font-weight: 700;
  background: rgba(var(--theme-primary-rgb), 0.12);
}

.history-row__body {
  display: grid;
  min-width: 0;
  gap: 4rpx;
}

.history-row__head {
  display: flex;
  align-items: center;
  gap: 12rpx;
  min-width: 0;
}

.history-row__title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 26rpx;
}

.history-row__date,
.history-row__value,
.history-row__arrow {
  flex: 0 0 auto;
}

.history-row__summary {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-row__value {
  font-size: 30rpx;
  color: var(--theme-primary);
}

.history-row__arrow {
  font-size: 36rpx;
  color: var(--theme-text-tertiary);
}

.empty-state {
  padding: 30rpx 0;
  text-align: center;
}
</style>
