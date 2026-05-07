<template>
  <view v-if="result" class="result-page">
    <view class="result-card">
      <view class="result-card__head">
        <view>
          <text class="result-eyebrow">{{ result.topicLabel }} · {{ result.casting?.methodLabel || '略筮法' }}</text>
          <text class="result-title">本卦：{{ result.hexagram.name }}</text>
          <text class="result-subtitle">{{ result.hexagram.meaning }}</text>
        </view>
        <text class="level-pill">{{ result.hexagram.level }}</text>
      </view>

      <view class="hexagram-area">
        <view class="hexagram-lines">
          <view
            v-for="(solid, index) in displayLines"
            :key="index"
            class="hex-line"
            :class="{ 'hex-line--broken': !solid }"
          >
            <view class="hex-line__segment"></view>
            <view class="hex-line__segment"></view>
          </view>
        </view>
        <view class="hexagram-copy">
          <text class="hexagram-symbol">{{ result.hexagram.symbol }}</text>
          <text class="hexagram-meta">{{ result.hexagram.upperTrigram }}上 · {{ result.hexagram.lowerTrigram }}下</text>
          <button v-if="result.changedHexagram" class="changed-button" @tap="showChangedHexagram">
            查看变卦：{{ result.changedHexagram.name }}
          </button>
        </view>
      </view>

      <view v-if="result.casting" class="casting-strip">
        <view class="casting-chip">
          <text class="casting-chip__label">起法</text>
          <text class="casting-chip__value">{{ result.casting.methodLabel }}</text>
        </view>
        <view class="casting-chip">
          <text class="casting-chip__label">动爻</text>
          <text class="casting-chip__value">{{ result.casting.movingLineLabel }}</text>
        </view>
        <view class="casting-chip">
          <text class="casting-chip__label">变卦</text>
          <text class="casting-chip__value">{{ result.changedHexagram?.name || '本卦不变' }}</text>
        </view>
      </view>
    </view>

    <view v-if="result.oracle" class="oracle-stack">
      <view class="oracle-card oracle-card--main">
        <text class="oracle-eyebrow">{{ result.oracle.title }}</text>
        <text class="oracle-title">{{ result.oracle.subject }}</text>
        <text class="oracle-text">{{ result.oracle.situation }}</text>
      </view>

      <view class="oracle-grid">
        <view class="oracle-panel">
          <text class="oracle-panel__label">动爻</text>
          <text class="oracle-panel__title">{{ result.casting?.movingLineLabel || movingLineFallback }}</text>
          <text class="oracle-panel__text">{{ result.oracle.moving }}</text>
          <text v-if="movingLineReading" class="oracle-panel__advice">{{ movingLineReading.advice }}</text>
        </view>
        <view class="oracle-panel">
          <text class="oracle-panel__label">变卦</text>
          <text class="oracle-panel__title">{{ result.changedHexagram?.name || '本卦不变' }}</text>
          <text class="oracle-panel__text">{{ result.oracle.tendency }}</text>
          <text class="oracle-panel__advice">{{ result.oracle.action }}</text>
        </view>
      </view>
    </view>

    <view v-if="result.topicReading" class="topic-reading">
      <text class="topic-reading__eyebrow">问事类型</text>
      <text class="topic-reading__title">{{ result.topicReading.title }}</text>
      <text class="topic-reading__text">{{ result.topicReading.summary }}</text>
      <view class="topic-reading__pair">
        <view>
          <text class="topic-reading__label">机会</text>
          <text class="topic-reading__body">{{ result.topicReading.opportunity }}</text>
        </view>
        <view>
          <text class="topic-reading__label topic-reading__label--risk">风险</text>
          <text class="topic-reading__body">{{ result.topicReading.risk }}</text>
        </view>
      </view>
      <text class="topic-reading__action">{{ result.topicReading.action }}</text>
    </view>

    <view class="score-row">
      <view
        v-for="item in scoreItems"
        :key="item.label"
        class="score-ring"
        :style="scoreStyle(item.value, item.color)"
      >
        <view class="score-ring__inner">
          <text class="score-value">{{ item.value }}</text>
          <text class="score-label">{{ item.label }}</text>
        </view>
      </view>
    </view>

    <view class="detail-stack">
      <view class="detail-card">
        <text class="detail-title">完整解读</text>
        <text class="detail-text">{{ result.analysis }}</text>
      </view>

      <view class="detail-card">
        <text class="detail-title">为什么是这个结果</text>
        <text class="detail-text">{{ result.personalizedReason }}</text>
      </view>

      <view class="detail-card">
        <text class="detail-title">关键提醒</text>
        <view class="bullet-list">
          <text v-for="item in result.reminders" :key="item" class="bullet-item">{{ item }}</text>
        </view>
      </view>

      <view class="detail-card">
        <text class="detail-title">今天可以这样做</text>
        <view class="bullet-list">
          <text v-for="item in result.advice" :key="item" class="bullet-item">{{ item }}</text>
        </view>
      </view>

      <view class="lucky-card">
        <view class="lucky-item">
          <text class="lucky-label">幸运色</text>
          <text class="lucky-value">{{ result.lucky.color }}</text>
        </view>
        <view class="lucky-item">
          <text class="lucky-label">幸运数字</text>
          <text class="lucky-value">{{ result.lucky.number }}</text>
        </view>
        <view class="lucky-item">
          <text class="lucky-label">幸运方位</text>
          <text class="lucky-value">{{ result.lucky.direction }}</text>
        </view>
        <view class="lucky-item">
          <text class="lucky-label">幸运元素</text>
          <text class="lucky-value">{{ result.lucky.element }}</text>
        </view>
      </view>

      <view class="suitable-pair">
        <view class="suitable-panel suitable-panel--good">
          <text class="suitable-label">宜</text>
          <text class="suitable-text">{{ result.suitable.join('、') }}</text>
        </view>
        <view class="suitable-panel suitable-panel--avoid">
          <text class="suitable-label">忌</text>
          <text class="suitable-text">{{ result.avoid.join('、') }}</text>
        </view>
      </view>

      <view class="review-card">
        <view class="review-card__head">
          <view>
            <text class="detail-title">复盘记录</text>
            <text class="review-card__subtitle">收藏、标记应验，并留下之后回看的备注。</text>
          </view>
          <button class="favorite-button" :class="{ 'favorite-button--active': review.favorite }" @tap="toggleFavorite">
            {{ review.favorite ? '已收藏' : '收藏' }}
          </button>
        </view>

        <view class="outcome-row">
          <button
            v-for="item in outcomeOptions"
            :key="item.value"
            class="outcome-button"
            :class="{ 'outcome-button--active': review.outcome === item.value }"
            @tap="markOutcome(item.value)"
          >
            {{ item.label }}
          </button>
        </view>

        <textarea
          v-model="review.note"
          class="review-note"
          maxlength="500"
          placeholder="写下后续应验、偏差或当时的真实处境"
          placeholder-class="review-note__placeholder"
        />
        <view class="review-actions">
          <button class="review-save" @tap="saveReviewNote">保存复盘</button>
          <button class="review-list-button" @tap="openReviewList">复盘列表</button>
        </view>
      </view>
    </view>

    <view class="bottom-buttons">
      <button class="action-button action-button--ghost" @tap="saveResult">保存结果</button>
      <button class="action-button action-button--primary" @tap="openPoster">分享海报</button>
      <button class="action-button action-button--ghost" @tap="again">再占一次</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import {
  getDivinationReview,
  getDivinationResult,
  getOrCreateTodayDivinationResult,
  saveDivinationResult,
  saveDivinationReview,
} from '../../../services/divination';
import type { DivinationReview, DivinationResult } from '../../../types/divination';

const result = ref<DivinationResult | null>(null);
const review = ref<DivinationReview>(createDefaultReview(''));
const outcomeOptions: Array<{ value: DivinationReview['outcome']; label: string }> = [
  { value: 'pending', label: '待复盘' },
  { value: 'fulfilled', label: '已应验' },
  { value: 'unfulfilled', label: '未应验' },
];

const displayLines = computed(() => {
  if (!result.value) {
    return [];
  }

  return [...result.value.hexagram.lines].reverse();
});

const scoreItems = computed(() => {
  if (!result.value) {
    return [];
  }

  return [
    { label: '综合运势', value: result.value.scores.overall, color: '#8B6FD6' },
    { label: '情绪指数', value: result.value.scores.emotion, color: '#F3A6B5' },
    { label: '行动时机', value: result.value.scores.action, color: '#8FB99A' },
  ];
});

const movingLineFallback = computed(() => {
  const line = result.value?.changingLines?.[0] || 1;
  return `第 ${line} 爻`;
});

const movingLineReading = computed(() => {
  if (!result.value) {
    return null;
  }

  const line = result.value.casting?.movingLine || result.value.changingLines?.[0] || 1;
  return result.value.hexagram.lineReadings?.[line - 1] || null;
});

function scoreStyle(value: number, color: string) {
  return {
    background: `conic-gradient(${color} ${value * 3.6}deg, rgba(139,111,214,0.12) 0deg)`,
  };
}

function showChangedHexagram() {
  if (!result.value?.changedHexagram) {
    return;
  }
  const changed = result.value.changedHexagram;

  uni.showModal({
    title: changed.name,
    content: [changed.meaning, changed.decision].filter(Boolean).join('\n'),
    showCancel: false,
    confirmText: '知道了',
  });
}

function saveResult() {
  if (!result.value) {
    return;
  }

  saveDivinationResult(result.value);
  uni.showToast({
    title: '已保存',
    icon: 'success',
  });
}

function openPoster() {
  if (!result.value) {
    return;
  }

  uni.navigateTo({
    url: `/pages/divination/poster/index?id=${encodeURIComponent(result.value.id)}`,
  });
}

function again() {
  uni.navigateTo({
    url: '/pages/divination/select/index',
  });
}

function toggleFavorite() {
  if (!result.value) {
    return;
  }

  review.value = saveDivinationReview(result.value.id, {
    favorite: !review.value.favorite,
  });
  result.value.review = review.value;
}

function markOutcome(outcome: DivinationReview['outcome']) {
  if (!result.value) {
    return;
  }

  review.value = saveDivinationReview(result.value.id, {
    outcome,
  });
  result.value.review = review.value;
}

function saveReviewNote() {
  if (!result.value) {
    return;
  }

  review.value = saveDivinationReview(result.value.id, {
    note: review.value.note,
  });
  result.value.review = review.value;
  uni.showToast({
    title: '复盘已保存',
    icon: 'success',
  });
}

function openReviewList() {
  uni.navigateTo({
    url: '/pages/divination/review/index',
  });
}

function createDefaultReview(resultId: string): DivinationReview {
  return {
    resultId,
    favorite: false,
    outcome: 'pending',
    note: '',
    updatedAt: Date.now(),
  };
}

onLoad((query) => {
  const id = String(query?.id || '');
  const nextResult = getDivinationResult(id) || getOrCreateTodayDivinationResult();
  result.value = nextResult;
  review.value = getDivinationReview(nextResult.id) || nextResult.review || createDefaultReview(nextResult.id);
});
</script>

<style lang="scss">
.result-page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: calc(env(safe-area-inset-top) + 24rpx) 24rpx 180rpx;
  background:
    radial-gradient(circle at 82% 12%, rgba(216, 166, 78, 0.16), transparent 28%),
    linear-gradient(180deg, #fff9ef 0%, #f5edff 48%, #fffaf0 100%);
  color: #4e3825;
}

.result-card,
.detail-card,
.lucky-card,
.suitable-panel,
.topic-reading,
.review-card {
  background: rgba(255, 255, 255, 0.84);
  border: 1rpx solid rgba(255, 255, 255, 0.92);
  box-shadow: 0 14rpx 38rpx rgba(80, 60, 120, 0.08);
}

.result-card {
  padding: 28rpx;
  border-radius: 30rpx;
  border-color: rgba(216, 166, 78, 0.26);
}

.result-card__head {
  display: flex;
  justify-content: space-between;
  gap: 20rpx;
}

.result-eyebrow,
.result-title,
.result-subtitle {
  display: block;
}

.result-eyebrow {
  font-size: 22rpx;
  color: #8b6fd6;
}

.result-title {
  margin-top: 8rpx;
  font-size: 42rpx;
  font-weight: 700;
  font-family:
    'Iowan Old Style',
    'Times New Roman',
    'Noto Serif SC',
    serif;
}

.result-subtitle {
  margin-top: 10rpx;
  font-size: 24rpx;
  color: rgba(78, 56, 37, 0.62);
}

.level-pill {
  flex: 0 0 auto;
  align-self: start;
  padding: 9rpx 20rpx;
  border-radius: 999rpx;
  color: #b97724;
  background: #fff3d8;
  border: 1rpx solid rgba(216, 166, 78, 0.34);
  font-size: 22rpx;
  font-weight: 700;
}

.hexagram-area {
  display: flex;
  gap: 30rpx;
  margin-top: 34rpx;
}

.hexagram-lines {
  display: grid;
  gap: 15rpx;
  flex: 0 0 192rpx;
}

.hex-line {
  display: flex;
  gap: 28rpx;
  height: 18rpx;
}

.hex-line__segment {
  flex: 1;
  border-radius: 999rpx;
  background: #3d3342;
}

.hex-line:not(.hex-line--broken) .hex-line__segment:first-child {
  flex-basis: 100%;
}

.hex-line:not(.hex-line--broken) .hex-line__segment:last-child {
  display: none;
}

.hexagram-copy {
  display: grid;
  align-content: center;
  gap: 10rpx;
  flex: 1;
  min-width: 0;
}

.hexagram-symbol {
  font-size: 72rpx;
  line-height: 1;
  color: rgba(139, 111, 214, 0.38);
}

.hexagram-meta {
  font-size: 23rpx;
  color: rgba(78, 56, 37, 0.58);
}

.changed-button {
  display: inline-grid;
  min-width: 228rpx;
  height: 52rpx;
  padding: 0 22rpx;
  margin: 4rpx 0 0;
  border-radius: 999rpx;
  background: rgba(139, 111, 214, 0.1);
  color: #8b6fd6;
  font-size: 22rpx;
}

.changed-button::after,
.action-button::after {
  border: 0;
}

.oracle-stack {
  display: grid;
  gap: 16rpx;
  margin-top: 20rpx;
}

.oracle-card,
.oracle-panel {
  background: rgba(255, 255, 255, 0.86);
  border: 1rpx solid rgba(255, 255, 255, 0.92);
  box-shadow: 0 14rpx 38rpx rgba(80, 60, 120, 0.08);
}

.oracle-card {
  padding: 28rpx;
  border-radius: 28rpx;
}

.oracle-card--main {
  border-color: rgba(139, 111, 214, 0.16);
}

.oracle-eyebrow,
.oracle-title,
.oracle-text,
.oracle-panel__label,
.oracle-panel__title,
.oracle-panel__text,
.oracle-panel__advice {
  display: block;
}

.oracle-eyebrow,
.oracle-panel__label {
  font-size: 21rpx;
  color: #8b6fd6;
}

.oracle-title {
  margin-top: 8rpx;
  font-size: 34rpx;
  font-weight: 760;
}

.oracle-text,
.oracle-panel__text {
  margin-top: 12rpx;
  font-size: 25rpx;
  line-height: 1.62;
  color: rgba(78, 56, 37, 0.74);
}

.oracle-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
}

.oracle-panel {
  min-width: 0;
  padding: 24rpx;
  border-radius: 26rpx;
}

.oracle-panel__title {
  margin-top: 8rpx;
  font-size: 30rpx;
  font-weight: 740;
  color: #4e3825;
}

.oracle-panel__advice {
  margin-top: 14rpx;
  padding-top: 14rpx;
  border-top: 1rpx solid rgba(139, 111, 214, 0.12);
  font-size: 23rpx;
  line-height: 1.5;
  color: #8b6fd6;
}

.topic-reading {
  display: grid;
  gap: 14rpx;
  margin-top: 20rpx;
  padding: 28rpx;
  border-radius: 28rpx;
  border-color: rgba(216, 166, 78, 0.2);
}

.topic-reading__eyebrow,
.topic-reading__title,
.topic-reading__text,
.topic-reading__label,
.topic-reading__body,
.topic-reading__action {
  display: block;
}

.topic-reading__eyebrow {
  font-size: 21rpx;
  color: #b97724;
}

.topic-reading__title {
  font-size: 34rpx;
  font-weight: 760;
}

.topic-reading__text,
.topic-reading__body {
  font-size: 24rpx;
  line-height: 1.58;
  color: rgba(78, 56, 37, 0.72);
}

.topic-reading__pair {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
}

.topic-reading__pair > view {
  min-width: 0;
  padding: 18rpx;
  border-radius: 20rpx;
  background: rgba(139, 111, 214, 0.07);
}

.topic-reading__label {
  margin-bottom: 8rpx;
  font-size: 20rpx;
  color: #8b6fd6;
}

.topic-reading__label--risk {
  color: #b97724;
}

.topic-reading__action {
  padding: 18rpx 20rpx;
  border-radius: 20rpx;
  background: rgba(216, 166, 78, 0.12);
  color: #7a5426;
  font-size: 24rpx;
  line-height: 1.55;
}

.casting-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
  margin-top: 28rpx;
}

.casting-chip {
  display: grid;
  gap: 6rpx;
  min-height: 82rpx;
  box-sizing: border-box;
  padding: 15rpx 16rpx;
  border-radius: 20rpx;
  background: rgba(139, 111, 214, 0.08);
}

.casting-chip__label {
  font-size: 19rpx;
  color: rgba(78, 56, 37, 0.52);
}

.casting-chip__value {
  min-width: 0;
  font-size: 22rpx;
  font-weight: 720;
  color: #4e3825;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.score-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16rpx;
  margin-top: 20rpx;
}

.score-ring {
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  border-radius: 50%;
}

.score-ring__inner {
  display: grid;
  place-items: center;
  width: calc(100% - 18rpx);
  height: calc(100% - 18rpx);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
}

.score-value {
  font-size: 36rpx;
  font-weight: 800;
  color: #4e3825;
}

.score-label {
  margin-top: 4rpx;
  font-size: 20rpx;
  color: rgba(78, 56, 37, 0.58);
}

.detail-stack {
  display: grid;
  gap: 18rpx;
  margin-top: 20rpx;
}

.detail-card {
  display: grid;
  gap: 14rpx;
  padding: 24rpx;
  border-radius: 24rpx;
}

.detail-title {
  font-size: 27rpx;
  font-weight: 700;
}

.detail-text,
.bullet-item {
  font-size: 24rpx;
  line-height: 1.72;
  color: rgba(78, 56, 37, 0.7);
}

.bullet-list {
  display: grid;
  gap: 10rpx;
}

.bullet-item::before {
  content: '✦ ';
  color: #8b6fd6;
}

.lucky-card {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0;
  padding: 22rpx 10rpx;
  border-radius: 24rpx;
}

.lucky-item {
  display: grid;
  justify-items: center;
  gap: 8rpx;
  padding: 0 8rpx;
}

.lucky-item + .lucky-item {
  border-left: 1rpx solid rgba(78, 56, 37, 0.1);
}

.lucky-label {
  font-size: 20rpx;
  color: rgba(78, 56, 37, 0.5);
}

.lucky-value {
  font-size: 24rpx;
  font-weight: 700;
  color: #4e3825;
}

.suitable-pair {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18rpx;
}

.suitable-panel {
  min-height: 130rpx;
  padding: 24rpx;
  border-radius: 24rpx;
}

.suitable-panel--good {
  background: #f3f8ee;
}

.suitable-panel--avoid {
  background: #fff0ea;
}

.suitable-label {
  display: block;
  font-size: 28rpx;
  font-weight: 800;
}

.suitable-panel--good .suitable-label {
  color: #4f7c5a;
}

.suitable-panel--avoid .suitable-label {
  color: #b75a4f;
}

.suitable-text {
  display: block;
  margin-top: 12rpx;
  font-size: 23rpx;
  line-height: 1.5;
  color: rgba(78, 56, 37, 0.68);
}

.review-card {
  display: grid;
  gap: 18rpx;
  padding: 24rpx;
  border-radius: 24rpx;
}

.review-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
}

.review-card__subtitle {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: rgba(78, 56, 37, 0.56);
}

.favorite-button,
.outcome-button,
.review-save,
.review-list-button {
  padding: 0;
  margin: 0;
  border: 0;
}

.favorite-button::after,
.outcome-button::after,
.review-save::after,
.review-list-button::after {
  border: 0;
}

.favorite-button {
  flex: 0 0 auto;
  min-width: 116rpx;
  height: 54rpx;
  border-radius: 999rpx;
  color: #8b6fd6;
  background: rgba(139, 111, 214, 0.1);
  font-size: 22rpx;
}

.favorite-button--active {
  color: #ffffff;
  background: #8b6fd6;
}

.outcome-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
}

.outcome-button {
  height: 62rpx;
  border-radius: 999rpx;
  color: rgba(78, 56, 37, 0.62);
  background: rgba(139, 111, 214, 0.08);
  font-size: 22rpx;
}

.outcome-button--active {
  color: #ffffff;
  background: linear-gradient(135deg, #8b6fd6, #b898f0);
}

.review-note {
  width: 100%;
  min-height: 150rpx;
  box-sizing: border-box;
  padding: 20rpx;
  border-radius: 22rpx;
  background: rgba(255, 249, 239, 0.92);
  color: #4e3825;
  font-size: 24rpx;
  line-height: 1.55;
}

.review-note__placeholder {
  color: rgba(78, 56, 37, 0.42);
}

.review-actions {
  display: grid;
  grid-template-columns: minmax(0, 1.18fr) minmax(0, 1fr);
  gap: 12rpx;
}

.review-save {
  height: 68rpx;
  border-radius: 999rpx;
  color: #ffffff;
  background: #4e3825;
  font-size: 24rpx;
  font-weight: 700;
}

.review-list-button {
  height: 68rpx;
  border-radius: 999rpx;
  color: #8b6fd6;
  background: rgba(139, 111, 214, 0.1);
  font-size: 24rpx;
  font-weight: 700;
}

.bottom-buttons {
  position: fixed;
  left: 24rpx;
  right: 24rpx;
  bottom: calc(env(safe-area-inset-bottom) + 24rpx);
  display: grid;
  grid-template-columns: 1fr 1.2fr 1fr;
  gap: 14rpx;
  z-index: 10;
}

.action-button {
  display: grid;
  place-items: center;
  height: 76rpx;
  padding: 0;
  margin: 0;
  border-radius: 999rpx;
  font-size: 25rpx;
  font-weight: 700;
}

.action-button--primary {
  color: #ffffff;
  background: linear-gradient(135deg, #8b6fd6, #b898f0);
  box-shadow: 0 14rpx 32rpx rgba(139, 111, 214, 0.26);
}

.action-button--ghost {
  color: #8b6fd6;
  background: rgba(255, 255, 255, 0.9);
  border: 1rpx solid rgba(139, 111, 214, 0.18);
}
</style>
