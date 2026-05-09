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

    <view v-if="poster" class="poster-preview">
      <view class="poster-preview__rule poster-preview__rule--left"></view>
      <view class="poster-preview__rule poster-preview__rule--right"></view>
      <view class="poster-corner poster-corner--tl"></view>
      <view class="poster-corner poster-corner--tr"></view>
      <view class="poster-corner poster-corner--bl"></view>
      <view class="poster-corner poster-corner--br"></view>

      <view class="poster-preview__header">
        <view>
          <text class="poster-preview__brand">FORTUNE HUB</text>
          <text class="poster-preview__eyebrow">今日占卜签</text>
        </view>
        <view class="poster-preview__date-group">
          <text class="poster-preview__date">{{ poster.dateText }}</text>
          <text class="poster-preview__serial">HEXAGRAM NO.{{ poster.hexagramNo }}</text>
        </view>
      </view>

      <view class="poster-preview__title-block">
        <view class="poster-preview__title-copy">
          <text class="poster-preview__name">{{ poster.title }}</text>
          <text class="poster-preview__meaning">{{ poster.meaning }}</text>
          <view class="poster-preview__meta">
            <text class="poster-preview__level">{{ poster.level }}</text>
            <text class="poster-preview__topic">{{ poster.topicLabel }} · {{ poster.movingText }}</text>
          </view>
        </view>
        <view class="poster-seal">
          <text>占</text>
          <text>签</text>
        </view>
      </view>

      <view class="poster-oracle">
        <view class="poster-oracle__left">
          <text class="poster-oracle__tag">本卦</text>
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
        </view>
        <view class="poster-oracle__right">
          <text class="poster-preview__symbol">{{ result.hexagram.symbol }}</text>
          <text class="poster-oracle__label">卦象关键词</text>
          <text class="poster-keywords">{{ poster.keywordText }}</text>
          <text class="poster-oracle__row">动爻 {{ poster.movingText }}</text>
          <text class="poster-oracle__row">后势 {{ poster.changedText }}</text>
        </view>
      </view>

      <view class="poster-score-row">
        <view v-for="item in poster.scoreMetrics" :key="item.key" class="poster-score">
          <text class="poster-score__label">{{ item.label }}</text>
          <view class="poster-score__number">
            <text class="poster-score__value">{{ item.value }}</text>
            <text class="poster-score__unit">/100</text>
          </view>
          <view class="poster-score__track">
            <view
              class="poster-score__fill"
              :style="{ width: `${item.value}%`, background: item.color }"
            ></view>
          </view>
        </view>
      </view>

      <view class="poster-summary">
        <text class="poster-summary__title">一句话结论</text>
        <text class="poster-sentence">{{ poster.summaryText }}</text>
      </view>

      <view class="poster-preview__bottom">
        <view class="poster-yi-ji">
          <text class="poster-yi-ji__label">宜</text>
          <text>{{ poster.suitableText }}</text>
        </view>
        <view class="poster-yi-ji poster-yi-ji--avoid">
          <text class="poster-yi-ji__label">忌</text>
          <text>{{ poster.avoidText }}</text>
        </view>
      </view>

      <view class="poster-footer">
        <view>
          <text class="poster-footer__text">长按识别，生成你的今日占卜</text>
          <text class="poster-footer__brand">Fortune Hub</text>
        </view>
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
  getDivinationResult,
  getOrCreateTodayDivinationResult,
} from '../../../services/divination';
import {
  buildDivinationPosterViewModel,
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
const poster = computed(() => (result.value ? buildDivinationPosterViewModel(result.value) : null));

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
    linear-gradient(110deg, rgba(160, 71, 53, 0.06), transparent 34%),
    linear-gradient(180deg, #f6eee2 0%, #f1eadf 56%, #edf2e9 100%);
  color: #35291f;
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
  background: rgba(255, 249, 240, 0.78);
  color: #35291f;
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
  color: rgba(53, 41, 31, 0.54);
}

.poster-preview {
  position: relative;
  box-sizing: border-box;
  width: 640rpx;
  height: 866rpx;
  margin: 0 auto;
  padding: 34rpx 40rpx 26rpx;
  overflow: hidden;
  border-radius: 18rpx;
  background:
    repeating-linear-gradient(0deg, rgba(118, 88, 55, 0.045) 0, rgba(118, 88, 55, 0.045) 1rpx, transparent 1rpx, transparent 42rpx),
    linear-gradient(180deg, #f8f0e3 0%, #f3ece2 56%, #edf2e9 100%);
  border: 1rpx solid rgba(118, 88, 55, 0.28);
  box-shadow: 0 28rpx 68rpx rgba(45, 58, 52, 0.18);
}

.poster-preview::before {
  position: absolute;
  inset: 24rpx;
  border: 1rpx solid rgba(118, 88, 55, 0.34);
  content: '';
  pointer-events: none;
}

.poster-preview__rule {
  position: absolute;
  top: 98rpx;
  bottom: 112rpx;
  width: 1rpx;
  pointer-events: none;
}

.poster-preview__rule--left {
  left: 38rpx;
  background: rgba(160, 71, 53, 0.56);
}

.poster-preview__rule--right {
  right: 38rpx;
  background: rgba(118, 88, 55, 0.2);
}

.poster-corner {
  position: absolute;
  width: 30rpx;
  height: 30rpx;
  border-color: rgba(118, 88, 55, 0.42);
  pointer-events: none;
}

.poster-corner--tl {
  left: 24rpx;
  top: 24rpx;
  border-left: 2rpx solid;
  border-top: 2rpx solid;
}

.poster-corner--tr {
  right: 24rpx;
  top: 24rpx;
  border-right: 2rpx solid;
  border-top: 2rpx solid;
}

.poster-corner--bl {
  left: 24rpx;
  bottom: 24rpx;
  border-left: 2rpx solid;
  border-bottom: 2rpx solid;
}

.poster-corner--br {
  right: 24rpx;
  bottom: 24rpx;
  border-right: 2rpx solid;
  border-bottom: 2rpx solid;
}

.poster-preview__header,
.poster-preview__title-block,
.poster-oracle,
.poster-score-row,
.poster-summary,
.poster-preview__bottom,
.poster-footer {
  position: absolute;
  z-index: 1;
}

.poster-preview__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  left: 66rpx;
  right: 66rpx;
  top: 58rpx;
}

.poster-preview__brand,
.poster-preview__eyebrow,
.poster-preview__date,
.poster-preview__serial,
.poster-preview__name,
.poster-preview__meaning,
.poster-preview__topic,
.poster-footer__text,
.poster-footer__brand {
  display: block;
}

.poster-preview__brand {
  font-size: 14rpx;
  color: #a04735;
  font-weight: 700;
  letter-spacing: 0;
}

.poster-preview__eyebrow {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #35291f;
  font-weight: 700;
}

.poster-preview__date-group {
  text-align: right;
}

.poster-preview__date {
  font-size: 18rpx;
  color: rgba(53, 41, 31, 0.64);
}

.poster-preview__serial {
  margin-top: 8rpx;
  font-size: 12rpx;
  color: #a04735;
  font-weight: 700;
}

.poster-preview__title-block {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
  left: 66rpx;
  right: 66rpx;
  top: 128rpx;
}

.poster-preview__title-copy {
  min-width: 0;
}

.poster-preview__name {
  font-size: 48rpx;
  font-weight: 800;
  font-family:
    'Songti SC',
    'STSong',
    'Noto Serif SC',
    serif;
  line-height: 1;
}

.poster-preview__meaning {
  margin-top: 12rpx;
  color: #6f6253;
  font-size: 18rpx;
}

.poster-preview__meta {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin-top: 14rpx;
}

.poster-preview__level {
  min-width: 60rpx;
  padding: 6rpx 16rpx;
  border-radius: 999rpx;
  background: #a04735;
  color: #fff6ea;
  font-size: 16rpx;
  font-weight: 700;
  text-align: center;
}

.poster-preview__topic {
  min-width: 0;
  color: #7a6a58;
  font-size: 17rpx;
  white-space: nowrap;
}

.poster-seal {
  display: grid;
  place-items: center;
  flex: 0 0 66rpx;
  width: 66rpx;
  height: 66rpx;
  margin-top: 2rpx;
  border: 3rpx solid rgba(160, 71, 53, 0.78);
  transform: rotate(-5deg);
}

.poster-seal text {
  color: #a04735;
  font-family:
    'Songti SC',
    'STSong',
    serif;
  font-size: 19rpx;
  font-weight: 800;
  line-height: 1;
}

.poster-oracle {
  display: grid;
  grid-template-columns: 1fr 1fr;
  box-sizing: border-box;
  gap: 28rpx;
  left: 66rpx;
  right: 66rpx;
  top: 258rpx;
  height: 193rpx;
  padding: 18rpx 28rpx;
  border-radius: 22rpx;
  background: #2d3a34;
  box-shadow: 0 16rpx 38rpx rgba(45, 58, 52, 0.18);
}

.poster-oracle__left,
.poster-oracle__right {
  position: relative;
}

.poster-oracle__tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 54rpx;
  height: 26rpx;
  border-radius: 999rpx;
  color: #eedcc4;
  background: rgba(250, 240, 220, 0.12);
  font-size: 14rpx;
  font-weight: 700;
}

.poster-hexagram {
  display: grid;
  gap: 10rpx;
  width: 208rpx;
  margin-top: 16rpx;
}

.poster-line {
  display: flex;
  gap: 36rpx;
  height: 10rpx;
}

.poster-line__segment {
  flex: 1;
  border-radius: 2rpx;
  background: #f6ecdd;
}

.poster-line:not(.poster-line--broken) .poster-line__segment:first-child {
  flex-basis: 100%;
}

.poster-line:not(.poster-line--broken) .poster-line__segment:last-child {
  display: none;
}

.poster-preview__symbol {
  position: absolute;
  right: 10rpx;
  top: 0;
  color: rgba(246, 236, 221, 0.08);
  font-family:
    'Songti SC',
    'STSong',
    serif;
  font-size: 94rpx;
  line-height: 1;
}

.poster-oracle__label {
  display: block;
  margin-top: 12rpx;
  color: #c69a5b;
  font-size: 16rpx;
  font-weight: 700;
}

.poster-keywords {
  display: block;
  margin-top: 14rpx;
  color: #fff6ea;
  font-size: 22rpx;
  font-weight: 700;
  line-height: 1.35;
}

.poster-oracle__row {
  display: block;
  margin-top: 10rpx;
  color: #f6ecdd;
  font-size: 16rpx;
}

.poster-score-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  left: 66rpx;
  right: 66rpx;
  top: 488rpx;
  padding: 16rpx 0;
  border-top: 1rpx solid rgba(118, 88, 55, 0.23);
  border-bottom: 1rpx solid rgba(118, 88, 55, 0.23);
}

.poster-score {
  min-width: 0;
  padding: 0 18rpx;
  text-align: center;
}

.poster-score + .poster-score {
  border-left: 1rpx solid rgba(118, 88, 55, 0.16);
}

.poster-score__label {
  color: #6f6253;
  font-size: 17rpx;
  font-weight: 700;
}

.poster-score__number {
  display: flex;
  align-items: baseline;
  justify-content: center;
  margin-top: 8rpx;
}

.poster-score__value {
  color: #35291f;
  font-size: 38rpx;
  font-weight: 800;
  line-height: 1;
}

.poster-score__unit {
  margin-left: 4rpx;
  color: #8b7b67;
  font-size: 14rpx;
}

.poster-score__track {
  position: relative;
  height: 8rpx;
  margin-top: 14rpx;
  overflow: hidden;
  border-radius: 999rpx;
  background: rgba(118, 88, 55, 0.12);
}

.poster-score__fill {
  height: 100%;
  border-radius: inherit;
}

.poster-summary {
  left: 66rpx;
  right: 66rpx;
  top: 618rpx;
  padding-left: 24rpx;
  border-left: 6rpx solid #a04735;
}

.poster-summary__title {
  display: block;
  color: #35291f;
  font-size: 21rpx;
  font-weight: 700;
}

.poster-sentence {
  display: block;
  margin-top: 14rpx;
  color: #5d5044;
  font-size: 22rpx;
  line-height: 1.36;
}

.poster-preview__bottom {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 26rpx;
  left: 66rpx;
  right: 66rpx;
  top: 732rpx;
}

.poster-yi-ji {
  display: flex;
  align-items: center;
  gap: 16rpx;
  min-height: 64rpx;
  padding: 14rpx 20rpx;
  border: 1rpx solid rgba(118, 88, 55, 0.14);
  border-radius: 18rpx;
  background: #eef4e9;
  color: #5d5044;
  font-size: 17rpx;
  line-height: 1.4;
}

.poster-yi-ji--avoid {
  background: #f8e8e2;
}

.poster-yi-ji__label {
  flex: 0 0 auto;
  color: #58735a;
  font-family:
    'Songti SC',
    'STSong',
    serif;
  font-size: 28rpx;
  font-weight: 800;
}

.poster-yi-ji--avoid .poster-yi-ji__label {
  color: #a04735;
}

.poster-footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24rpx;
  left: 66rpx;
  right: 66rpx;
  top: 788rpx;
  padding-top: 12rpx;
  border-top: 1rpx solid rgba(118, 88, 55, 0.23);
}

.poster-footer__text {
  color: #6f6253;
  font-size: 17rpx;
}

.poster-footer__brand {
  margin-top: 10rpx;
  color: #35291f;
  font-size: 24rpx;
  font-weight: 800;
}

.qr-placeholder {
  position: relative;
  flex: 0 0 70rpx;
  width: 70rpx;
  height: 70rpx;
  border: 1rpx solid rgba(118, 88, 55, 0.2);
  border-radius: 14rpx;
  background: #fff9f0;
}

.qr-cell {
  position: absolute;
  width: 7rpx;
  height: 7rpx;
  border-radius: 1rpx;
  background: #35291f;
}

.generated-image {
  display: block;
  width: 640rpx;
  margin: 22rpx auto 0;
  border-radius: 18rpx;
  box-shadow: 0 18rpx 42rpx rgba(45, 58, 52, 0.14);
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
  color: #a04735;
  background: rgba(255, 249, 240, 0.9);
  font-size: 23rpx;
  border: 1rpx solid rgba(160, 71, 53, 0.18);
}

.poster-button--primary {
  grid-column: span 4;
  color: #ffffff;
  font-size: 27rpx;
  font-weight: 700;
  background: linear-gradient(135deg, #a04735, #c69a5b);
  box-shadow: 0 14rpx 32rpx rgba(160, 71, 53, 0.22);
}

.poster-button[disabled] {
  opacity: 0.45;
}
</style>
