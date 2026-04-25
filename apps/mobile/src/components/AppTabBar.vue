<template>
  <view class="app-tabbar">
    <view
      v-for="item in items"
      :key="item.id"
      class="app-tabbar__item"
      :class="{ 'app-tabbar__item--active': item.id === currentTab }"
      @tap="handlePress(item)"
    >
      <view class="app-tabbar__icon">
        <view class="app-tabbar__glyph" :class="`app-tabbar__glyph--${item.id}`"></view>
      </view>
      <text class="app-tabbar__label">{{ item.label }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
type TabId = 'home' | 'explore' | 'record' | 'mine';

interface TabItem {
  id: TabId;
  label: string;
  route: string;
}

const props = defineProps<{
  currentTab: TabId;
}>();

const items: TabItem[] = [
  { id: 'home', label: '首页', route: '/pages/index/index' },
  { id: 'explore', label: '探索', route: '/pages/explore/index' },
  { id: 'record', label: '记录', route: '/pages/records/index' },
  { id: 'mine', label: '我的', route: '/pages/profile/index' },
];

function handlePress(item: TabItem) {
  if (item.id === props.currentTab) {
    if (item.id === 'home' || item.id === 'explore' || item.id === 'record' || item.id === 'mine') {
      uni.pageScrollTo({
        scrollTop: 0,
        duration: 220,
      });
    }
    return;
  }

  const pageStack = getCurrentPages();
  const targetIndex = pageStack.findIndex(
    (page) => `/${page.route}` === item.route,
  );

  if (targetIndex >= 0) {
    const delta = pageStack.length - 1 - targetIndex;

    if (delta > 0) {
      uni.navigateBack({
        delta,
      });
    }
    return;
  }

  uni.navigateTo({
    url: item.route,
  });
}
</script>

<style lang="scss">
.app-tabbar {
  position: fixed;
  left: 24rpx;
  right: 24rpx;
  bottom: calc(18rpx);
  z-index: 40;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0;
  box-sizing: border-box;
  padding: 14rpx 18rpx;
  background: rgba(255, 255, 255, 0.9);
  border: 1rpx solid rgba(255, 255, 255, 0.96);
  border-radius: 34rpx;
  box-shadow:
    0 20rpx 52rpx rgba(var(--theme-text-primary-rgb), 0.1),
    0 0 0 1rpx rgba(255, 255, 255, 0.44) inset;
  backdrop-filter: blur(24rpx);
}

.app-tabbar__item {
  display: grid;
  justify-items: center;
  gap: 8rpx;
  padding: 6rpx 6rpx 2rpx;
  border-radius: 22rpx;
}

.app-tabbar__icon {
  display: grid;
  place-items: center;
  width: 52rpx;
  height: 52rpx;
}

.app-tabbar__label {
  font-size: 22rpx;
  color: var(--theme-text-secondary);
}

.app-tabbar__item--active .app-tabbar__label {
  color: var(--theme-primary);
}

.app-tabbar__glyph {
  position: relative;
  width: 32rpx;
  height: 32rpx;
  color: rgba(var(--theme-text-primary-rgb), 0.72);
}

.app-tabbar__item--active .app-tabbar__glyph {
  color: var(--theme-primary);
}

.app-tabbar__glyph::before,
.app-tabbar__glyph::after {
  content: '';
  position: absolute;
}

.app-tabbar__glyph--home::before {
  left: 6rpx;
  right: 6rpx;
  bottom: 4rpx;
  height: 16rpx;
  border: 2rpx solid currentColor;
  border-top: 0;
  border-radius: 3rpx;
}

.app-tabbar__glyph--home::after {
  left: 4rpx;
  right: 4rpx;
  top: 2rpx;
  height: 18rpx;
  border-left: 2rpx solid transparent;
  border-right: 2rpx solid transparent;
  border-bottom: 16rpx solid currentColor;
  clip-path: polygon(50% 0, 100% 52%, 100% 100%, 0 100%, 0 52%);
  opacity: 0.95;
}

.app-tabbar__glyph--explore {
  border-radius: 50%;
}

.app-tabbar__glyph--explore::before,
.app-tabbar__glyph--explore::after {
  border: 2rpx solid currentColor;
  border-radius: 50%;
}

.app-tabbar__glyph--explore::before {
  inset: 4rpx;
}

.app-tabbar__glyph--explore::after {
  inset: 10rpx 2rpx 6rpx 10rpx;
  transform: rotate(-24deg);
}

.app-tabbar__glyph--record::before {
  left: 6rpx;
  top: 4rpx;
  width: 20rpx;
  height: 24rpx;
  border: 2rpx solid currentColor;
  border-radius: 10rpx 10rpx 12rpx 12rpx;
}

.app-tabbar__glyph--record::after {
  left: 14rpx;
  top: 0;
  width: 4rpx;
  height: 10rpx;
  border-radius: 999rpx;
  background: currentColor;
}

.app-tabbar__glyph--mine::before {
  left: 10rpx;
  top: 3rpx;
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  border: 2rpx solid currentColor;
}

.app-tabbar__glyph--mine::after {
  left: 6rpx;
  bottom: 2rpx;
  width: 20rpx;
  height: 12rpx;
  border-radius: 16rpx 16rpx 8rpx 8rpx;
  border: 2rpx solid currentColor;
  border-top: 0;
}
</style>
