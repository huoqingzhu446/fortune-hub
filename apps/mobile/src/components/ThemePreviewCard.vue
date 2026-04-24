<template>
  <view
    class="theme-card"
    :class="{
      'theme-card--active': active,
      'theme-card--muted': muted,
    }"
    @tap="$emit('select')"
  >
    <view class="theme-card__swatches">
      <view
        v-for="color in swatches"
        :key="color"
        class="theme-card__swatch"
        :style="{ background: color }"
      />
    </view>

    <view class="theme-card__meta">
      <view class="theme-card__head">
        <text class="theme-card__title">{{ palette.name }}</text>
        <text v-if="active" class="theme-card__badge">当前</text>
      </view>
      <text class="theme-card__description">{{ palette.description }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ThemePalette } from '../theme/tokens';

const props = withDefaults(
  defineProps<{
    palette: ThemePalette;
    active?: boolean;
    muted?: boolean;
  }>(),
  {
    active: false,
    muted: false,
  },
);

defineEmits<{
  (event: 'select'): void;
}>();

const swatches = computed(() => [
  props.palette.primary,
  props.palette.accent,
  props.palette.soft,
]);
</script>

<style lang="scss">
.theme-card {
  display: grid;
  gap: 18rpx;
  padding: 24rpx;
  border-radius: 28rpx;
  background: var(--theme-surface);
  border: 1rpx solid transparent;
  box-shadow: var(--theme-shadow-soft);
}

.theme-card--active {
  border-color: var(--theme-primary);
  background: var(--theme-surface-strong);
}

.theme-card--muted {
  opacity: 0.76;
}

.theme-card__swatches {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
}

.theme-card__swatch {
  height: 64rpx;
  border-radius: 18rpx;
}

.theme-card__meta {
  display: grid;
  gap: 8rpx;
}

.theme-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.theme-card__title {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--theme-text-primary);
}

.theme-card__badge {
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  font-size: 20rpx;
  color: var(--theme-primary);
  background: var(--theme-tag-bg);
}

.theme-card__description {
  font-size: 22rpx;
  line-height: 1.6;
  color: var(--theme-text-secondary);
}
</style>
