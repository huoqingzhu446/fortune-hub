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

    <view v-if="poster" class="poster-preview poster-preview--template">
      <image
        class="poster-template-image"
        src="/static/posters/divination-share-template.png"
        mode="aspectFill"
      />

      <view class="template-hexagram">
        <view
          v-for="(line, index) in poster.result.hexagramLines"
          :key="index"
          class="template-line"
          :class="{
            'template-line--broken': line.type === 'broken',
            'template-line--active': line.active,
          }"
        >
          <view class="template-line__segment"></view>
          <view class="template-line__segment"></view>
        </view>
      </view>

      <text class="template-text template-method">{{ posterMethodText }}</text>
      <text class="template-text template-hexagram-name">{{ poster.result.name }}</text>
      <text class="template-text template-subtitle">{{ poster.result.subtitle }}</text>
      <text class="template-text template-level">{{ poster.result.luckyLevel }}</text>
      <text class="template-text template-trigram">{{ poster.result.trigramNote }}</text>
      <text class="template-text template-moving">{{ posterMovingText }}</text>
      <text class="template-text template-changed">{{ posterChangedName }}</text>
      <text class="template-text template-question">{{ poster.question.text }}</text>
      <text class="template-text template-summary">{{ poster.question.summary }}</text>

      <view class="template-keywords">
        <text
          v-for="(keyword, index) in templateKeywords"
          :key="`${index}-${keyword}`"
          class="template-keyword"
        >
          {{ keyword }}
        </text>
      </view>

      <view class="template-advice">
        <view v-for="(row, index) in templateAdviceRows" :key="index" class="template-advice__row">
          <text class="template-advice__label">{{ row.label }}</text>
          <text class="template-advice__text">{{ row.text }}</text>
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
  buildDivinationPosterData,
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

const poster = computed(() => (result.value ? buildDivinationPosterData(result.value) : null));
const posterMethodText = computed(() => findPosterChipValue('起法', poster.value?.methodLabel || '略筮法'));
const posterMovingText = computed(() => findPosterChipValue('动爻', '动爻未显'));
const posterChangedName = computed(() => findPosterChipValue('变卦', '本卦不变'));
const templateKeywords = computed(() => {
  if (!poster.value) {
    return [];
  }

  return [
    poster.value.question.tag,
    poster.value.result.trigramNote,
    posterMovingText.value,
    posterChangedName.value,
  ];
});
const templateAdviceRows = computed(() => {
  if (!poster.value) {
    return [];
  }

  const [first, second] = poster.value.analysisCards;

  return [
    {
      label: first ? `${first.title}提示` : '当下提示',
      text: first?.actionText || first?.content || poster.value.result.subtitle,
    },
    {
      label: second ? `${second.title}提示` : '趋势提示',
      text: second?.actionText || second?.content || poster.value.question.summary,
    },
    {
      label: '今日取舍',
      text: poster.value.question.summary || poster.value.result.subtitle,
    },
  ];
});

function findPosterChipValue(label: string, fallback: string) {
  return poster.value?.chips.find((item) => item.label === label)?.value || fallback;
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

.poster-preview {
  border-radius: 28rpx;
  background:
    radial-gradient(circle at 50% 10%, rgba(255, 255, 255, 0.46), transparent 26%),
    radial-gradient(circle at 88% 23%, rgba(141, 117, 244, 0.1), transparent 24%),
    radial-gradient(circle at 18% 81%, rgba(216, 169, 77, 0.11), transparent 26%),
    linear-gradient(180deg, #f8f0e5 0%, #f7ede0 55%, #efe3d3 100%);
  box-shadow: 0 28rpx 68rpx rgba(86, 61, 36, 0.14);
}

.poster-glow {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.poster-glow--top {
  top: -70rpx;
  left: 145rpx;
  width: 350rpx;
  height: 350rpx;
  background: rgba(255, 255, 255, 0.26);
}

.poster-glow--side {
  top: 210rpx;
  right: -90rpx;
  width: 250rpx;
  height: 250rpx;
  background: rgba(141, 117, 244, 0.08);
}

.poster-glow--bottom {
  left: -82rpx;
  bottom: 118rpx;
  width: 300rpx;
  height: 300rpx;
  background: rgba(216, 169, 77, 0.1);
}

.poster-sun {
  position: absolute;
  top: 92rpx;
  left: 50%;
  width: 340rpx;
  height: 110rpx;
  border-top: 2rpx solid rgba(216, 169, 77, 0.24);
  border-radius: 340rpx 340rpx 0 0;
  transform: translateX(-50%);
}

.poster-sun__ray {
  position: absolute;
  left: 50%;
  bottom: 5rpx;
  width: 1rpx;
  background: rgba(216, 169, 77, 0.15);
  transform-origin: center bottom;
}

.poster-nav {
  top: 49rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32rpx;
}

.poster-nav__title {
  color: #3f3028;
  font-family:
    'Songti SC',
    'STSong',
    serif;
  font-size: 35rpx;
  font-weight: 800;
}

.poster-nav__spark {
  color: #d8a94d;
  font-size: 18rpx;
}

.poster-result-card,
.poster-oracle-card,
.poster-panel {
  background: rgba(255, 253, 248, 0.94);
  border: 1rpx solid rgba(216, 169, 77, 0.25);
  box-shadow: 0 14rpx 36rpx rgba(86, 61, 36, 0.11);
}

.poster-result-card {
  top: 151rpx;
  left: 38rpx;
  right: 38rpx;
  height: 469rpx;
  padding: 30rpx 33rpx;
  border-radius: 25rpx;
}

.poster-result-card__head {
  align-items: center;
  gap: 24rpx;
}

.poster-method {
  display: flex;
  align-items: center;
  gap: 14rpx;
  min-width: 0;
}

.poster-method__icon {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 28rpx;
  height: 28rpx;
  border-radius: 50%;
  background: rgba(141, 117, 244, 0.18);
  color: #8d75f4;
  font-size: 18rpx;
}

.poster-eyebrow {
  overflow: hidden;
  color: #8d75f4;
  font-size: 20rpx;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.poster-title-main {
  margin-top: 36rpx;
  color: #3f3028;
  font-family:
    'Songti SC',
    'STSong',
    serif;
  font-size: 42rpx;
  line-height: 1.1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.poster-meaning {
  margin-top: 20rpx;
  color: #7b6b60;
  font-family:
    'Songti SC',
    'STSong',
    serif;
  font-size: 23rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.poster-level {
  display: grid;
  place-items: center;
  width: 61rpx;
  min-width: 61rpx;
  height: 61rpx;
  padding: 0;
  border: 2rpx solid rgba(216, 169, 77, 0.72);
  border-radius: 50%;
  background: #fff2d8;
  color: #b67a1a;
  font-family:
    'Songti SC',
    'STSong',
    serif;
  font-size: 20rpx;
}

.poster-divider {
  width: 122rpx;
  height: 1rpx;
  margin: 13rpx 0 0 116rpx;
  background: rgba(216, 169, 77, 0.32);
}

.poster-divider--small {
  width: 95rpx;
  margin: 20rpx auto 0;
}

.poster-hexagram-area {
  justify-content: space-between;
  gap: 46rpx;
  margin-top: 52rpx;
}

.poster-hexagram {
  flex: 0 0 204rpx;
  gap: 16rpx;
  width: 204rpx;
}

.poster-line {
  gap: 49rpx;
  height: 12rpx;
}

.poster-line__segment {
  border-radius: 999rpx;
  background: #3f3448;
}

.poster-line--active .poster-line__segment {
  background: #8d75f4;
}

.poster-trigram-note {
  display: flex;
  flex: 0 0 177rpx;
  flex-direction: column;
  align-items: center;
}

.poster-trigram-note__seal {
  display: grid;
  place-items: center;
  width: 92rpx;
  height: 92rpx;
  border: 1rpx solid rgba(216, 169, 77, 0.36);
  border-radius: 50%;
  background: rgba(141, 117, 244, 0.12);
  gap: 4rpx;
}

.poster-trigram-note__mark {
  width: 40rpx;
  height: 4rpx;
  border-radius: 999rpx;
  background: rgba(141, 117, 244, 0.72);
}

.poster-trigram {
  margin-top: 18rpx;
  color: #3f3028;
  font-family:
    'Songti SC',
    'STSong',
    serif;
  font-size: 20rpx;
  font-weight: 600;
  text-align: center;
}

.poster-casting-strip {
  left: 33rpx;
  right: 33rpx;
  bottom: 29rpx;
  gap: 16rpx;
}

.poster-casting-chip {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  height: 52rpx;
  gap: 12rpx;
  padding: 9rpx 13rpx;
  border: 1rpx solid rgba(216, 169, 77, 0.18);
  border-radius: 12rpx;
  background: rgba(255, 255, 255, 0.62);
}

.poster-casting-chip__icon {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
  background: rgba(141, 117, 244, 0.16);
  color: #8d75f4;
  font-size: 14rpx;
  font-weight: 700;
}

.poster-casting-chip__label {
  color: #a39387;
}

.poster-casting-chip__value {
  margin-top: 2rpx;
  color: #3f3028;
}

.poster-oracle-card {
  top: 640rpx;
  left: 38rpx;
  right: 38rpx;
  height: 133rpx;
  padding: 23rpx 29rpx;
  border-color: rgba(255, 255, 255, 0.72);
  border-radius: 19rpx;
  overflow: hidden;
}

.poster-oracle-card__eyebrow {
  display: inline-flex;
  position: absolute;
  top: 22rpx;
  left: 29rpx;
  width: fit-content;
  padding: 6rpx 15rpx;
  border-radius: 10rpx;
  background: linear-gradient(90deg, #8d75f4, #bfa8ff);
  color: #ffffff;
  font-size: 16rpx;
  font-weight: 800;
}

.poster-oracle-card__title {
  position: absolute;
  top: 58rpx;
  left: 29rpx;
  right: 110rpx;
  margin-top: 0;
  color: #3f3028;
  font-family:
    'Songti SC',
    'STSong',
    serif;
  font-size: 27rpx;
}

.poster-oracle-card__text {
  position: absolute;
  top: 94rpx;
  left: 29rpx;
  right: 29rpx;
  display: block;
  margin-top: 0;
  white-space: nowrap;
  color: #7b6b60;
  font-size: 17rpx;
  text-overflow: ellipsis;
}

.poster-bamboo {
  position: absolute;
  top: 29rpx;
  right: 42rpx;
  width: 72rpx;
  height: 80rpx;
  border-left: 2rpx solid rgba(141, 117, 244, 0.13);
  border-radius: 50%;
  transform: rotate(18deg);
}

.poster-panel-row {
  top: 794rpx;
  left: 38rpx;
  right: 38rpx;
  gap: 20rpx;
}

.poster-panel {
  box-sizing: border-box;
  height: 234rpx;
  min-height: 0;
  padding: 23rpx;
  border-color: rgba(255, 255, 255, 0.74);
  border-radius: 19rpx;
}

.poster-panel__head {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.poster-panel__icon {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 39rpx;
  height: 39rpx;
  border-radius: 50%;
  background: rgba(141, 117, 244, 0.18);
  color: #8d75f4;
  font-size: 20rpx;
  font-weight: 800;
}

.poster-panel__label {
  color: #8d75f4;
  font-size: 18rpx;
}

.poster-panel__title {
  margin-top: 4rpx;
  color: #3f3028;
  font-family:
    'Songti SC',
    'STSong',
    serif;
  font-size: 27rpx;
}

.poster-panel__body {
  margin-top: 20rpx;
  color: #7b6b60;
  font-size: 17rpx;
  line-height: 1.44;
  -webkit-line-clamp: 3;
}

.poster-panel__advice {
  margin-top: 12rpx;
  color: #8d75f4;
  font-size: 17rpx;
  font-weight: 700;
  -webkit-line-clamp: 1;
}

.poster-footer {
  top: 1043rpx;
  left: 38rpx;
  right: 38rpx;
  align-items: center;
  gap: 16rpx;
}

.poster-brand-badge {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 44rpx;
  height: 44rpx;
  border: 1rpx solid rgba(141, 117, 244, 0.45);
  border-radius: 50%;
  background: rgba(141, 117, 244, 0.12);
  color: #5f47b8;
  font-size: 20rpx;
}

.poster-footer__copy {
  flex: 1;
  min-width: 0;
}

.poster-footer__text {
  color: #7b6b60;
  font-size: 16rpx;
}

.poster-footer__brand {
  margin-top: 7rpx;
  color: #3f3028;
  font-family: Georgia, 'Songti SC', serif;
  font-size: 29rpx;
}

.qr-placeholder {
  flex: 0 0 87rpx;
  width: 87rpx;
  height: 87rpx;
  border: 1rpx solid rgba(216, 169, 77, 0.25);
  border-radius: 15rpx;
  background: #ffffff;
  box-shadow: 0 6rpx 18rpx rgba(86, 61, 36, 0.14);
}

.qr-cell {
  width: 8rpx;
  height: 8rpx;
  border-radius: 2rpx;
  background: #3f3028;
}

.poster-method {
  position: absolute;
  top: 37rpx;
  left: 33rpx;
  width: 390rpx;
}

.poster-level {
  position: absolute;
  top: 30rpx;
  right: 33rpx;
}

.poster-title-main {
  position: absolute;
  top: 90rpx;
  left: 33rpx;
  right: 122rpx;
  margin-top: 0;
}

.poster-meaning {
  position: absolute;
  top: 162rpx;
  left: 33rpx;
  right: 174rpx;
  margin-top: 0;
}

.poster-result-card > .poster-divider {
  position: absolute;
  top: 177rpx;
  left: 149rpx;
  margin: 0;
}

.poster-hexagram-area {
  position: absolute;
  top: 216rpx;
  left: 40rpx;
  right: 33rpx;
  margin-top: 0;
}

.poster-oracle-card__text {
  -webkit-line-clamp: 1;
}

.poster-casting-strip {
  z-index: 2;
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

.poster-preview--template {
  padding: 0;
  border-radius: 28rpx;
  background: #fbf2e7;
}

.poster-template-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.template-text {
  position: absolute;
  z-index: 1;
  display: block;
  overflow: hidden;
  color: #3f3028;
  font-family:
    'PingFang SC',
    'Microsoft YaHei',
    sans-serif;
  letter-spacing: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.template-method {
  top: 243rpx;
  left: 214rpx;
  width: 121rpx;
  color: #a39387;
  font-size: 16rpx;
  font-weight: 600;
}

.template-hexagram-name {
  top: 303rpx;
  left: 220rpx;
  width: 121rpx;
  font-family:
    'Songti SC',
    'STSong',
    serif;
  font-size: 23rpx;
  font-weight: 800;
}

.template-subtitle {
  top: 405rpx;
  left: 118rpx;
  display: -webkit-box;
  width: 184rpx;
  color: #7b6b60;
  font-family:
    'Songti SC',
    'STSong',
    serif;
  font-size: 16rpx;
  line-height: 1.45;
  white-space: normal;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.template-level {
  top: 265rpx;
  left: 498rpx;
  width: 65rpx;
  color: #b67a1a;
  font-family:
    'Songti SC',
    'STSong',
    serif;
  font-size: 19rpx;
  font-weight: 800;
  text-align: center;
}

.template-hexagram {
  position: absolute;
  z-index: 1;
  top: 337rpx;
  left: 375rpx;
  display: grid;
  width: 143rpx;
  gap: 12rpx;
}

.template-line {
  display: flex;
  gap: 33rpx;
  height: 8rpx;
}

.template-line__segment {
  flex: 1;
  border-radius: 999rpx;
  background: #3f3448;
}

.template-line:not(.template-line--broken) .template-line__segment:first-child {
  flex-basis: 100%;
}

.template-line:not(.template-line--broken) .template-line__segment:last-child {
  display: none;
}

.template-line--active .template-line__segment {
  background: #8d75f4;
}

.template-trigram {
  top: 459rpx;
  left: 361rpx;
  width: 170rpx;
  color: #7b6b60;
  font-family:
    'Songti SC',
    'STSong',
    serif;
  font-size: 15rpx;
  font-weight: 600;
  text-align: center;
}

.template-moving {
  top: 526rpx;
  left: 170rpx;
  width: 65rpx;
  font-size: 17rpx;
  font-weight: 800;
}

.template-changed {
  top: 526rpx;
  left: 385rpx;
  width: 76rpx;
  font-size: 17rpx;
  font-weight: 800;
}

.template-question {
  top: 671rpx;
  left: 216rpx;
  width: 335rpx;
  font-family:
    'Songti SC',
    'STSong',
    serif;
  font-size: 18rpx;
  font-weight: 800;
}

.template-summary {
  top: 703rpx;
  left: 216rpx;
  display: -webkit-box;
  width: 335rpx;
  color: #7b6b60;
  font-size: 15rpx;
  line-height: 1.45;
  white-space: normal;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.template-keywords {
  position: absolute;
  z-index: 1;
  top: 733rpx;
  left: 194rpx;
  display: grid;
  width: 376rpx;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12rpx;
}

.template-keyword {
  display: block;
  overflow: hidden;
  color: #5f47b8;
  font-size: 12rpx;
  font-weight: 700;
  line-height: 26rpx;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.template-advice {
  position: absolute;
  z-index: 1;
  top: 846rpx;
  left: 0;
  right: 0;
}

.template-advice__row {
  position: relative;
  height: 48rpx;
}

.template-advice__label,
.template-advice__text {
  position: absolute;
  top: 0;
  display: block;
  overflow: hidden;
  line-height: 30rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.template-advice__label {
  left: 124rpx;
  width: 106rpx;
  color: #5f47b8;
  font-size: 16rpx;
  font-weight: 800;
}

.template-advice__text {
  left: 272rpx;
  width: 254rpx;
  color: #7b6b60;
  font-size: 16rpx;
}
</style>
