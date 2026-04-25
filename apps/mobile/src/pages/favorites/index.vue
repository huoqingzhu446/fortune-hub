<template>
  <view class="page-shell" :style="themeVars">
    <view class="page">
      <view class="page-header">
        <view>
          <text class="page-header__title">我的收藏</text>
          <text class="page-header__subtitle">把想稍后再看的内容留在这里</text>
        </view>
      </view>

      <view v-if="loading" class="empty-state">
        <text class="empty-state__title">正在同步收藏...</text>
        <text class="empty-state__text">马上就好。</text>
      </view>

      <view v-else-if="favorites.length" class="favorite-list">
        <view
          v-for="item in favorites"
          :key="item.id"
          class="favorite-row"
          @tap="open(item.route)"
        >
          <view class="favorite-row__icon">{{ item.icon }}</view>
          <view class="favorite-row__body">
            <text class="favorite-row__title">{{ item.title }}</text>
            <text class="favorite-row__text">{{ item.summary || '已收藏，稍后继续查看。' }}</text>
          </view>
          <text class="favorite-row__arrow">›</text>
        </view>
      </view>

      <view v-else class="empty-state">
        <text class="empty-state__title">还没有收藏内容</text>
        <text class="empty-state__text">在探索页点击内容卡右侧的星标，就能把喜欢的内容保存到这里。</text>
        <button class="empty-state__button" @tap="open('/pages/explore/index')">去探索</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad, onShow } from '@dcloudio/uni-app';
import { ref } from 'vue';
import { fetchFavorites } from '../../api/favorites';
import { useThemePreference } from '../../composables/useThemePreference';
import { getErrorMessage, handleAuthExpired } from '../../services/errors';
import { clearSession } from '../../services/session';
import { usePageStateStore } from '../../stores/page-state';
import type { FavoriteItem } from '../../types/favorite';

const favorites = ref<FavoriteItem[]>([]);
const loading = ref(false);
const { themeVars } = useThemePreference();
const pageStateStore = usePageStateStore();
let lastFavoritesVersion = pageStateStore.versionOf('favorites');

async function loadFavorites() {
  try {
    loading.value = true;
    const response = await fetchFavorites();
    favorites.value = response.data.items;
    lastFavoritesVersion = pageStateStore.versionOf('favorites');
  } catch (error) {
    console.warn('load favorites failed', error);
    favorites.value = [];
    if (handleAuthExpired(error, true)) {
      clearSession();
    }
    uni.showToast({
      title: getErrorMessage(error, '收藏读取失败'),
      icon: 'none',
    });
  } finally {
    loading.value = false;
  }
}

function open(route: string) {
  uni.navigateTo({
    url: route,
  });
}

onLoad(() => {
  void loadFavorites();
});

onShow(() => {
  if (pageStateStore.versionOf('favorites') !== lastFavoritesVersion) {
    void loadFavorites();
  }
});
</script>

<style lang="scss">
.page-shell {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, var(--theme-glow), transparent 34%),
    linear-gradient(180deg, var(--theme-page-top) 0%, var(--theme-page-bottom) 100%);
}

.page {
  min-height: 100vh;
  padding: 28rpx 24rpx 40rpx;
}

.page-header {
  margin-bottom: 24rpx;
}

.page-header__title {
  display: block;
  font-size: 64rpx;
  font-weight: 500;
  color: var(--theme-text-primary);
  font-family:
    'Iowan Old Style',
    'Times New Roman',
    'Noto Serif SC',
    serif;
}

.page-header__subtitle,
.favorite-row__text,
.empty-state__text {
  font-size: 24rpx;
  line-height: 1.7;
  color: var(--theme-text-secondary);
}

.favorite-list,
.empty-state {
  display: grid;
  gap: 16rpx;
}

.favorite-row,
.empty-state {
  border-radius: 30rpx;
  border: 1rpx solid var(--theme-border);
  background: var(--theme-surface);
  box-shadow: var(--theme-shadow-soft);
}

.favorite-row {
  display: grid;
  grid-template-columns: 74rpx minmax(0, 1fr) auto;
  gap: 16rpx;
  align-items: center;
  padding: 20rpx;
}

.favorite-row__icon {
  display: grid;
  place-items: center;
  width: 74rpx;
  height: 74rpx;
  border-radius: 24rpx;
  color: var(--theme-primary);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, var(--theme-soft) 100%);
}

.favorite-row__body {
  display: grid;
  gap: 8rpx;
}

.favorite-row__title,
.empty-state__title {
  font-size: 30rpx;
  color: var(--theme-text-primary);
}

.favorite-row__arrow {
  color: var(--theme-text-tertiary);
}

.empty-state {
  padding: 28rpx;
}

.empty-state__button {
  width: fit-content;
  min-height: 72rpx;
  margin: 0;
  padding: 0 26rpx;
  border-radius: 999rpx;
  line-height: 72rpx;
  font-size: 24rpx;
  color: #ffffff;
  background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-accent) 100%);
}

.empty-state__button::after {
  border: none;
}
</style>
