<template>
  <view class="today-action-card">
    <view class="today-action-card__marker">
      <view class="today-action-card__marker-line"></view>
      <view class="today-action-card__marker-dot"></view>
    </view>

    <view class="today-action-card__content">
      <view class="today-action-card__head">
        <text class="today-action-card__eyebrow">{{ eyebrow }}</text>
        <text class="today-action-card__badge">{{ badge }}</text>
      </view>

      <text class="today-action-card__title">{{ title }}</text>
      <text class="today-action-card__summary">{{ summary }}</text>

      <view class="today-action-card__actions">
        <button class="today-action-card__button today-action-card__button--primary" @tap="$emit('action')">
          {{ actionText }}
        </button>
        <button class="today-action-card__button today-action-card__button--secondary" @tap="$emit('secondary')">
          {{ secondaryText }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    eyebrow?: string;
    badge: string;
    title: string;
    summary: string;
    actionText: string;
    secondaryText: string;
  }>(),
  {
    eyebrow: '今日一步',
  },
);

defineEmits<{
  (event: 'action'): void;
  (event: 'secondary'): void;
}>();
</script>

<style lang="scss">
.today-action-card {
  display: grid;
  grid-template-columns: 54rpx minmax(0, 1fr);
  gap: 20rpx;
  box-sizing: border-box;
  padding: 28rpx 30rpx 30rpx;
  border-radius: 32rpx;
  background:
    linear-gradient(145deg, rgba(var(--theme-primary-rgb), 0.1), rgba(var(--theme-accent-rgb), 0.07)),
    rgba(255, 255, 255, 0.78);
  border: 1rpx solid rgba(var(--theme-primary-rgb), 0.1);
  box-shadow:
    0 16rpx 40rpx rgba(var(--theme-text-primary-rgb), 0.06),
    0 0 0 1rpx rgba(255, 255, 255, 0.7) inset;
  animation: todayActionIn 460ms ease 130ms both;
}

.today-action-card__marker {
  position: relative;
  display: flex;
  justify-content: center;
  min-height: 100%;
}

.today-action-card__marker-line {
  width: 2rpx;
  min-height: 100%;
  border-radius: 999rpx;
  background: linear-gradient(180deg, rgba(var(--theme-primary-rgb), 0.42), rgba(var(--theme-primary-rgb), 0.08));
}

.today-action-card__marker-dot {
  position: absolute;
  top: 4rpx;
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
  background: var(--theme-surface-strong);
  border: 7rpx solid var(--theme-primary);
  box-shadow: 0 0 0 12rpx rgba(var(--theme-primary-rgb), 0.08);
}

.today-action-card__content {
  display: grid;
  gap: 14rpx;
  min-width: 0;
}

.today-action-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14rpx;
  min-width: 0;
}

.today-action-card__eyebrow {
  font-size: 22rpx;
  line-height: 1.2;
  color: rgba(var(--theme-primary-rgb), 0.78);
  letter-spacing: 0.08em;
}

.today-action-card__badge {
  overflow: hidden;
  max-width: 260rpx;
  padding: 7rpx 14rpx;
  border-radius: 999rpx;
  font-size: 20rpx;
  line-height: 1.2;
  color: rgba(var(--theme-primary-rgb), 0.86);
  text-overflow: ellipsis;
  white-space: nowrap;
  background: rgba(255, 255, 255, 0.62);
  border: 1rpx solid rgba(var(--theme-primary-rgb), 0.08);
}

.today-action-card__title {
  display: block;
  font-size: 33rpx;
  line-height: 1.36;
  font-weight: 650;
  color: rgba(var(--theme-text-primary-rgb), 0.9);
}

.today-action-card__summary {
  display: block;
  font-size: 24rpx;
  line-height: 1.62;
  color: rgba(var(--theme-text-secondary-rgb), 0.88);
}

.today-action-card__actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 0.82fr);
  gap: 14rpx;
  padding-top: 4rpx;
}

.today-action-card__button {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-height: 76rpx;
  margin: 0;
  padding: 0 22rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  line-height: 1.2;
  font-weight: 650;
}

.today-action-card__button::after {
  border: 0;
}

.today-action-card__button--primary {
  color: #fff;
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-accent));
  box-shadow: 0 14rpx 30rpx rgba(var(--theme-primary-rgb), 0.18);
}

.today-action-card__button--secondary {
  color: rgba(var(--theme-primary-rgb), 0.9);
  background: rgba(255, 255, 255, 0.72);
  border: 1rpx solid rgba(var(--theme-primary-rgb), 0.1);
}

@keyframes todayActionIn {
  from {
    opacity: 0;
    transform: translateY(22rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 360px) {
  .today-action-card {
    grid-template-columns: 44rpx minmax(0, 1fr);
    padding: 26rpx;
  }

  .today-action-card__actions {
    grid-template-columns: 1fr;
  }
}
</style>
