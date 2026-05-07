<template>
  <view class="review-page">
    <view class="review-head">
      <button class="back-button" @tap="back">‹</button>
      <view class="review-head__copy">
        <text class="review-title">复盘</text>
        <text class="review-subtitle">收藏、应验与备注</text>
      </view>
      <button class="new-button" @tap="startNew">新占</button>
    </view>

    <view class="overview-panel">
      <view class="overview-panel__copy">
        <text class="overview-panel__eyebrow">当前筛选</text>
        <text class="overview-panel__value">{{ filteredEntries.length }} 条</text>
        <text class="overview-panel__meta">
          收藏 {{ stats.favorite }} · 已应验 {{ stats.fulfilled }} · 未应验 {{ stats.unfulfilled }}
        </text>
        <text class="overview-panel__sync">{{ syncStatusText }}</text>
      </view>
      <view class="overview-panel__seal">验</view>
    </view>

    <scroll-view class="scope-scroll" scroll-x>
      <view class="scope-row">
        <view
          v-for="item in scopeTabs"
          :key="item.value"
          class="scope-pill"
          :class="{ 'scope-pill--active': activeScope === item.value }"
          @tap="activeScope = item.value"
        >
          <text class="scope-pill__label">{{ item.label }}</text>
          <text class="scope-pill__count">{{ item.count }}</text>
        </view>
      </view>
    </scroll-view>

    <view class="filter-bar">
      <text class="filter-bar__label">主题</text>
      <scroll-view class="topic-scroll" scroll-x>
        <view class="topic-row">
          <view
            v-for="item in topicTabs"
            :key="item.value"
            class="topic-pill"
            :class="{ 'topic-pill--active': activeTopic === item.value }"
            @tap="activeTopic = item.value"
          >
            <text>{{ item.icon }}</text>
            <text>{{ item.label }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <view class="sort-bar">
      <text class="sort-bar__label">时间排序</text>
      <view class="sort-toggle">
        <button
          class="sort-button"
          :class="{ 'sort-button--active': sortOrder === 'desc' }"
          @tap="sortOrder = 'desc'"
        >
          ↓ 最新
        </button>
        <button
          class="sort-button"
          :class="{ 'sort-button--active': sortOrder === 'asc' }"
          @tap="sortOrder = 'asc'"
        >
          ↑ 最早
        </button>
      </view>
    </view>

    <view v-if="filteredEntries.length" class="review-list">
      <view
        v-for="item in filteredEntries"
        :key="item.result.id"
        class="review-item"
        @tap="openResult(item.result.id)"
      >
        <view class="review-item__head">
          <view class="topic-badge">
            <text>{{ topicIcon(item.result.topic) }}</text>
            <text>{{ item.result.topicLabel }}</text>
          </view>
          <view class="outcome-badge" :class="`outcome-badge--${item.review.outcome}`">
            {{ outcomeLabel(item.review.outcome) }}
          </view>
        </view>

        <view class="hexagram-row">
          <view class="mini-hexagram">
            <view
              v-for="(solid, index) in hexagramLines(item.result)"
              :key="index"
              class="mini-line"
              :class="{ 'mini-line--broken': !solid }"
            >
              <view class="mini-line__segment"></view>
              <view class="mini-line__segment"></view>
            </view>
          </view>

          <view class="hexagram-copy">
            <view class="hexagram-title-row">
              <text class="hexagram-title">{{ item.result.hexagram.name }}</text>
              <text v-if="item.review.favorite" class="favorite-star">★</text>
            </view>
            <text class="hexagram-meta">
              {{ item.result.casting?.movingLineLabel || movingLineFallback(item.result) }} · 变卦
              {{ item.result.changedHexagram?.name || '本卦不变' }}
            </text>
          </view>
        </view>

        <text class="question-line">{{ item.result.question || item.result.summary }}</text>

        <view class="note-box" :class="{ 'note-box--empty': !item.review.note }">
          <text class="note-box__label">备注</text>
          <text class="note-box__text">{{ item.review.note || '暂无备注，进入原卦后可继续补充。' }}</text>
        </view>

        <view v-if="item.result.personalizationSnapshot" class="review-profile">
          <view class="review-profile__head">
            <text class="review-profile__title">当时画像</text>
            <text
              class="review-profile__tone"
              :class="`review-profile__tone--${item.result.personalizationSnapshot.tone}`"
            >
              {{ item.result.personalizationSnapshot.toneLabel }}
            </text>
          </view>
          <view class="review-profile__grid">
            <view class="review-profile__cell">
              <text class="review-profile__label">心情</text>
              <text class="review-profile__value">{{ snapshotMoodLabel(item.result.personalizationSnapshot) }}</text>
            </view>
            <view class="review-profile__cell">
              <text class="review-profile__label">策略</text>
              <text class="review-profile__value">{{ item.result.personalizationSnapshot.toneLabel }}</text>
            </view>
            <view class="review-profile__cell">
              <text class="review-profile__label">用到资料</text>
              <text class="review-profile__value">{{ snapshotUsedLabels(item.result.personalizationSnapshot) }}</text>
            </view>
          </view>
          <text v-if="snapshotMissedText(item.result.personalizationSnapshot)" class="review-profile__miss">
            {{ snapshotMissedText(item.result.personalizationSnapshot) }}
          </text>
        </view>

        <view class="review-item__foot">
          <text>{{ formatDivinationDateTime(item.result.createdAt) }}</text>
          <text class="review-item__link">查看原卦 ›</text>
        </view>
      </view>
    </view>

    <view v-else-if="entries.length" class="empty-state">
      <text class="empty-state__title">没有符合条件的复盘</text>
      <text class="empty-state__text">换一个状态或主题再看。</text>
      <button class="empty-button" @tap="clearFilters">清空筛选</button>
    </view>

    <view v-else class="empty-state">
      <text class="empty-state__title">还没有可复盘的卦</text>
      <text class="empty-state__text">完成一次起卦后，就能在这里回看收藏、应验和备注。</text>
      <button class="empty-button" @tap="startNew">开始起卦</button>
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
  listDivinationReviewEntries,
  setPendingDivinationRequest,
  syncDivinationReviewsFromServer,
} from '../../../services/divination';
import {
  ensureDivinationContentCatalog,
  getDivinationProfileMapping,
  getDivinationReviewScopes,
  getDivinationReviewTopicTabs,
} from '../../../services/divination-content';
import { getAuthToken } from '../../../services/session';
import type {
  DivinationHistoryTabValue,
  DivinationReviewScopeValue,
} from '../../../services/divination-runtime-config';
import type {
  DivinationPersonalizationSnapshot,
  DivinationPersonalizationKey,
  DivinationResult,
  DivinationReview,
  DivinationReviewEntry,
  DivinationTopic,
} from '../../../types/divination';

type SortOrder = 'desc' | 'asc';
type SyncStatus = 'local' | 'syncing' | 'synced';

const entries = ref<DivinationReviewEntry[]>([]);
const activeScope = ref<DivinationReviewScopeValue>('all');
const activeTopic = ref<DivinationHistoryTabValue>('all');
const sortOrder = ref<SortOrder>('desc');
const syncStatus = ref<SyncStatus>('local');
const scopeConfig = ref(getDivinationReviewScopes());
const topicConfig = ref(getDivinationReviewTopicTabs());

const stats = computed(() => {
  const favorite = entries.value.filter((item) => item.review.favorite).length;
  const fulfilled = entries.value.filter((item) => item.review.outcome === 'fulfilled').length;
  const unfulfilled = entries.value.filter((item) => item.review.outcome === 'unfulfilled').length;
  const pending = entries.value.filter((item) => item.review.outcome === 'pending').length;

  return {
    total: entries.value.length,
    favorite,
    fulfilled,
    unfulfilled,
    pending,
  };
});

const scopeTabs = computed(() =>
  scopeConfig.value.map((item) => ({
    ...item,
    count: scopeCount(item.value),
  })),
);

const topicTabs = computed(() => topicConfig.value);

const filteredEntries = computed(() => {
  return entries.value
    .filter((item) => {
      if (activeScope.value === 'favorite') {
        return item.review.favorite;
      }

      if (activeScope.value === 'all') {
        return true;
      }

      return item.review.outcome === activeScope.value;
    })
    .filter((item) => (activeTopic.value === 'all' ? true : item.result.topic === activeTopic.value))
    .sort((left, right) => {
      const delta = left.result.createdAt - right.result.createdAt;
      return sortOrder.value === 'asc' ? delta : -delta;
    });
});

const syncStatusText = computed(() => {
  if (!getAuthToken()) {
    return '未登录时仅使用本地复盘';
  }

  return syncStatus.value === 'syncing' ? '正在尝试合并云端复盘' : '登录后自动同步复盘';
});

function loadEntries() {
  entries.value = listDivinationReviewEntries();
}

function scopeCount(scope: DivinationReviewScopeValue) {
  if (scope === 'favorite') {
    return stats.value.favorite;
  }

  if (scope === 'all') {
    return stats.value.total;
  }

  return stats.value[scope];
}

async function syncEntries() {
  syncStatus.value = getAuthToken() ? 'syncing' : 'local';
  await syncDivinationReviewsFromServer();
  loadEntries();
  syncStatus.value = getAuthToken() ? 'synced' : 'local';
}

function topicIcon(topic: DivinationTopic) {
  return getTopicOption(topic).icon;
}

function outcomeLabel(outcome: DivinationReview['outcome']) {
  const labels: Record<DivinationReview['outcome'], string> = {
    pending: '待复盘',
    fulfilled: '已应验',
    unfulfilled: '未应验',
  };

  return labels[outcome];
}

function hexagramLines(result: DivinationResult) {
  return [...result.hexagram.lines].reverse();
}

function movingLineFallback(result: DivinationResult) {
  const line = result.changingLines?.[0] || 1;
  return `第 ${line} 爻`;
}

function snapshotMoodLabel(snapshot: DivinationPersonalizationSnapshot) {
  const moodState = snapshot.dimensionStates?.find((item) => item.key === 'mood');
  if (moodState?.state === 'active') {
    return moodState.valueLabel;
  }

  return moodState?.statusLabel || snapshot.signals.find((item) => item.key === 'mood')?.value || '暂无记录';
}

function snapshotUsedLabels(snapshot: DivinationPersonalizationSnapshot) {
  return snapshot.signals.map((item) => item.label).join('、') || '无';
}

function snapshotMissedText(snapshot: DivinationPersonalizationSnapshot) {
  const dimensionRows = snapshot.dimensionStates || [];
  const missing = dimensionRows.length
    ? dimensionRows
        .filter((item) => item.enabled && item.state === 'missing')
        .map((item) => item.label)
    : snapshot.enabledKeys
        .filter((key) => !snapshot.activeKeys.includes(key))
        .map(personalizationKeyLabel);

  return missing.length ? `未命中：${missing.join('、')}` : '';
}

function personalizationKeyLabel(key: DivinationPersonalizationKey) {
  return getDivinationProfileMapping().dimensionLabels[key] || key;
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

function clearFilters() {
  activeScope.value = 'all';
  activeTopic.value = 'all';
  sortOrder.value = 'desc';
}

function back() {
  uni.navigateBack({
    fail: () => {
      uni.redirectTo({ url: '/pages/divination/index/index' });
    },
  });
}

onShow(() => {
  loadEntries();
  void ensureDivinationContentCatalog().then(() => {
    scopeConfig.value = getDivinationReviewScopes();
    topicConfig.value = getDivinationReviewTopicTabs();
  });
  void syncEntries();
});
</script>

<style lang="scss">
.review-page {
  position: relative;
  min-height: 100vh;
  box-sizing: border-box;
  padding: calc(env(safe-area-inset-top) + 24rpx) 24rpx 88rpx;
  background: linear-gradient(180deg, #fff9ef 0%, #f7efff 48%, #fffaf0 100%);
  color: #4e3825;
}

.review-head,
.overview-panel,
.scope-scroll,
.filter-bar,
.sort-bar,
.review-list,
.empty-state {
  position: relative;
  z-index: 1;
}

.review-head {
  display: grid;
  grid-template-columns: 64rpx 1fr 96rpx;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 22rpx;
}

.back-button,
.new-button,
.sort-button,
.empty-button {
  padding: 0;
  margin: 0;
  border: 0;
}

.back-button::after,
.new-button::after,
.sort-button::after,
.empty-button::after {
  border: 0;
}

.back-button {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.74);
  color: #4e3825;
  font-size: 46rpx;
  line-height: 54rpx;
}

.review-head__copy {
  display: grid;
  gap: 4rpx;
  min-width: 0;
}

.review-title {
  font-size: 42rpx;
  font-family:
    'Iowan Old Style',
    'Times New Roman',
    'Noto Serif SC',
    serif;
  font-weight: 760;
}

.review-subtitle {
  font-size: 22rpx;
  color: rgba(78, 56, 37, 0.56);
}

.new-button {
  height: 58rpx;
  border-radius: 999rpx;
  color: #ffffff;
  background: #4e3825;
  font-size: 23rpx;
  font-weight: 700;
}

.overview-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
  min-height: 172rpx;
  box-sizing: border-box;
  padding: 26rpx 28rpx;
  border-radius: 30rpx;
  background: rgba(255, 255, 255, 0.84);
  border: 1rpx solid rgba(216, 166, 78, 0.24);
  box-shadow: 0 14rpx 38rpx rgba(80, 60, 120, 0.08);
}

.overview-panel__copy {
  display: grid;
  gap: 8rpx;
  min-width: 0;
}

.overview-panel__eyebrow {
  font-size: 21rpx;
  color: #8b6fd6;
}

.overview-panel__value {
  font-size: 56rpx;
  line-height: 1;
  font-weight: 820;
}

.overview-panel__meta {
  font-size: 22rpx;
  color: rgba(78, 56, 37, 0.58);
}

.overview-panel__sync {
  font-size: 21rpx;
  color: rgba(139, 111, 214, 0.72);
}

.overview-panel__seal {
  display: grid;
  place-items: center;
  flex: 0 0 104rpx;
  width: 104rpx;
  height: 104rpx;
  border-radius: 50%;
  color: #b97724;
  background: #fff3d8;
  border: 1rpx solid rgba(216, 166, 78, 0.35);
  font-size: 44rpx;
  font-weight: 760;
}

.scope-scroll {
  margin: 22rpx -24rpx 0;
  white-space: nowrap;
}

.scope-row {
  display: inline-flex;
  gap: 14rpx;
  padding: 0 24rpx 18rpx;
}

.scope-pill {
  display: inline-flex;
  align-items: center;
  gap: 10rpx;
  height: 64rpx;
  padding: 0 20rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.76);
  color: rgba(78, 56, 37, 0.62);
  border: 1rpx solid rgba(139, 111, 214, 0.12);
}

.scope-pill--active {
  color: #ffffff;
  background: linear-gradient(135deg, #8b6fd6, #b898f0);
  box-shadow: 0 12rpx 24rpx rgba(139, 111, 214, 0.2);
}

.scope-pill__label {
  font-size: 23rpx;
  font-weight: 700;
}

.scope-pill__count {
  min-width: 34rpx;
  height: 34rpx;
  padding: 0 8rpx;
  border-radius: 999rpx;
  box-sizing: border-box;
  text-align: center;
  line-height: 34rpx;
  font-size: 20rpx;
  background: rgba(78, 56, 37, 0.08);
}

.scope-pill--active .scope-pill__count {
  background: rgba(255, 255, 255, 0.2);
}

.filter-bar,
.sort-bar {
  margin-top: 4rpx;
  padding: 18rpx 20rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.74);
  border: 1rpx solid rgba(255, 255, 255, 0.92);
}

.filter-bar {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 16rpx;
}

.filter-bar__label,
.sort-bar__label {
  font-size: 22rpx;
  color: rgba(78, 56, 37, 0.58);
}

.topic-scroll {
  white-space: nowrap;
  min-width: 0;
}

.topic-row {
  display: inline-flex;
  gap: 12rpx;
}

.topic-pill {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  height: 52rpx;
  padding: 0 18rpx;
  border-radius: 999rpx;
  color: rgba(78, 56, 37, 0.62);
  background: rgba(139, 111, 214, 0.08);
  font-size: 22rpx;
}

.topic-pill--active {
  color: #8b6fd6;
  background: rgba(139, 111, 214, 0.16);
  font-weight: 700;
}

.sort-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.sort-toggle {
  display: grid;
  grid-template-columns: repeat(2, 126rpx);
  gap: 10rpx;
}

.sort-button {
  height: 52rpx;
  border-radius: 999rpx;
  color: rgba(78, 56, 37, 0.62);
  background: rgba(139, 111, 214, 0.08);
  font-size: 21rpx;
}

.sort-button--active {
  color: #ffffff;
  background: #4e3825;
}

.review-list {
  display: grid;
  gap: 18rpx;
  margin-top: 20rpx;
}

.review-item {
  display: grid;
  gap: 18rpx;
  padding: 24rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.86);
  border: 1rpx solid rgba(255, 255, 255, 0.92);
  box-shadow: 0 14rpx 38rpx rgba(80, 60, 120, 0.08);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.review-item:active {
  transform: scale(0.985);
  box-shadow: 0 8rpx 22rpx rgba(80, 60, 120, 0.08);
}

.review-item__head,
.review-item__foot,
.hexagram-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.topic-badge,
.outcome-badge {
  display: inline-flex;
  align-items: center;
  height: 44rpx;
  box-sizing: border-box;
  border-radius: 999rpx;
  font-size: 20rpx;
}

.topic-badge {
  gap: 7rpx;
  padding: 0 16rpx;
  color: #8b6fd6;
  background: rgba(139, 111, 214, 0.1);
}

.outcome-badge {
  flex: 0 0 auto;
  padding: 0 18rpx;
  font-weight: 700;
}

.outcome-badge--pending {
  color: #8b6fd6;
  background: rgba(139, 111, 214, 0.1);
}

.outcome-badge--fulfilled {
  color: #4f7c5a;
  background: #f3f8ee;
}

.outcome-badge--unfulfilled {
  color: #b75a4f;
  background: #fff0ea;
}

.hexagram-row {
  display: grid;
  grid-template-columns: 92rpx minmax(0, 1fr);
  gap: 20rpx;
  align-items: center;
}

.mini-hexagram {
  display: grid;
  gap: 7rpx;
  width: 92rpx;
}

.mini-line {
  display: flex;
  gap: 10rpx;
  height: 8rpx;
}

.mini-line__segment {
  flex: 1;
  border-radius: 999rpx;
  background: #3d3342;
}

.mini-line:not(.mini-line--broken) .mini-line__segment:first-child {
  flex-basis: 100%;
}

.mini-line:not(.mini-line--broken) .mini-line__segment:last-child {
  display: none;
}

.hexagram-copy {
  display: grid;
  gap: 8rpx;
  min-width: 0;
}

.hexagram-title {
  min-width: 0;
  font-size: 34rpx;
  font-weight: 760;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.favorite-star {
  flex: 0 0 auto;
  color: #d9a64e;
  font-size: 28rpx;
}

.hexagram-meta,
.question-line,
.note-box__text,
.review-item__foot {
  font-size: 23rpx;
  line-height: 1.55;
  color: rgba(78, 56, 37, 0.62);
}

.question-line {
  display: block;
  color: rgba(78, 56, 37, 0.72);
}

.note-box {
  display: grid;
  gap: 8rpx;
  padding: 18rpx 20rpx;
  border-radius: 22rpx;
  background: rgba(255, 249, 239, 0.9);
  border: 1rpx solid rgba(216, 166, 78, 0.15);
}

.note-box--empty {
  background: rgba(139, 111, 214, 0.06);
  border-color: rgba(139, 111, 214, 0.1);
}

.note-box__label {
  font-size: 20rpx;
  color: #b97724;
}

.note-box--empty .note-box__label {
  color: #8b6fd6;
}

.review-profile {
  display: grid;
  gap: 14rpx;
  padding: 18rpx 20rpx;
  border-radius: 22rpx;
  background: rgba(139, 111, 214, 0.06);
  border: 1rpx solid rgba(139, 111, 214, 0.1);
}

.review-profile__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14rpx;
}

.review-profile__title {
  font-size: 21rpx;
  color: #8b6fd6;
  font-weight: 700;
}

.review-profile__tone {
  flex: 0 0 auto;
  padding: 4rpx 12rpx;
  border-radius: 999rpx;
  font-size: 20rpx;
  font-weight: 760;
}

.review-profile__tone--move {
  color: #4f7c5a;
  background: rgba(79, 124, 90, 0.12);
}

.review-profile__tone--clarify {
  color: #8b6fd6;
  background: rgba(139, 111, 214, 0.1);
}

.review-profile__tone--soften {
  color: #b97724;
  background: rgba(216, 166, 78, 0.16);
}

.review-profile__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10rpx;
}

.review-profile__cell {
  display: grid;
  gap: 6rpx;
  min-width: 0;
  padding: 12rpx;
  border-radius: 16rpx;
  background: rgba(255, 255, 255, 0.58);
}

.review-profile__label {
  font-size: 19rpx;
  color: rgba(78, 56, 37, 0.5);
}

.review-profile__value {
  min-width: 0;
  font-size: 21rpx;
  line-height: 1.35;
  color: #4e3825;
  font-weight: 720;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.review-profile__miss {
  font-size: 21rpx;
  color: #b97724;
  line-height: 1.45;
}

.review-item__foot {
  padding-top: 2rpx;
}

.review-item__link {
  color: #8b6fd6;
  font-weight: 700;
}

.empty-state {
  display: grid;
  gap: 14rpx;
  margin-top: 20rpx;
  padding: 30rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.84);
  border: 1rpx solid rgba(255, 255, 255, 0.92);
  box-shadow: 0 14rpx 38rpx rgba(80, 60, 120, 0.08);
}

.empty-state__title {
  font-size: 32rpx;
  font-weight: 760;
}

.empty-state__text {
  font-size: 24rpx;
  line-height: 1.65;
  color: rgba(78, 56, 37, 0.64);
}

.empty-button {
  width: fit-content;
  height: 66rpx;
  padding: 0 28rpx;
  border-radius: 999rpx;
  color: #ffffff;
  background: #4e3825;
  font-size: 23rpx;
  font-weight: 700;
}
</style>
