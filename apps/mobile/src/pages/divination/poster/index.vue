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
      <view class="poster-nav">
        <text class="poster-nav__title">占卜结果</text>
        <text class="poster-nav__date">{{ poster.dateText }}</text>
      </view>

      <view class="poster-result-card">
        <view class="poster-result-card__head">
          <view class="poster-result-card__copy">
            <text class="poster-eyebrow">{{ poster.eyebrowText }}</text>
            <text class="poster-title-main">{{ poster.hexagramTitle }}</text>
            <text class="poster-meaning">{{ poster.meaning }}</text>
          </view>
          <text class="poster-level">{{ poster.level }}</text>
        </view>

        <view class="poster-hexagram-area">
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
          <view class="poster-hexagram-copy">
            <text class="poster-preview__symbol">{{ result.hexagram.symbol }}</text>
            <text class="poster-trigram">{{ poster.trigramText }}</text>
            <text class="poster-changed-button">{{ poster.changedButtonText }}</text>
          </view>
        </view>

        <view class="poster-casting-strip">
          <view v-for="item in poster.infoChips" :key="item.label" class="poster-casting-chip">
            <text class="poster-casting-chip__label">{{ item.label }}</text>
            <text class="poster-casting-chip__value">{{ item.value }}</text>
          </view>
        </view>
      </view>

      <view class="poster-oracle-card">
        <text class="poster-oracle-card__eyebrow">{{ poster.oracleTitle }}</text>
        <text class="poster-oracle-card__title">{{ poster.oracleSubject }}</text>
        <text class="poster-oracle-card__text">{{ poster.oracleSituation }}</text>
      </view>

      <view class="poster-panel-row">
        <view class="poster-panel">
          <text class="poster-panel__label">动爻</text>
          <text class="poster-panel__title">{{ poster.movingTitle }}</text>
          <text class="poster-panel__body">{{ poster.movingBody }}</text>
          <text class="poster-panel__advice">{{ poster.movingAdvice }}</text>
        </view>
        <view class="poster-panel">
          <text class="poster-panel__label">变卦</text>
          <text class="poster-panel__title">{{ poster.changedTitle }}</text>
          <text class="poster-panel__body">{{ poster.changedBody }}</text>
          <text class="poster-panel__advice">{{ poster.changedAdvice }}</text>
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
  height: 1138rpx;
  margin: 0 auto;
  overflow: hidden;
  border-radius: 22rpx;
  background: #fcf7ee;
  box-shadow: 0 28rpx 68rpx rgba(84, 64, 45, 0.12);
}

.poster-nav,
.poster-result-card,
.poster-oracle-card,
.poster-panel-row,
.poster-footer {
  position: absolute;
  left: 28rpx;
  right: 28rpx;
}

.poster-nav {
  top: 30rpx;
  display: grid;
  place-items: center;
}

.poster-nav__title {
  color: #181512;
  font-size: 27rpx;
  font-weight: 800;
}

.poster-nav__date {
  display: none;
}

.poster-result-card,
.poster-oracle-card,
.poster-panel {
  box-sizing: border-box;
  background: #ffffff;
  box-shadow: 0 12rpx 34rpx rgba(84, 64, 45, 0.06);
}

.poster-result-card {
  top: 104rpx;
  height: 415rpx;
  padding: 24rpx;
  border-radius: 26rpx;
}

.poster-result-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
}

.poster-result-card__copy {
  min-width: 0;
}

.poster-eyebrow,
.poster-title-main,
.poster-meaning,
.poster-level,
.poster-trigram,
.poster-changed-button,
.poster-casting-chip__label,
.poster-casting-chip__value,
.poster-oracle-card__eyebrow,
.poster-oracle-card__title,
.poster-oracle-card__text,
.poster-panel__label,
.poster-panel__title,
.poster-panel__body,
.poster-panel__advice,
.poster-footer__text,
.poster-footer__brand {
  display: block;
}

.poster-eyebrow {
  color: #8d73e6;
  font-size: 18rpx;
  font-weight: 700;
}

.poster-title-main {
  margin-top: 22rpx;
  color: #4b382a;
  font-size: 36rpx;
  font-weight: 800;
  line-height: 1.12;
}

.poster-meaning {
  margin-top: 16rpx;
  color: #8e8174;
  font-size: 18rpx;
}

.poster-level {
  flex: 0 0 auto;
  min-width: 56rpx;
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: #fff3d8;
  border: 1rpx solid rgba(216, 178, 103, 0.45);
  color: #b67c25;
  font-size: 18rpx;
  font-weight: 700;
  text-align: center;
}

.poster-hexagram-area {
  display: flex;
  align-items: center;
  gap: 48rpx;
  margin-top: 28rpx;
}

.poster-hexagram {
  display: grid;
  gap: 9rpx;
  width: 188rpx;
}

.poster-line {
  display: flex;
  gap: 23rpx;
  height: 12rpx;
}

.poster-line__segment {
  flex: 1;
  border-radius: 2rpx;
  background: #3e3345;
}

.poster-line:not(.poster-line--broken) .poster-line__segment:first-child {
  flex-basis: 100%;
}

.poster-line:not(.poster-line--broken) .poster-line__segment:last-child {
  display: none;
}

.poster-preview__symbol {
  color: #c9bdf1;
  font-family:
    'Songti SC',
    'STSong',
    serif;
  font-size: 34rpx;
  font-weight: 800;
  line-height: 1;
}

.poster-trigram {
  margin-top: 16rpx;
  color: #9a8b7d;
  font-size: 18rpx;
}

.poster-changed-button {
  min-width: 330rpx;
  margin-top: 16rpx;
  padding: 13rpx 24rpx;
  border-radius: 999rpx;
  background: #f1eef8;
  color: #8d73e6;
  font-size: 18rpx;
  font-weight: 700;
  text-align: center;
}

.poster-casting-strip {
  position: absolute;
  left: 24rpx;
  right: 24rpx;
  bottom: 20rpx;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10rpx;
}

.poster-casting-chip {
  min-width: 0;
  padding: 13rpx 16rpx;
  border-radius: 16rpx;
  background: #f6f2fa;
}

.poster-casting-chip__label {
  color: #a49a90;
  font-size: 13rpx;
}

.poster-casting-chip__value {
  margin-top: 6rpx;
  overflow: hidden;
  color: #4b382a;
  font-size: 17rpx;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.poster-oracle-card {
  top: 542rpx;
  height: 166rpx;
  padding: 26rpx 24rpx;
  border-radius: 22rpx;
}

.poster-oracle-card__eyebrow,
.poster-panel__label {
  color: #8d73e6;
  font-weight: 600;
}

.poster-oracle-card__eyebrow {
  font-size: 18rpx;
}

.poster-oracle-card__title {
  margin-top: 14rpx;
  overflow: hidden;
  color: #4b382a;
  font-size: 25rpx;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.poster-oracle-card__text {
  margin-top: 12rpx;
  overflow: hidden;
  color: #766a60;
  font-size: 19rpx;
  line-height: 1.35;
  display: -webkit-box;
  text-overflow: clip;
  white-space: normal;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.poster-panel-row {
  top: 736rpx;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18rpx;
}

.poster-panel {
  min-height: 270rpx;
  padding: 22rpx;
  border-radius: 22rpx;
}

.poster-panel__label {
  font-size: 18rpx;
}

.poster-panel__title {
  margin-top: 18rpx;
  overflow: hidden;
  color: #4b382a;
  font-size: 27rpx;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.poster-panel__body {
  display: -webkit-box;
  margin-top: 18rpx;
  overflow: hidden;
  color: #766a60;
  font-size: 19rpx;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
}

.poster-panel__advice {
  display: -webkit-box;
  margin-top: 16rpx;
  overflow: hidden;
  color: #8d73e6;
  font-size: 18rpx;
  line-height: 1.4;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.poster-footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24rpx;
  top: 1042rpx;
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
  color: #8d73e6;
  background: rgba(255, 249, 240, 0.9);
  font-size: 23rpx;
  border: 1rpx solid rgba(141, 115, 230, 0.18);
}

.poster-button--primary {
  grid-column: span 4;
  color: #ffffff;
  font-size: 27rpx;
  font-weight: 700;
  background: linear-gradient(135deg, #8d73e6, #a88deb);
  box-shadow: 0 14rpx 32rpx rgba(141, 115, 230, 0.24);
}

.poster-button[disabled] {
  opacity: 0.45;
}
</style>
