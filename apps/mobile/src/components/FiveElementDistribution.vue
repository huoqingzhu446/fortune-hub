<template>
  <view class="five-element-distribution">
    <view
      v-for="item in displayRows"
      :key="item.name"
      class="five-element-distribution__row"
    >
      <text class="five-element-distribution__name">{{ item.name }}</text>
      <view class="five-element-distribution__track">
        <view
          class="five-element-distribution__bar"
          :style="{ width: item.width }"
        ></view>
      </view>
      <text class="five-element-distribution__level">{{ item.level }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export interface FiveElementDistributionItem {
  name: string;
  value: number;
}

const props = withDefaults(
  defineProps<{
    elements: FiveElementDistributionItem[];
    minPercent?: number;
  }>(),
  {
    minPercent: 12,
  },
);

const displayRows = computed(() => {
  const values = props.elements
    .map((element) => element.value)
    .filter((value) => Number.isFinite(value));
  const max = values.length ? Math.max(...values) : 0;
  const min = values.length ? Math.min(...values) : 0;

  return props.elements.map((item) => ({
    name: item.name,
    width: formatElementWidth(item.value, max, props.minPercent),
    level: formatElementLevel(item.value, max, min),
  }));
});

function formatElementWidth(value: number, max: number, minPercent: number) {
  if (!Number.isFinite(value) || max <= 0) {
    return `${minPercent}%`;
  }

  return `${Math.min(100, Math.max(minPercent, (value / max) * 100))}%`;
}

function formatElementLevel(value: number, max: number, min: number) {
  if (!Number.isFinite(value) || max <= 0) {
    return '适中';
  }

  if (max === min) {
    return '均衡';
  }

  if (value === max) {
    return '偏旺';
  }

  if (value === min) {
    return '待补';
  }

  const ratio = value / max;

  if (ratio >= 0.75) {
    return '有势';
  }

  if (ratio <= 0.45) {
    return '偏弱';
  }

  return '适中';
}
</script>

<style lang="scss">
.five-element-distribution {
  display: grid;
  gap: 14rpx;
  margin: 20rpx 0;
}

.five-element-distribution__row {
  display: grid;
  grid-template-columns: 72rpx minmax(0, 1fr) 84rpx;
  align-items: center;
  gap: 14rpx;
}

.five-element-distribution__name,
.five-element-distribution__level {
  display: block;
  min-width: 0;
  font-size: 24rpx;
  font-weight: 700;
  line-height: 1.35;
  color: #4b3a26;
}

.five-element-distribution__level {
  text-align: right;
}

.five-element-distribution__track {
  height: 18rpx;
  overflow: hidden;
  border-radius: 999rpx;
  background: rgba(230, 219, 197, 0.95);
}

.five-element-distribution__bar {
  height: 100%;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #7f9b84 0%, #c8a56f 100%);
}
</style>
