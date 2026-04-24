<template>
  <view class="status-card" :class="[`status-card--${variant}`, `status-card--${metricMode}`]">
    <view class="status-card__art">
      <view class="status-card__art-orb"></view>
      <view class="status-card__art-ring"></view>
      <view class="status-card__art-mark">{{ icon }}</view>
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

      <text class="status-card__description">{{ description }}</text>
      <text v-if="note" class="status-card__note">{{ note }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    icon: string;
    variant: 'lotus' | 'mind' | 'bagua' | 'stars';
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
    subtitle: '',
    metricMode: 'score',
    suffix: '',
    badge: '',
    note: '',
    progress: 0,
    stars: 0,
  },
);
</script>

<style lang="scss">
.status-card {
  display: grid;
  grid-template-columns: 132rpx minmax(0, 1fr);
  gap: 18rpx;
  min-height: 260rpx;
  padding: 28rpx;
  border-radius: 34rpx;
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
  width: 132rpx;
  height: 132rpx;
  margin-top: 4rpx;
}

.status-card__art-orb,
.status-card__art-ring,
.status-card__art-mark {
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
  inset: 10rpx;
  border: 1rpx solid rgba(var(--theme-primary-rgb), 0.26);
}

.status-card__art::before,
.status-card__art::after {
  content: '';
  position: absolute;
  inset: 10rpx;
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
  display: grid;
  place-items: center;
  inset: 28rpx;
  color: var(--theme-primary);
  font-size: 42rpx;
  font-family:
    'Iowan Old Style',
    'Times New Roman',
    'Noto Serif SC',
    serif;
}

.status-card__body {
  display: grid;
  gap: 12rpx;
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
  font-size: 26rpx;
  font-weight: 500;
}

.status-card__subtitle {
  font-size: 22rpx;
  color: var(--theme-text-secondary);
}

.status-card__badge {
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
  font-size: 20rpx;
  color: var(--theme-primary);
  background: var(--theme-tag-bg);
}

.status-card__metric,
.status-card__rating {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
  flex-wrap: wrap;
}

.status-card__value {
  font-size: 60rpx;
  line-height: 1;
  font-family:
    'Iowan Old Style',
    'Times New Roman',
    'Noto Serif SC',
    serif;
}

.status-card__suffix {
  font-size: 24rpx;
  color: var(--theme-text-secondary);
}

.status-card__progress {
  width: 120rpx;
  height: 12rpx;
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
  font-size: 28rpx;
  color: rgba(var(--theme-accent-rgb), 0.34);
}

.status-card__star--active {
  color: var(--theme-accent);
}

.status-card__description {
  font-size: 24rpx;
  line-height: 1.65;
  color: rgba(var(--theme-text-primary-rgb), 0.78);
}

.status-card__note {
  font-size: 22rpx;
  line-height: 1.6;
  color: var(--theme-text-secondary);
}

.status-card--lotus .status-card__art-mark,
.status-card--mind .status-card__art-mark,
.status-card--stars .status-card__art-mark {
  color: var(--theme-primary);
}

.status-card--bagua .status-card__art-orb {
  background:
    radial-gradient(circle at 30% 28%, rgba(255, 255, 255, 0.96), transparent 24%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(var(--theme-accent-rgb), 0.2) 100%);
}

.status-card--bagua .status-card__art-mark {
  color: var(--theme-accent);
}

.status-card--stars .status-card__art-mark {
  font-size: 40rpx;
}

.status-card--level .status-card__value {
  font-size: 64rpx;
}

.status-card--stars .status-card__value,
.status-card--stars .status-card__suffix {
  display: none;
}
</style>
