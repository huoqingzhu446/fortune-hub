<template>
  <view class="fortune-action-card" @tap="$emit('open')">
    <view class="fortune-action-card__beam"></view>
    <view class="fortune-action-card__copy">
      <text class="fortune-action-card__eyebrow">{{ eyebrow }}</text>
      <text class="fortune-action-card__title">{{ title }}</text>
      <text class="fortune-action-card__summary">{{ summary }}</text>

      <view class="fortune-action-card__tags">
        <text
          v-for="tag in tags"
          :key="tag"
          class="fortune-action-card__tag"
        >
          {{ tag }}
        </text>
      </view>

      <button class="fortune-action-card__button" @tap.stop="$emit('action')">
        <text>{{ buttonText }}</text>
        <view class="fortune-action-card__button-arrow"></view>
      </button>
    </view>

    <view class="fortune-action-card__visual" @tap.stop="$emit('open')">
      <view class="fortune-action-card__moon"></view>
      <view class="fortune-action-card__crystal"></view>
      <view class="fortune-action-card__cloud fortune-action-card__cloud--one"></view>
      <view class="fortune-action-card__cloud fortune-action-card__cloud--two"></view>
      <view class="fortune-action-card__platform"></view>
      <view class="fortune-action-card__star fortune-action-card__star--one"></view>
      <view class="fortune-action-card__star fortune-action-card__star--two"></view>
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  eyebrow: string;
  title: string;
  summary: string;
  tags: string[];
  buttonText: string;
}>();

defineEmits<{
  (event: 'open'): void;
  (event: 'action'): void;
}>();
</script>

<style lang="scss">
.fortune-action-card {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 210rpx;
  gap: 20rpx;
  min-height: 292rpx;
  overflow: hidden;
  padding: 34rpx;
  border-radius: 42rpx;
  background:
    radial-gradient(circle at 86% 14%, rgba(255, 255, 255, 0.46), transparent 28%),
    radial-gradient(circle at 16% 100%, rgba(var(--theme-accent-rgb), 0.22), transparent 34%),
    linear-gradient(135deg, rgba(var(--theme-primary-rgb), 0.92), rgba(var(--theme-primary-rgb), 0.74) 56%, rgba(var(--theme-accent-rgb), 0.58));
  color: var(--theme-surface-strong);
  box-shadow:
    0 24rpx 58rpx rgba(var(--theme-primary-rgb), 0.2),
    0 0 0 1rpx rgba(255, 255, 255, 0.26) inset;
  animation: fortuneActionIn 520ms ease 180ms both;
}

.fortune-action-card:active {
  transform: scale(0.98);
  transition: transform 180ms ease;
}

.fortune-action-card__beam {
  position: absolute;
  right: 142rpx;
  top: -90rpx;
  width: 120rpx;
  height: 390rpx;
  border-radius: 50%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.32), rgba(255, 255, 255, 0));
  transform: rotate(16deg);
  pointer-events: none;
}

.fortune-action-card__copy {
  position: relative;
  z-index: 1;
  display: grid;
  align-content: start;
  gap: 13rpx;
  min-width: 0;
}

.fortune-action-card__eyebrow {
  font-size: 23rpx;
  color: rgba(255, 255, 255, 0.76);
  letter-spacing: 0.06em;
}

.fortune-action-card__title {
  font-size: 46rpx;
  line-height: 1.14;
  font-weight: 700;
  color: var(--theme-surface-strong);
  font-family:
    'Iowan Old Style',
    'Times New Roman',
    'Noto Serif SC',
    serif;
}

.fortune-action-card__summary {
  max-width: 396rpx;
  font-size: 25rpx;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.84);
}

.fortune-action-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-top: 2rpx;
}

.fortune-action-card__tag {
  padding: 7rpx 16rpx;
  border-radius: 999rpx;
  font-size: 21rpx;
  color: rgba(255, 255, 255, 0.86);
  background: rgba(255, 255, 255, 0.16);
  border: 1rpx solid rgba(255, 255, 255, 0.16);
}

.fortune-action-card__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  width: 188rpx;
  min-height: 62rpx;
  margin: 10rpx 0 0;
  padding: 0 24rpx;
  border-radius: 999rpx;
  color: var(--theme-primary);
  background: rgba(255, 255, 255, 0.92);
  border: 1rpx solid rgba(255, 255, 255, 0.3);
  font-size: 24rpx;
  font-weight: 700;
  line-height: 1;
  box-shadow: 0 12rpx 26rpx rgba(var(--theme-text-primary-rgb), 0.1);
}

.fortune-action-card__button::after {
  border: 0;
}

.fortune-action-card__button-arrow {
  width: 12rpx;
  height: 12rpx;
  border-top: 3rpx solid currentColor;
  border-right: 3rpx solid currentColor;
  transform: rotate(45deg);
}

.fortune-action-card__visual {
  position: relative;
  z-index: 1;
  min-height: 220rpx;
}

.fortune-action-card__moon,
.fortune-action-card__crystal,
.fortune-action-card__cloud,
.fortune-action-card__platform,
.fortune-action-card__star {
  position: absolute;
  pointer-events: none;
}

.fortune-action-card__moon {
  right: 22rpx;
  top: 6rpx;
  width: 84rpx;
  height: 84rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.78);
  box-shadow:
    -24rpx 0 0 rgba(var(--theme-accent-rgb), 0.2) inset,
    0 16rpx 34rpx rgba(var(--theme-text-primary-rgb), 0.08);
}

.fortune-action-card__crystal {
  left: 48rpx;
  top: 72rpx;
  width: 78rpx;
  height: 104rpx;
  background:
    linear-gradient(150deg, rgba(255, 255, 255, 0.94), rgba(255, 255, 255, 0.44)),
    linear-gradient(180deg, rgba(var(--theme-accent-rgb), 0.18), rgba(255, 255, 255, 0));
  clip-path: polygon(50% 0, 100% 38%, 72% 100%, 28% 100%, 0 38%);
  box-shadow: 0 18rpx 34rpx rgba(var(--theme-text-primary-rgb), 0.1);
}

.fortune-action-card__cloud {
  height: 2rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.48);
}

.fortune-action-card__cloud--one {
  left: 12rpx;
  right: 18rpx;
  top: 172rpx;
}

.fortune-action-card__cloud--two {
  left: 44rpx;
  right: 0;
  top: 188rpx;
  opacity: 0.62;
}

.fortune-action-card__platform {
  left: 10rpx;
  right: 10rpx;
  bottom: 8rpx;
  height: 44rpx;
  border-radius: 50%;
  border: 2rpx solid rgba(255, 255, 255, 0.42);
}

.fortune-action-card__star {
  width: 9rpx;
  height: 9rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 0 18rpx rgba(255, 255, 255, 0.54);
}

.fortune-action-card__star--one {
  left: 18rpx;
  top: 38rpx;
}

.fortune-action-card__star--two {
  right: 4rpx;
  top: 120rpx;
}

@keyframes fortuneActionIn {
  from {
    opacity: 0;
    transform: translateY(24rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 360px) {
  .fortune-action-card {
    grid-template-columns: minmax(0, 1fr) 168rpx;
    padding: 30rpx;
  }

  .fortune-action-card__visual {
    transform: scale(0.92);
    transform-origin: right center;
  }
}
</style>
