<template>
  <view class="page">
    <view class="page-orb"></view>

    <view class="panel hero-panel">
      <text class="eyebrow">lucky sign</text>
      <text class="title">{{ detail.sign.title }}</text>
      <view class="tag-row">
        <text class="tag-chip">{{ detail.sign.tag }}</text>
        <text class="tag-chip tag-chip--soft">{{ detail.profile.dominantElement }}元素主导</text>
      </view>
      <text class="summary">{{ detail.sign.summary }}</text>
      <text class="mantra">签语提醒：{{ detail.sign.mantra }}</text>
    </view>

    <view class="panel">
      <text class="section-title">今日解读</text>
      <text class="body-text">{{ detail.sign.interpretation }}</text>

      <view class="info-grid">
        <view class="info-card">
          <text class="info-card__label">顺势时段</text>
          <text class="info-card__value">{{ detail.sign.favorableWindow }}</text>
        </view>
        <view class="info-card">
          <text class="info-card__label">适合</text>
          <text class="info-card__value">{{ detail.sign.goodFor }}</text>
        </view>
      </view>
    </view>

    <view class="panel panel--soft">
      <text class="section-title">今天先别做的事</text>
      <text class="body-text">{{ detail.sign.avoid }}</text>
    </view>

    <view class="panel">
      <text class="section-title">行动建议</text>
      <view class="tip-list">
        <text v-for="item in detail.sign.suggestions" :key="item" class="tip-item">{{ item }}</text>
      </view>
    </view>

    <view class="action-row">
      <button class="hero-button hero-button--secondary" @tap="goLucky">返回幸运物</button>
      <button class="hero-button hero-button--primary" @tap="backHome">回到首页</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';
import { ref } from 'vue';
import { fetchLuckySignDetail } from '../../../api/lucky';
import type { LuckySignDetailData } from '../../../types/lucky';

const fallbackDetail: LuckySignDetailData = {
  profile: {
    personalized: false,
    zodiac: null,
    dominantElement: '木',
  },
  sign: {
    bizCode: 'sign-breeze-open',
    title: '今日幸运签',
    summary: '先把心绪放松一点，再做决定，顺势比硬顶更容易得到答案。',
    tag: '风起有信',
    interpretation: '今天更适合在柔和中保持明确，让判断回到自己手里。',
    mantra: '先松一口气，再向前一步。',
    favorableWindow: '10:00 - 13:00',
    goodFor: '适合沟通、确认安排、做一次轻量整理。',
    avoid: '不要在疲惫和上头的时候做情绪化决定。',
    suggestions: [
      '先完成一件最小但明确的任务，让节奏重新流动。',
      '给重要沟通留一点缓冲和回看空间。',
    ],
  },
};

const detail = ref<LuckySignDetailData>(fallbackDetail);

async function loadDetail(bizCode: string) {
  try {
    const response = await fetchLuckySignDetail(bizCode);
    detail.value = response.data;
  } catch (error) {
    console.warn('load lucky sign failed', error);
    detail.value = fallbackDetail;
    uni.showToast({
      title: '使用默认签语',
      icon: 'none',
    });
  }
}

function goLucky() {
  uni.navigateTo({
    url: '/pages/lucky/index',
  });
}

function backHome() {
  uni.reLaunch({
    url: '/pages/index/index',
  });
}

onLoad((options) => {
  const bizCode =
    typeof options?.bizCode === 'string' && options.bizCode
      ? decodeURIComponent(options.bizCode)
      : fallbackDetail.sign.bizCode;
  void loadDetail(bizCode);
});
</script>

<style lang="scss">
.page {
  min-height: 100vh;
  padding: 24rpx;
  background:
    radial-gradient(circle at top left, rgba(149, 224, 197, 0.24), transparent 22%),
    linear-gradient(180deg, #f9fbff 0%, #eef3f8 100%);
}

.page-orb {
  position: fixed;
  top: 40rpx;
  right: -80rpx;
  width: 300rpx;
  height: 300rpx;
  border-radius: 999rpx;
  background: rgba(143, 212, 186, 0.36);
  filter: blur(28rpx);
}

.panel {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 18rpx;
  margin-bottom: 20rpx;
  padding: 28rpx;
  border-radius: 32rpx;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: var(--apple-shadow);
}

.panel--soft {
  background: rgba(247, 250, 252, 0.94);
}

.eyebrow,
.info-card__label {
  font-size: 20rpx;
  text-transform: uppercase;
  letter-spacing: 0.28em;
  color: var(--apple-subtle);
}

.title,
.section-title {
  font-size: 40rpx;
  font-weight: 700;
  color: var(--apple-text);
}

.tag-row,
.info-grid,
.action-row {
  display: grid;
  gap: 16rpx;
}

.tag-row {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.tag-chip {
  padding: 12rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(221, 243, 234, 0.9);
  color: #457d6a;
  font-size: 22rpx;
  text-align: center;
}

.tag-chip--soft {
  background: rgba(239, 244, 248, 0.92);
  color: var(--apple-muted);
}

.summary,
.body-text,
.mantra,
.info-card__value,
.tip-item {
  font-size: 28rpx;
  line-height: 1.7;
  color: var(--apple-text);
}

.info-card {
  display: grid;
  gap: 10rpx;
  padding: 22rpx;
  border-radius: 24rpx;
  background: rgba(246, 249, 252, 0.92);
}

.tip-list {
  display: grid;
  gap: 14rpx;
}

.tip-item {
  padding: 18rpx 20rpx;
  border-radius: 22rpx;
  background: rgba(246, 249, 252, 0.92);
}

.hero-button {
  min-height: 82rpx;
  border-radius: 999rpx;
  line-height: 82rpx;
  font-size: 28rpx;
}

.hero-button::after {
  border: none;
}

.hero-button--primary {
  color: #ffffff;
  background: linear-gradient(135deg, var(--apple-blue) 0%, #7ba7ff 100%);
}

.hero-button--secondary {
  color: var(--apple-text);
  background: rgba(244, 247, 250, 0.92);
}
</style>
