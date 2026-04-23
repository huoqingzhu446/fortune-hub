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
type TabId = 'home' | 'personality' | 'lucky' | 'profile';

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
  { id: 'home', label: '首页', route: '/pages/index/index', iconText: '运' },
  { id: 'personality', label: '测评', route: '/pages/personality/index', iconText: '测' },
  { id: 'lucky', label: '幸运物', route: '/pages/lucky/index', iconText: '幸' },
  { id: 'profile', label: '我的', route: '/pages/profile/index', iconText: '我' },
];

function handlePress(item: TabItem) {
  if (item.id === props.currentTab) {
    if (item.id === 'home') {
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
  background: rgba(250, 252, 255, 0.9);
  border-top: 1rpx solid rgba(196, 210, 229, 0.38);
  box-shadow: 0 -16rpx 44rpx rgba(34, 54, 88, 0.08);
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
  background: linear-gradient(180deg, rgba(231, 239, 255, 0.9) 0%, rgba(255, 255, 255, 0.84) 100%);
}

.app-tabbar__icon {
  display: grid;
  place-items: center;
  width: 52rpx;
  height: 52rpx;
  border-radius: 50%;
  background: rgba(91, 141, 239, 0.12);
  color: var(--apple-blue);
  font-size: 22rpx;
  font-weight: 700;
}

.app-tabbar__item--active .app-tabbar__icon {
  background: linear-gradient(135deg, var(--apple-blue) 0%, #7ba7ff 100%);
  color: #ffffff;
}

.app-tabbar__label {
  font-size: 22rpx;
  color: var(--apple-muted);
}

.app-tabbar__item--active .app-tabbar__label {
  color: var(--apple-text);
  font-weight: 600;
}
</style>
