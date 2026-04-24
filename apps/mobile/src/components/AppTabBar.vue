<template>
  <view class="app-tabbar">
    <view
      v-for="item in items"
      :key="item.id"
      class="app-tabbar__item"
      :class="{ 'app-tabbar__item--active': item.id === currentTab }"
      @tap="handlePress(item)"
    >
      <view class="app-tabbar__icon">{{ item.iconText }}</view>
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
  iconText: string;
}

const props = defineProps<{
  currentTab: TabId;
}>();

const items: TabItem[] = [
  { id: 'home', label: '首页', route: '/pages/index/index', iconText: '今' },
  { id: 'explore', label: '探索', route: '/pages/explore/index', iconText: '探' },
  { id: 'record', label: '记录', route: '/pages/records/index', iconText: '记' },
  { id: 'mine', label: '我的', route: '/pages/profile/index', iconText: '我' },
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

  uni.redirectTo({
    url: item.route,
  });
}
</script>

<style lang="scss">
.app-tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8rpx;
  box-sizing: border-box;
  padding: 10rpx 18rpx calc(8rpx + constant(safe-area-inset-bottom));
  padding: 10rpx 18rpx calc(8rpx + env(safe-area-inset-bottom));
  background: var(--theme-surface-strong);
  border-top: 1rpx solid var(--theme-border);
  box-shadow: 0 -16rpx 44rpx rgba(50, 60, 80, 0.06);
  backdrop-filter: blur(24rpx);
}

.app-tabbar__item {
  display: grid;
  justify-items: center;
  gap: 6rpx;
  padding: 8rpx 6rpx 4rpx;
  border-radius: 22rpx;
}

.app-tabbar__item--active {
  background: linear-gradient(180deg, var(--theme-tag-bg) 0%, rgba(255, 255, 255, 0.84) 100%);
}

.app-tabbar__icon {
  display: grid;
  place-items: center;
  width: 52rpx;
  height: 52rpx;
  border-radius: 50%;
  background: var(--theme-tag-bg);
  color: var(--theme-primary);
  font-size: 22rpx;
  font-weight: 700;
}

.app-tabbar__item--active .app-tabbar__icon {
  background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-accent) 100%);
  color: #ffffff;
}

.app-tabbar__label {
  font-size: 22rpx;
  color: var(--theme-text-secondary);
}

.app-tabbar__item--active .app-tabbar__label {
  color: var(--theme-text-primary);
  font-weight: 600;
}
</style>
