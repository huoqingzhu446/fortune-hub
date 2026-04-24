<template>
  <view class="page-shell" :style="themeVars">
    <view class="page">
      <view class="ambient ambient--glow"></view>
      <view class="ambient ambient--moon"></view>

      <view class="page-header">
        <view>
          <text class="page-header__title">探索</text>
          <text class="page-header__subtitle">发现适合当下自己的疗愈与指引</text>
        </view>
        <text class="page-header__theme">{{ themePalette.name }}</text>
      </view>

      <view class="search-row">
        <view class="search-box">
          <text class="search-box__icon">⌕</text>
          <input
            v-model="keyword"
            class="search-box__input"
            confirm-type="search"
            :placeholder="exploreData.searchPlaceholder"
            placeholder-class="search-box__placeholder"
            @confirm="submitSearch"
          />
          <text v-if="keyword" class="search-box__clear" @tap="clearKeyword">清除</text>
        </view>

        <view class="filter-button" @tap="showFilter = true">
          <text class="filter-button__icon">筛</text>
          <text>筛选</text>
        </view>
      </view>

      <view class="fit-pill" @tap="open(exploreData.todayFit.route)">
        <text class="fit-pill__icon">{{ exploreData.todayFit.icon }}</text>
        <text>{{ exploreData.todayFit.text }}</text>
        <text class="fit-pill__arrow">›</text>
      </view>

      <view class="hero-banner" @tap="open(exploreData.banner.route)">
        <view class="hero-banner__copy">
          <text class="hero-banner__eyebrow">{{ exploreData.banner.eyebrow }}</text>
          <text class="hero-banner__title">{{ exploreData.banner.title }}</text>
          <text class="hero-banner__summary">{{ exploreData.banner.summary }}</text>
          <text class="hero-banner__cta">{{ exploreData.banner.ctaText }} →</text>
        </view>

        <view class="hero-banner__art">
          <view class="hero-banner__moon"></view>
          <view class="hero-banner__lotus">{{ exploreData.banner.icon }}</view>
        </view>
      </view>

      <view class="section">
        <view class="section__head">
          <text class="section__title">功能入口</text>
          <text class="section__meta">{{ filteredFeatures.length }} 项</text>
        </view>

        <view class="feature-grid">
          <view
            v-for="item in filteredFeatures"
            :key="item.id"
            class="feature-card"
            @tap="open(item.route)"
          >
            <view class="feature-card__icon">{{ item.icon }}</view>
            <view class="feature-card__copy">
              <text class="feature-card__title">{{ item.title }}</text>
              <text class="feature-card__desc">{{ item.description }}</text>
            </view>
            <text class="feature-card__arrow">›</text>
          </view>
        </view>
      </view>

      <view class="section">
        <view class="section__head">
          <text class="section__title">热门专题</text>
          <text class="section__link">全部专题 ›</text>
        </view>

        <scroll-view class="topic-scroll" scroll-x>
          <view class="topic-track">
            <view
              v-for="topic in topics"
              :key="topic.id"
              class="topic-card"
              @tap="open(topic.route)"
            >
              <text class="topic-card__title">{{ topic.title }}</text>
              <text class="topic-card__summary">{{ topic.summary }}</text>
              <text class="topic-card__tag">{{ topic.tag }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <view class="section">
        <view class="section__head">
          <text class="section__title">精选内容</text>
          <text class="section__link">更多内容 ›</text>
        </view>

        <view class="content-list">
          <view
            v-for="item in filteredContents"
            :key="item.id"
            class="content-card"
            @tap="open(item.route)"
          >
            <view class="content-card__cover">
              <text>{{ item.icon }}</text>
            </view>

            <view class="content-card__body">
              <view class="content-card__head">
                <text class="content-card__title">{{ item.title }}</text>
                <text class="content-card__tag">{{ item.type }}</text>
              </view>
              <text class="content-card__desc">{{ item.description }}</text>
              <text class="content-card__meta">{{ item.duration }} · {{ item.stat }}</text>
            </view>

            <button class="content-card__button" @tap.stop="open(item.route)">
              {{ item.buttonText }}
            </button>
          </view>
        </view>
      </view>
    </view>

    <view v-if="showFilter" class="filter-mask" @tap="showFilter = false">
      <view class="filter-sheet" @tap.stop>
        <view class="filter-sheet__head">
          <text class="filter-sheet__title">筛选内容</text>
          <text class="filter-sheet__close" @tap="showFilter = false">关闭</text>
        </view>

        <view class="filter-group">
          <text class="filter-group__title">类型</text>
          <view class="filter-options">
            <view
              v-for="item in typeFilters"
              :key="item.value"
              class="filter-chip"
              :class="{ 'filter-chip--active': selectedType === item.value }"
              @tap="selectedType = item.value"
            >
              <text>{{ item.label }}</text>
            </view>
          </view>
        </view>

        <view class="filter-group">
          <text class="filter-group__title">目标</text>
          <view class="filter-options">
            <view
              v-for="item in goalFilters"
              :key="item.value"
              class="filter-chip"
              :class="{ 'filter-chip--active': selectedGoals.includes(item.value) }"
              @tap="toggleGoal(item.value)"
            >
              <text>{{ item.label }}</text>
            </view>
          </view>
        </view>

        <view class="filter-actions">
          <button class="filter-actions__reset" @tap="resetFilters">重置</button>
          <button class="filter-actions__confirm" @tap="showFilter = false">确定</button>
        </view>
      </view>
    </view>

    <AppTabBar current-tab="explore" />
  </view>
</template>

<script setup lang="ts">
import { onLoad, onShow } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import { fetchExploreIndex, fetchExploreSearch } from '../../api/explore';
import AppTabBar from '../../components/AppTabBar.vue';
import { useThemePreference } from '../../composables/useThemePreference';
import { getErrorMessage } from '../../services/errors';
import type {
  ExploreContentItem,
  ExploreFeatureItem,
  ExploreIndexData,
  ExploreFilterOption,
  ExploreTopicItem,
} from '../../types/explore';

type FilterType = 'all' | 'test' | 'meditation' | 'zodiac' | 'bazi' | 'journal' | 'content';

const { themePalette, themeVars } = useThemePreference();

const keyword = ref('');
const showFilter = ref(false);
const selectedType = ref<FilterType>('all');
const selectedGoals = ref<string[]>([]);
const searchedKeyword = ref('');

function normalizeFilterType(value: string): FilterType {
  if (
    value === 'test' ||
    value === 'meditation' ||
    value === 'zodiac' ||
    value === 'bazi' ||
    value === 'journal' ||
    value === 'content'
  ) {
    return value;
  }

  return 'all';
}
const fallbackExploreData: ExploreIndexData = {
  isLoggedIn: false,
  searchPlaceholder: '搜索测试 / 冥想 / 星座 / 八字',
  todayFit: {
    icon: '莲',
    text: '今日适合：情绪疗愈',
    route: '/pages/emotion/index',
  },
  filters: {
    types: [
      { label: '全部', value: 'all' },
      { label: '心理测试', value: 'test' },
      { label: '冥想', value: 'meditation' },
      { label: '星座', value: 'zodiac' },
      { label: '八字', value: 'bazi' },
      { label: '日记', value: 'journal' },
      { label: '内容', value: 'content' },
    ],
    goals: [
      { label: '放松', value: 'relax' },
      { label: '睡眠', value: 'sleep' },
      { label: '减压', value: 'stress' },
      { label: '自我探索', value: 'self' },
      { label: '关系分析', value: 'relationship' },
    ],
  },
  banner: {
    eyebrow: '为你推荐',
    title: '情绪自测与疗愈地图',
    summary: '识别情绪状态，找到专属疗愈方案。',
    ctaText: '立即探索',
    icon: '莲',
    route: '/pages/emotion/index',
  },
  features: [],
  topics: [],
  contents: [],
};
const exploreData = ref<ExploreIndexData>(fallbackExploreData);
const searchedFeatures = ref<ExploreFeatureItem[] | null>(null);
const searchedTopics = ref<ExploreTopicItem[] | null>(null);
const searchedContents = ref<ExploreContentItem[] | null>(null);

const normalizedKeyword = computed(() => keyword.value.trim().toLowerCase());
const typeFilters = computed<Array<ExploreFilterOption & { value: FilterType }>>(() =>
  exploreData.value.filters.types.map((item) => ({
    ...item,
    value: normalizeFilterType(item.value),
  })),
);
const goalFilters = computed<ExploreFilterOption[]>(() => exploreData.value.filters.goals);
const features = computed<ExploreFeatureItem[]>(() =>
  searchedFeatures.value && searchedKeyword.value === normalizedKeyword.value
    ? searchedFeatures.value
    : exploreData.value.features,
);
const topics = computed<ExploreTopicItem[]>(() =>
  searchedTopics.value && searchedKeyword.value === normalizedKeyword.value
    ? searchedTopics.value
    : exploreData.value.topics,
);
const contents = computed<ExploreContentItem[]>(() =>
  searchedContents.value && searchedKeyword.value === normalizedKeyword.value
    ? searchedContents.value
    : exploreData.value.contents,
);

const filteredFeatures = computed(() =>
  features.value.filter((item) => {
    const matchesType = selectedType.value === 'all' || item.type === selectedType.value;
    const matchesGoal =
      selectedGoals.value.length === 0 ||
      selectedGoals.value.some((goal) => item.goals.includes(goal));
    const matchesKeyword =
      !normalizedKeyword.value ||
      `${item.title}${item.description}`.toLowerCase().includes(normalizedKeyword.value);

    return matchesType && matchesGoal && matchesKeyword;
  }),
);

const filteredContents = computed(() =>
  contents.value.filter((item) => {
    const matchesType = selectedType.value === 'all' || item.filterType === selectedType.value;
    const matchesGoal =
      selectedGoals.value.length === 0 ||
      selectedGoals.value.some((goal) => item.goals.includes(goal));
    const matchesKeyword =
      !normalizedKeyword.value ||
      `${item.title}${item.description}${item.type}`.toLowerCase().includes(normalizedKeyword.value);

    return matchesType && matchesGoal && matchesKeyword;
  }),
);

async function loadExploreIndex() {
  try {
    const response = await fetchExploreIndex();
    exploreData.value = response.data;
  } catch (error) {
    console.warn('load explore index failed', error);
    exploreData.value = fallbackExploreData;
    uni.showToast({
      title: getErrorMessage(error, '探索数据加载失败'),
      icon: 'none',
    });
  }
}

function open(route: string) {
  uni.navigateTo({
    url: route,
  });
}

function submitSearch() {
  const nextKeyword = keyword.value.trim();

  if (!nextKeyword) {
    searchedKeyword.value = '';
    searchedFeatures.value = null;
    searchedTopics.value = null;
    searchedContents.value = null;
    return;
  }

  void loadExploreSearch(nextKeyword);
}

function clearKeyword() {
  keyword.value = '';
  searchedKeyword.value = '';
  searchedFeatures.value = null;
  searchedTopics.value = null;
  searchedContents.value = null;
}

function toggleGoal(value: string) {
  selectedGoals.value = selectedGoals.value.includes(value)
    ? selectedGoals.value.filter((item) => item !== value)
    : [...selectedGoals.value, value];
}

function resetFilters() {
  selectedType.value = 'all';
  selectedGoals.value = [];
}

async function loadExploreSearch(nextKeyword: string) {
  try {
    const response = await fetchExploreSearch({
      keyword: nextKeyword,
      type: selectedType.value === 'all' ? undefined : selectedType.value,
      goal: selectedGoals.value,
    });
    searchedKeyword.value = nextKeyword.toLowerCase();
    searchedFeatures.value = response.data.features;
    searchedTopics.value = response.data.topics;
    searchedContents.value = response.data.contents;
  } catch (error) {
    console.warn('search explore failed', error);
    uni.showToast({
      title: getErrorMessage(error, '搜索失败'),
      icon: 'none',
    });
  }
}

onLoad(() => {
  void loadExploreIndex();
});

onShow(() => {
  void loadExploreIndex();
});
</script>

<style lang="scss">
.page-shell {
  position: relative;
  min-height: 100vh;
  padding-bottom: 144rpx;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, var(--theme-glow), transparent 34%),
    linear-gradient(180deg, var(--theme-page-top) 0%, var(--theme-page-bottom) 100%);
}

.page {
  position: relative;
  min-height: 100vh;
  padding: 28rpx 24rpx 0;
}

.ambient {
  position: absolute;
  border-radius: 999rpx;
  pointer-events: none;
  filter: blur(28rpx);
}

.ambient--glow {
  top: 46rpx;
  right: -80rpx;
  width: 300rpx;
  height: 300rpx;
  background: var(--theme-glow);
}

.ambient--moon {
  top: 330rpx;
  left: -70rpx;
  width: 230rpx;
  height: 230rpx;
  background: rgba(255, 255, 255, 0.74);
}

.page-header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
  margin-bottom: 26rpx;
}

.page-header__title {
  display: block;
  font-size: 72rpx;
  font-weight: 500;
  color: var(--theme-text-primary);
  font-family:
    'Iowan Old Style',
    'Times New Roman',
    'Noto Serif SC',
    serif;
}

.page-header__subtitle,
.page-header__theme,
.section__meta,
.section__link {
  font-size: 24rpx;
  line-height: 1.7;
  color: var(--theme-text-secondary);
}

.page-header__theme {
  margin-top: 16rpx;
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  color: var(--theme-primary);
  background: var(--theme-tag-bg);
}

.search-row {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 132rpx;
  gap: 14rpx;
  margin-bottom: 18rpx;
}

.search-box,
.filter-button,
.fit-pill,
.hero-banner,
.section,
.filter-sheet {
  border: 1rpx solid var(--theme-border);
  box-shadow: var(--theme-shadow-soft);
}

.search-box,
.filter-button,
.fit-pill {
  min-height: 82rpx;
  border-radius: 999rpx;
  background: var(--theme-surface);
}

.search-box {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 14rpx;
  padding: 0 24rpx;
}

.search-box__icon,
.search-box__clear,
.filter-button__icon {
  font-size: 24rpx;
  color: var(--theme-primary);
}

.search-box__input {
  min-width: 0;
  font-size: 26rpx;
  color: var(--theme-text-primary);
}

.search-box__placeholder {
  color: var(--theme-text-tertiary);
}

.filter-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  font-size: 26rpx;
  color: var(--theme-text-primary);
}

.fit-pill {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12rpx;
  width: fit-content;
  margin: 0 0 20rpx auto;
  padding: 0 22rpx;
  font-size: 24rpx;
  color: var(--theme-text-primary);
}

.fit-pill__icon,
.fit-pill__arrow {
  color: var(--theme-primary);
}

.hero-banner {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 240rpx;
  min-height: 250rpx;
  gap: 20rpx;
  margin-bottom: 28rpx;
  padding: 34rpx;
  overflow: hidden;
  border-radius: 36rpx;
  background:
    radial-gradient(circle at 78% 34%, rgba(255, 255, 255, 0.92), transparent 24%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.84) 0%, var(--theme-soft) 100%);
  box-shadow: var(--theme-shadow);
}

.hero-banner__copy {
  display: grid;
  gap: 12rpx;
  align-content: center;
}

.hero-banner__eyebrow {
  font-size: 22rpx;
  letter-spacing: 0.16em;
  color: var(--theme-primary);
}

.hero-banner__title {
  font-size: 42rpx;
  font-weight: 500;
  line-height: 1.25;
  color: var(--theme-text-primary);
}

.hero-banner__summary {
  font-size: 26rpx;
  line-height: 1.7;
  color: var(--theme-text-secondary);
}

.hero-banner__cta {
  margin-top: 6rpx;
  font-size: 26rpx;
  color: var(--theme-primary);
}

.hero-banner__art {
  position: relative;
  min-height: 200rpx;
}

.hero-banner__moon,
.hero-banner__lotus {
  position: absolute;
  border-radius: 50%;
}

.hero-banner__moon {
  inset: 16rpx 0 auto auto;
  width: 210rpx;
  height: 210rpx;
  background:
    radial-gradient(circle at 32% 30%, rgba(255, 255, 255, 0.96), transparent 30%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, var(--theme-soft) 100%);
}

.hero-banner__lotus {
  right: 54rpx;
  bottom: 20rpx;
  display: grid;
  place-items: center;
  width: 98rpx;
  height: 98rpx;
  color: var(--theme-primary);
  background: rgba(255, 255, 255, 0.6);
}

.section {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 18rpx;
  margin-bottom: 28rpx;
}

.section__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16rpx;
}

.section__title {
  font-size: 40rpx;
  font-weight: 500;
  color: var(--theme-text-primary);
}

.section__link {
  color: var(--theme-primary);
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18rpx;
}

.feature-card {
  position: relative;
  display: grid;
  grid-template-columns: 84rpx minmax(0, 1fr) auto;
  gap: 16rpx;
  min-height: 164rpx;
  padding: 24rpx;
  border-radius: 30rpx;
  background: var(--theme-surface);
  border: 1rpx solid var(--theme-border);
  box-shadow: var(--theme-shadow-soft);
}

.feature-card__icon,
.content-card__cover {
  display: grid;
  place-items: center;
  border-radius: 26rpx;
  color: var(--theme-primary);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, var(--theme-soft) 100%);
}

.feature-card__icon {
  width: 84rpx;
  height: 84rpx;
  font-size: 30rpx;
  font-weight: 600;
}

.feature-card__copy {
  display: grid;
  gap: 8rpx;
}

.feature-card__title,
.content-card__title,
.topic-card__title {
  font-size: 30rpx;
  font-weight: 500;
  color: var(--theme-text-primary);
}

.feature-card__desc,
.content-card__desc,
.topic-card__summary,
.content-card__meta {
  font-size: 22rpx;
  line-height: 1.6;
  color: var(--theme-text-secondary);
}

.feature-card__arrow {
  color: var(--theme-text-tertiary);
}

.topic-scroll {
  width: 100%;
  white-space: nowrap;
}

.topic-track {
  display: inline-flex;
  gap: 16rpx;
  padding-bottom: 4rpx;
}

.topic-card {
  display: inline-grid;
  gap: 10rpx;
  width: 214rpx;
  min-height: 126rpx;
  padding: 24rpx;
  border-radius: 28rpx;
  background: var(--theme-surface);
  border: 1rpx solid var(--theme-border);
  box-shadow: var(--theme-shadow-soft);
  white-space: normal;
}

.topic-card__tag,
.content-card__tag {
  width: fit-content;
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  font-size: 20rpx;
  color: var(--theme-primary);
  background: var(--theme-tag-bg);
}

.content-list {
  display: grid;
  gap: 16rpx;
}

.content-card {
  display: grid;
  grid-template-columns: 132rpx minmax(0, 1fr) 104rpx;
  gap: 18rpx;
  align-items: center;
  padding: 18rpx;
  border-radius: 30rpx;
  background: var(--theme-surface);
  border: 1rpx solid var(--theme-border);
  box-shadow: var(--theme-shadow-soft);
}

.content-card__cover {
  width: 132rpx;
  height: 104rpx;
  font-size: 34rpx;
  font-weight: 600;
}

.content-card__body {
  display: grid;
  gap: 8rpx;
}

.content-card__head {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.content-card__button {
  display: grid;
  place-items: center;
  min-height: 64rpx;
  padding: 0;
  border-radius: 999rpx;
  font-size: 24rpx;
  color: var(--theme-primary);
  background: transparent;
  border: 1rpx solid var(--theme-primary);
}

.content-card__button::after {
  border: none;
}

.filter-mask {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  align-items: flex-end;
  padding: 24rpx;
  background: rgba(47, 58, 74, 0.22);
}

.filter-sheet {
  display: grid;
  gap: 26rpx;
  width: 100%;
  padding: 30rpx;
  border-radius: 34rpx;
  background: var(--theme-surface-strong);
}

.filter-sheet__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.filter-sheet__title,
.filter-group__title {
  font-size: 32rpx;
  font-weight: 500;
  color: var(--theme-text-primary);
}

.filter-sheet__close {
  font-size: 24rpx;
  color: var(--theme-primary);
}

.filter-group {
  display: grid;
  gap: 14rpx;
}

.filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
}

.filter-chip {
  padding: 14rpx 20rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  color: var(--theme-text-secondary);
  background: var(--theme-surface-muted);
}

.filter-chip--active {
  color: #ffffff;
  background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-accent) 100%);
}

.filter-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
}

.filter-actions__reset,
.filter-actions__confirm {
  min-height: 76rpx;
  border-radius: 999rpx;
  font-size: 26rpx;
}

.filter-actions__reset {
  color: var(--theme-primary);
  background: var(--theme-tag-bg);
}

.filter-actions__confirm {
  color: #ffffff;
  background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-accent) 100%);
}

.filter-actions__reset::after,
.filter-actions__confirm::after {
  border: none;
}
</style>
