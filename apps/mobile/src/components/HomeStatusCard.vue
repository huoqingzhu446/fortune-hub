<template>
  <view class="status-card" :class="[`status-card--${variant}`, `status-card--${metricMode}`]">
    <view class="status-card__art">
      <view class="status-card__art-orb"></view>
      <view class="status-card__art-ring"></view>
      <view class="status-card__art-mark" :style="iconStyle"></view>
    </view>

    <view class="status-card__body">
      <view class="status-card__intro">
        <text class="status-card__title">{{ title }}</text>
        <text v-if="subtitle" class="status-card__subtitle">{{ subtitle }}</text>
      </view>

      <view v-if="metricMode !== 'stars'" class="status-card__metric">
        <text class="status-card__value">{{ value }}</text>
        <text v-if="suffix" class="status-card__suffix">{{ suffix }}</text>
        <text v-if="badge" class="status-card__badge">{{ badge }}</text>
      </view>

      <view v-else class="status-card__rating">
        <text
          v-for="starIndex in 5"
          :key="starIndex"
          class="status-card__star"
          :class="{ 'status-card__star--active': starIndex <= stars }"
        >
          ★
        </text>
        <text v-if="badge" class="status-card__badge">{{ badge }}</text>
      </view>

      <view v-if="metricMode === 'score'" class="status-card__progress">
        <view class="status-card__progress-fill" :style="{ width: `${Math.max(8, Math.min(progress, 100))}%` }"></view>
      </view>
    </view>

    <view class="status-card__text">
      <text class="status-card__description">{{ description }}</text>
      <text v-if="note" class="status-card__note">{{ note }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import baguaSvg from '../static/icons/bagua.svg?raw';
import constellationSvg from '../static/icons/constellation.svg?raw';
import heartBrainSvg from '../static/icons/heart_brain.svg?raw';
import lotusSvg from '../static/icons/lotus.svg?raw';

const props = withDefaults(
  defineProps<{
    variant: 'lotus' | 'mind' | 'bagua' | 'stars';
    iconColor?: string;
    title: string;
    subtitle?: string;
    value: string;
    metricMode?: 'score' | 'level' | 'stars';
    suffix?: string;
    badge?: string;
    description: string;
    note?: string;
    progress?: number;
    stars?: number;
  }>(),
  {
    iconColor: '#6F91B7',
    subtitle: '',
    metricMode: 'score',
    suffix: '',
    badge: '',
    note: '',
    progress: 0,
    stars: 0,
  },
);

const iconSvgMap = {
  lotus: lotusSvg,
  mind: heartBrainSvg,
  bagua: baguaSvg,
  stars: constellationSvg,
} as const;

const iconSrc = computed(() => {
  const markup = iconSvgMap[props.variant] || lotusSvg;
  return buildSvgDataUrl(markup, props.iconColor);
});

const iconStyle = computed(() => ({
  backgroundImage: `url("${iconSrc.value}")`,
}));

function buildSvgDataUrl(markup: string, color: string) {
  const normalizedColor = color || '#6F91B7';
  const nextMarkup = markup.replace(/currentColor/g, normalizedColor);
  return `data:image/svg+xml;utf8,${encodeURIComponent(nextMarkup)}`;
}
</script>

<style lang="scss">
.status-card {
  display: grid;
  grid-template-columns: 98rpx minmax(0, 1fr);
  gap: 14rpx;
  height: 100%;
  box-sizing: border-box;
  padding: 20rpx 22rpx 18rpx;
  border-radius: 34rpx;
  align-content: start;
  overflow: hidden;
  background:
    radial-gradient(circle at 100% 0%, rgba(var(--theme-accent-rgb), 0.18), transparent 36%),
    linear-gradient(150deg, rgba(255, 255, 255, 0.96) 0%, rgba(var(--theme-primary-rgb), 0.04) 100%);
  border: 1rpx solid rgba(255, 255, 255, 0.94);
  box-shadow:
    0 18rpx 48rpx rgba(149, 157, 176, 0.12),
    0 0 0 1rpx rgba(255, 255, 255, 0.5) inset;
}

.status-card__art {
  position: relative;
  width: 98rpx;
  height: 98rpx;
  margin-top: 4rpx;
}

.status-card__art-orb,
.status-card__art-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
}

.status-card__art-orb {
  background:
    radial-gradient(circle at 30% 28%, rgba(255, 255, 255, 0.96), transparent 24%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(var(--theme-primary-rgb), 0.18) 100%);
  box-shadow:
    0 0 0 1rpx rgba(255, 255, 255, 0.76) inset,
    0 18rpx 34rpx rgba(var(--theme-primary-rgb), 0.14);
}

.status-card__art-ring {
  inset: 8rpx;
  border: 1rpx solid rgba(var(--theme-primary-rgb), 0.26);
}

.status-card__art::before,
.status-card__art::after {
  content: '';
  position: absolute;
  inset: 8rpx;
  border-radius: 50%;
  border: 1rpx solid rgba(var(--theme-accent-rgb), 0.28);
}

.status-card__art::before {
  transform: rotate(28deg) scaleX(1.18);
}

.status-card__art::after {
  transform: rotate(-30deg) scaleY(0.84);
}

.status-card__art-mark {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 52rpx;
  height: 52rpx;
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
  transform: translate(-50%, -50%);
}

.status-card__body {
  display: grid;
  gap: 8rpx;
  align-content: start;
  min-width: 0;
}

.status-card__text {
  grid-column: 1 / -1;
  display: grid;
  gap: 6rpx;
  margin-top: 2rpx;
  padding-left: 0;
  align-content: start;
}

.status-card__intro {
  display: grid;
  gap: 2rpx;
}

.status-card__title,
.status-card__value {
  color: var(--theme-text-primary);
}

.status-card__title {
  font-size: 22rpx;
  font-weight: 500;
  line-height: 1.32;
}

.status-card__subtitle {
  font-size: 18rpx;
  color: var(--theme-text-secondary);
  line-height: 1.32;
}

.status-card__badge {
  padding: 6rpx 12rpx;
  border-radius: 999rpx;
  font-size: 18rpx;
  color: var(--theme-primary);
  background: var(--theme-tag-bg);
}

.status-card__metric,
.status-card__rating {
  display: flex;
  align-items: baseline;
  gap: 6rpx;
  flex-wrap: wrap;
}

.status-card__value {
  font-size: 42rpx;
  line-height: 1;
  font-family:
    'Iowan Old Style',
    'Times New Roman',
    'Noto Serif SC',
    serif;
}

.status-card__suffix {
  font-size: 20rpx;
  color: var(--theme-text-secondary);
}

.status-card__progress {
  width: 92rpx;
  height: 10rpx;
  border-radius: 999rpx;
  background: rgba(var(--theme-text-secondary-rgb), 0.16);
  overflow: hidden;
}

.status-card__progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--theme-accent) 0%, var(--theme-primary) 100%);
}

.status-card__star {
  font-size: 24rpx;
  color: rgba(var(--theme-accent-rgb), 0.34);
}

.status-card__star--active {
  color: var(--theme-accent);
}

.status-card__description {
  font-size: 18rpx;
  line-height: 1.6;
  color: rgba(var(--theme-text-primary-rgb), 0.78);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.status-card__note {
  font-size: 18rpx;
  line-height: 1.55;
  color: var(--theme-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}

.status-card--lotus .status-card__art-mark,
.status-card--mind .status-card__art-mark,
.status-card--stars .status-card__art-mark {
  width: 52rpx;
  height: 52rpx;
}

.status-card--lotus .status-card__art-mark {
  width: 46rpx;
  height: 46rpx;
}

.status-card--bagua .status-card__art-orb {
  background:
    radial-gradient(circle at 30% 28%, rgba(255, 255, 255, 0.96), transparent 24%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(var(--theme-accent-rgb), 0.2) 100%);
}

.status-card--bagua .status-card__art-mark {
  width: 58rpx;
  height: 58rpx;
}

.status-card--stars .status-card__art-mark {
  width: 54rpx;
  height: 54rpx;
}

.status-card--level .status-card__value {
  font-size: 46rpx;
}

.status-card--stars .status-card__value,
.status-card--stars .status-card__suffix {
  display: none;
}
</style>
