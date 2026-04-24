<template>
  <view class="advice-card">
    <view class="advice-card__illustration">
      <view class="advice-card__moon"></view>
      <view class="advice-card__silhouette">静</view>
    </view>

    <view class="advice-card__content">
      <text class="advice-card__eyebrow">今日建议</text>
      <text class="advice-card__title">{{ title }}</text>
      <text class="advice-card__summary">{{ summary }}</text>

      <view class="advice-card__actions">
        <button class="advice-card__button" @tap.stop="$emit('action')">{{ actionText }}</button>
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
  grid-template-columns: 164rpx minmax(0, 1fr);
  gap: 22rpx;
  align-items: center;
  padding: 28rpx;
  border-radius: 34rpx;
  background:
    radial-gradient(circle at 85% 20%, rgba(255, 255, 255, 0.78), transparent 24%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.84) 0%, var(--theme-soft) 100%);
  border: 1rpx solid var(--theme-border);
  box-shadow: var(--theme-shadow);
}

.advice-card__illustration {
  position: relative;
  width: 164rpx;
  height: 164rpx;
}

.advice-card__moon,
.advice-card__silhouette {
  position: absolute;
  inset: 0;
  border-radius: 50%;
}

.advice-card__moon {
  background:
    radial-gradient(circle at 32% 32%, rgba(255, 255, 255, 0.92), transparent 30%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, var(--theme-soft) 100%);
  box-shadow: 0 0 0 1rpx rgba(255, 255, 255, 0.72) inset;
}

.advice-card__silhouette {
  display: grid;
  place-items: center;
  inset: 24rpx;
  font-size: 42rpx;
  color: var(--theme-primary);
  background: rgba(255, 255, 255, 0.42);
}

.advice-card__content {
  display: grid;
  gap: 12rpx;
}

.advice-card__eyebrow {
  font-size: 22rpx;
  letter-spacing: 0.14em;
  color: var(--theme-primary);
}

.advice-card__title {
  font-size: 36rpx;
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
  min-width: 190rpx;
  min-height: 76rpx;
  margin: 0;
  padding: 0 26rpx;
  border-radius: 999rpx;
  font-size: 26rpx;
  color: #ffffff;
  background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-accent) 100%);
}

.advice-card__button::after {
  border: none;
}
</style>
