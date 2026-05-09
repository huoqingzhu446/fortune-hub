<template>
  <view class="insight-mini-card" :class="`insight-mini-card--${metricMode}`" @tap="$emit('select')">
    <view class="insight-mini-card__top">
      <view class="insight-mini-card__icon">
        <view class="insight-mini-card__icon-mark" :style="iconStyle"></view>
      </view>
      <view class="insight-mini-card__heading">
        <text v-if="displayEyebrow" class="insight-mini-card__eyebrow">{{ displayEyebrow }}</text>
        <text class="insight-mini-card__title">{{ displayTitle }}</text>
      </view>
    </view>

    <view v-if="metricMode !== 'stars'" class="insight-mini-card__metric">
      <text class="insight-mini-card__value">{{ value }}</text>
      <text v-if="suffix" class="insight-mini-card__suffix">{{ suffix }}</text>
      <text v-if="badge" class="insight-mini-card__badge">{{ badge }}</text>
    </view>

    <view v-else class="insight-mini-card__rating">
      <text
        v-for="starIndex in 5"
        :key="starIndex"
        class="insight-mini-card__star"
        :class="{ 'insight-mini-card__star--active': starIndex <= stars }"
      >
        ★
      </text>
      <text v-if="badge" class="insight-mini-card__badge">{{ badge }}</text>
    </view>

    <view v-if="metricMode === 'score'" class="insight-mini-card__progress">
      <view class="insight-mini-card__progress-fill" :style="{ width: `${progressValue}%` }"></view>
    </view>

    <text class="insight-mini-card__description">{{ description }}</text>

    <button class="insight-mini-card__button" @tap.stop="$emit('select')">
      <text>{{ actionText }}</text>
      <view class="insight-mini-card__button-arrow"></view>
    </button>
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
    progress?: number;
    stars?: number;
    actionText: string;
  }>(),
  {
    iconColor: '',
    subtitle: '',
    metricMode: 'score',
    suffix: '',
    badge: '',
    progress: 0,
    stars: 0,
  },
);

defineEmits<{
  (event: 'select'): void;
}>();

const iconSvgMap = {
  lotus: lotusSvg,
  mind: heartBrainSvg,
  bagua: baguaSvg,
  stars: constellationSvg,
} as const;

const iconStyle = computed(() => ({
  backgroundImage: `url("${buildSvgDataUrl(iconSvgMap[props.variant] || lotusSvg, props.iconColor)}")`,
}));

const progressValue = computed(() => Math.max(8, Math.min(props.progress || 0, 100)));
const displayTitle = computed(() => props.subtitle || props.title);
const displayEyebrow = computed(() => (props.subtitle ? props.title : ''));

function buildSvgDataUrl(markup: string, color: string) {
  const normalizedColor = color || 'currentColor';
  const nextMarkup = markup.replace(/currentColor/g, normalizedColor);
  return `data:image/svg+xml;utf8,${encodeURIComponent(nextMarkup)}`;
}
</script>

<style lang="scss">
.insight-mini-card {
  display: grid;
  grid-template-rows: auto auto auto minmax(66rpx, 1fr) auto;
  gap: 16rpx;
  min-height: 318rpx;
  box-sizing: border-box;
  padding: 26rpx;
  border-radius: 34rpx;
  background:
    radial-gradient(circle at 92% 0%, rgba(var(--theme-accent-rgb), 0.13), transparent 36%),
    linear-gradient(150deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.68) 58%, var(--theme-surface-muted) 100%);
  border: 1rpx solid rgba(var(--theme-primary-rgb), 0.12);
  box-shadow:
    0 18rpx 46rpx rgba(var(--theme-text-primary-rgb), 0.07),
    0 0 0 1rpx rgba(255, 255, 255, 0.62) inset;
  backdrop-filter: blur(14rpx);
}

.insight-mini-card:active {
  transform: scale(0.98);
  transition: transform 160ms ease;
}

.insight-mini-card__top {
  display: grid;
  grid-template-columns: 70rpx minmax(0, 1fr);
  gap: 14rpx;
  align-items: center;
  min-width: 0;
}

.insight-mini-card__icon {
  position: relative;
  display: grid;
  place-items: center;
  width: 74rpx;
  height: 74rpx;
  border-radius: 50%;
  background:
    radial-gradient(circle at 34% 28%, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0) 36%),
    rgba(var(--theme-primary-rgb), 0.09);
  box-shadow:
    0 12rpx 26rpx rgba(var(--theme-primary-rgb), 0.1),
    0 0 0 1rpx rgba(var(--theme-primary-rgb), 0.12) inset;
}

.insight-mini-card__icon::after {
  content: '';
  position: absolute;
  inset: 10rpx;
  border-radius: 50%;
  border: 1rpx solid rgba(var(--theme-primary-rgb), 0.18);
}

.insight-mini-card__icon-mark {
  position: relative;
  z-index: 1;
  width: 42rpx;
  height: 42rpx;
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
}

.insight-mini-card__heading {
  display: grid;
  gap: 4rpx;
  min-width: 0;
}

.insight-mini-card__eyebrow {
  overflow: hidden;
  font-size: 19rpx;
  line-height: 1.28;
  color: rgba(var(--theme-text-secondary-rgb), 0.62);
  letter-spacing: 0.04em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.insight-mini-card__title {
  overflow: hidden;
  font-size: 28rpx;
  line-height: 1.26;
  font-weight: 600;
  color: rgba(var(--theme-primary-rgb), 0.78);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.insight-mini-card__metric,
.insight-mini-card__rating {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
  min-width: 0;
}

.insight-mini-card__value {
  font-size: 48rpx;
  line-height: 1;
  color: var(--theme-text-primary);
  font-family:
    'Iowan Old Style',
    'Times New Roman',
    'Noto Serif SC',
    serif;
}

.insight-mini-card--level .insight-mini-card__value {
  font-size: 44rpx;
  font-weight: 600;
}

.insight-mini-card__suffix {
  font-size: 22rpx;
  color: rgba(var(--theme-text-secondary-rgb), 0.84);
}

.insight-mini-card__badge {
  padding: 6rpx 13rpx;
  border-radius: 999rpx;
  font-size: 20rpx;
  font-weight: 600;
  color: var(--theme-primary);
  background: var(--theme-tag-bg);
}

.insight-mini-card__progress {
  width: 100%;
  height: 8rpx;
  overflow: hidden;
  border-radius: 999rpx;
  background: rgba(var(--theme-text-secondary-rgb), 0.14);
}

.insight-mini-card__progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--theme-primary), var(--theme-accent));
  animation: insightProgressGrow 520ms ease both;
  transform-origin: left center;
}

.insight-mini-card__description {
  overflow: hidden;
  font-size: 21rpx;
  line-height: 1.58;
  color: rgba(var(--theme-text-secondary-rgb), 0.82);
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.insight-mini-card__button {
  align-self: end;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9rpx;
  width: 100%;
  height: 58rpx;
  min-height: 58rpx;
  max-height: 58rpx;
  margin: 0;
  padding: 0 18rpx;
  border-radius: 999rpx;
  color: var(--theme-primary);
  background: rgba(var(--theme-primary-rgb), 0.08);
  border: 1rpx solid rgba(var(--theme-primary-rgb), 0.12);
  font-size: 22rpx;
  font-weight: 600;
  line-height: 1;
}

.insight-mini-card__button::after {
  border: 0;
}

.insight-mini-card__button-arrow {
  width: 10rpx;
  height: 10rpx;
  border-top: 2rpx solid currentColor;
  border-right: 2rpx solid currentColor;
  transform: rotate(45deg);
}

.insight-mini-card__star {
  font-size: 24rpx;
  color: rgba(var(--theme-primary-rgb), 0.24);
}

.insight-mini-card__star--active {
  color: var(--theme-primary);
}

@keyframes insightProgressGrow {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

@media (max-width: 360px) {
  .insight-mini-card {
    padding: 22rpx;
  }

  .insight-mini-card__top {
    grid-template-columns: 64rpx minmax(0, 1fr);
    gap: 12rpx;
  }

  .insight-mini-card__icon {
    width: 64rpx;
    height: 64rpx;
  }
}
</style>
