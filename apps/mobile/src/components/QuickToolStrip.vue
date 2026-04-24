<template>
  <view class="tool-strip">
    <view
      v-for="item in items"
      :key="item.id"
      class="tool-strip__item"
      :class="`tool-strip__item--${item.icon}`"
      @tap="$emit('select', item.route)"
    >
      <view class="tool-strip__icon">
        <view class="tool-strip__icon-mark"></view>
      </view>
      <view class="tool-strip__copy">
        <text class="tool-strip__title">{{ item.title }}</text>
        <text class="tool-strip__description">{{ item.description }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
export interface QuickToolItem {
  id: string;
  title: string;
  description: string;
  icon: 'leaf' | 'journal' | 'orbit' | 'compass';
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
  gap: 0;
  padding: 16rpx 12rpx;
  border-radius: 34rpx;
  background: rgba(255, 255, 255, 0.88);
  border: 1rpx solid rgba(255, 255, 255, 0.94);
  box-shadow:
    0 18rpx 46rpx rgba(var(--theme-text-primary-rgb), 0.08),
    0 0 0 1rpx rgba(255, 255, 255, 0.44) inset;
}

.tool-strip__item {
  display: grid;
  justify-items: center;
  gap: 10rpx;
  padding: 14rpx 10rpx;
  text-align: center;
  position: relative;
}

.tool-strip__item + .tool-strip__item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 18rpx;
  bottom: 18rpx;
  width: 1rpx;
  background: rgba(var(--theme-text-secondary-rgb), 0.18);
}

.tool-strip__icon {
  display: grid;
  place-items: center;
  width: 62rpx;
  height: 62rpx;
  border-radius: 50%;
  border: 1.5rpx solid rgba(var(--theme-primary-rgb), 0.58);
  color: var(--theme-primary);
}

.tool-strip__icon-mark {
  position: relative;
  width: 30rpx;
  height: 30rpx;
}

.tool-strip__item--leaf .tool-strip__icon-mark {
  width: 20rpx;
  height: 28rpx;
  border: 2rpx solid currentColor;
  border-radius: 20rpx 20rpx 20rpx 4rpx;
  transform: rotate(-18deg);
}

.tool-strip__item--leaf .tool-strip__icon-mark::after {
  content: '';
  position: absolute;
  left: 8rpx;
  top: 2rpx;
  bottom: 2rpx;
  width: 2rpx;
  background: currentColor;
  transform: rotate(18deg);
}

.tool-strip__item--journal .tool-strip__icon-mark {
  border: 2rpx solid currentColor;
  border-radius: 8rpx;
}

.tool-strip__item--journal .tool-strip__icon-mark::before,
.tool-strip__item--journal .tool-strip__icon-mark::after {
  content: '';
  position: absolute;
  background: currentColor;
}

.tool-strip__item--journal .tool-strip__icon-mark::before {
  left: 8rpx;
  top: 0;
  bottom: 0;
  width: 2rpx;
}

.tool-strip__item--journal .tool-strip__icon-mark::after {
  left: 16rpx;
  top: 18rpx;
  width: 12rpx;
  height: 2rpx;
}

.tool-strip__item--orbit .tool-strip__icon-mark {
  border-radius: 50%;
  border: 2rpx solid transparent;
}

.tool-strip__item--orbit .tool-strip__icon-mark::before,
.tool-strip__item--orbit .tool-strip__icon-mark::after {
  content: '';
  position: absolute;
  border: 2rpx solid currentColor;
  border-radius: 50%;
}

.tool-strip__item--orbit .tool-strip__icon-mark::before {
  inset: 3rpx;
  transform: rotate(28deg) scaleX(1.08);
}

.tool-strip__item--orbit .tool-strip__icon-mark::after {
  inset: 7rpx;
  background: currentColor;
  border: 0;
}

.tool-strip__item--compass .tool-strip__icon-mark {
  border: 2rpx solid currentColor;
  border-radius: 50%;
}

.tool-strip__item--compass .tool-strip__icon-mark::before,
.tool-strip__item--compass .tool-strip__icon-mark::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  background: currentColor;
  transform-origin: center;
}

.tool-strip__item--compass .tool-strip__icon-mark::before {
  width: 2rpx;
  height: 18rpx;
  transform: translate(-50%, -50%) rotate(32deg);
}

.tool-strip__item--compass .tool-strip__icon-mark::after {
  width: 0;
  height: 0;
  border-left: 6rpx solid transparent;
  border-right: 6rpx solid transparent;
  border-bottom: 12rpx solid currentColor;
  background: transparent;
  transform: translate(-50%, -50%) rotate(32deg) translateY(-8rpx);
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

.tool-strip__copy {
  display: grid;
  gap: 2rpx;
}
</style>
