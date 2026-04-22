<template>
  <view class="page-shell">
    <view class="page">
    <view class="page-orb page-orb--mint"></view>
    <view class="page-orb page-orb--peach"></view>

    <view class="hero-card">
      <text class="hero-card__eyebrow">lucky system</text>
      <text class="hero-card__title">
        {{ luckyData.profile.personalized ? '今天的幸运物推荐已就位' : '先看看今天的幸运物方向' }}
      </text>
      <text class="hero-card__subtitle">{{ luckyData.profile.guidance }}</text>

      <view class="metric-grid">
        <view class="metric-card metric-card--primary">
          <text class="metric-card__label">{{ luckyData.scores.today.label }}</text>
          <text class="metric-card__value">{{ luckyData.scores.today.value }}</text>
          <text class="metric-card__hint">{{ luckyData.scores.today.hint }}</text>
        </view>
        <view class="metric-card">
          <text class="metric-card__label">{{ luckyData.scores.annual.label }}</text>
          <text class="metric-card__value">{{ luckyData.scores.annual.value }}</text>
          <text class="metric-card__hint">{{ luckyData.scores.annual.hint }}</text>
        </view>
      </view>

      <view class="hero-actions">
        <button class="hero-button hero-button--primary" :loading="loading" @tap="loadLucky">
          刷新推荐
        </button>
        <button
          v-if="!luckyData.profile.personalized"
          class="hero-button hero-button--secondary"
          @tap="goProfile"
        >
          完善资料
        </button>
      </view>
    </view>

    <view class="section-card sign-card">
      <view class="section-header">
        <view>
          <text class="section-header__eyebrow">today sign</text>
          <text class="section-header__title">{{ luckyData.sign.title }}</text>
        </view>
        <text class="sign-tag">{{ luckyData.sign.tag }}</text>
      </view>

      <text class="sign-summary">{{ luckyData.sign.summary }}</text>
      <text class="sign-mantra">今日提醒：{{ luckyData.sign.mantra }}</text>

      <view class="tip-list">
        <text v-for="tip in luckyData.actionTips" :key="tip" class="tip-item">{{ tip }}</text>
      </view>

      <button class="hero-button hero-button--secondary" @tap="openSignDetail">
        查看幸运签详情
      </button>
    </view>

    <view class="section-card">
      <view class="section-header">
        <view>
          <text class="section-header__eyebrow">recommendations</text>
          <text class="section-header__title">今日幸运物推荐</text>
        </view>
        <text class="section-header__side">{{ recommendations.length }} 项</text>
      </view>

      <view v-if="loading" class="empty-card">
        <text class="empty-card__title">正在同步今天的幸运物...</text>
        <text class="empty-card__text">马上就好，稍等一下。</text>
      </view>

      <view v-else class="recommendation-list">
        <view v-for="item in recommendations" :key="item.bizCode" class="recommendation-card">
          <view class="recommendation-card__top">
            <view>
              <text class="recommendation-card__category">{{ item.category }}</text>
              <text class="recommendation-card__title">{{ item.title }}</text>
            </view>
            <view class="fit-pill">
              <text class="fit-pill__label">适配度</text>
              <text class="fit-pill__value">{{ item.fitScore }}</text>
            </view>
          </view>

          <text class="recommendation-card__summary">{{ item.summary }}</text>
          <text class="recommendation-card__highlight">{{ item.highlight }}</text>
          <text class="recommendation-card__support">{{ item.supportiveFocus }}</text>

          <view class="recommendation-meta">
            <text class="recommendation-meta__item">适合时段：{{ item.useMoment }}</text>
            <text class="recommendation-meta__item">搭配建议：{{ item.styleHint }}</text>
          </view>

          <view class="tag-row">
            <text v-for="tag in item.fitTags" :key="tag" class="tag-chip">{{ tag }}</text>
          </view>

          <view class="palette-row">
            <view
              v-for="color in item.palette"
              :key="color"
              class="palette-dot"
              :style="{ background: color }"
            ></view>
          </view>
        </view>
      </view>
    </view>

    <view class="section-card section-card--soft">
      <view class="section-header">
        <view>
          <text class="section-header__eyebrow">wallpaper mood</text>
          <text class="section-header__title">幸运壁纸方向</text>
        </view>
        <text class="section-header__side">内容化预览</text>
      </view>

      <view class="wallpaper-list">
        <view v-for="theme in luckyData.wallpaperThemes" :key="theme.id" class="wallpaper-card">
          <text class="wallpaper-card__mood">{{ theme.mood }}</text>
          <text class="wallpaper-card__title">{{ theme.title }}</text>
          <text class="wallpaper-card__prompt">{{ theme.prompt }}</text>

          <view class="palette-row">
            <view
              v-for="color in theme.palette"
              :key="color"
              class="palette-dot"
              :style="{ background: color }"
            ></view>
          </view>

          <view class="wallpaper-card__actions">
            <button class="hero-button hero-button--primary" @tap="openWallpaperGenerator(theme)">
              生成壁纸
            </button>
            <button class="hero-button hero-button--secondary" @tap="copyWallpaperPrompt(theme.prompt)">
              复制提示词
            </button>
          </view>
          <text class="wallpaper-card__helper">
            现在会生成一张可预览的 SVG 壁纸，H5 环境下可直接下载。
          </text>
        </view>
      </view>
    </view>

    <view class="footer-actions">
      <button class="hero-button hero-button--secondary" @tap="backHome">返回首页</button>
    </view>
    </view>
    <AppTabBar current-tab="lucky" />
  </view>
</template>

<script setup lang="ts">
import { onLoad, onShow } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import AppTabBar from '../../components/AppTabBar.vue';
import { fetchLuckyToday } from '../../api/lucky';
import { setLuckyWallpaperTheme } from '../../services/lucky-wallpaper';
import { getAuthToken } from '../../services/session';
import type { LuckyTodayData, LuckyWallpaperTheme } from '../../types/lucky';

const fallbackLucky: LuckyTodayData = {
  profile: {
    personalized: false,
    nickname: null,
    zodiac: null,
    dominantElement: '木',
    guidance: '登录并完善生日资料后，会结合你的星座和五行做更个性化的推荐。',
  },
  scores: {
    today: {
      label: '今日幸运指数',
      value: '86',
      hint: '今天适合轻量整理和温柔推进。',
    },
    annual: {
      label: '年度幸运指数',
      value: '92',
      hint: '今年适合长期打磨表达与秩序感。',
    },
  },
  sign: {
    bizCode: 'sign-breeze-open',
    title: '今日幸运签',
    summary: '先把心绪放松一点，再做决定，顺势比硬顶更容易得到答案。',
    tag: '风起有信',
    mantra: '先松一口气，再向前一步。',
    accent: 'mint',
  },
  actionTips: [
    '先完成最重要的一小步，再决定下一步。',
    '给自己留一点回看空间，会更容易做出清晰判断。',
  ],
  recommendations: [],
  wallpaperThemes: [],
};

const luckyData = ref<LuckyTodayData>(fallbackLucky);
const loading = ref(false);
const authToken = ref(getAuthToken());

const recommendations = computed(() => luckyData.value.recommendations);

async function loadLucky() {
  try {
    loading.value = true;
    const response = await fetchLuckyToday();
    luckyData.value = response.data;
  } catch (error) {
    console.warn('load lucky failed', error);
    luckyData.value = fallbackLucky;
    uni.showToast({
      title: '已切换到离线推荐',
      icon: 'none',
    });
  } finally {
    loading.value = false;
  }
}

function openSignDetail() {
  uni.navigateTo({
    url: `/pages/lucky/sign/index?bizCode=${encodeURIComponent(luckyData.value.sign.bizCode)}`,
  });
}

function copyWallpaperPrompt(prompt: string) {
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

function openWallpaperGenerator(theme: LuckyWallpaperTheme) {
  setLuckyWallpaperTheme(theme);
  uni.navigateTo({
    url: '/pages/lucky/wallpaper/index',
  });
}

function goProfile() {
  uni.navigateTo({
    url: '/pages/profile/index',
  });
}

function backHome() {
  uni.reLaunch({
    url: '/pages/index/index',
  });
}

onLoad(() => {
  void loadLucky();
});

onShow(() => {
  const latestToken = getAuthToken();
  if (latestToken !== authToken.value) {
    authToken.value = latestToken;
    void loadLucky();
  }
});
</script>

<style lang="scss">
.page-shell {
  min-height: 100vh;
  padding-bottom: 138rpx;
  overflow-x: hidden;
}

.page {
  min-height: 100vh;
  padding: 24rpx 24rpx 24rpx;
  background:
    radial-gradient(circle at top left, rgba(134, 209, 182, 0.28), transparent 22%),
    radial-gradient(circle at top right, rgba(255, 214, 195, 0.28), transparent 18%),
    linear-gradient(180deg, #f8fbff 0%, #edf2f7 100%);
  overflow-x: hidden;
}

.page-orb {
  position: fixed;
  z-index: 0;
  width: 320rpx;
  height: 320rpx;
  border-radius: 999rpx;
  filter: blur(26rpx);
  opacity: 0.48;
}

.page-orb--mint {
  top: 20rpx;
  left: -80rpx;
  background: rgba(140, 219, 189, 0.42);
}

.page-orb--peach {
  top: 360rpx;
  right: -90rpx;
  background: rgba(255, 210, 191, 0.42);
}

.hero-card,
.section-card {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 18rpx;
  margin-bottom: 20rpx;
  padding: 28rpx;
  border-radius: 32rpx;
  background: rgba(255, 255, 255, 0.88);
  border: 1rpx solid rgba(255, 255, 255, 0.8);
  box-shadow: var(--apple-shadow);
}

.section-card--soft {
  background: rgba(247, 250, 252, 0.92);
}

.hero-card__eyebrow,
.section-header__eyebrow,
.recommendation-card__category,
.wallpaper-card__mood {
  font-size: 20rpx;
  text-transform: uppercase;
  letter-spacing: 0.28em;
  color: var(--apple-subtle);
}

.hero-card__title,
.section-header__title {
  font-size: 42rpx;
  font-weight: 700;
  color: var(--apple-text);
}

.hero-card__subtitle,
.recommendation-card__summary,
.wallpaper-card__prompt,
.empty-card__text {
  font-size: 26rpx;
  line-height: 1.7;
  color: var(--apple-muted);
}

.metric-grid,
.hero-actions,
.footer-actions {
  display: grid;
  gap: 16rpx;
}

.metric-card {
  display: grid;
  gap: 8rpx;
  padding: 22rpx;
  border-radius: 28rpx;
  background: rgba(246, 249, 252, 0.88);
}

.metric-card--primary {
  background: linear-gradient(135deg, rgba(236, 245, 255, 0.96), rgba(228, 250, 242, 0.96));
}

.metric-card__label,
.fit-pill__label,
.section-header__side,
.tip-item,
.recommendation-meta__item,
.empty-card__title {
  font-size: 22rpx;
  color: var(--apple-subtle);
}

.metric-card__value,
.fit-pill__value {
  font-size: 46rpx;
  font-weight: 700;
  color: var(--apple-text);
}

.metric-card__hint,
.sign-mantra {
  font-size: 24rpx;
  color: var(--apple-muted);
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

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.sign-tag {
  align-self: center;
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(221, 243, 234, 0.9);
  color: #3f7f69;
  font-size: 22rpx;
}

.sign-summary,
.recommendation-card__highlight,
.recommendation-card__support {
  font-size: 28rpx;
  line-height: 1.7;
  color: var(--apple-text);
}

.recommendation-card__support {
  color: #516776;
}

.tip-list,
.recommendation-list,
.wallpaper-list {
  display: grid;
  gap: 16rpx;
}

.tag-row,
.wallpaper-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.tip-item,
.recommendation-card,
.wallpaper-card,
.empty-card {
  padding: 22rpx;
  border-radius: 24rpx;
  background: rgba(246, 249, 252, 0.92);
}

.recommendation-card {
  gap: 14rpx;
}

.recommendation-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.recommendation-card__title,
.wallpaper-card__title {
  display: block;
  margin-top: 8rpx;
  font-size: 34rpx;
  font-weight: 700;
  color: var(--apple-text);
}

.fit-pill {
  display: grid;
  justify-items: end;
}

.recommendation-meta {
  display: grid;
  gap: 8rpx;
}

.tag-chip {
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(221, 243, 234, 0.84);
  font-size: 22rpx;
  color: #457d6a;
}

.palette-row {
  display: flex;
  gap: 10rpx;
}

.palette-dot {
  width: 28rpx;
  height: 28rpx;
  border-radius: 999rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.8);
}

.wallpaper-card__actions .hero-button {
  flex: 1;
}

.wallpaper-card__helper {
  font-size: 22rpx;
  line-height: 1.6;
  color: var(--apple-subtle);
}
</style>
