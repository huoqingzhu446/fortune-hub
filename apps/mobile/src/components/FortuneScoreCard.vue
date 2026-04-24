<template>
  <view class="fortune-card" @tap="$emit('select')">
    <view class="fortune-card__glow"></view>

    <view class="fortune-card__head">
      <view class="fortune-card__copy">
        <text class="fortune-card__eyebrow">{{ label }}</text>
        <view class="fortune-card__score-line">
          <text class="fortune-card__score">{{ score }}</text>
          <text class="fortune-card__denominator">/ 100</text>
        </view>
        <text class="fortune-card__status">{{ status }}</text>
      </view>

      <view class="fortune-card__orbital">
        <view class="fortune-card__ring fortune-card__ring--outer"></view>
        <view class="fortune-card__ring fortune-card__ring--inner"></view>
        <view class="fortune-card__orb"></view>
      </view>
    </view>

    <view class="fortune-card__body">
      <text class="fortune-card__title">{{ title }}</text>
      <text class="fortune-card__summary">{{ summary }}</text>
    </view>

    <view class="fortune-card__footer">
      <view
        v-for="item in tags"
        :key="item.label"
        class="fortune-card__tag"
      >
        <text class="fortune-card__tag-label">{{ item.label }}</text>
        <text class="fortune-card__tag-value">{{ item.value }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
export interface FortuneCardTag {
  label: string;
  value: string;
}

defineProps<{
  label: string;
  score: number;
  status: string;
  title: string;
  summary: string;
  tags: FortuneCardTag[];
}>();

defineEmits<{
  (event: 'select'): void;
}>();
</script>

<style lang="scss">
.fortune-card {
  position: relative;
  display: grid;
  gap: 28rpx;
  padding: 34rpx;
  overflow: hidden;
  border-radius: 40rpx;
  background:
    radial-gradient(circle at 78% 34%, rgba(255, 255, 255, 0.86), transparent 22%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.84) 0%, var(--theme-soft) 100%);
  border: 1rpx solid var(--theme-border);
  box-shadow: var(--theme-shadow);
}

.fortune-card__glow {
  position: absolute;
  top: 56rpx;
  right: 82rpx;
  width: 220rpx;
  height: 220rpx;
  border-radius: 50%;
  background: var(--theme-glow);
  filter: blur(34rpx);
  opacity: 0.7;
}

.fortune-card__head {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 248rpx;
  gap: 20rpx;
  align-items: center;
}

.fortune-card__copy {
  display: grid;
  gap: 12rpx;
}

.fortune-card__eyebrow,
.fortune-card__tag-label {
  font-size: 22rpx;
  letter-spacing: 0.16em;
  color: var(--theme-primary);
}

.fortune-card__score-line {
  display: flex;
  align-items: baseline;
  gap: 10rpx;
}

.fortune-card__score {
  font-size: 152rpx;
  line-height: 0.92;
  font-weight: 300;
  color: var(--theme-text-primary);
  font-family:
    'Iowan Old Style',
    'Times New Roman',
    'Noto Serif SC',
    serif;
}

.fortune-card__denominator {
  font-size: 34rpx;
  color: var(--theme-text-secondary);
}

.fortune-card__status {
  font-size: 28rpx;
  color: var(--theme-text-secondary);
}

.fortune-card__orbital {
  position: relative;
  width: 248rpx;
  height: 248rpx;
}

.fortune-card__ring,
.fortune-card__orb {
  position: absolute;
  inset: 0;
  border-radius: 50%;
}

.fortune-card__ring--outer {
  border: 1rpx solid rgba(255, 255, 255, 0.86);
  box-shadow: 0 0 0 1rpx rgba(255, 255, 255, 0.3) inset;
}

.fortune-card__ring--inner {
  inset: 20rpx;
  border: 1rpx dashed rgba(255, 255, 255, 0.84);
}

.fortune-card__orb {
  inset: 54rpx;
  background:
    radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.94), transparent 30%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.88) 0%, var(--theme-soft) 100%);
  box-shadow:
    0 0 0 1rpx rgba(255, 255, 255, 0.72) inset,
    0 18rpx 40rpx rgba(50, 60, 80, 0.08);
}

.fortune-card__body {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 12rpx;
}

.fortune-card__title {
  font-size: 42rpx;
  font-weight: 500;
  color: var(--theme-text-primary);
}

.fortune-card__summary {
  font-size: 26rpx;
  line-height: 1.7;
  color: var(--theme-text-secondary);
}

.fortune-card__footer {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
  padding: 16rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.56);
}

.fortune-card__tag {
  display: grid;
  gap: 8rpx;
  text-align: center;
}

.fortune-card__tag-label {
  letter-spacing: 0;
  font-size: 20rpx;
  color: var(--theme-text-tertiary);
}

.fortune-card__tag-value {
  font-size: 24rpx;
  color: var(--theme-text-primary);
}
</style>
