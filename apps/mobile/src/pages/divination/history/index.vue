<template>
  <view class="history-page">
    <view class="history-head">
      <button class="back-button" @tap="back">‹</button>
      <text class="history-title">占卜记录</text>
      <button class="head-link" @tap="openReviewList">复盘</button>
      <button class="head-link" @tap="startNew">新占</button>
    </view>

    <scroll-view class="tab-scroll" scroll-x>
      <view class="tab-row">
        <view
          v-for="tab in tabs"
          :key="tab.value"
          class="tab-item"
          :class="{ 'tab-item--active': activeTab === tab.value }"
          @tap="activeTab = tab.value"
        >
          {{ tab.label }}
        </view>
      </view>
    </scroll-view>

    <view class="trend-card">
      <view class="trend-card__head">
        <view>
          <text class="trend-title">本周占卜趋势</text>
          <text class="trend-date">最近 7 次 / {{ historySourceLabel }}</text>
        </view>
        <view class="trend-score">
          <text class="trend-score__label">平均分</text>
          <text class="trend-score__value">{{ averageScore }}</text>
        </view>
      </view>

      <view class="chart">
        <view v-for="point in trendPoints" :key="point.label" class="chart-item">
          <text class="chart-value">{{ point.value }}</text>
          <view class="chart-track">
            <view class="chart-bar" :style="{ height: `${Math.max(28, point.value * 1.4)}rpx` }"></view>
          </view>
          <text class="chart-label">{{ point.label }}</text>
        </view>
      </view>

      <text class="trend-summary">常见关键词：{{ commonKeywords }}</text>
    </view>

    <view v-if="filteredHistory.length" class="record-list">
      <view
        v-for="item in filteredHistory"
        :key="item.id"
        class="record-item"
        @tap="openResult(item.id)"
      >
        <view class="record-icon">{{ topicIcon(item.topic) }}</view>
        <view class="record-copy">
          <view class="record-line">
            <text class="record-title">{{ item.topicLabel }}</text>
            <text class="record-level">{{ item.hexagram.level }}</text>
          </view>
          <text class="record-summary">{{ item.question || item.summary }}</text>
          <text class="record-time">{{ formatDivinationDateTime(item.createdAt) }}</text>
          <view v-if="reviewBadges(item).length" class="record-review-row">
            <text
              v-for="badge in reviewBadges(item)"
              :key="badge.value"
              class="record-review-badge"
              :class="`record-review-badge--${badge.tone}`"
            >
              {{ badge.label }}
            </text>
          </view>
        </view>
        <text class="record-arrow">›</text>
      </view>
    </view>

    <view v-else class="empty-state">
      <text class="empty-title">还没有占卜记录</text>
      <text class="empty-text">先完成一次今日占卜，这里会自动保存最近 30 条。</text>
      <button class="empty-button" @tap="startNew">开始占卜</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import {
  createTodayDivinationRequest,
  formatDivinationDateTime,
  getTopicOption,
  getDivinationTrend,
  listDivinationHistory,
  setPendingDivinationRequest,
  syncDivinationReviewsFromServer,
} from '../../../services/divination';
import {
  ensureDivinationContentCatalog,
  getDivinationHistoryTabs,
} from '../../../services/divination-content';
import { getAuthToken } from '../../../services/session';
import type { DivinationHistoryTabValue } from '../../../services/divination-runtime-config';
import type { DivinationResult, DivinationReview, DivinationTopic } from '../../../types/divination';

type SyncStatus = 'local' | 'syncing' | 'synced';

const tabs = ref(getDivinationHistoryTabs());
const activeTab = ref<DivinationHistoryTabValue>('all');
const history = ref<DivinationResult[]>([]);
const syncStatus = ref<SyncStatus>('local');

const filteredHistory = computed(() => {
  if (activeTab.value === 'all') {
    return history.value;
  }

  return history.value.filter((item) => item.topic === activeTab.value);
});

const trendPoints = computed(() => getDivinationTrend(history.value));
const averageScore = computed(() => {
  const points = trendPoints.value;
  return Math.round(points.reduce((sum, item) => sum + item.value, 0) / points.length);
});

const commonKeywords = computed(() => {
  const source = history.value.flatMap((item) => item.keywords).slice(0, 8);
  return Array.from(new Set(source)).slice(0, 4).join('、') || '感应、整理、行动、留白';
});

const historySourceLabel = computed(() => {
  if (!getAuthToken()) {
    return '本地记录';
  }

  return syncStatus.value === 'syncing' ? '云端同步中' : '登录复盘同步';
});

function topicIcon(topic: DivinationTopic) {
  return getTopicOption(topic).icon;
}

function reviewBadges(item: DivinationResult) {
  const itemReview = item.review;
  if (!itemReview) {
    return [];
  }

  const badges: Array<{ label: string; value: string; tone: 'favorite' | DivinationReview['outcome'] | 'note' }> = [];

  if (itemReview.favorite) {
    badges.push({ label: '已收藏', value: 'favorite', tone: 'favorite' });
  }

  if (itemReview.outcome !== 'pending') {
    badges.push({
      label: outcomeLabel(itemReview.outcome),
      value: itemReview.outcome,
      tone: itemReview.outcome,
    });
  }

  if (itemReview.note.trim()) {
    badges.push({ label: '有备注', value: 'note', tone: 'note' });
  }

  return badges;
}

function outcomeLabel(outcome: DivinationReview['outcome']) {
  const labels: Record<DivinationReview['outcome'], string> = {
    pending: '待复盘',
    fulfilled: '已应验',
    unfulfilled: '未应验',
  };

  return labels[outcome];
}

function loadHistory() {
  history.value = listDivinationHistory();
}

async function syncReviews() {
  syncStatus.value = getAuthToken() ? 'syncing' : 'local';
  await syncDivinationReviewsFromServer();
  loadHistory();
  syncStatus.value = getAuthToken() ? 'synced' : 'local';
}

function openResult(id: string) {
  uni.navigateTo({
    url: `/pages/divination/result/index?id=${encodeURIComponent(id)}`,
  });
}

function startNew() {
  setPendingDivinationRequest(createTodayDivinationRequest('general'));
  uni.navigateTo({
    url: '/pages/divination/loading/index',
  });
}

function openReviewList() {
  uni.navigateTo({
    url: '/pages/divination/review/index',
  });
}

function back() {
  uni.navigateBack({
    fail: () => {
      uni.redirectTo({ url: '/pages/divination/index/index' });
    },
  });
}

onShow(() => {
  loadHistory();
  void ensureDivinationContentCatalog().then(() => {
    tabs.value = getDivinationHistoryTabs();
  });
  void syncReviews();
});
</script>

<style lang="scss">
.history-page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: calc(env(safe-area-inset-top) + 24rpx) 24rpx 80rpx;
  background:
    radial-gradient(circle at 84% 8%, rgba(139, 111, 214, 0.14), transparent 28%),
    linear-gradient(180deg, #fff9ef 0%, #f7efff 48%, #fffaf0 100%);
  color: #4e3825;
}

.history-head {
  display: grid;
  grid-template-columns: 64rpx 1fr 82rpx 82rpx;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 22rpx;
}

.back-button,
.head-link,
.empty-button {
  padding: 0;
  margin: 0;
  border: 0;
}

.back-button::after,
.head-link::after,
.empty-button::after {
  border: 0;
}

.back-button {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.72);
  color: #4e3825;
  font-size: 46rpx;
  line-height: 54rpx;
}

.history-title {
  text-align: center;
  font-size: 34rpx;
  font-weight: 700;
}

.head-link {
  height: 56rpx;
  border-radius: 999rpx;
  color: #8b6fd6;
  background: rgba(255, 255, 255, 0.72);
  font-size: 23rpx;
}

.tab-scroll {
  white-space: nowrap;
  margin: 0 -24rpx 20rpx;
}

.tab-row {
  display: inline-flex;
  gap: 16rpx;
  padding: 0 24rpx 10rpx;
}

.tab-item {
  padding: 14rpx 28rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.68);
  color: rgba(78, 56, 37, 0.62);
  font-size: 24rpx;
}

.tab-item--active {
  color: #ffffff;
  background: linear-gradient(135deg, #8b6fd6, #b898f0);
  box-shadow: 0 12rpx 26rpx rgba(139, 111, 214, 0.22);
}

.trend-card,
.record-item,
.empty-state {
  background: rgba(255, 255, 255, 0.84);
  border: 1rpx solid rgba(255, 255, 255, 0.92);
  box-shadow: 0 14rpx 36rpx rgba(80, 60, 120, 0.08);
}

.trend-card {
  padding: 26rpx;
  border-radius: 28rpx;
}

.trend-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
}

.trend-title,
.trend-date,
.trend-summary {
  display: block;
}

.trend-title {
  font-size: 30rpx;
  font-weight: 700;
}

.trend-date {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: rgba(78, 56, 37, 0.52);
}

.trend-score {
  display: grid;
  justify-items: end;
  gap: 4rpx;
}

.trend-score__label {
  font-size: 20rpx;
  color: rgba(78, 56, 37, 0.5);
}

.trend-score__value {
  font-size: 40rpx;
  color: #8b6fd6;
  font-weight: 800;
}

.chart {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  align-items: end;
  gap: 8rpx;
  height: 230rpx;
  margin-top: 22rpx;
  padding: 0 4rpx;
}

.chart-item {
  display: grid;
  justify-items: center;
  gap: 8rpx;
  height: 100%;
}

.chart-value {
  font-size: 20rpx;
  color: rgba(78, 56, 37, 0.62);
}

.chart-track {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  flex: 1;
  width: 100%;
}

.chart-bar {
  width: 18rpx;
  max-height: 150rpx;
  border-radius: 999rpx 999rpx 0 0;
  background: linear-gradient(180deg, #8b6fd6, rgba(139, 111, 214, 0.22));
}

.chart-label {
  font-size: 19rpx;
  color: rgba(78, 56, 37, 0.48);
}

.trend-summary {
  margin-top: 18rpx;
  font-size: 23rpx;
  color: rgba(78, 56, 37, 0.62);
}

.record-list {
  display: grid;
  gap: 16rpx;
  margin-top: 22rpx;
}

.record-item {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 22rpx;
  border-radius: 24rpx;
}

.record-icon {
  display: grid;
  place-items: center;
  flex: 0 0 70rpx;
  width: 70rpx;
  height: 70rpx;
  border-radius: 50%;
  color: #8b6fd6;
  font-size: 32rpx;
  background: linear-gradient(145deg, #efe8ff, #fff6f2);
}

.record-copy {
  display: grid;
  gap: 8rpx;
  flex: 1;
  min-width: 0;
}

.record-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14rpx;
}

.record-title {
  font-size: 27rpx;
  font-weight: 700;
}

.record-level {
  flex: 0 0 auto;
  padding: 6rpx 16rpx;
  border-radius: 999rpx;
  color: #b97724;
  background: #fff3d8;
  font-size: 20rpx;
}

.record-summary,
.record-time {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.record-summary {
  font-size: 23rpx;
  color: rgba(78, 56, 37, 0.62);
}

.record-time {
  font-size: 21rpx;
  color: rgba(78, 56, 37, 0.44);
}

.record-review-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  min-height: 36rpx;
}

.record-review-badge {
  display: inline-flex;
  align-items: center;
  height: 34rpx;
  padding: 0 12rpx;
  border-radius: 999rpx;
  font-size: 19rpx;
  font-weight: 700;
}

.record-review-badge--favorite {
  color: #b97724;
  background: #fff3d8;
}

.record-review-badge--fulfilled {
  color: #4f7c5a;
  background: #f3f8ee;
}

.record-review-badge--unfulfilled {
  color: #b75a4f;
  background: #fff0ea;
}

.record-review-badge--note {
  color: #8b6fd6;
  background: rgba(139, 111, 214, 0.1);
}

.record-arrow {
  color: rgba(78, 56, 37, 0.32);
  font-size: 42rpx;
}

.empty-state {
  display: grid;
  justify-items: center;
  gap: 16rpx;
  margin-top: 24rpx;
  padding: 52rpx 34rpx;
  border-radius: 28rpx;
  text-align: center;
}

.empty-title {
  font-size: 30rpx;
  font-weight: 700;
}

.empty-text {
  font-size: 24rpx;
  line-height: 1.6;
  color: rgba(78, 56, 37, 0.58);
}

.empty-button {
  display: grid;
  place-items: center;
  width: 220rpx;
  height: 72rpx;
  border-radius: 999rpx;
  color: #ffffff;
  background: linear-gradient(135deg, #8b6fd6, #b898f0);
  font-size: 25rpx;
}
</style>
