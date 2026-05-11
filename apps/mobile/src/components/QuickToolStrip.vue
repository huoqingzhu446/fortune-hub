<template>
  <view class="tool-strip">
    <view
      v-for="item in items"
      :key="item.id"
      class="tool-strip__item"
      :class="`tool-strip__item--${item.icon}`"
      @tap="$emit('select', item.route, item.id)"
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
  icon: 'leaf' | 'journal' | 'orbit' | 'compass' | 'poster';
  route: string;
}

defineProps<{
  items: QuickToolItem[];
}>();

defineEmits<{
  (event: 'select', route: string, id: string): void;
}>();
</script>

<style lang="scss">
.tool-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12rpx;
  padding: 0;
  border-radius: 0;
  background: transparent;
  border: 0;
  box-shadow:
    none;
}

.tool-strip__item {
  display: grid;
  justify-items: center;
  gap: 9rpx;
  min-height: 150rpx;
  box-sizing: border-box;
  padding: 18rpx 8rpx 16rpx;
  border-radius: 26rpx;
  text-align: center;
  position: relative;
  background: rgba(255, 255, 255, 0.74);
  border: 1rpx solid rgba(var(--theme-primary-rgb), 0.08);
  box-shadow: 0 12rpx 28rpx rgba(var(--theme-text-primary-rgb), 0.045);
}

.tool-strip__item + .tool-strip__item::before {
  content: none;
}

.tool-strip__icon {
  display: grid;
  place-items: center;
  width: 58rpx;
  height: 58rpx;
  border-radius: 50%;
  border: 1rpx solid rgba(var(--theme-primary-rgb), 0.18);
  color: var(--theme-primary);
  background: rgba(var(--theme-primary-rgb), 0.07);
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

.tool-strip__item--poster .tool-strip__icon-mark {
  width: 24rpx;
  height: 30rpx;
  border: 2rpx solid currentColor;
  border-radius: 6rpx;
}

.tool-strip__item--poster .tool-strip__icon-mark::before,
.tool-strip__item--poster .tool-strip__icon-mark::after {
  content: '';
  position: absolute;
  left: 50%;
  background: currentColor;
  transform: translateX(-50%);
}

.tool-strip__item--poster .tool-strip__icon-mark::before {
  top: 5rpx;
  width: 10rpx;
  height: 2rpx;
}

.tool-strip__item--poster .tool-strip__icon-mark::after {
  top: 13rpx;
  width: 14rpx;
  height: 8rpx;
  border: 2rpx solid currentColor;
  border-radius: 2rpx;
  background: transparent;
}

.tool-strip__title {
  font-size: 23rpx;
  line-height: 1.2;
  font-weight: 600;
  color: var(--theme-text-primary);
}

.tool-strip__description {
  font-size: 19rpx;
  line-height: 1.35;
  color: var(--theme-text-secondary);
}

.tool-strip__copy {
  display: grid;
  gap: 2rpx;
}
</style>
