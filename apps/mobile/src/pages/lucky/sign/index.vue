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

    <view class="panel">
      <view class="section-head">
        <text class="section-title">分享海报</text>
        <text class="section-meta">{{ detail.sign.sharePoster.themeName }}</text>
      </view>

      <view class="poster-shell">
        <text class="poster-shell__title">{{ detail.sign.sharePoster.title }}</text>
        <text class="poster-shell__subtitle">{{ detail.sign.sharePoster.subtitle }}</text>
        <text class="poster-shell__accent">{{ detail.sign.sharePoster.accentText }}</text>
        <text class="poster-shell__footer">{{ detail.sign.sharePoster.footerText }}</text>
      </view>

      <view class="action-row">
        <button class="hero-button hero-button--primary" :loading="posterLoading" @tap="generatePoster">
          生成分享海报
        </button>
        <button class="hero-button hero-button--secondary" @tap="copySharePoster">
          复制海报文案
        </button>
      </view>

      <view v-if="poster" class="poster-result">
        <image class="poster-image" :src="poster.imageDataUrl" mode="widthFix" />
        <view class="action-row">
          <button class="hero-button hero-button--secondary" @tap="previewPoster">全屏预览</button>
          <button class="hero-button hero-button--primary" @tap="downloadPoster">{{ downloadLabel }}</button>
        </view>
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
import { generateLuckySignPoster } from '../../../api/posters';
import { fetchLuckySignDetail } from '../../../api/lucky';
import { getErrorMessage } from '../../../services/errors';
import type { GeneratedPoster } from '../../../types/poster';
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
    sharePoster: {
      themeName: 'fresh-mint',
      title: '今日幸运签',
      subtitle: '先把心绪放松一点，再做决定。',
      accentText: '先松一口气，再向前一步。',
      footerText: 'Fortune Hub · 今日幸运签',
    },
  },
};

const detail = ref<LuckySignDetailData>(fallbackDetail);
const poster = ref<GeneratedPoster | null>(null);
const posterLoading = ref(false);
const downloadLabel = ref('下载 SVG 海报');

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

function copySharePoster() {
  const lines = [
    detail.value.sign.sharePoster.title,
    detail.value.sign.sharePoster.subtitle,
    detail.value.sign.sharePoster.accentText,
    detail.value.sign.sharePoster.footerText,
  ].filter(Boolean);

  uni.setClipboardData({
    data: lines.join('\n'),
    success: () => {
      uni.showToast({
        title: '海报文案已复制',
        icon: 'success',
      });
    },
  });
}

async function generatePoster() {
  try {
    posterLoading.value = true;
    const response = await generateLuckySignPoster(detail.value.sign.bizCode);
    poster.value = response.data.poster;
    uni.showToast({
      title: '海报已生成',
      icon: 'success',
    });
  } catch (error) {
    console.warn('generate lucky sign poster failed', error);
    uni.showToast({
      title: getErrorMessage(error, '海报生成失败'),
      icon: 'none',
    });
  } finally {
    posterLoading.value = false;
  }
}

function previewPoster() {
  if (!poster.value) {
    return;
  }

  uni.previewImage({
    urls: [poster.value.imageDataUrl],
    current: poster.value.imageDataUrl,
  });
}

function downloadPoster() {
  if (!poster.value) {
    return;
  }

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const anchor = document.createElement('a');
    anchor.href = poster.value.imageDataUrl;
    anchor.download = poster.value.downloadFileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    uni.showToast({
      title: '已开始下载',
      icon: 'success',
    });
    return;
  }

  uni.setClipboardData({
    data: poster.value.svgMarkup,
    success: () => {
      downloadLabel.value = '已复制 SVG 源码';
      uni.showToast({
        title: '当前平台先支持复制 SVG',
        icon: 'none',
      });
    },
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
.info-card__label,
.section-meta {
  font-size: 20rpx;
  text-transform: uppercase;
  letter-spacing: 0.28em;
  color: var(--apple-subtle);
}

.title,
.section-title,
.poster-shell__title {
  font-size: 40rpx;
  font-weight: 700;
  color: var(--apple-text);
}

.tag-row,
.info-grid,
.action-row,
.poster-result {
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

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.poster-shell {
  display: grid;
  gap: 14rpx;
  padding: 24rpx;
  border-radius: 24rpx;
  background: linear-gradient(135deg, rgba(221, 243, 234, 0.92) 0%, rgba(239, 244, 248, 0.96) 100%);
}

.poster-shell__subtitle,
.poster-shell__footer {
  font-size: 26rpx;
  line-height: 1.7;
  color: var(--apple-muted);
}

.poster-shell__accent {
  font-size: 24rpx;
  color: #457d6a;
}

.poster-image {
  width: 100%;
  border-radius: 24rpx;
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
