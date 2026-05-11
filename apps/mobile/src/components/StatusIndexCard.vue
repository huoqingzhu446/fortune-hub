<template>
  <view class="status-index-card">
    <view class="status-index-card__topline">
      <text class="status-index-card__label">{{ label }}</text>
      <text class="status-index-card__status">{{ formattedStatus }}</text>
    </view>

    <view class="status-index-card__hero">
      <view class="status-index-card__metric">
        <view class="status-index-card__score-row">
          <text class="status-index-card__score">{{ normalizedScore }}</text>
          <text class="status-index-card__unit">/100</text>
        </view>
        <view class="status-index-card__progress">
          <view class="status-index-card__progress-fill" :style="{ width: `${progressValue}%` }"></view>
        </view>
      </view>

      <view class="status-index-card__signal">
        <view class="status-index-card__signal-ring status-index-card__signal-ring--outer"></view>
        <view class="status-index-card__signal-ring status-index-card__signal-ring--inner"></view>
        <view class="status-index-card__signal-core"></view>
      </view>
    </view>

    <view class="status-index-card__body">
      <text class="status-index-card__title">{{ title }}</text>
      <text class="status-index-card__summary">{{ summary }}</text>
    </view>

    <view class="status-index-card__evidence" v-if="evidence">
      <text class="status-index-card__evidence-label">依据</text>
      <text class="status-index-card__evidence-text">{{ evidence }}</text>
    </view>

    <view class="status-index-card__capsule">
      <view
        v-for="item in displayTags"
        :key="item.label"
        class="status-index-card__capsule-item"
      >
        <text class="status-index-card__capsule-label">{{ item.label }}</text>
        <text class="status-index-card__capsule-value">{{ item.value }}</text>
      </view>
    </view>

    <view class="status-index-card__actions">
      <button class="status-index-card__button status-index-card__button--primary" @tap="$emit('primary')">
        {{ primaryActionText }}
      </button>
      <button class="status-index-card__button status-index-card__button--secondary" @tap="$emit('secondary')">
        {{ secondaryActionText }}
      </button>
    </view>

    <text class="status-index-card__disclaimer" v-if="disclaimer">{{ disclaimer }}</text>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export interface StatusIndexTag {
  label: string;
  value: string;
}

const props = withDefaults(
  defineProps<{
    label: string;
    score: number;
    status: string;
    title: string;
    summary: string;
    tags: StatusIndexTag[];
    evidence?: string;
    disclaimer?: string;
    primaryActionText?: string;
    secondaryActionText?: string;
  }>(),
  {
    evidence: '',
    disclaimer: '',
    primaryActionText: '查看完整报告',
    secondaryActionText: '记录心情',
  },
);

defineEmits<{
  (event: 'primary'): void;
  (event: 'secondary'): void;
}>();

const normalizedScore = computed(() => Math.max(0, Math.min(100, Math.round(props.score || 0))));
const progressValue = computed(() => Math.max(8, normalizedScore.value));
const formattedStatus = computed(() => formatStatusText(props.status || '依据同步中'));
const displayTags = computed(() =>
  props.tags.map((item, index) =>
    index === 2 && props.status
      ? {
          ...item,
          value: formattedStatus.value,
        }
      : item,
  ),
);

function formatStatusText(value: string) {
  return value.replace(/[：:]/g, ' · ');
}
</script>

<style lang="scss">
.status-index-card {
  position: relative;
  display: grid;
  gap: 20rpx;
  overflow: hidden;
  padding: 30rpx;
  border-radius: 34rpx;
  color: var(--theme-text-primary);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(255, 255, 255, 0.78)),
    radial-gradient(circle at 96% 0%, rgba(var(--theme-accent-rgb), 0.16), transparent 32%);
  border: 1rpx solid rgba(var(--theme-primary-rgb), 0.1);
  box-shadow:
    0 18rpx 48rpx rgba(var(--theme-text-primary-rgb), 0.075),
    0 0 0 1rpx rgba(255, 255, 255, 0.7) inset;
  animation: statusCardIn 460ms ease 80ms both;
}

.status-index-card__topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  min-width: 0;
}

.status-index-card__label {
  font-size: 24rpx;
  line-height: 1.3;
  color: rgba(var(--theme-primary-rgb), 0.88);
  letter-spacing: 0.06em;
}

.status-index-card__status {
  overflow: hidden;
  max-width: 360rpx;
  padding: 7rpx 16rpx;
  border-radius: 999rpx;
  font-size: 20rpx;
  line-height: 1.2;
  color: rgba(var(--theme-primary-rgb), 0.86);
  text-overflow: ellipsis;
  white-space: nowrap;
  background: rgba(var(--theme-primary-rgb), 0.075);
}

.status-index-card__hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 138rpx;
  gap: 18rpx;
  align-items: center;
}

.status-index-card__metric {
  display: grid;
  gap: 16rpx;
  min-width: 0;
}

.status-index-card__score-row {
  display: flex;
  align-items: baseline;
  gap: 10rpx;
}

.status-index-card__score {
  font-size: 108rpx;
  line-height: 0.86;
  font-weight: 460;
  color: rgba(var(--theme-primary-rgb), 0.94);
  letter-spacing: 0;
  font-family:
    'Iowan Old Style',
    'Times New Roman',
    'Noto Serif SC',
    serif;
}

.status-index-card__unit {
  font-size: 25rpx;
  color: rgba(var(--theme-primary-rgb), 0.56);
}

.status-index-card__progress {
  position: relative;
  width: 100%;
  max-width: 292rpx;
  height: 9rpx;
  overflow: hidden;
  border-radius: 999rpx;
  background: rgba(var(--theme-text-secondary-rgb), 0.12);
}

.status-index-card__progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--theme-primary), var(--theme-accent));
  animation: statusProgressGrow 560ms ease both;
  transform-origin: left center;
}

.status-index-card__signal {
  position: relative;
  width: 132rpx;
  height: 132rpx;
  border-radius: 50%;
}

.status-index-card__signal-ring,
.status-index-card__signal-core {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.status-index-card__signal-ring--outer {
  inset: 0;
  border: 1.5rpx solid rgba(var(--theme-primary-rgb), 0.2);
}

.status-index-card__signal-ring--inner {
  inset: 24rpx;
  border: 1.5rpx solid rgba(var(--theme-accent-rgb), 0.3);
  background: rgba(var(--theme-primary-rgb), 0.045);
}

.status-index-card__signal-core {
  inset: 48rpx;
  background: linear-gradient(145deg, var(--theme-primary), var(--theme-accent));
  box-shadow:
    0 0 0 14rpx rgba(var(--theme-primary-rgb), 0.08),
    0 18rpx 34rpx rgba(var(--theme-primary-rgb), 0.16);
}

.status-index-card__body {
  display: grid;
  gap: 12rpx;
}

.status-index-card__title {
  display: block;
  font-size: 30rpx;
  line-height: 1.42;
  font-weight: 650;
  color: rgba(var(--theme-text-primary-rgb), 0.9);
}

.status-index-card__summary {
  display: block;
  font-size: 24rpx;
  line-height: 1.56;
  color: rgba(var(--theme-text-secondary-rgb), 0.88);
}

.status-index-card__evidence {
  display: grid;
  grid-template-columns: 60rpx minmax(0, 1fr);
  gap: 14rpx;
  align-items: start;
  padding: 15rpx 18rpx;
  border-radius: 24rpx;
  background: rgba(var(--theme-primary-rgb), 0.055);
  border: 1rpx solid rgba(var(--theme-primary-rgb), 0.08);
}

.status-index-card__evidence-label {
  font-size: 21rpx;
  line-height: 1.4;
  color: rgba(var(--theme-primary-rgb), 0.88);
  font-weight: 600;
}

.status-index-card__evidence-text {
  font-size: 22rpx;
  line-height: 1.48;
  color: rgba(var(--theme-text-secondary-rgb), 0.88);
}

.status-index-card__capsule {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10rpx;
}

.status-index-card__capsule-item {
  display: grid;
  gap: 6rpx;
  min-width: 0;
  min-height: 72rpx;
  box-sizing: border-box;
  padding: 12rpx 12rpx;
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.74);
  border: 1rpx solid rgba(var(--theme-primary-rgb), 0.08);
}

.status-index-card__capsule-label {
  font-size: 19rpx;
  line-height: 1.2;
  color: rgba(var(--theme-text-secondary-rgb), 0.66);
}

.status-index-card__capsule-value {
  display: -webkit-box;
  overflow: hidden;
  font-size: 22rpx;
  line-height: 1.34;
  font-weight: 600;
  color: rgba(var(--theme-text-primary-rgb), 0.82);
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.status-index-card__actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 0.82fr);
  gap: 12rpx;
}

.status-index-card__button {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-height: 72rpx;
  margin: 0;
  padding: 0 24rpx;
  border-radius: 999rpx;
  font-size: 25rpx;
  line-height: 1.2;
  font-weight: 650;
}

.status-index-card__button::after {
  border: 0;
}

.status-index-card__button--primary {
  color: #fff;
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-accent));
  box-shadow: 0 14rpx 30rpx rgba(var(--theme-primary-rgb), 0.18);
}

.status-index-card__button--secondary {
  color: rgba(var(--theme-primary-rgb), 0.88);
  background: rgba(var(--theme-primary-rgb), 0.08);
  border: 1rpx solid rgba(var(--theme-primary-rgb), 0.1);
}

.status-index-card__disclaimer {
  display: block;
  font-size: 20rpx;
  line-height: 1.42;
  color: rgba(var(--theme-text-secondary-rgb), 0.64);
}

@keyframes statusCardIn {
  from {
    opacity: 0;
    transform: translateY(22rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes statusProgressGrow {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

@media (max-width: 360px) {
  .status-index-card {
    padding: 30rpx;
  }

  .status-index-card__hero {
    grid-template-columns: minmax(0, 1fr) 112rpx;
  }

  .status-index-card__score {
    font-size: 98rpx;
  }

  .status-index-card__signal {
    width: 112rpx;
    height: 112rpx;
  }

  .status-index-card__signal-ring--inner {
    inset: 22rpx;
  }

  .status-index-card__signal-core {
    inset: 46rpx;
  }

  .status-index-card__capsule,
  .status-index-card__actions {
    grid-template-columns: 1fr;
  }
}
</style>
