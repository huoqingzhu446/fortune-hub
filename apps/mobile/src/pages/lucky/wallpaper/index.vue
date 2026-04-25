<template>
  <view class="page" :style="themeVars">
    <view class="page-orb"></view>

    <view class="panel hero-panel">
      <text class="eyebrow">lucky wallpaper</text>
      <text class="title">{{ wallpaper?.title || activeTheme?.title || '幸运壁纸生成' }}</text>
      <text class="summary">
        {{ wallpaper?.guidance || '会根据当前幸运主题生成一张可预览的 SVG 壁纸。' }}
      </text>

      <view class="ratio-row">
        <view
          v-for="item in ratioOptions"
          :key="item.value"
          class="ratio-chip"
          :class="{ 'ratio-chip--active': aspectRatio === item.value }"
          @tap="switchAspectRatio(item.value)"
        >
          <text>{{ item.label }}</text>
        </view>
      </view>

      <view class="action-row">
        <button class="hero-button hero-button--primary" :loading="loading" @tap="loadWallpaper">
          重新生成
        </button>
        <button class="hero-button hero-button--secondary" @tap="copyPrompt">
          复制提示词
        </button>
      </view>
    </view>

    <view v-if="loading" class="panel empty-card">
      <text class="empty-card__title">正在生成壁纸...</text>
      <text class="empty-card__text">稍等一下，马上把今天的视觉主题铺开。</text>
    </view>

    <view v-else-if="wallpaper" class="panel">
      <text class="section-title">壁纸预览</text>
      <image class="wallpaper-preview" :src="wallpaper.imageDataUrl" mode="widthFix" />

      <view class="meta-grid">
        <view class="meta-card">
          <text class="meta-card__label">比例</text>
          <text class="meta-card__value">{{ wallpaper.aspectRatio }}</text>
        </view>
        <view class="meta-card">
          <text class="meta-card__label">尺寸</text>
          <text class="meta-card__value">{{ wallpaper.width }} × {{ wallpaper.height }}</text>
        </view>
      </view>

      <view class="tag-row">
        <text v-for="color in wallpaper.palette" :key="color" class="color-chip">
          {{ color }}
        </text>
      </view>

      <view class="action-row">
        <button class="hero-button hero-button--primary" @tap="downloadWallpaper">
          {{ downloadLabel }}
        </button>
        <button class="hero-button hero-button--secondary" @tap="previewWallpaper">
          全屏预览
        </button>
      </view>
    </view>

    <view v-else class="panel empty-card">
      <text class="empty-card__title">还没有选中主题</text>
      <text class="empty-card__text">先回到幸运物页挑一个壁纸方向，再回来生成。</text>
      <button class="hero-button hero-button--primary" @tap="goLucky">回到幸运物</button>
    </view>

    <view v-if="wallpaper" class="panel panel--soft">
      <text class="section-title">生成信息</text>
      <text class="body-text">{{ wallpaper.subtitle }}</text>
      <text class="body-text">Prompt：{{ wallpaper.prompt }}</text>
      <text class="helper-text">生成时间：{{ formatDateTime(wallpaper.generatedAt) }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';
import { ref } from 'vue';
import { generateLuckyWallpaper } from '../../../api/lucky';
import { useThemePreference } from '../../../composables/useThemePreference';
import { getLuckyWallpaperTheme } from '../../../services/lucky-wallpaper';
import type { LuckyWallpaperData, LuckyWallpaperTheme } from '../../../types/lucky';

type AspectRatio = '9:16' | '16:9' | '1:1';

const ratioOptions: Array<{ label: string; value: AspectRatio }> = [
  { label: '手机竖屏', value: '9:16' },
  { label: '桌面横屏', value: '16:9' },
  { label: '方形卡面', value: '1:1' },
];

const activeTheme = ref<LuckyWallpaperTheme | null>(null);
const wallpaper = ref<LuckyWallpaperData['wallpaper'] | null>(null);
const loading = ref(false);
const aspectRatio = ref<AspectRatio>('9:16');
const downloadLabel = ref('下载 SVG 壁纸');
const { themeVars } = useThemePreference();

async function loadWallpaper() {
  if (!activeTheme.value) {
    return;
  }

  try {
    loading.value = true;
    const response = await generateLuckyWallpaper({
      sourceBizCode: activeTheme.value.sourceBizCode,
      title: activeTheme.value.title,
      prompt: activeTheme.value.prompt,
      mood: activeTheme.value.mood,
      palette: activeTheme.value.palette,
      aspectRatio: aspectRatio.value,
    });
    wallpaper.value = response.data.wallpaper;
  } catch (error) {
    console.warn('generate lucky wallpaper failed', error);
    uni.showToast({
      title: '壁纸生成失败',
      icon: 'none',
    });
  } finally {
    loading.value = false;
  }
}

function switchAspectRatio(nextRatio: AspectRatio) {
  aspectRatio.value = nextRatio;
  if (wallpaper.value) {
    void loadWallpaper();
  }
}

function copyPrompt() {
  const prompt = wallpaper.value?.prompt || activeTheme.value?.prompt;

  if (!prompt) {
    uni.showToast({
      title: '还没有可复制的提示词',
      icon: 'none',
    });
    return;
  }

  uni.setClipboardData({
    data: prompt,
    success: () => {
      uni.showToast({
        title: '提示词已复制',
        icon: 'success',
      });
    },
  });
}

function previewWallpaper() {
  if (!wallpaper.value) {
    return;
  }

  uni.previewImage({
    urls: [wallpaper.value.imageDataUrl],
    current: wallpaper.value.imageDataUrl,
  });
}

function downloadWallpaper() {
  if (!wallpaper.value) {
    return;
  }

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const anchor = document.createElement('a');
    anchor.href = wallpaper.value.imageDataUrl;
    anchor.download = wallpaper.value.downloadFileName;
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
    data: wallpaper.value.svgMarkup,
    success: () => {
      downloadLabel.value = '已复制 SVG 源码';
      uni.showToast({
        title: '当前平台先支持复制 SVG',
        icon: 'none',
      });
    },
  });
}

function goLucky() {
  uni.navigateBack({
    fail: () => {
      uni.navigateTo({
        url: '/pages/lucky/index',
      });
    },
  });
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hour = `${date.getHours()}`.padStart(2, '0');
  const minute = `${date.getMinutes()}`.padStart(2, '0');
  return `${month}-${day} ${hour}:${minute}`;
}

onLoad(() => {
  activeTheme.value = getLuckyWallpaperTheme();
  if (activeTheme.value) {
    void loadWallpaper();
  }
});
</script>

<style lang="scss">
.page {
  min-height: 100vh;
  padding: 24rpx;
  background:
    radial-gradient(circle at top left, var(--theme-glow), transparent 24%),
    linear-gradient(180deg, var(--theme-page-top) 0%, var(--theme-page-bottom) 100%);
}

.page-orb {
  position: fixed;
  right: -90rpx;
  top: 40rpx;
  width: 320rpx;
  height: 320rpx;
  border-radius: 999rpx;
  background: rgba(125, 182, 255, 0.24);
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
.meta-card__label,
.helper-text {
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

.summary,
.body-text,
.empty-card__text,
.meta-card__value {
  font-size: 28rpx;
  line-height: 1.7;
  color: var(--apple-text);
}

.ratio-row,
.action-row,
.meta-grid,
.tag-row {
  display: grid;
  gap: 14rpx;
}

.ratio-row {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.action-row,
.meta-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.ratio-chip,
.meta-card,
.color-chip,
.empty-card {
  padding: 18rpx 20rpx;
  border-radius: 24rpx;
  background: rgba(246, 249, 252, 0.92);
  color: var(--apple-muted);
  text-align: center;
  font-size: 24rpx;
}

.ratio-chip--active {
  color: #ffffff;
  background: linear-gradient(135deg, var(--apple-blue) 0%, #7ba7ff 100%);
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

.wallpaper-preview {
  width: 100%;
  border-radius: 28rpx;
  box-shadow: 0 28rpx 60rpx rgba(84, 111, 143, 0.16);
  overflow: hidden;
}

.tag-row {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.color-chip {
  color: var(--apple-text);
}

.empty-card__title {
  font-size: 28rpx;
  color: var(--apple-text);
}
</style>
