<template>
  <view class="home-tabbar">
    <view
      v-for="item in items"
      :key="item.id"
      class="home-tabbar__item"
      :class="{ 'home-tabbar__item--active': item.id === currentTab }"
      @tap="handlePress(item)"
    >
      <view class="home-tabbar__icon">
        <view class="home-tabbar__glyph" :class="`home-tabbar__glyph--${item.id}`"></view>
      </view>
      <text class="home-tabbar__label">{{ item.label }}</text>
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

let navigating = false;

function handlePress(item: TabItem) {
  if (navigating) {
    return;
  }

  if (item.id === props.currentTab) {
    uni.pageScrollTo({
      scrollTop: 0,
      duration: 220,
    });
    return;
  }

  navigating = true;
  uni.redirectTo({
    url: item.route,
    complete: () => {
      navigating = false;
    },
  });
}
</script>

<style lang="scss">
.home-tabbar {
  position: fixed;
  left: 28rpx;
  right: 28rpx;
  bottom: calc(env(safe-area-inset-bottom) + 18rpx);
  z-index: 40;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0;
  box-sizing: border-box;
  padding: 16rpx 18rpx 14rpx;
  border-radius: 42rpx;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(255, 255, 255, 0.74)),
    rgba(255, 255, 255, 0.72);
  border: 1rpx solid rgba(255, 255, 255, 0.82);
  box-shadow:
    0 20rpx 58rpx rgba(var(--theme-text-primary-rgb), 0.11),
    0 1rpx 0 rgba(255, 255, 255, 0.86) inset,
    0 0 0 1rpx rgba(var(--theme-primary-rgb), 0.06) inset;
  backdrop-filter: blur(18rpx);
}

.home-tabbar__item {
  display: grid;
  justify-items: center;
  gap: 7rpx;
  min-width: 0;
  padding: 6rpx 4rpx 2rpx;
  border-radius: 28rpx;
}

.home-tabbar__icon {
  display: grid;
  place-items: center;
  width: 54rpx;
  height: 54rpx;
  border-radius: 50%;
  transition:
    background 220ms ease,
    box-shadow 220ms ease;
}

.home-tabbar__item--active .home-tabbar__icon {
  background: rgba(var(--theme-primary-rgb), 0.1);
  box-shadow: 0 10rpx 24rpx rgba(var(--theme-primary-rgb), 0.12);
}

.home-tabbar__label {
  font-size: 22rpx;
  color: rgba(var(--theme-text-secondary-rgb), 0.86);
}

.home-tabbar__item--active .home-tabbar__label {
  color: var(--theme-primary);
  font-weight: 600;
}

.home-tabbar__glyph {
  position: relative;
  width: 31rpx;
  height: 31rpx;
  color: rgba(var(--theme-text-primary-rgb), 0.66);
}

.home-tabbar__item--active .home-tabbar__glyph {
  color: var(--theme-primary);
}

.home-tabbar__glyph::before,
.home-tabbar__glyph::after {
  content: '';
  position: absolute;
}

.home-tabbar__glyph--home::before {
  left: 6rpx;
  right: 6rpx;
  bottom: 4rpx;
  height: 15rpx;
  border: 2rpx solid currentColor;
  border-top: 0;
  border-radius: 4rpx;
}

.home-tabbar__glyph--home::after {
  left: 4rpx;
  right: 4rpx;
  top: 2rpx;
  height: 17rpx;
  border-left: 2rpx solid transparent;
  border-right: 2rpx solid transparent;
  border-bottom: 15rpx solid currentColor;
  clip-path: polygon(50% 0, 100% 52%, 100% 100%, 0 100%, 0 52%);
  opacity: 0.94;
}

.home-tabbar__glyph--explore::before,
.home-tabbar__glyph--explore::after {
  border: 2rpx solid currentColor;
  border-radius: 50%;
}

.home-tabbar__glyph--explore::before {
  inset: 4rpx;
}

.home-tabbar__glyph--explore::after {
  inset: 10rpx 2rpx 6rpx 10rpx;
  transform: rotate(-24deg);
}

.home-tabbar__glyph--record::before {
  left: 6rpx;
  top: 4rpx;
  width: 20rpx;
  height: 23rpx;
  border: 2rpx solid currentColor;
  border-radius: 10rpx 10rpx 12rpx 12rpx;
}

.home-tabbar__glyph--record::after {
  left: 14rpx;
  top: 0;
  width: 4rpx;
  height: 10rpx;
  border-radius: 999rpx;
  background: currentColor;
}

.home-tabbar__glyph--mine::before {
  left: 10rpx;
  top: 3rpx;
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  border: 2rpx solid currentColor;
}

.home-tabbar__glyph--mine::after {
  left: 6rpx;
  bottom: 2rpx;
  width: 20rpx;
  height: 12rpx;
  border-radius: 16rpx 16rpx 8rpx 8rpx;
  border: 2rpx solid currentColor;
  border-top: 0;
}
</style>
