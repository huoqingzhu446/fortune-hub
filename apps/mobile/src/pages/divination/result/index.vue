<template>
  <view v-if="result" class="result-page">
    <view class="result-card">
      <view class="result-card__head">
        <view>
          <text class="result-eyebrow">{{ result.topicLabel }}</text>
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
        <text class="detail-title">卦象解读</text>
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
  getDivinationResult,
  getOrCreateTodayDivinationResult,
  saveDivinationResult,
} from '../../../services/divination';
import type { DivinationResult } from '../../../types/divination';

const result = ref<DivinationResult | null>(null);

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

function scoreStyle(value: number, color: string) {
  return {
    background: `conic-gradient(${color} ${value * 3.6}deg, rgba(139,111,214,0.12) 0deg)`,
  };
}

function showChangedHexagram() {
  if (!result.value?.changedHexagram) {
    return;
  }

  uni.showModal({
    title: result.value.changedHexagram.name,
    content: result.value.changedHexagram.meaning,
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

onLoad((query) => {
  const id = String(query?.id || '');
  result.value = getDivinationResult(id) || getOrCreateTodayDivinationResult();
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
.suitable-panel {
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
