<template>
  <view class="home-hero">
    <view class="home-hero__wash"></view>
    <view class="home-hero__ridge home-hero__ridge--back"></view>
    <view class="home-hero__ridge home-hero__ridge--front"></view>

    <view class="home-hero__content">
      <view class="home-hero__meta">
        <view class="home-hero__date">
          <text class="home-hero__date-line">{{ displayDate }}</text>
          <text class="home-hero__date-line home-hero__date-line--lunar">{{ lunarDate }}</text>
        </view>

        <view class="home-hero__theme">
          <view class="home-hero__theme-dot"></view>
          <text class="home-hero__theme-text">今日色 · {{ themeName }}</text>
        </view>
      </view>

      <view class="home-hero__copy">
        <text class="home-hero__eyebrow">{{ eyebrow }}</text>
        <text class="home-hero__title">{{ title }}</text>
        <text class="home-hero__subtitle">{{ subtitle }}</text>
      </view>

      <view class="home-hero__status" v-if="statusText">
        <text class="home-hero__status-label">首页状态</text>
        <text class="home-hero__status-value">{{ statusText }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    subtitle: string;
    displayDate: string;
    lunarDate: string;
    themeName: string;
    eyebrow?: string;
    statusText?: string;
  }>(),
  {
    eyebrow: '今日状态中枢',
    statusText: '',
  },
);
</script>

<style lang="scss">
.home-hero {
  position: relative;
  box-sizing: border-box;
  min-height: 286rpx;
  padding-top: calc(env(safe-area-inset-top) + 24rpx);
  overflow: hidden;
  animation: homeHeroIn 420ms ease both;
}

.home-hero::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -2rpx;
  height: 96rpx;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0), var(--theme-page-top));
  pointer-events: none;
}

.home-hero__wash,
.home-hero__ridge {
  position: absolute;
  pointer-events: none;
}

.home-hero__wash {
  right: -168rpx;
  top: -72rpx;
  width: 520rpx;
  height: 320rpx;
  border-radius: 50%;
  background:
    radial-gradient(circle at 34% 34%, rgba(255, 255, 255, 0.78), transparent 28%),
    radial-gradient(circle, rgba(var(--theme-primary-rgb), 0.16), rgba(var(--theme-accent-rgb), 0.08) 48%, transparent 72%);
  filter: blur(2rpx);
}

.home-hero__ridge {
  left: -46rpx;
  right: -46rpx;
  bottom: 4rpx;
  height: 136rpx;
  opacity: 0.72;
}

.home-hero__ridge--back {
  background: rgba(var(--theme-primary-rgb), 0.07);
  clip-path: polygon(0 72%, 13% 56%, 27% 66%, 43% 42%, 58% 68%, 73% 46%, 88% 62%, 100% 50%, 100% 100%, 0 100%);
}

.home-hero__ridge--front {
  bottom: -18rpx;
  background: rgba(255, 255, 255, 0.42);
  clip-path: polygon(0 80%, 16% 68%, 31% 76%, 48% 58%, 62% 78%, 80% 60%, 100% 72%, 100% 100%, 0 100%);
}

.home-hero__content {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 24rpx;
  padding: 0 32rpx 56rpx;
}

.home-hero__meta {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
}

.home-hero__date {
  display: grid;
  gap: 6rpx;
  min-width: 0;
}

.home-hero__date-line {
  display: block;
  overflow: hidden;
  max-width: 390rpx;
  font-size: 22rpx;
  line-height: 1.35;
  color: rgba(var(--theme-text-secondary-rgb), 0.82);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.home-hero__date-line--lunar {
  color: rgba(var(--theme-text-secondary-rgb), 0.66);
}

.home-hero__theme {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 10rpx;
  min-height: 46rpx;
  padding: 0 18rpx;
  border-radius: 999rpx;
  color: rgba(var(--theme-primary-rgb), 0.88);
  background: rgba(255, 255, 255, 0.78);
  border: 1rpx solid rgba(var(--theme-primary-rgb), 0.1);
  box-shadow: 0 10rpx 24rpx rgba(var(--theme-text-primary-rgb), 0.055);
}

.home-hero__theme-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-accent));
  box-shadow: 0 0 0 8rpx rgba(var(--theme-primary-rgb), 0.08);
}

.home-hero__theme-text {
  font-size: 21rpx;
  line-height: 1;
  white-space: nowrap;
}

.home-hero__copy {
  display: grid;
  gap: 11rpx;
  max-width: 660rpx;
}

.home-hero__eyebrow {
  font-size: 22rpx;
  line-height: 1.2;
  color: rgba(var(--theme-primary-rgb), 0.78);
  letter-spacing: 0.08em;
}

.home-hero__title {
  display: block;
  font-size: 50rpx;
  line-height: 1.12;
  font-weight: 650;
  color: var(--theme-text-primary);
  letter-spacing: 0;
  font-family:
    'Iowan Old Style',
    'Times New Roman',
    'Noto Serif SC',
    serif;
}

.home-hero__subtitle {
  display: -webkit-box;
  overflow: hidden;
  max-width: 610rpx;
  font-size: 25rpx;
  line-height: 1.52;
  color: rgba(var(--theme-text-secondary-rgb), 0.86);
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.home-hero__status {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 14rpx;
  align-items: center;
  max-width: 100%;
  min-height: 52rpx;
  padding: 0 18rpx;
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.68);
  border: 1rpx solid rgba(var(--theme-primary-rgb), 0.1);
}

.home-hero__status-label {
  font-size: 20rpx;
  line-height: 1.2;
  color: rgba(var(--theme-text-secondary-rgb), 0.68);
}

.home-hero__status-value {
  overflow: hidden;
  font-size: 21rpx;
  line-height: 1.35;
  color: rgba(var(--theme-text-primary-rgb), 0.78);
  text-overflow: ellipsis;
  white-space: nowrap;
}

@keyframes homeHeroIn {
  from {
    opacity: 0;
    transform: translateY(16rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 360px) {
  .home-hero__content {
    padding-right: 26rpx;
    padding-left: 26rpx;
  }

  .home-hero__title {
    font-size: 48rpx;
  }

  .home-hero__meta {
    display: grid;
    gap: 16rpx;
  }

  .home-hero__theme {
    justify-self: start;
  }
}
</style>
