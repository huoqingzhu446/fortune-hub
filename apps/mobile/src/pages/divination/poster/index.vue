<template>
  <view v-if="result" class="poster-page">
    <view class="poster-head">
      <button class="back-button" @tap="back">‹</button>
      <view>
        <text class="poster-title">分享海报</text>
        <text class="poster-size">{{ posterWidth }} × {{ posterHeight }}</text>
      </view>
      <view class="top-spacer"></view>
    </view>

    <view class="poster-preview">
      <view class="poster-preview__ornament poster-preview__ornament--left"></view>
      <view class="poster-preview__ornament poster-preview__ornament--right"></view>
      <view class="poster-preview__header">
        <text class="poster-preview__eyebrow">今日占卜结果</text>
        <text class="poster-preview__date">{{ dateText }}</text>
      </view>
      <view class="poster-preview__main">
        <text class="poster-preview__name">{{ result.hexagram.name }}</text>
        <view class="poster-hexagram">
          <view
            v-for="(solid, index) in displayLines"
            :key="index"
            class="poster-line"
            :class="{ 'poster-line--broken': !solid }"
          >
            <view class="poster-line__segment"></view>
            <view class="poster-line__segment"></view>
          </view>
        </view>
        <text class="poster-preview__symbol">{{ result.hexagram.symbol }}</text>
      </view>
      <view class="poster-preview__content">
        <view class="poster-index">
          <text class="poster-index__value">{{ result.scores.overall }}</text>
          <text class="poster-index__label">综合指数</text>
        </view>
        <view class="poster-summary">
          <text class="poster-keywords">{{ result.keywords.join(' · ') }}</text>
          <text class="poster-sentence">{{ result.summary }}</text>
        </view>
      </view>
      <view class="poster-preview__bottom">
        <view class="poster-yi-ji">
          <text class="poster-yi-ji__label">宜</text>
          <text>{{ result.suitable.slice(0, 3).join('、') }}</text>
        </view>
        <view class="poster-yi-ji poster-yi-ji--avoid">
          <text class="poster-yi-ji__label">忌</text>
          <text>{{ result.avoid.slice(0, 3).join('、') }}</text>
        </view>
      </view>
      <view class="poster-footer">
        <text>长按识别，生成你的今日占卜</text>
        <view class="qr-placeholder">
          <view v-for="cell in qrCells" :key="cell" class="qr-cell" :style="qrStyle(cell)"></view>
        </view>
      </view>
    </view>

    <image v-if="posterPath" class="generated-image" :src="posterPath" mode="widthFix" @tap="previewPoster" />

    <view class="poster-actions">
      <button class="poster-button poster-button--primary" :loading="generating" @tap="generatePoster">
        {{ posterPath ? '重新生成高清海报' : '生成高清海报' }}
      </button>
      <button class="poster-button" :disabled="!posterPath" @tap="previewPoster">预览</button>
      <button class="poster-button" :disabled="!posterPath" @tap="savePoster">保存</button>
      <button v-if="isMpWeixin" class="poster-button" :disabled="!posterPath" @tap="sharePoster">发送</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import {
  formatDivinationDate,
  getDivinationResult,
  getOrCreateTodayDivinationResult,
} from '../../../services/divination';
import {
  DIVINATION_POSTER_HEIGHT,
  DIVINATION_POSTER_WIDTH,
  generateDivinationSharePoster,
  getWechatPosterRuntime,
} from '../../../services/divination-poster';
import type { DivinationResult } from '../../../types/divination';

const result = ref<DivinationResult | null>(null);
const posterPath = ref('');
const generating = ref(false);
const posterWidth = DIVINATION_POSTER_WIDTH;
const posterHeight = DIVINATION_POSTER_HEIGHT;
const isMpWeixin = String((uni.getSystemInfoSync() as { uniPlatform?: string }).uniPlatform || '').toLowerCase() === 'mp-weixin';
const qrCells = [0, 1, 2, 8, 10, 16, 17, 18, 5, 6, 7, 13, 15, 21, 22, 23, 40, 41, 42, 48, 50, 56, 57, 58, 36, 38, 43, 53, 63];

const displayLines = computed(() => {
  if (!result.value) {
    return [];
  }

  return [...result.value.hexagram.lines].reverse();
});

const dateText = computed(() => (result.value ? formatDivinationDate(result.value.createdAt) : ''));

function qrStyle(cell: number) {
  const x = cell % 8;
  const y = Math.floor(cell / 8);
  return {
    left: `${x * 12.5}%`,
    top: `${y * 12.5}%`,
  };
}

async function generatePoster() {
  if (!result.value || generating.value) {
    return;
  }

  generating.value = true;

  try {
    const file = await generateDivinationSharePoster(result.value);
    posterPath.value = file.tempFilePath;
    uni.showToast({
      title: '海报已生成',
      icon: 'success',
    });
  } catch (error) {
    console.warn('generate divination poster failed', error);
    uni.showToast({
      title: error instanceof Error ? error.message : '海报生成失败',
      icon: 'none',
    });
  } finally {
    generating.value = false;
  }
}

function previewPoster() {
  if (!posterPath.value) {
    uni.showToast({
      title: '请先生成海报',
      icon: 'none',
    });
    return;
  }

  uni.previewImage({
    urls: [posterPath.value],
    current: posterPath.value,
  });
}

function savePoster() {
  if (!posterPath.value) {
    uni.showToast({
      title: '请先生成海报',
      icon: 'none',
    });
    return;
  }

  uni.saveImageToPhotosAlbum({
    filePath: posterPath.value,
    success: () => {
      uni.showToast({
        title: '已保存',
        icon: 'success',
      });
    },
    fail: (error) => {
      console.warn('save divination poster failed', error);
      uni.showToast({
        title: '保存失败，请检查相册权限',
        icon: 'none',
      });
    },
  });
}

function sharePoster() {
  if (!posterPath.value) {
    uni.showToast({
      title: '请先生成海报',
      icon: 'none',
    });
    return;
  }

  const wxRuntime = getWechatPosterRuntime();

  if (typeof wxRuntime?.showShareImageMenu !== 'function') {
    uni.showToast({
      title: '当前微信版本暂不支持直接发送图片',
      icon: 'none',
    });
    return;
  }

  wxRuntime.showShareImageMenu({
    path: posterPath.value,
    fail: (error) => {
      console.warn('share divination poster failed', error);
      uni.showToast({
        title: '发送失败，请先保存到相册',
        icon: 'none',
      });
    },
  });
}

function back() {
  uni.navigateBack();
}

onLoad((query) => {
  const id = String(query?.id || '');
  result.value = getDivinationResult(id) || getOrCreateTodayDivinationResult();
});
</script>

<style lang="scss">
.poster-page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: calc(env(safe-area-inset-top) + 24rpx) 24rpx 70rpx;
  background:
    radial-gradient(circle at 80% 6%, rgba(216, 166, 78, 0.16), transparent 28%),
    linear-gradient(180deg, #fff9ef 0%, #f6efff 52%, #fffaf0 100%);
  color: #4e3825;
}

.poster-head {
  display: grid;
  grid-template-columns: 64rpx 1fr 64rpx;
  align-items: center;
  margin-bottom: 24rpx;
}

.back-button,
.poster-button {
  padding: 0;
  margin: 0;
}

.back-button::after,
.poster-button::after {
  border: 0;
}

.back-button {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.72);
  color: #4e3825;
  font-size: 46rpx;
  line-height: 54rpx;
}

.poster-title,
.poster-size {
  display: block;
  text-align: center;
}

.poster-title {
  font-size: 34rpx;
  font-weight: 700;
}

.poster-size {
  margin-top: 4rpx;
  font-size: 21rpx;
  color: rgba(78, 56, 37, 0.52);
}

.poster-preview {
  position: relative;
  box-sizing: border-box;
  width: 620rpx;
  min-height: 1102rpx;
  margin: 0 auto;
  padding: 48rpx 42rpx 38rpx;
  overflow: hidden;
  border-radius: 34rpx;
  background:
    radial-gradient(circle at 20% 14%, rgba(139, 111, 214, 0.2), transparent 28%),
    radial-gradient(circle at 82% 10%, rgba(216, 166, 78, 0.2), transparent 24%),
    linear-gradient(180deg, #fff9ef 0%, #f2eaff 54%, #fff7ea 100%);
  border: 1rpx solid rgba(216, 166, 78, 0.28);
  box-shadow: 0 24rpx 60rpx rgba(80, 60, 120, 0.14);
}

.poster-preview__ornament {
  position: absolute;
  border: 1rpx solid rgba(216, 166, 78, 0.3);
  border-radius: 50%;
  pointer-events: none;
}

.poster-preview__ornament--left {
  left: -90rpx;
  top: 120rpx;
  width: 220rpx;
  height: 120rpx;
}

.poster-preview__ornament--right {
  right: -86rpx;
  bottom: 160rpx;
  width: 220rpx;
  height: 120rpx;
}

.poster-preview__header,
.poster-preview__content,
.poster-preview__bottom,
.poster-footer,
.poster-preview__main {
  position: relative;
  z-index: 1;
}

.poster-preview__header,
.poster-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.poster-preview__eyebrow {
  font-size: 24rpx;
  color: #8b6fd6;
  font-weight: 700;
}

.poster-preview__date {
  font-size: 22rpx;
  color: rgba(78, 56, 37, 0.58);
}

.poster-preview__main {
  display: grid;
  justify-items: center;
  gap: 24rpx;
  margin-top: 62rpx;
}

.poster-preview__name {
  font-size: 48rpx;
  font-weight: 800;
  font-family:
    'Iowan Old Style',
    'Times New Roman',
    'Noto Serif SC',
    serif;
}

.poster-hexagram {
  display: grid;
  gap: 13rpx;
  width: 210rpx;
}

.poster-line {
  display: flex;
  gap: 28rpx;
  height: 18rpx;
}

.poster-line__segment {
  flex: 1;
  border-radius: 999rpx;
  background: #3d3342;
}

.poster-line:not(.poster-line--broken) .poster-line__segment:first-child {
  flex-basis: 100%;
}

.poster-line:not(.poster-line--broken) .poster-line__segment:last-child {
  display: none;
}

.poster-preview__symbol {
  position: absolute;
  right: 18rpx;
  top: 78rpx;
  color: rgba(139, 111, 214, 0.14);
  font-size: 150rpx;
}

.poster-preview__content {
  display: flex;
  gap: 22rpx;
  margin-top: 64rpx;
  padding: 28rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.78);
}

.poster-index {
  display: grid;
  justify-items: center;
  align-content: center;
  flex: 0 0 128rpx;
  height: 128rpx;
  border-radius: 50%;
  background: conic-gradient(#8b6fd6 295deg, rgba(139, 111, 214, 0.12) 0deg);
  color: #4e3825;
}

.poster-index__value {
  font-size: 42rpx;
  font-weight: 800;
}

.poster-index__label {
  font-size: 19rpx;
  color: rgba(78, 56, 37, 0.58);
}

.poster-summary {
  display: grid;
  gap: 12rpx;
  flex: 1;
  min-width: 0;
}

.poster-keywords {
  font-size: 23rpx;
  color: #8b6fd6;
  font-weight: 700;
}

.poster-sentence {
  font-size: 24rpx;
  line-height: 1.6;
  color: rgba(78, 56, 37, 0.7);
}

.poster-preview__bottom {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18rpx;
  margin-top: 24rpx;
}

.poster-yi-ji {
  display: grid;
  gap: 10rpx;
  min-height: 102rpx;
  padding: 20rpx;
  border-radius: 22rpx;
  background: #f2f8ed;
  color: rgba(78, 56, 37, 0.68);
  font-size: 22rpx;
  line-height: 1.4;
}

.poster-yi-ji--avoid {
  background: #fff0ea;
}

.poster-yi-ji__label {
  color: #4f7c5a;
  font-size: 26rpx;
  font-weight: 800;
}

.poster-yi-ji--avoid .poster-yi-ji__label {
  color: #b75a4f;
}

.poster-footer {
  margin-top: 42rpx;
  font-size: 21rpx;
  color: rgba(78, 56, 37, 0.58);
}

.qr-placeholder {
  position: relative;
  flex: 0 0 94rpx;
  width: 94rpx;
  height: 94rpx;
  padding: 10rpx;
  border-radius: 18rpx;
  background: #ffffff;
}

.qr-cell {
  position: absolute;
  width: 10rpx;
  height: 10rpx;
  border-radius: 2rpx;
  background: #4e3825;
}

.generated-image {
  display: block;
  width: 620rpx;
  margin: 22rpx auto 0;
  border-radius: 28rpx;
  box-shadow: 0 18rpx 42rpx rgba(80, 60, 120, 0.12);
}

.poster-actions {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12rpx;
  margin-top: 24rpx;
}

.poster-button {
  display: grid;
  place-items: center;
  height: 72rpx;
  border-radius: 999rpx;
  color: #8b6fd6;
  background: rgba(255, 255, 255, 0.86);
  font-size: 23rpx;
  border: 1rpx solid rgba(139, 111, 214, 0.18);
}

.poster-button--primary {
  grid-column: span 4;
  color: #ffffff;
  font-size: 27rpx;
  font-weight: 700;
  background: linear-gradient(135deg, #8b6fd6, #b898f0);
  box-shadow: 0 14rpx 32rpx rgba(139, 111, 214, 0.24);
}

.poster-button[disabled] {
  opacity: 0.45;
}
</style>
