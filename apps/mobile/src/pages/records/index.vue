<template>
  <view class="page-shell" :style="themeVars">
    <view class="page">
      <view class="hero-card">
        <text class="hero-card__eyebrow">看见自己的情绪轨迹与变化</text>
        <text class="hero-card__title">记录</text>
        <text class="hero-card__subtitle">
          {{ isLoggedIn ? '这里会慢慢沉淀你的情绪、测试与疗愈记录。' : '登录后，记录和变化才会开始长期保存。' }}
        </text>
      </view>

      <view v-if="!isLoggedIn" class="section-card empty-card">
        <text class="empty-card__title">还没有登录</text>
        <text class="empty-card__text">去“我的”完成登录后，后续测评和记录都会自动沉淀在这里。</text>
        <button class="hero-button hero-button--primary" @tap="goProfile">去我的</button>
      </view>

      <template v-else>
        <view class="section-card">
          <view class="filter-row">
            <view
              v-for="item in filters"
              :key="item.value"
              class="filter-chip"
              :class="{ 'filter-chip--active': activeFilter === item.value }"
              @tap="activeFilter = item.value"
            >
              <text>{{ item.label }}</text>
            </view>
          </view>
        </view>

        <view v-if="loading" class="section-card empty-card">
          <text class="empty-card__title">正在同步记录...</text>
          <text class="empty-card__text">马上就好。</text>
        </view>

        <view v-else-if="filteredItems.length" class="section-card">
          <view class="record-list">
            <view
              v-for="item in filteredItems"
              :key="item.id"
              class="record-card"
              @tap="openRecord(item)"
            >
              <view class="record-card__top">
                <view>
                  <text class="record-card__type">{{ item.recordTypeLabel }}</text>
                  <text class="record-card__title">{{ item.title }}</text>
                </view>
                <text class="record-card__score">{{ item.score !== null ? item.score : '--' }}</text>
              </view>

              <text class="record-card__subtitle">{{ item.subtitle || item.detailHint || '查看详情' }}</text>
              <text class="record-card__summary">{{ item.summary || '这条记录暂时还没有补充摘要。' }}</text>
              <text class="record-card__time">{{ formatDateTime(item.completedAt) }}</text>
            </view>
          </view>
        </view>

        <view v-else class="section-card empty-card">
          <text class="empty-card__title">还没有对应记录</text>
          <text class="empty-card__text">完成一次测试、日记或解读后，这里就会出现。</text>
        </view>
      </template>
    </view>

    <AppTabBar current-tab="record" />
  </view>
</template>

<script setup lang="ts">
import { onLoad, onShow } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import AppTabBar from '../../components/AppTabBar.vue';
import { fetchUnifiedHistory } from '../../api/records';
import { useThemePreference } from '../../composables/useThemePreference';
import { getErrorMessage, handleAuthExpired } from '../../services/errors';
import { getAuthToken } from '../../services/session';
import type { UnifiedRecordItem } from '../../types/records';

const items = ref<UnifiedRecordItem[]>([]);
const loading = ref(false);
const authToken = ref(getAuthToken());
const activeFilter = ref<'all' | 'personality' | 'emotion' | 'bazi'>('all');
const { themeVars } = useThemePreference();

const isLoggedIn = computed(() => Boolean(authToken.value));
const filters = computed(() => [
  { label: '全部', value: 'all' as const },
  { label: '性格', value: 'personality' as const },
  { label: '情绪', value: 'emotion' as const },
  { label: '八字', value: 'bazi' as const },
]);
const filteredItems = computed(() =>
  items.value.filter((item) => activeFilter.value === 'all' || item.recordType === activeFilter.value),
);

async function loadHistory() {
  if (!isLoggedIn.value) {
    items.value = [];
    return;
  }

  try {
    loading.value = true;
    const response = await fetchUnifiedHistory();
    items.value = response.data.items;
  } catch (error) {
    console.warn('load unified history failed', error);
    items.value = [];
    if (handleAuthExpired(error, true)) {
      authToken.value = '';
      return;
    }
    uni.showToast({
      title: getErrorMessage(error, '历史读取失败'),
      icon: 'none',
    });
  } finally {
    loading.value = false;
  }
}

function openRecord(item: UnifiedRecordItem) {
  uni.navigateTo({
    url: item.route,
  });
}

function goProfile() {
  uni.navigateTo({
    url: '/pages/profile/index',
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
  void loadHistory();
});

onShow(() => {
  const latestToken = getAuthToken();
  if (latestToken !== authToken.value) {
    authToken.value = latestToken;
  }
  void loadHistory();
});
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

.hero-card,
.section-card {
  display: grid;
  gap: 18rpx;
  margin-bottom: 20rpx;
  padding: 28rpx;
  border-radius: 32rpx;
  background: var(--theme-surface);
  border: 1rpx solid var(--theme-border);
  box-shadow: var(--theme-shadow);
}

.hero-card__eyebrow,
.record-card__type {
  font-size: 22rpx;
  letter-spacing: 0.12em;
  color: var(--theme-primary);
}

.hero-card__title {
  font-size: 52rpx;
  font-weight: 500;
  color: var(--theme-text-primary);
}

.hero-card__subtitle,
.empty-card__text,
.record-card__summary,
.record-card__subtitle {
  font-size: 26rpx;
  line-height: 1.7;
  color: var(--theme-text-secondary);
}

.filter-row,
.record-list {
  display: grid;
  gap: 14rpx;
}

.filter-row {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.filter-chip {
  padding: 18rpx 0;
  border-radius: 999rpx;
  text-align: center;
  background: var(--theme-surface-muted);
  color: var(--theme-text-secondary);
  font-size: 24rpx;
}

.filter-chip--active {
  color: #ffffff;
  background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-accent) 100%);
}

.record-card {
  display: grid;
  gap: 10rpx;
  padding: 22rpx;
  border-radius: 24rpx;
  background: var(--theme-surface-muted);
}

.record-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.record-card__title {
  display: block;
  margin-top: 8rpx;
  font-size: 34rpx;
  font-weight: 700;
  color: var(--theme-text-primary);
}

.record-card__score,
.empty-card__title {
  font-size: 30rpx;
  color: var(--theme-text-primary);
}

.record-card__time {
  font-size: 22rpx;
  color: var(--theme-text-tertiary);
}

.hero-button {
  min-height: 82rpx;
  border-radius: 999rpx;
  line-height: 82rpx;
  font-size: 28rpx;
  color: #ffffff;
  background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-accent) 100%);
}

.hero-button::after {
  border: none;
}
</style>
