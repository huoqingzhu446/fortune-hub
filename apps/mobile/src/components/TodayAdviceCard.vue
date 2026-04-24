<template>
  <view class="advice-card">
    <view class="advice-card__illustration">
      <view class="advice-card__mist"></view>
      <view class="advice-card__orb"></view>
      <view class="advice-card__silhouette">静</view>
    </view>

    <view class="advice-card__content">
      <text class="advice-card__eyebrow">今日建议 ✧</text>
      <text class="advice-card__title">{{ title }}</text>
      <text class="advice-card__summary">{{ summary }}</text>

      <view class="advice-card__actions">
        <button class="advice-card__button" @tap.stop="$emit('action')">
          <text>{{ actionText }}</text>
          <text class="advice-card__button-arrow">▶</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  summary: string;
  actionText: string;
}>();

defineEmits<{
  (event: 'action'): void;
}>();
</script>

<style lang="scss">
.advice-card {
  display: grid;
  grid-template-columns: 168rpx minmax(0, 1fr);
  gap: 26rpx;
  align-items: center;
  padding: 28rpx 30rpx;
  border-radius: 36rpx;
  background:
    radial-gradient(circle at 82% 20%, rgba(var(--theme-accent-rgb), 0.18), transparent 24%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.94) 0%, rgba(var(--theme-primary-rgb), 0.08) 100%);
  border: 1rpx solid rgba(255, 255, 255, 0.92);
  box-shadow:
    0 20rpx 54rpx rgba(var(--theme-text-primary-rgb), 0.08),
    0 0 0 1rpx rgba(255, 255, 255, 0.44) inset;
}

.advice-card__illustration {
  position: relative;
  width: 168rpx;
  height: 168rpx;
}

.advice-card__mist,
.advice-card__orb,
.advice-card__silhouette {
  position: absolute;
  inset: 0;
}

.advice-card__mist {
  inset: auto -20rpx -6rpx auto;
  width: 110rpx;
  height: 80rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(var(--theme-primary-rgb), 0.18) 0%, rgba(255, 255, 255, 0) 74%);
  filter: blur(10rpx);
}

.advice-card__orb {
  border-radius: 34rpx;
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.94), transparent 26%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(var(--theme-primary-rgb), 0.18) 100%);
  box-shadow:
    0 0 0 1rpx rgba(255, 255, 255, 0.76) inset,
    0 22rpx 44rpx rgba(var(--theme-primary-rgb), 0.12);
}

.advice-card__silhouette {
  display: grid;
  place-items: center;
  inset: 30rpx;
  font-size: 42rpx;
  color: var(--theme-primary);
  background: rgba(255, 255, 255, 0.28);
  border-radius: 50%;
}

.advice-card__content {
  display: grid;
  gap: 12rpx;
}

.advice-card__eyebrow {
  font-size: 22rpx;
  letter-spacing: 0.08em;
  color: var(--theme-primary);
}

.advice-card__title {
  font-size: 34rpx;
  font-weight: 500;
  color: var(--theme-text-primary);
}

.advice-card__summary {
  font-size: 24rpx;
  line-height: 1.7;
  color: var(--theme-text-secondary);
}

.advice-card__actions {
  padding-top: 6rpx;
}

.advice-card__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 14rpx;
  min-width: 214rpx;
  min-height: 80rpx;
  margin: 0;
  padding: 0 28rpx;
  border-radius: 999rpx;
  font-size: 26rpx;
  color: var(--theme-text-primary);
  background: rgba(255, 255, 255, 0.82);
  border: 1rpx solid rgba(var(--theme-primary-rgb), 0.22);
  box-shadow: 0 14rpx 28rpx rgba(var(--theme-primary-rgb), 0.08);
}

.advice-card__button::after {
  border: none;
}

.advice-card__button-arrow {
  font-size: 22rpx;
  color: var(--theme-primary);
}
</style>
