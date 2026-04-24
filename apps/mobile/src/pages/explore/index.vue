<template>
  <view class="page-shell" :style="themeVars">
    <view class="page">
      <view class="hero-panel">
        <text class="hero-panel__eyebrow">发现当下适合自己的疗愈方式</text>
        <view class="hero-panel__head">
          <text class="hero-panel__title">探索</text>
          <text class="hero-panel__meta">{{ themePalette.name }}主题</text>
        </view>
        <text class="hero-panel__summary">
          Phase 1 先把导航与主题体系接上，这里作为探索页骨架，后续会继续补搜索、筛选、Banner 与专题内容。
        </text>
      </view>

      <view class="chip-row">
        <text class="chip">今日适合：情绪疗愈</text>
        <text class="chip">冥想与记录优先</text>
      </view>

      <view class="section">
        <view class="section__head">
          <text class="section__title">核心入口</text>
          <text class="section__meta">V2 骨架</text>
        </view>

        <view class="entry-grid">
          <view
            v-for="entry in entries"
            :key="entry.route"
            class="entry-card"
            @tap="open(entry.route)"
          >
            <text class="entry-card__title">{{ entry.title }}</text>
            <text class="entry-card__desc">{{ entry.description }}</text>
          </view>
        </view>
      </view>
    </view>

    <AppTabBar current-tab="explore" />
  </view>
</template>

<script setup lang="ts">
import AppTabBar from '../../components/AppTabBar.vue';
import { useThemePreference } from '../../composables/useThemePreference';

const { themePalette, themeVars } = useThemePreference();

const entries = [
  {
    title: '情绪自检',
    description: '先观察最近的情绪起伏与压力变化。',
    route: '/pages/emotion/index',
  },
  {
    title: '性格测评',
    description: '看看你更自然的节奏与反应方式。',
    route: '/pages/personality/index',
  },
  {
    title: '星座运势',
    description: '把今日提示变成更轻量的阅读入口。',
    route: '/pages/zodiac/index',
  },
  {
    title: '八字气运',
    description: '基于生日资料补充个性化参考。',
    route: '/pages/bazi/index',
  },
];

function open(route: string) {
  uni.navigateTo({
    url: route,
  });
}
</script>

<style lang="scss">
.page-shell {
  min-height: 100vh;
  padding-bottom: 144rpx;
  background:
    radial-gradient(circle at top left, var(--theme-glow), transparent 32%),
    linear-gradient(180deg, var(--theme-page-top) 0%, var(--theme-page-bottom) 100%);
}

.page {
  min-height: 100vh;
  padding: 28rpx 24rpx 0;
}

.hero-panel,
.section {
  display: grid;
  gap: 16rpx;
  margin-bottom: 24rpx;
  padding: 30rpx;
  border-radius: 34rpx;
  background: var(--theme-surface);
  border: 1rpx solid var(--theme-border);
  box-shadow: var(--theme-shadow);
}

.hero-panel__eyebrow,
.section__meta {
  font-size: 22rpx;
  letter-spacing: 0.16em;
  color: var(--theme-primary);
}

.hero-panel__head,
.section__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16rpx;
}

.hero-panel__title,
.section__title,
.entry-card__title {
  font-size: 40rpx;
  font-weight: 600;
  color: var(--theme-text-primary);
}

.hero-panel__summary,
.entry-card__desc,
.hero-panel__meta {
  font-size: 24rpx;
  line-height: 1.7;
  color: var(--theme-text-secondary);
}

.chip-row,
.entry-grid {
  display: grid;
  gap: 16rpx;
}

.chip-row {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-bottom: 24rpx;
}

.chip {
  padding: 18rpx 20rpx;
  border-radius: 999rpx;
  text-align: center;
  font-size: 22rpx;
  color: var(--theme-primary);
  background: var(--theme-tag-bg);
}

.entry-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.entry-card {
  display: grid;
  gap: 10rpx;
  min-height: 176rpx;
  padding: 24rpx;
  border-radius: 28rpx;
  background: var(--theme-surface-muted);
}

.entry-card__title {
  font-size: 30rpx;
}
</style>
