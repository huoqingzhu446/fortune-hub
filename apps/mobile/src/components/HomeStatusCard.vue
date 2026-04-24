<template>
  <view class="status-card">
    <view class="status-card__icon">{{ icon }}</view>

    <view class="status-card__body">
      <view class="status-card__head">
        <text class="status-card__title">{{ title }}</text>
        <text v-if="badge" class="status-card__badge">{{ badge }}</text>
      </view>

      <view class="status-card__metric">
        <text class="status-card__value">{{ value }}</text>
        <text v-if="suffix" class="status-card__suffix">{{ suffix }}</text>
      </view>

      <text class="status-card__description">{{ description }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    icon: string;
    title: string;
    value: string;
    suffix?: string;
    badge?: string;
    description: string;
  }>(),
  {
    suffix: '',
    badge: '',
  },
);
</script>

<style lang="scss">
.status-card {
  display: grid;
  grid-template-columns: 84rpx minmax(0, 1fr);
  gap: 18rpx;
  min-height: 220rpx;
  padding: 26rpx;
  border-radius: 30rpx;
  background: var(--theme-surface);
  border: 1rpx solid var(--theme-border);
  box-shadow: var(--theme-shadow-soft);
}

.status-card__icon {
  display: grid;
  place-items: center;
  width: 84rpx;
  height: 84rpx;
  border-radius: 28rpx;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.88) 0%, var(--theme-soft) 100%);
  color: var(--theme-primary);
  font-size: 30rpx;
  font-weight: 600;
}

.status-card__body {
  display: grid;
  gap: 12rpx;
}

.status-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10rpx;
}

.status-card__title,
.status-card__value {
  color: var(--theme-text-primary);
}

.status-card__title {
  font-size: 30rpx;
  font-weight: 500;
}

.status-card__badge {
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  font-size: 20rpx;
  color: var(--theme-primary);
  background: var(--theme-tag-bg);
}

.status-card__metric {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
}

.status-card__value {
  font-size: 58rpx;
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

.status-card__description {
  font-size: 24rpx;
  line-height: 1.7;
  color: var(--theme-text-secondary);
}
</style>
