<template>
  <view class="home-hero">
    <view class="home-hero__aura home-hero__aura--left"></view>
    <view class="home-hero__aura home-hero__aura--right"></view>
    <view class="home-hero__sun"></view>
    <view class="home-hero__cloud home-hero__cloud--one"></view>
    <view class="home-hero__cloud home-hero__cloud--two"></view>
    <view class="home-hero__ridges">
      <view class="home-hero__ridge home-hero__ridge--back"></view>
      <view class="home-hero__ridge home-hero__ridge--mid"></view>
      <view class="home-hero__ridge home-hero__ridge--front"></view>
    </view>

    <view class="home-hero__content">
      <view class="home-hero__copy">
        <text class="home-hero__title">{{ title }}</text>
        <text class="home-hero__subtitle">{{ subtitle }}</text>
      </view>

      <view class="home-hero__date">
        <text class="home-hero__date-line">{{ displayDate }}</text>
        <text class="home-hero__date-line home-hero__date-line--lunar">{{ lunarDate }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  subtitle: string;
  displayDate: string;
  lunarDate: string;
}>();
</script>

<style lang="scss">
.home-hero {
  position: relative;
  min-height: 296rpx;
  overflow: hidden;
  border-radius: 0 0 42rpx 42rpx;
  animation: homeHeroIn 460ms ease both;
}

.home-hero::after {
  content: '';
  position: absolute;
  left: -40rpx;
  right: -40rpx;
  bottom: -2rpx;
  height: 92rpx;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0), var(--theme-page-bottom));
  pointer-events: none;
}

.home-hero__aura,
.home-hero__sun,
.home-hero__cloud,
.home-hero__ridges,
.home-hero__ridge {
  position: absolute;
  pointer-events: none;
}

.home-hero__aura {
  border-radius: 50%;
  animation: homeAuraBreath 5200ms ease-in-out infinite;
}

.home-hero__aura--left {
  left: -86rpx;
  top: 8rpx;
  width: 308rpx;
  height: 190rpx;
  background: radial-gradient(circle, rgba(var(--theme-accent-rgb), 0.18), rgba(255, 255, 255, 0) 72%);
}

.home-hero__aura--right {
  right: -116rpx;
  top: 46rpx;
  width: 350rpx;
  height: 220rpx;
  background: radial-gradient(circle, rgba(var(--theme-primary-rgb), 0.13), rgba(255, 255, 255, 0) 74%);
  animation-delay: 700ms;
}

.home-hero__sun {
  right: 166rpx;
  top: 42rpx;
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background:
    radial-gradient(circle at 38% 34%, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0) 36%),
    radial-gradient(circle, rgba(var(--theme-accent-rgb), 0.28), rgba(var(--theme-accent-rgb), 0.02) 68%);
  box-shadow: 0 0 64rpx rgba(var(--theme-accent-rgb), 0.18);
}

.home-hero__cloud {
  height: 2rpx;
  border-radius: 999rpx;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(var(--theme-primary-rgb), 0.2), rgba(255, 255, 255, 0));
}

.home-hero__cloud--one {
  left: 22rpx;
  right: 126rpx;
  top: 178rpx;
}

.home-hero__cloud--two {
  left: 156rpx;
  right: 20rpx;
  top: 214rpx;
  opacity: 0.74;
}

.home-hero__ridges {
  left: -38rpx;
  right: -38rpx;
  bottom: 18rpx;
  height: 154rpx;
}

.home-hero__ridge {
  left: 0;
  right: 0;
  bottom: 0;
  height: 100%;
  border-radius: 52% 48% 0 0;
}

.home-hero__ridge--back {
  background: rgba(var(--theme-primary-rgb), 0.08);
  clip-path: polygon(0 64%, 10% 54%, 20% 60%, 34% 34%, 48% 58%, 62% 28%, 77% 55%, 90% 38%, 100% 52%, 100% 100%, 0 100%);
}

.home-hero__ridge--mid {
  background: rgba(var(--theme-accent-rgb), 0.11);
  clip-path: polygon(0 76%, 13% 58%, 28% 72%, 42% 44%, 57% 70%, 70% 42%, 84% 66%, 100% 50%, 100% 100%, 0 100%);
}

.home-hero__ridge--front {
  background: rgba(255, 255, 255, 0.36);
  clip-path: polygon(0 84%, 14% 74%, 30% 80%, 45% 60%, 60% 78%, 74% 62%, 88% 76%, 100% 68%, 100% 100%, 0 100%);
}

.home-hero__content {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 22rpx;
  align-items: start;
  padding: 56rpx 4rpx 0;
}

.home-hero__copy {
  display: grid;
  gap: 16rpx;
  min-width: 0;
}

.home-hero__title {
  font-size: 78rpx;
  line-height: 0.98;
  font-weight: 500;
  color: var(--theme-text-primary);
  letter-spacing: 0;
  font-family:
    'Iowan Old Style',
    'Times New Roman',
    'Noto Serif SC',
    serif;
}

.home-hero__subtitle {
  font-size: 25rpx;
  line-height: 1.5;
  letter-spacing: 0.1em;
  color: rgba(var(--theme-text-secondary-rgb), 0.78);
}

.home-hero__date {
  display: grid;
  justify-items: end;
  gap: 8rpx;
  max-width: 258rpx;
  padding-top: 108rpx;
}

.home-hero__date-line {
  font-size: 22rpx;
  line-height: 1.35;
  color: rgba(var(--theme-text-primary-rgb), 0.66);
  text-align: right;
  white-space: nowrap;
}

.home-hero__date-line--lunar {
  color: rgba(var(--theme-text-secondary-rgb), 0.78);
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

@keyframes homeAuraBreath {
  0%,
  100% {
    opacity: 0.66;
    transform: scale(0.98);
  }
  50% {
    opacity: 1;
    transform: scale(1.04);
  }
}

@media (max-width: 360px) {
  .home-hero__title {
    font-size: 66rpx;
  }

  .home-hero__date {
    max-width: 220rpx;
  }

  .home-hero__date-line {
    font-size: 20rpx;
  }
}
</style>
