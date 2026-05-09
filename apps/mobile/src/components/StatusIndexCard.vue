<template>
  <view class="status-index-card" @tap="$emit('select')">
    <view class="status-index-card__glow status-index-card__glow--one"></view>
    <view class="status-index-card__glow status-index-card__glow--two"></view>

    <view class="status-index-card__top">
      <view class="status-index-card__metric">
        <text class="status-index-card__label">{{ label }}</text>
        <view class="status-index-card__score-row">
          <text class="status-index-card__score">{{ normalizedScore }}</text>
          <text class="status-index-card__unit">/ 100</text>
        </view>
        <view class="status-index-card__progress">
          <view class="status-index-card__progress-fill" :style="{ width: `${progressValue}%` }"></view>
        </view>
      </view>

      <view class="status-index-card__oracle">
        <view class="status-index-card__orbit status-index-card__orbit--outer"></view>
        <view class="status-index-card__orbit status-index-card__orbit--middle"></view>
        <view class="status-index-card__orbit status-index-card__orbit--inner"></view>
        <view class="status-index-card__dial-line status-index-card__dial-line--vertical"></view>
        <view class="status-index-card__dial-line status-index-card__dial-line--horizontal"></view>
        <view class="status-index-card__light-ball"></view>
        <view class="status-index-card__spark status-index-card__spark--one"></view>
        <view class="status-index-card__spark status-index-card__spark--two"></view>
      </view>
    </view>

    <view class="status-index-card__body">
      <text class="status-index-card__title">{{ title }}</text>
      <text class="status-index-card__summary">{{ summary }}</text>
    </view>

    <view class="status-index-card__capsule">
      <view
        v-for="item in displayTags"
        :key="item.label"
        class="status-index-card__capsule-item"
      >
        <view class="status-index-card__capsule-copy">
          <text class="status-index-card__capsule-label">{{ item.label }}</text>
          <text class="status-index-card__capsule-value">{{ item.value }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export interface StatusIndexTag {
  label: string;
  value: string;
}

const props = defineProps<{
  label: string;
  score: number;
  status: string;
  title: string;
  summary: string;
  tags: StatusIndexTag[];
}>();

defineEmits<{
  (event: 'select'): void;
}>();

const normalizedScore = computed(() => Math.max(0, Math.min(100, Math.round(props.score || 0))));
const progressValue = computed(() => Math.max(8, normalizedScore.value));
const displayTags = computed(() =>
  props.tags.map((item, index) =>
    index === 2 && props.status
      ? {
          ...item,
          value: formatStatusText(props.status),
        }
      : item,
  ),
);

function formatStatusText(value: string) {
  return value.replace(/[：:]/g, ' · ');
}
</script>

<style lang="scss">
.status-index-card {
  position: relative;
  display: grid;
  gap: 34rpx;
  overflow: hidden;
  padding: 42rpx 36rpx 34rpx;
  border-radius: 44rpx;
  color: var(--theme-text-primary);
  background:
    radial-gradient(circle at 82% 24%, rgba(var(--theme-accent-rgb), 0.2), transparent 28%),
    radial-gradient(circle at 8% 8%, rgba(255, 255, 255, 0.86), transparent 34%),
    linear-gradient(136deg, rgba(255, 255, 255, 0.82) 0%, rgba(255, 255, 255, 0.54) 42%, rgba(var(--theme-primary-rgb), 0.1) 100%);
  border: 1rpx solid rgba(255, 255, 255, 0.78);
  box-shadow:
    0 26rpx 70rpx rgba(var(--theme-text-primary-rgb), 0.1),
    0 0 0 1rpx rgba(var(--theme-primary-rgb), 0.08) inset;
  backdrop-filter: blur(18rpx);
  animation: statusCardIn 520ms ease 90ms both;
}

.status-index-card:active {
  transform: scale(0.98);
  transition: transform 180ms ease;
}

.status-index-card__glow {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  animation: statusGlowBreath 5600ms ease-in-out infinite;
}

.status-index-card__glow--one {
  right: -64rpx;
  top: -44rpx;
  width: 260rpx;
  height: 220rpx;
  background: radial-gradient(circle, rgba(var(--theme-primary-rgb), 0.16), rgba(255, 255, 255, 0) 72%);
}

.status-index-card__glow--two {
  left: -74rpx;
  bottom: 90rpx;
  width: 240rpx;
  height: 180rpx;
  background: radial-gradient(circle, rgba(var(--theme-accent-rgb), 0.16), rgba(255, 255, 255, 0) 74%);
  animation-delay: 900ms;
}

.status-index-card__top {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260rpx;
  gap: 28rpx;
  align-items: center;
}

.status-index-card__metric {
  display: grid;
  gap: 18rpx;
  min-width: 0;
}

.status-index-card__label {
  font-size: 25rpx;
  line-height: 1.3;
  color: var(--theme-primary);
  letter-spacing: 0.06em;
}

.status-index-card__score-row {
  display: flex;
  align-items: baseline;
  gap: 12rpx;
}

.status-index-card__score {
  font-size: 160rpx;
  line-height: 0.84;
  font-weight: 400;
  color: rgba(var(--theme-primary-rgb), 0.92);
  letter-spacing: 0;
  text-shadow: 0 12rpx 34rpx rgba(var(--theme-primary-rgb), 0.1);
  font-family:
    'Iowan Old Style',
    'Times New Roman',
    'Noto Serif SC',
    serif;
}

.status-index-card__unit {
  font-size: 32rpx;
  color: rgba(var(--theme-primary-rgb), 0.58);
}

.status-index-card__progress {
  position: relative;
  width: 230rpx;
  height: 9rpx;
  overflow: hidden;
  border-radius: 999rpx;
  background: rgba(var(--theme-text-secondary-rgb), 0.14);
}

.status-index-card__progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--theme-primary), var(--theme-accent));
  animation: statusProgressGrow 560ms ease both;
  transform-origin: left center;
}

.status-index-card__oracle {
  position: relative;
  width: 248rpx;
  height: 248rpx;
  border-radius: 50%;
}

.status-index-card__orbit,
.status-index-card__dial-line,
.status-index-card__light-ball,
.status-index-card__spark {
  position: absolute;
  pointer-events: none;
}

.status-index-card__orbit {
  border-radius: 50%;
  border: 1.5rpx solid rgba(var(--theme-primary-rgb), 0.2);
}

.status-index-card__orbit--outer {
  inset: 4rpx;
}

.status-index-card__orbit--middle {
  inset: 32rpx;
  border-color: rgba(var(--theme-accent-rgb), 0.28);
}

.status-index-card__orbit--inner {
  inset: 62rpx;
  background:
    radial-gradient(circle at 38% 30%, rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0) 42%),
    radial-gradient(circle, rgba(var(--theme-primary-rgb), 0.16), rgba(var(--theme-accent-rgb), 0.08));
  border-color: rgba(255, 255, 255, 0.6);
  box-shadow: 0 18rpx 44rpx rgba(var(--theme-primary-rgb), 0.12);
}

.status-index-card__dial-line {
  left: 50%;
  top: 22rpx;
  bottom: 22rpx;
  width: 1rpx;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0), rgba(var(--theme-primary-rgb), 0.26), rgba(255, 255, 255, 0));
}

.status-index-card__dial-line--horizontal {
  top: 50%;
  left: 22rpx;
  right: 22rpx;
  bottom: auto;
  width: auto;
  height: 1rpx;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(var(--theme-primary-rgb), 0.22), rgba(255, 255, 255, 0));
}

.status-index-card__light-ball {
  left: 50%;
  top: 50%;
  width: 26rpx;
  height: 26rpx;
  border-radius: 50%;
  background: var(--theme-surface-strong);
  box-shadow:
    0 0 0 10rpx rgba(var(--theme-accent-rgb), 0.12),
    0 0 34rpx rgba(var(--theme-primary-rgb), 0.28);
  transform: translate(-50%, -50%);
}

.status-index-card__spark {
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  background: rgba(var(--theme-primary-rgb), 0.52);
}

.status-index-card__spark--one {
  right: 34rpx;
  top: 64rpx;
}

.status-index-card__spark--two {
  left: 36rpx;
  bottom: 58rpx;
  background: rgba(var(--theme-accent-rgb), 0.58);
}

.status-index-card__body {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 14rpx;
}

.status-index-card__title {
  font-size: 34rpx;
  line-height: 1.45;
  font-weight: 600;
  color: rgba(var(--theme-text-primary-rgb), 0.84);
}

.status-index-card__summary {
  font-size: 25rpx;
  line-height: 1.72;
  color: rgba(var(--theme-text-secondary-rgb), 0.86);
}

.status-index-card__capsule {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 0.72fr) minmax(0, 1.38fr);
  gap: 0;
  padding: 14rpx 10rpx;
  border-radius: 32rpx;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.76), rgba(255, 255, 255, 0.5)),
    rgba(var(--theme-primary-rgb), 0.035);
  border: 1rpx solid rgba(var(--theme-primary-rgb), 0.1);
  box-shadow:
    0 12rpx 30rpx rgba(var(--theme-text-primary-rgb), 0.045),
    0 1rpx 0 rgba(255, 255, 255, 0.78) inset;
}

.status-index-card__capsule-item {
  position: relative;
  display: grid;
  align-items: center;
  justify-content: center;
  min-width: 0;
  min-height: 66rpx;
  padding: 4rpx 12rpx;
  text-align: center;
}

.status-index-card__capsule-item + .status-index-card__capsule-item {
  border-left: 1rpx solid rgba(var(--theme-text-secondary-rgb), 0.1);
}

.status-index-card__capsule-copy {
  display: grid;
  gap: 5rpx;
  justify-items: center;
  min-width: 0;
}

.status-index-card__capsule-label {
  font-size: 19rpx;
  line-height: 1.28;
  color: rgba(var(--theme-text-secondary-rgb), 0.66);
  letter-spacing: 0.03em;
}

.status-index-card__capsule-value {
  min-width: 0;
  overflow: hidden;
  max-width: 100%;
  font-size: 23rpx;
  line-height: 1.32;
  font-weight: 500;
  color: rgba(var(--theme-primary-rgb), 0.82);
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-index-card__capsule-item:last-child .status-index-card__capsule-value {
  font-size: 21rpx;
  line-height: 1.34;
  display: -webkit-box;
  white-space: normal;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

@keyframes statusCardIn {
  from {
    opacity: 0;
    transform: translateY(24rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes statusProgressGrow {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

@keyframes statusGlowBreath {
  0%,
  100% {
    opacity: 0.62;
    transform: scale(0.98);
  }
  50% {
    opacity: 1;
    transform: scale(1.04);
  }
}

@media (max-width: 360px) {
  .status-index-card {
    padding: 36rpx 30rpx 32rpx;
  }

  .status-index-card__top {
    grid-template-columns: minmax(0, 1fr) 220rpx;
    gap: 14rpx;
  }

  .status-index-card__score {
    font-size: 138rpx;
  }

  .status-index-card__oracle {
    width: 214rpx;
    height: 214rpx;
  }

  .status-index-card__capsule {
    grid-template-columns: 1fr;
    border-radius: 30rpx;
  }

  .status-index-card__capsule-item + .status-index-card__capsule-item {
    border-left: 0;
    border-top: 1rpx solid rgba(var(--theme-text-secondary-rgb), 0.1);
  }
}
</style>
