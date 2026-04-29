<template>
  <view class="divination-page">
    <view class="ambient ambient--moon"></view>
    <view class="ambient ambient--mist"></view>

    <view class="page-head">
      <view>
        <text class="page-title">占卜</text>
        <text class="page-subtitle">周易 × 八字 × 星座 × 心情</text>
      </view>
      <button class="ghost-button" @tap="openHistory">记录</button>
    </view>

    <view class="today-card" @tap="startToday">
      <view class="today-card__copy">
        <text class="today-card__eyebrow">今日占卜</text>
        <text class="today-card__title">聆听内心的声音</text>
        <text class="today-card__summary">指引当下的方向，把答案落回可行动的一步。</text>
        <button class="primary-pill" @tap.stop="startToday">立即占卜</button>
      </view>
      <view class="today-card__visual">
        <view class="moon"></view>
        <view class="crystal"></view>
        <view class="water"></view>
      </view>
    </view>

    <view class="state-card">
      <view class="avatar-orb">占</view>
      <view class="state-card__content">
        <view class="state-line state-line--strong">
          <text>八字已同步</text>
          <text class="state-badge">已完善</text>
        </view>
        <view class="state-line">
          <text>星座：天秤座</text>
          <text>最近心情：轻焦虑</text>
        </view>
        <view class="state-line">
          <text>性格：INFP</text>
          <text>敏感细腻型</text>
        </view>
      </view>
    </view>

    <view class="section-head">
      <text class="section-title">选择方向</text>
      <text class="section-note">清晰的问题，会得到更贴近当下的指引</text>
    </view>

    <view class="feature-grid">
      <view
        v-for="entry in featureEntries"
        :key="entry.topic"
        class="feature-card"
        @tap="openSelect(entry.topic)"
      >
        <view class="feature-card__icon">{{ entry.icon }}</view>
        <view>
          <text class="feature-card__title">{{ entry.title }}</text>
          <text class="feature-card__desc">{{ entry.desc }}</text>
        </view>
      </view>
    </view>

    <view class="suitable-card">
      <view class="suitable-card__head">
        <text class="section-title">今日宜 / 忌</text>
        <text class="section-link" @tap="startToday">查看更多</text>
      </view>
      <view class="suitable-card__body">
        <view class="suitable-box suitable-box--good">
          <text class="suitable-box__label">宜</text>
          <text class="suitable-box__text">沟通、整理、学习</text>
        </view>
        <view class="suitable-box suitable-box--avoid">
          <text class="suitable-box__label">忌</text>
          <text class="suitable-box__text">冲动、熬夜、争执</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import {
  createTodayDivinationRequest,
  setPendingDivinationRequest,
} from '../../../services/divination';
import type { DivinationTopic } from '../../../types/divination';

const featureEntries: Array<{
  topic: DivinationTopic;
  title: string;
  desc: string;
  icon: string;
}> = [
  { topic: 'general', title: '今日运势', desc: '每日趋势指引', icon: '✦' },
  { topic: 'love', title: '感情占卜', desc: '缘分与关系', icon: '♡' },
  { topic: 'career', title: '事业占卜', desc: '职业与发展', icon: '▣' },
  { topic: 'wealth', title: '财运占卜', desc: '收支与资源', icon: '◍' },
  { topic: 'emotion', title: '情绪疗愈', desc: '身心成长指南', icon: '✺' },
  { topic: 'growth', title: '历史记录', desc: '复盘近期趋势', icon: '☷' },
];

function startToday() {
  setPendingDivinationRequest(createTodayDivinationRequest('general'));
  uni.navigateTo({
    url: '/pages/divination/loading/index',
  });
}

function openSelect(topic: DivinationTopic) {
  if (topic === 'growth') {
    openHistory();
    return;
  }

  uni.navigateTo({
    url: `/pages/divination/select/index?topic=${encodeURIComponent(topic)}`,
  });
}

function openHistory() {
  uni.navigateTo({
    url: '/pages/divination/history/index',
  });
}
</script>

<style lang="scss">
.divination-page {
  position: relative;
  min-height: 100vh;
  box-sizing: border-box;
  padding: calc(env(safe-area-inset-top) + 36rpx) 28rpx 80rpx;
  overflow: hidden;
  background:
    radial-gradient(circle at 14% 8%, rgba(139, 111, 214, 0.2), transparent 26%),
    radial-gradient(circle at 86% 4%, rgba(216, 166, 78, 0.18), transparent 28%),
    linear-gradient(180deg, #fff9ef 0%, #f5edff 48%, #fffaf0 100%);
  color: #4e3825;
}

.ambient {
  position: absolute;
  pointer-events: none;
}

.ambient--moon {
  right: 82rpx;
  top: 112rpx;
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  background: rgba(216, 166, 78, 0.28);
  box-shadow: -20rpx 2rpx 0 #fff9ef inset;
}

.ambient--mist {
  left: -80rpx;
  top: 330rpx;
  width: 300rpx;
  height: 180rpx;
  border-radius: 50%;
  background: rgba(139, 111, 214, 0.16);
  filter: blur(30rpx);
}

.page-head,
.today-card,
.state-card,
.section-head,
.feature-grid,
.suitable-card {
  position: relative;
  z-index: 1;
}

.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24rpx;
  margin-bottom: 24rpx;
}

.page-title {
  display: block;
  font-size: 54rpx;
  line-height: 1.1;
  font-family:
    'Iowan Old Style',
    'Times New Roman',
    'Noto Serif SC',
    serif;
  font-weight: 700;
}

.page-subtitle {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: rgba(78, 56, 37, 0.66);
}

.ghost-button,
.primary-pill {
  padding: 0;
  margin: 0;
  border: 0;
  line-height: 1;
}

.ghost-button::after,
.primary-pill::after {
  border: 0;
}

.ghost-button {
  min-width: 104rpx;
  height: 58rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.68);
  color: #8b6fd6;
  font-size: 24rpx;
  border: 1rpx solid rgba(139, 111, 214, 0.22);
}

.today-card {
  min-height: 328rpx;
  display: flex;
  justify-content: space-between;
  gap: 20rpx;
  padding: 36rpx 34rpx;
  border-radius: 34rpx;
  overflow: hidden;
  background:
    linear-gradient(135deg, rgba(139, 111, 214, 0.9), rgba(217, 181, 255, 0.7)),
    radial-gradient(circle at 74% 16%, rgba(255, 255, 255, 0.5), transparent 32%);
  box-shadow: 0 22rpx 54rpx rgba(99, 74, 143, 0.22);
  color: #ffffff;
}

.today-card::before,
.today-card::after {
  content: '';
  position: absolute;
  pointer-events: none;
}

.today-card::before {
  left: 0;
  right: 0;
  bottom: 0;
  height: 116rpx;
  background:
    radial-gradient(ellipse at 20% 100%, rgba(255, 255, 255, 0.28), transparent 62%),
    linear-gradient(180deg, transparent, rgba(68, 49, 122, 0.18));
}

.today-card::after {
  right: 80rpx;
  top: 50rpx;
  width: 128rpx;
  height: 128rpx;
  border-radius: 50%;
  border: 2rpx solid rgba(255, 255, 255, 0.34);
}

.today-card__copy {
  position: relative;
  z-index: 1;
  display: grid;
  align-content: start;
  gap: 16rpx;
  width: 396rpx;
}

.today-card__eyebrow {
  font-size: 24rpx;
  opacity: 0.86;
}

.today-card__title {
  font-size: 46rpx;
  font-weight: 700;
  font-family:
    'Iowan Old Style',
    'Times New Roman',
    'Noto Serif SC',
    serif;
}

.today-card__summary {
  font-size: 24rpx;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.86);
}

.primary-pill {
  display: inline-grid;
  place-items: center;
  width: 176rpx;
  height: 58rpx;
  margin-top: 10rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.92);
  color: #8b6fd6;
  font-size: 24rpx;
  font-weight: 600;
}

.today-card__visual {
  position: relative;
  z-index: 1;
  flex: 1;
  min-width: 190rpx;
}

.moon {
  position: absolute;
  right: 10rpx;
  top: 12rpx;
  width: 92rpx;
  height: 92rpx;
  border-radius: 50%;
  background: rgba(255, 243, 216, 0.88);
  box-shadow: -24rpx 0 0 rgba(139, 111, 214, 0.3) inset;
}

.crystal {
  position: absolute;
  right: 60rpx;
  top: 136rpx;
  width: 76rpx;
  height: 102rpx;
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.96), rgba(210, 183, 255, 0.54));
  clip-path: polygon(50% 0, 100% 36%, 72% 100%, 28% 100%, 0 36%);
  box-shadow: 0 18rpx 42rpx rgba(255, 255, 255, 0.34);
}

.water {
  position: absolute;
  right: 10rpx;
  top: 224rpx;
  width: 176rpx;
  height: 38rpx;
  border-radius: 50%;
  border: 2rpx solid rgba(255, 255, 255, 0.54);
}

.state-card {
  display: flex;
  gap: 22rpx;
  margin-top: 22rpx;
  padding: 22rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.82);
  border: 1rpx solid rgba(255, 255, 255, 0.92);
  box-shadow: 0 12rpx 34rpx rgba(80, 60, 120, 0.08);
}

.avatar-orb {
  display: grid;
  place-items: center;
  flex: 0 0 92rpx;
  width: 92rpx;
  height: 92rpx;
  border-radius: 50%;
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 700;
  background: linear-gradient(145deg, #8b6fd6, #d9b5ff);
}

.state-card__content {
  display: grid;
  gap: 10rpx;
  flex: 1;
  min-width: 0;
}

.state-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14rpx;
  min-height: 38rpx;
  padding: 0 4rpx;
  font-size: 23rpx;
  color: rgba(78, 56, 37, 0.72);
}

.state-line--strong {
  color: #4e3825;
  font-weight: 600;
}

.state-badge {
  padding: 6rpx 16rpx;
  border-radius: 999rpx;
  background: #edf7ee;
  color: #5f9668;
  font-size: 21rpx;
}

.section-head {
  display: grid;
  gap: 6rpx;
  margin: 34rpx 4rpx 18rpx;
}

.section-title {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #4e3825;
}

.section-note,
.section-link {
  font-size: 22rpx;
  color: rgba(78, 56, 37, 0.56);
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18rpx;
}

.feature-card {
  display: flex;
  align-items: center;
  gap: 18rpx;
  min-height: 118rpx;
  padding: 18rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.82);
  border: 1rpx solid rgba(255, 255, 255, 0.92);
  box-shadow: 0 10rpx 26rpx rgba(80, 60, 120, 0.07);
}

.feature-card__icon {
  display: grid;
  place-items: center;
  flex: 0 0 64rpx;
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  color: #8b6fd6;
  font-size: 34rpx;
  background: linear-gradient(145deg, #f5edff, #fff6f2);
}

.feature-card__title,
.feature-card__desc {
  display: block;
}

.feature-card__title {
  font-size: 26rpx;
  font-weight: 650;
  color: #4e3825;
}

.feature-card__desc {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: rgba(78, 56, 37, 0.58);
}

.suitable-card {
  margin-top: 24rpx;
  padding: 24rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.84);
  border: 1rpx solid rgba(255, 255, 255, 0.92);
  box-shadow: 0 12rpx 34rpx rgba(80, 60, 120, 0.08);
}

.suitable-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  margin-bottom: 18rpx;
}

.suitable-card__body {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
}

.suitable-box {
  min-height: 106rpx;
  padding: 20rpx;
  border-radius: 22rpx;
}

.suitable-box--good {
  background: #f1f8ed;
}

.suitable-box--avoid {
  background: #fff0ea;
}

.suitable-box__label,
.suitable-box__text {
  display: block;
}

.suitable-box__label {
  font-size: 26rpx;
  font-weight: 700;
}

.suitable-box--good .suitable-box__label {
  color: #4f7c5a;
}

.suitable-box--avoid .suitable-box__label {
  color: #b75a4f;
}

.suitable-box__text {
  margin-top: 12rpx;
  font-size: 23rpx;
  color: rgba(78, 56, 37, 0.7);
}
</style>
