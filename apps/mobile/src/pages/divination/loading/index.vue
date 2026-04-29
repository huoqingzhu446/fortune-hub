<template>
  <view class="loading-page">
    <view class="loading-scene">
      <view class="star-ring"></view>
      <view class="hexagram-loader">
        <view
          v-for="line in 6"
          :key="line"
          class="loader-line"
          :class="{ 'loader-line--broken': line === 2 || line === 5 }"
          :style="{ animationDelay: `${line * 0.14}s` }"
        >
          <view class="loader-line__segment"></view>
          <view class="loader-line__segment"></view>
        </view>
      </view>
      <view class="water-ripple"></view>
    </view>
    <text class="loading-title">正在生成属于你的卦象</text>
    <text class="loading-text">{{ loadingText }}</text>
  </view>
</template>

<script setup lang="ts">
import { onLoad, onUnload } from '@dcloudio/uni-app';
import { ref } from 'vue';
import {
  clearPendingDivinationRequest,
  createTodayDivinationRequest,
  generateDivinationResult,
  getPendingDivinationRequest,
  saveDivinationResult,
} from '../../../services/divination';

const texts = [
  '正在结合你的当下状态',
  '正在读取星象与心情变化',
  '正在整理今日的行动建议',
  '正在生成温柔可执行的提醒',
];

const loadingText = ref(texts[0]);
let resultTimer: ReturnType<typeof setTimeout> | null = null;
let textTimer: ReturnType<typeof setInterval> | null = null;

onLoad(() => {
  let index = 0;
  textTimer = setInterval(() => {
    index = (index + 1) % texts.length;
    loadingText.value = texts[index];
  }, 520);

  const pending = getPendingDivinationRequest() || createTodayDivinationRequest();
  const result = generateDivinationResult(pending);
  saveDivinationResult(result);
  clearPendingDivinationRequest();

  resultTimer = setTimeout(() => {
    uni.redirectTo({
      url: `/pages/divination/result/index?id=${encodeURIComponent(result.id)}`,
    });
  }, 1800);
});

onUnload(() => {
  if (resultTimer) {
    clearTimeout(resultTimer);
  }
  if (textTimer) {
    clearInterval(textTimer);
  }
});
</script>

<style lang="scss">
.loading-page {
  display: grid;
  align-content: center;
  justify-items: center;
  min-height: 100vh;
  box-sizing: border-box;
  padding: 80rpx 48rpx;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 32%, rgba(139, 111, 214, 0.2), transparent 36%),
    linear-gradient(180deg, #fff9ef 0%, #f4edff 52%, #fff8ec 100%);
  color: #4e3825;
}

.loading-scene {
  position: relative;
  display: grid;
  place-items: center;
  width: 390rpx;
  height: 390rpx;
}

.star-ring {
  position: absolute;
  inset: 20rpx;
  border-radius: 50%;
  border: 2rpx solid rgba(216, 166, 78, 0.3);
  animation: ringRotate 8s linear infinite;
}

.star-ring::before,
.star-ring::after {
  content: '';
  position: absolute;
  width: 22rpx;
  height: 22rpx;
  background: #d8a64e;
  clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%);
}

.star-ring::before {
  top: -12rpx;
  left: 50%;
}

.star-ring::after {
  right: 28rpx;
  bottom: 30rpx;
  transform: scale(0.72);
}

.hexagram-loader {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 18rpx;
  width: 214rpx;
}

.loader-line {
  display: flex;
  gap: 30rpx;
  height: 18rpx;
  opacity: 0.28;
  animation: lineGlow 1.6s ease-in-out infinite;
}

.loader-line__segment {
  flex: 1;
  border-radius: 999rpx;
  background: #3d3342;
}

.loader-line:not(.loader-line--broken) .loader-line__segment:first-child {
  flex-basis: 100%;
}

.loader-line:not(.loader-line--broken) .loader-line__segment:last-child {
  display: none;
}

.water-ripple {
  position: absolute;
  bottom: 68rpx;
  width: 260rpx;
  height: 66rpx;
  border-radius: 50%;
  border: 2rpx solid rgba(139, 111, 214, 0.22);
  animation: ripple 2.4s ease-in-out infinite;
}

.loading-title {
  margin-top: 24rpx;
  font-size: 38rpx;
  font-weight: 700;
  font-family:
    'Iowan Old Style',
    'Times New Roman',
    'Noto Serif SC',
    serif;
}

.loading-text {
  margin-top: 18rpx;
  font-size: 24rpx;
  color: rgba(78, 56, 37, 0.58);
}

@keyframes ringRotate {
  to {
    transform: rotate(360deg);
  }
}

@keyframes lineGlow {
  0%,
  100% {
    opacity: 0.24;
    transform: scaleX(0.88);
  }
  45% {
    opacity: 1;
    transform: scaleX(1);
  }
}

@keyframes ripple {
  0%,
  100% {
    opacity: 0.22;
    transform: scale(0.88);
  }
  50% {
    opacity: 0.72;
    transform: scale(1.12);
  }
}
</style>
