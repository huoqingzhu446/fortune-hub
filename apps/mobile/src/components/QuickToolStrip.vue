<template>
  <view class="tool-strip">
    <view
      v-for="item in items"
      :key="item.id"
      class="tool-strip__item"
      @tap="$emit('select', item.route)"
    >
      <view class="tool-strip__icon">{{ item.icon }}</view>
      <text class="tool-strip__title">{{ item.title }}</text>
      <text class="tool-strip__description">{{ item.description }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
export interface QuickToolItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
}

defineProps<{
  items: QuickToolItem[];
}>();

defineEmits<{
  (event: 'select', route: string): void;
}>();
</script>

<style lang="scss">
.tool-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14rpx;
  padding: 18rpx;
  border-radius: 32rpx;
  background: var(--theme-surface);
  border: 1rpx solid var(--theme-border);
  box-shadow: var(--theme-shadow);
}

.tool-strip__item {
  display: grid;
  justify-items: center;
  gap: 10rpx;
  padding: 14rpx 8rpx;
  text-align: center;
}

.tool-strip__icon {
  display: grid;
  place-items: center;
  width: 72rpx;
  height: 72rpx;
  border-radius: 24rpx;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, var(--theme-soft) 100%);
  color: var(--theme-primary);
  font-size: 28rpx;
  font-weight: 600;
}

.tool-strip__title {
  font-size: 24rpx;
  color: var(--theme-text-primary);
}

.tool-strip__description {
  font-size: 20rpx;
  line-height: 1.5;
  color: var(--theme-text-secondary);
}
</style>
