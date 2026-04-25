<template>
  <view class="fortune-card" @tap="$emit('select')">
    <view class="fortune-card__wash"></view>
    <view class="fortune-card__spark fortune-card__spark--left"></view>
    <view class="fortune-card__spark fortune-card__spark--right"></view>

    <view class="fortune-card__head">
      <view class="fortune-card__copy">
        <text class="fortune-card__eyebrow">{{ label }}</text>
        <view class="fortune-card__score-line">
          <text class="fortune-card__score">{{ score }}</text>
          <text class="fortune-card__denominator">/ 100</text>
        </view>
        <view class="fortune-card__score-track">
          <view class="fortune-card__score-track-fill" :style="{ width: `${Math.max(12, Math.min(score, 100))}%` }"></view>
          <view class="fortune-card__score-track-dot"></view>
        </view>
      </view>

      <view class="fortune-card__orbital">
        <view class="fortune-card__orbital-art" :style="orbitalStyle"></view>
      </view>
    </view>

    <view class="fortune-card__body">
      <text class="fortune-card__title">{{ title }}</text>
      <text class="fortune-card__summary">{{ summary }}</text>
    </view>

    <view class="fortune-card__footer">
      <view
        v-for="item in tags"
        :key="item.label"
        class="fortune-card__tag"
      >
        <text class="fortune-card__tag-label">{{ item.label }}</text>
        <text class="fortune-card__tag-value">{{ item.value }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export interface FortuneCardTag {
  label: string;
  value: string;
}

const props = defineProps<{
  label: string;
  score: number;
  status: string;
  title: string;
  summary: string;
  tags: FortuneCardTag[];
  orbitalSrc?: string;
}>();

defineEmits<{
  (event: 'select'): void;
}>();

const orbitalStyle = computed(() => ({
  backgroundImage: props.orbitalSrc ? `url("${props.orbitalSrc}")` : 'none',
}));
</script>

<style lang="scss">
.fortune-card {
  position: relative;
  display: grid;
  margin-top: 0rpx;
  gap: 30rpx;
  padding: 44rpx 30rpx 34rpx;
  overflow: hidden;
  border-radius: 0rpx;
  background:
    radial-gradient(circle at 76% 36%, rgba(var(--theme-accent-rgb), 0.18), transparent 18%),
    radial-gradient(circle at 18% 18%, rgba(var(--theme-primary-rgb), 0.18), transparent 26%),
    linear-gradient(112deg, rgba(var(--theme-primary-rgb), 0.12) 0%, rgba(255, 252, 246, 0.94) 54%, rgba(var(--theme-accent-rgb), 0.08) 100%);
  border: 1rpx solid rgba(255, 255, 255, 0.88);
  box-shadow:
    0 26rpx 68rpx rgba(143, 156, 180, 0.14),
    0 0 0 1rpx rgba(255, 255, 255, 0.42) inset;
}

.fortune-card__wash {
  position: absolute;
  inset: auto auto 26rpx 36rpx;
  width: 340rpx;
  height: 180rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(var(--theme-primary-rgb), 0.18) 0%, rgba(255, 255, 255, 0) 74%);
  filter: blur(26rpx);
}

.fortune-card__spark {
  position: absolute;
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  background: rgba(var(--theme-accent-rgb), 0.82);
  box-shadow:
    0 0 0 10rpx rgba(255, 255, 255, 0.18),
    0 0 22rpx rgba(var(--theme-accent-rgb), 0.32);
}

.fortune-card__spark::before,
.fortune-card__spark::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  background: rgba(var(--theme-accent-rgb), 0.56);
  transform: translate(-50%, -50%);
}

.fortune-card__spark::before {
  width: 2rpx;
  height: 28rpx;
}

.fortune-card__spark::after {
  width: 28rpx;
  height: 2rpx;
}

.fortune-card__spark--left {
  top: 64rpx;
  left: 298rpx;
}

.fortune-card__spark--right {
  top: 184rpx;
  right: 144rpx;
}

.fortune-card__head {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  gap: 24rpx;
  align-items: flex-start;
}

.fortune-card__copy {
  display: grid;
  gap: 18rpx;
}

.fortune-card__eyebrow,
.fortune-card__tag-label {
  font-size: 22rpx;
  letter-spacing: 0.08em;
  color: var(--theme-primary);
}

.fortune-card__score-line {
  display: flex;
  align-items: baseline;
  gap: 10rpx;
}

.fortune-card__score {
  font-size: 180rpx;
  line-height: 0.82;
  font-weight: 300;
  color: var(--theme-text-primary);
  font-family:
    'Iowan Old Style',
    'Times New Roman',
    'Noto Serif SC',
    serif;
}

.fortune-card__denominator {
  font-size: 30rpx;
  color: var(--theme-text-secondary);
}

.fortune-card__score-track {
  position: relative;
  width: 206rpx;
  height: 8rpx;
  border-radius: 999rpx;
  background: linear-gradient(90deg, rgba(var(--theme-accent-rgb), 0.42) 0%, rgba(var(--theme-accent-rgb), 0.08) 100%);
}

.fortune-card__score-track-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--theme-accent) 0%, var(--theme-primary) 100%);
}

.fortune-card__score-track-dot {
  position: absolute;
  top: 50%;
  left: 108rpx;
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  border: 2rpx solid rgba(var(--theme-accent-rgb), 0.8);
  box-shadow: 0 0 12rpx rgba(var(--theme-accent-rgb), 0.26);
  transform: translate(-50%, -50%);
}

.fortune-card__orbital {
  position: relative;
  flex: 0 0 336rpx;
  width: 336rpx;
  height: 286rpx;
  margin-top: 8rpx;
}

.fortune-card__orbital-art {
  position: absolute;
  inset: 0;
  background-position: center center;
  background-repeat: no-repeat;
  background-size: 104%;
  filter: drop-shadow(0 18rpx 40rpx rgba(var(--theme-primary-rgb), 0.14));
  transform: none;
}

.fortune-card__body {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 12rpx;
}

.fortune-card__title {
  font-size: 30rpx;
  font-weight: 500;
  line-height: 1.45;
  color: var(--theme-text-primary);
}

.fortune-card__summary {
  font-size: 24rpx;
  line-height: 1.7;
  color: var(--theme-text-secondary);
}

.fortune-card__status {
  font-size: 24rpx;
  color: var(--theme-text-secondary);
}

.fortune-card__footer {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
  padding: 20rpx 2rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.52);
  box-shadow: 0 0 0 1rpx rgba(255, 255, 255, 0.48) inset;
}

.fortune-card__tag {
  display: grid;
  gap: 8rpx;
  text-align: center;
}

.fortune-card__tag-label {
  letter-spacing: 0;
  font-size: 20rpx;
  color: var(--theme-text-tertiary);
}

.fortune-card__tag-value {
  font-size: 24rpx;
  color: var(--theme-text-primary);
}
</style>
