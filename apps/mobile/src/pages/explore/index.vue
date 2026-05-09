<template>
  <view class="explore-shell" :style="themeVars">
    <view class="explore-page">
      <view class="explore-top">
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

        <button class="filter-button" @tap="showFilter = true">
          <text class="filter-button__icon">筛</text>
        </button>
      </view>

      <view class="focus-panel" @tap="open(exploreData.banner.route)">
        <view class="focus-panel__content">
          <view class="focus-panel__topline">
            <text class="focus-panel__eyebrow">{{ exploreData.banner.eyebrow }}</text>
            <text class="focus-panel__fit">{{ exploreData.todayFit.text }}</text>
          </view>
          <text class="focus-panel__title">{{ exploreData.banner.title }}</text>
          <text class="focus-panel__summary">{{ exploreData.banner.summary }}</text>
          <view class="focus-panel__action">
            <text>{{ exploreData.banner.ctaText }}</text>
            <text>→</text>
          </view>
        </view>

        <view class="focus-panel__visual">
          <text>{{ exploreData.banner.icon }}</text>
        </view>
      </view>

      <scroll-view class="type-strip" scroll-x :show-scrollbar="false">
        <view class="type-strip__track">
          <view
            v-for="item in typeFilters"
            :key="item.value"
            class="type-chip"
            :class="{ 'type-chip--active': selectedType === item.value }"
            @tap="selectedType = item.value"
          >
            <text>{{ item.label }}</text>
          </view>
        </view>
      </scroll-view>

      <view v-if="hasActiveFilters" class="result-note">
        <text>{{ visibleResultCount }} 项匹配当前条件</text>
        <text class="result-note__reset" @tap="resetDiscovery">清空</text>
      </view>

      <view class="explore-section">
        <view class="explore-section__head">
          <text class="explore-section__title">常用工具</text>
          <text class="explore-section__meta">{{ filteredFeatures.length }} 项</text>
        </view>

        <view v-if="filteredFeatures.length" class="tool-stack">
          <view class="tool-grid">
            <view
              v-for="item in primaryFeatures"
              :key="item.id"
              class="tool-tile"
              @tap="open(item.route)"
            >
              <button
                class="favorite-icon"
                :class="{ 'favorite-icon--active': isFavorited(`feature:${item.id}`) }"
                @tap.stop="handleFeatureFavorite(item)"
              >
                {{ isFavorited(`feature:${item.id}`) ? '★' : '☆' }}
              </button>
              <view class="tool-tile__icon">{{ item.icon }}</view>
              <text class="tool-tile__title">{{ item.title }}</text>
              <text class="tool-tile__desc">{{ item.description }}</text>
            </view>
          </view>

          <view v-if="secondaryFeatures.length" class="tool-list">
            <view
              v-for="item in secondaryFeatures"
              :key="item.id"
              class="tool-row"
              @tap="open(item.route)"
            >
              <view class="tool-row__icon">{{ item.icon }}</view>
              <view class="tool-row__body">
                <text class="tool-row__title">{{ item.title }}</text>
                <text class="tool-row__desc">{{ item.description }}</text>
              </view>
              <button
                class="favorite-icon favorite-icon--row"
                :class="{ 'favorite-icon--active': isFavorited(`feature:${item.id}`) }"
                @tap.stop="handleFeatureFavorite(item)"
              >
                {{ isFavorited(`feature:${item.id}`) ? '★' : '☆' }}
              </button>
              <text class="tool-row__arrow">›</text>
            </view>
          </view>
        </view>

        <view v-else class="empty-state">
          <text class="empty-state__title">没有匹配的工具</text>
          <text class="empty-state__text">换一个分类或清空筛选后再看看。</text>
        </view>
      </view>

      <view v-if="topics.length" class="explore-section">
        <view class="explore-section__head">
          <text class="explore-section__title">今日专题</text>
          <text class="explore-section__link">全部专题 ›</text>
        </view>

        <scroll-view class="topic-scroll" scroll-x :show-scrollbar="false">
          <view class="topic-track">
            <view
              v-for="topic in topics"
              :key="topic.id"
              class="topic-pill"
              @tap="open(topic.route)"
            >
              <view class="topic-pill__head">
                <text class="topic-pill__tag">{{ topic.tag }}</text>
                <button
                  class="favorite-icon favorite-icon--topic"
                  :class="{ 'favorite-icon--active': isFavorited(`topic:${topic.id}`) }"
                  @tap.stop="handleTopicFavorite(topic)"
                >
                  {{ isFavorited(`topic:${topic.id}`) ? '★' : '☆' }}
                </button>
              </view>
              <text class="topic-pill__title">{{ topic.title }}</text>
              <text class="topic-pill__summary">{{ topic.summary }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <view class="explore-section">
        <view class="explore-section__head">
          <text class="explore-section__title">精选内容</text>
          <text class="explore-section__link">更多内容 ›</text>
        </view>

        <view v-if="filteredContents.length" class="content-list">
          <view
            v-for="item in filteredContents"
            :key="item.id"
            class="content-row"
            @tap="open(item.route)"
          >
            <view class="content-row__cover">
              <text>{{ item.icon }}</text>
            </view>

            <view class="content-row__body">
              <view class="content-row__head">
                <text class="content-row__title">{{ item.title }}</text>
                <text class="content-row__tag">{{ item.type }}</text>
              </view>
              <text class="content-row__desc">{{ item.description }}</text>
              <text class="content-row__meta">{{ item.sourceLabel }} · {{ item.duration }} · {{ item.stat }}</text>
            </view>

            <button
              class="favorite-icon favorite-icon--row"
              :class="{ 'favorite-icon--active': isFavorited(item.id) }"
              @tap.stop="handleFavorite(item)"
            >
              {{ isFavorited(item.id) ? '★' : '☆' }}
            </button>
            <text class="content-row__arrow">›</text>
          </view>
        </view>

        <view v-else class="empty-state">
          <text class="empty-state__title">没有匹配的内容</text>
          <text class="empty-state__text">调整筛选条件，或尝试搜索其他关键词。</text>
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

        <view class="filter-group">
          <text class="filter-group__title">排序</text>
          <view class="filter-options">
            <view
              v-for="item in sortFilters"
              :key="item.value"
              class="filter-chip"
              :class="{ 'filter-chip--active': selectedSort === item.value }"
              @tap="selectedSort = item.value"
            >
              <text>{{ item.label }}</text>
            </view>
          </view>
        </view>

        <view class="filter-actions">
          <button class="filter-actions__reset" @tap="resetDiscovery">重置</button>
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
import { fetchFavorites, toggleFavorite } from '../../api/favorites';
import AppTabBar from '../../components/AppTabBar.vue';
import { useThemePreference } from '../../composables/useThemePreference';
import { getErrorMessage } from '../../services/errors';
import { getAuthToken } from '../../services/session';
import { usePageStateStore } from '../../stores/page-state';
import type {
  ExploreContentItem,
  ExploreFeatureItem,
  ExploreIndexData,
  ExploreFilterOption,
  ExploreTopicItem,
} from '../../types/explore';

type FilterType = 'all' | 'test' | 'meditation' | 'zodiac' | 'bazi' | 'journal' | 'content';
type SortType = ExploreIndexData['defaultSort'];

const { themeVars } = useThemePreference();
const pageStateStore = usePageStateStore();
let lastExploreVersion = pageStateStore.versionOf('explore');

const keyword = ref('');
const showFilter = ref(false);
const selectedType = ref<FilterType>('all');
const selectedGoals = ref<string[]>([]);
const selectedSort = ref<SortType>('recommended');
const searchedKeyword = ref('');
const favoriteKeys = ref<string[]>([]);

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
    sorts: [
      { label: '推荐优先', value: 'recommended' },
      { label: '搜索相关', value: 'related' },
      { label: '最新上架', value: 'latest' },
    ],
  },
  defaultSort: 'recommended',
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
const sortFilters = computed<Array<ExploreFilterOption & { value: SortType }>>(() =>
  exploreData.value.filters.sorts.map((item) => ({
    ...item,
    value:
      item.value === 'latest' || item.value === 'related'
        ? item.value
        : 'recommended',
  })),
);
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

const primaryFeatures = computed(() => filteredFeatures.value.slice(0, 4));
const secondaryFeatures = computed(() => filteredFeatures.value.slice(4));

const filteredContents = computed(() =>
  sortContentItems(
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
  ),
);

const visibleResultCount = computed(
  () => filteredFeatures.value.length + topics.value.length + filteredContents.value.length,
);

const hasActiveFilters = computed(
  () =>
    Boolean(normalizedKeyword.value) ||
    selectedType.value !== 'all' ||
    selectedGoals.value.length > 0 ||
    selectedSort.value !== (exploreData.value.defaultSort || 'recommended'),
);

async function loadExploreIndex() {
  try {
    const response = await fetchExploreIndex();
    exploreData.value = response.data;
    selectedSort.value = response.data.defaultSort || 'recommended';
    lastExploreVersion = pageStateStore.versionOf('explore');
  } catch (error) {
    console.warn('load explore index failed', error);
    exploreData.value = fallbackExploreData;
    uni.showToast({
      title: getErrorMessage(error, '探索数据加载失败'),
      icon: 'none',
    });
  }
}

async function loadFavoritesState() {
  if (!getAuthToken()) {
    favoriteKeys.value = [];
    return;
  }

  try {
    const response = await fetchFavorites();
    favoriteKeys.value = response.data.items.map((item) => item.itemKey);
  } catch (error) {
    console.warn('load favorites state failed', error);
    favoriteKeys.value = [];
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

function isFavorited(itemKey: string) {
  return favoriteKeys.value.includes(itemKey);
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

function resetDiscovery() {
  resetFilters();
  clearKeyword();
  selectedSort.value = exploreData.value.defaultSort || 'recommended';
  showFilter.value = false;
}

async function loadExploreSearch(nextKeyword: string) {
  try {
    const response = await fetchExploreSearch({
      keyword: nextKeyword,
      type: selectedType.value === 'all' ? undefined : selectedType.value,
      goal: selectedGoals.value,
      sort: selectedSort.value,
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

function sortContentItems(items: ExploreContentItem[]) {
  const list = [...items];

  if (selectedSort.value === 'latest') {
    return list.sort((left, right) => compareDate(right.publishedAt, left.publishedAt));
  }

  if (selectedSort.value === 'related') {
    return list.sort((left, right) => computeKeywordScore(right) - computeKeywordScore(left));
  }

  return list.sort((left, right) => {
    const rightScore = resolveSourcePriority(right.sourceType) * 10 + computeKeywordScore(right);
    const leftScore = resolveSourcePriority(left.sourceType) * 10 + computeKeywordScore(left);

    if (rightScore !== leftScore) {
      return rightScore - leftScore;
    }

    return compareDate(right.publishedAt, left.publishedAt);
  });
}

function computeKeywordScore(item: ExploreContentItem) {
  if (!normalizedKeyword.value) {
    return 0;
  }

  const keywordValue = normalizedKeyword.value;
  const title = item.title.toLowerCase();
  const contentText = `${item.title} ${item.description} ${item.sourceLabel}`.toLowerCase();

  if (title === keywordValue) {
    return 16;
  }

  if (title.includes(keywordValue)) {
    return 10;
  }

  if (contentText.includes(keywordValue)) {
    return 6;
  }

  return 0;
}

function resolveSourcePriority(sourceType: ExploreContentItem['sourceType']) {
  switch (sourceType) {
    case 'assessment_test':
      return 6;
    case 'fortune_content':
      return 5;
    case 'report_template':
      return 4;
    case 'lucky_item':
      return 3;
    default:
      return 1;
  }
}

function compareDate(left: string | null, right: string | null) {
  const leftTime = left ? new Date(left).getTime() : 0;
  const rightTime = right ? new Date(right).getTime() : 0;
  return leftTime - rightTime;
}

async function handleFavorite(item: ExploreContentItem) {
  await toggleFavoriteEntry({
    itemType: item.sourceType,
    itemKey: item.id,
    title: item.title,
    summary: item.description,
    icon: item.icon,
    route: item.route,
    extraJson: {
      type: item.type,
      filterType: item.filterType,
    },
  });
}

async function handleFeatureFavorite(item: ExploreFeatureItem) {
  await toggleFavoriteEntry({
    itemType: 'explore_feature',
    itemKey: `feature:${item.id}`,
    title: item.title,
    summary: item.description,
    icon: item.icon,
    route: item.route,
    extraJson: {
      type: item.type,
    },
  });
}

async function handleTopicFavorite(item: ExploreTopicItem) {
  await toggleFavoriteEntry({
    itemType: 'explore_topic',
    itemKey: `topic:${item.id}`,
    title: item.title,
    summary: item.summary,
    icon: item.tag.slice(0, 2),
    route: item.route,
    extraJson: {
      tag: item.tag,
      publishedAt: item.publishedAt,
    },
  });
}

async function toggleFavoriteEntry(input: {
  itemType: string;
  itemKey: string;
  title: string;
  summary?: string;
  icon?: string;
  route: string;
  extraJson?: Record<string, unknown>;
}) {
  if (!getAuthToken()) {
    uni.navigateTo({
      url: '/pages/profile/index',
    });
    return;
  }

  try {
    const response = await toggleFavorite({
      itemType: input.itemType,
      itemKey: input.itemKey,
      title: input.title,
      summary: input.summary,
      icon: input.icon,
      route: input.route,
      extraJson: input.extraJson,
    });

    if (response.data.active) {
      favoriteKeys.value = Array.from(new Set([...favoriteKeys.value, input.itemKey]));
    } else {
      favoriteKeys.value = favoriteKeys.value.filter((key) => key !== input.itemKey);
    }
    pageStateStore.markDirty(['records', 'profile', 'favorites']);

    uni.showToast({
      title: response.data.active ? '已收藏' : '已取消',
      icon: 'none',
    });
  } catch (error) {
    console.warn('toggle favorite failed', error);
    uni.showToast({
      title: getErrorMessage(error, '收藏失败'),
      icon: 'none',
    });
  }
}

onLoad(() => {
  void loadExploreIndex();
  void loadFavoritesState();
});

onShow(() => {
  if (pageStateStore.versionOf('explore') !== lastExploreVersion) {
    void loadExploreIndex();
    void loadFavoritesState();
  }
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

.sort-row {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.sort-row__label {
  font-size: 22rpx;
  color: var(--theme-text-secondary);
}

.sort-row__chips {
  display: flex;
  gap: 12rpx;
  flex-wrap: wrap;
}

.sort-chip {
  padding: 12rpx 20rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  color: var(--theme-text-secondary);
  background: var(--theme-surface);
  border: 1rpx solid var(--theme-border);
}

.sort-chip--active {
  color: var(--theme-primary);
  background: var(--theme-tag-bg);
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

.feature-card__actions {
  display: grid;
  justify-items: end;
  gap: 10rpx;
}

.feature-card__favorite,
.topic-card__favorite {
  min-height: 50rpx;
  padding: 0 18rpx;
  border-radius: 999rpx;
  font-size: 20rpx;
  color: var(--theme-text-secondary);
  background: var(--theme-surface-muted);
}

.feature-card__favorite--active,
.topic-card__favorite--active {
  color: var(--theme-primary);
  background: var(--theme-tag-bg);
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

.topic-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.content-list {
  display: grid;
  gap: 16rpx;
}

.content-card {
  display: grid;
  grid-template-columns: 132rpx minmax(0, 1fr) 124rpx;
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

.content-card__actions {
  display: grid;
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

.content-card__favorite {
  min-height: 56rpx;
  padding: 0;
  border-radius: 999rpx;
  font-size: 22rpx;
  color: var(--theme-text-secondary);
  background: var(--theme-surface-muted);
}

.content-card__favorite--active {
  color: var(--theme-primary);
  background: var(--theme-tag-bg);
}

.content-card__favorite::after,
.content-card__button::after,
.feature-card__favorite::after,
.topic-card__favorite::after {
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

<style lang="scss" scoped>

.explore-shell {
  min-height: 100vh;
  padding-bottom: 148rpx;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.72) 0%, rgba(255, 255, 255, 0) 36%),
    linear-gradient(180deg, var(--theme-page-top) 0%, var(--theme-page-bottom) 100%);
}

.explore-page {
  min-height: 100vh;
  padding: 22rpx 24rpx 0;
  box-sizing: border-box;
}

.explore-shell button {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  line-height: 1;
}

.explore-top {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 82rpx;
  gap: 14rpx;
  margin-bottom: 20rpx;
}

.explore-page .search-box {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 14rpx;
  min-height: 78rpx;
  padding: 0 22rpx;
  border: 1rpx solid rgba(var(--theme-text-primary-rgb), 0.06);
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: none;
  backdrop-filter: blur(18rpx);
}

.explore-page .search-box__icon {
  font-size: 28rpx;
  color: var(--theme-primary);
}

.explore-page .search-box__input {
  min-width: 0;
  height: 78rpx;
  font-size: 26rpx;
  color: var(--theme-text-primary);
}

.explore-page .search-box__placeholder {
  color: var(--theme-text-tertiary);
}

.explore-page .search-box__clear {
  font-size: 23rpx;
  color: var(--theme-primary);
}

.explore-page .filter-button {
  display: grid;
  place-items: center;
  width: 82rpx;
  height: 78rpx;
  min-height: 0;
  border: 1rpx solid rgba(var(--theme-text-primary-rgb), 0.06);
  border-radius: 24rpx;
  color: var(--theme-primary);
  background: rgba(255, 255, 255, 0.72);
  box-shadow: none;
  backdrop-filter: blur(18rpx);
}

.explore-page .filter-button__icon {
  font-size: 25rpx;
  color: var(--theme-primary);
}

.focus-panel {
  position: relative;
  min-height: 286rpx;
  padding: 30rpx;
  box-sizing: border-box;
  overflow: hidden;
  border: 1rpx solid rgba(255, 255, 255, 0.86);
  border-radius: 32rpx;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.72) 48%, var(--theme-soft) 100%);
  box-shadow: 0 22rpx 52rpx rgba(var(--theme-text-primary-rgb), 0.08);
  animation: exploreRise 360ms ease both;
}

.focus-panel__content {
  display: grid;
  gap: 12rpx;
  padding-right: 128rpx;
}

.focus-panel__topline {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10rpx;
}

.focus-panel__eyebrow,
.focus-panel__fit {
  font-size: 22rpx;
  line-height: 1.45;
}

.focus-panel__eyebrow {
  color: var(--theme-primary);
  font-weight: 600;
}

.focus-panel__fit {
  max-width: 420rpx;
  color: var(--theme-text-secondary);
}

.focus-panel__title {
  font-size: 42rpx;
  font-weight: 650;
  line-height: 1.22;
  color: var(--theme-text-primary);
  word-break: break-word;
}

.focus-panel__summary {
  font-size: 25rpx;
  line-height: 1.7;
  color: var(--theme-text-secondary);
}

.focus-panel__action {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  width: fit-content;
  min-height: 58rpx;
  margin-top: 6rpx;
  padding: 0 22rpx;
  border-radius: 18rpx;
  font-size: 25rpx;
  font-weight: 600;
  color: #ffffff;
  background: var(--theme-primary);
}

.focus-panel__visual {
  position: absolute;
  right: 30rpx;
  bottom: 28rpx;
  display: grid;
  place-items: center;
  width: 106rpx;
  height: 106rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.88);
  border-radius: 34rpx;
  color: var(--theme-primary);
  font-size: 38rpx;
  font-weight: 650;
  background: rgba(255, 255, 255, 0.64);
}

.type-strip {
  width: 100%;
  margin: 18rpx 0 22rpx;
  white-space: nowrap;
  animation: exploreRise 360ms 40ms ease both;
}

.type-strip__track {
  display: inline-flex;
  gap: 12rpx;
  padding: 2rpx 2rpx 6rpx;
}

.type-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 56rpx;
  padding: 0 22rpx;
  border: 1rpx solid rgba(var(--theme-text-primary-rgb), 0.06);
  border-radius: 18rpx;
  font-size: 24rpx;
  color: var(--theme-text-secondary);
  background: rgba(255, 255, 255, 0.66);
}

.type-chip--active {
  color: #ffffff;
  border-color: var(--theme-primary);
  background: var(--theme-primary);
}

.result-note {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin: -4rpx 2rpx 22rpx;
  font-size: 23rpx;
  color: var(--theme-text-secondary);
}

.result-note__reset {
  color: var(--theme-primary);
}

.explore-section {
  margin-top: 30rpx;
  animation: exploreRise 360ms 80ms ease both;
}

.explore-section__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 18rpx;
  margin-bottom: 16rpx;
}

.explore-section__title {
  font-size: 34rpx;
  font-weight: 650;
  line-height: 1.3;
  color: var(--theme-text-primary);
}

.explore-section__meta,
.explore-section__link {
  font-size: 23rpx;
  line-height: 1.5;
  color: var(--theme-text-secondary);
}

.explore-section__link {
  color: var(--theme-primary);
}

.tool-stack {
  display: grid;
  gap: 14rpx;
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
}

.tool-tile {
  position: relative;
  display: grid;
  align-content: start;
  gap: 10rpx;
  min-height: 178rpx;
  padding: 22rpx;
  box-sizing: border-box;
  border: 1rpx solid rgba(var(--theme-text-primary-rgb), 0.06);
  border-radius: 26rpx;
  background: rgba(255, 255, 255, 0.74);
  box-shadow: 0 10rpx 28rpx rgba(var(--theme-text-primary-rgb), 0.055);
  transition: transform 160ms ease, background-color 160ms ease;
}

.tool-tile:active,
.tool-row:active,
.topic-pill:active,
.content-row:active,
.focus-panel:active {
  transform: scale(0.985);
}

.tool-tile__icon,
.tool-row__icon,
.content-row__cover {
  display: grid;
  place-items: center;
  color: var(--theme-primary);
  background: var(--theme-tag-bg);
}

.tool-tile__icon {
  width: 56rpx;
  height: 56rpx;
  border-radius: 18rpx;
  font-size: 26rpx;
  font-weight: 650;
}

.tool-tile__title,
.tool-row__title,
.topic-pill__title,
.content-row__title,
.empty-state__title {
  color: var(--theme-text-primary);
  font-weight: 600;
  word-break: break-word;
}

.tool-tile__title {
  padding-right: 48rpx;
  font-size: 29rpx;
  line-height: 1.34;
}

.tool-tile__desc,
.tool-row__desc,
.topic-pill__summary,
.content-row__desc,
.content-row__meta,
.empty-state__text {
  color: var(--theme-text-secondary);
  word-break: break-word;
}

.tool-tile__desc {
  display: -webkit-box;
  overflow: hidden;
  font-size: 22rpx;
  line-height: 1.55;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.favorite-icon {
  position: absolute;
  top: 14rpx;
  right: 14rpx;
  display: grid;
  place-items: center;
  width: 46rpx;
  height: 46rpx;
  min-height: 0;
  border-radius: 16rpx;
  font-size: 24rpx;
  color: var(--theme-text-tertiary);
  background: transparent;
}

.favorite-icon--active {
  color: var(--theme-primary);
  background: var(--theme-tag-bg);
}

.favorite-icon--row,
.favorite-icon--topic {
  position: static;
}

.tool-list,
.content-list {
  border: 1rpx solid rgba(var(--theme-text-primary-rgb), 0.06);
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.66);
  box-shadow: 0 10rpx 28rpx rgba(var(--theme-text-primary-rgb), 0.045);
}

.tool-list {
  padding: 4rpx 18rpx;
}

.tool-row {
  display: grid;
  grid-template-columns: 56rpx minmax(0, 1fr) 46rpx auto;
  gap: 16rpx;
  align-items: center;
  min-height: 92rpx;
  padding: 16rpx 0;
  border-bottom: 1rpx solid rgba(var(--theme-text-primary-rgb), 0.06);
  transition: transform 160ms ease, background-color 160ms ease;
}

.tool-row:last-child,
.content-row:last-child {
  border-bottom: 0;
}

.tool-row__icon {
  width: 56rpx;
  height: 56rpx;
  border-radius: 18rpx;
  font-size: 24rpx;
  font-weight: 650;
}

.tool-row__body,
.content-row__body {
  display: grid;
  gap: 6rpx;
  min-width: 0;
}

.tool-row__title {
  font-size: 28rpx;
  line-height: 1.35;
}

.tool-row__desc {
  overflow: hidden;
  font-size: 22rpx;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tool-row__arrow,
.content-row__arrow {
  color: var(--theme-text-tertiary);
  font-size: 32rpx;
}

.explore-page .topic-scroll {
  width: 100%;
  white-space: nowrap;
}

.explore-page .topic-track {
  display: inline-flex;
  gap: 14rpx;
  padding: 2rpx 2rpx 8rpx;
}

.topic-pill {
  display: inline-grid;
  gap: 12rpx;
  width: 270rpx;
  min-height: 156rpx;
  padding: 22rpx;
  box-sizing: border-box;
  border: 1rpx solid rgba(var(--theme-text-primary-rgb), 0.06);
  border-radius: 26rpx;
  background: rgba(255, 255, 255, 0.68);
  white-space: normal;
  transition: transform 160ms ease, background-color 160ms ease;
}

.topic-pill__head,
.content-row__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10rpx;
  min-width: 0;
}

.topic-pill__tag,
.content-row__tag {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  max-width: 100%;
  min-height: 38rpx;
  padding: 0 12rpx;
  border-radius: 12rpx;
  font-size: 20rpx;
  color: var(--theme-primary);
  background: var(--theme-tag-bg);
}

.topic-pill__title {
  font-size: 29rpx;
  line-height: 1.3;
}

.topic-pill__summary {
  display: -webkit-box;
  overflow: hidden;
  font-size: 22rpx;
  line-height: 1.5;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.content-list {
  display: grid;
  gap: 0;
  padding: 4rpx 18rpx;
}

.content-row {
  display: grid;
  grid-template-columns: 72rpx minmax(0, 1fr) 46rpx auto;
  gap: 16rpx;
  align-items: center;
  min-height: 118rpx;
  padding: 18rpx 0;
  border-bottom: 1rpx solid rgba(var(--theme-text-primary-rgb), 0.06);
  transition: transform 160ms ease, background-color 160ms ease;
}

.content-row__cover {
  width: 72rpx;
  height: 72rpx;
  border-radius: 22rpx;
  font-size: 28rpx;
  font-weight: 650;
}

.content-row__title {
  min-width: 0;
  overflow: hidden;
  font-size: 28rpx;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.content-row__tag {
  flex: 0 0 auto;
}

.content-row__desc {
  display: -webkit-box;
  overflow: hidden;
  font-size: 22rpx;
  line-height: 1.5;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.content-row__meta {
  overflow: hidden;
  font-size: 20rpx;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.explore-page .empty-state {
  display: grid;
  gap: 10rpx;
  padding: 24rpx;
  border: 1rpx solid rgba(var(--theme-text-primary-rgb), 0.06);
  border-radius: 26rpx;
  background: rgba(255, 255, 255, 0.66);
  box-shadow: none;
}

.explore-page .empty-state__title {
  font-size: 28rpx;
  line-height: 1.4;
}

.explore-page .empty-state__text {
  font-size: 23rpx;
  line-height: 1.6;
}

.explore-shell .filter-mask {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  align-items: flex-end;
  padding: 24rpx;
  box-sizing: border-box;
  background: rgba(var(--theme-text-primary-rgb), 0.22);
}

.explore-shell .filter-sheet {
  display: grid;
  gap: 26rpx;
  width: 100%;
  padding: 30rpx;
  box-sizing: border-box;
  border: 1rpx solid rgba(255, 255, 255, 0.86);
  border-radius: 34rpx;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 24rpx 60rpx rgba(var(--theme-text-primary-rgb), 0.14);
  animation: sheetUp 220ms ease both;
}

.explore-shell .filter-sheet__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.explore-shell .filter-sheet__title,
.explore-shell .filter-group__title {
  font-size: 31rpx;
  font-weight: 650;
  color: var(--theme-text-primary);
}

.explore-shell .filter-sheet__close {
  font-size: 24rpx;
  color: var(--theme-primary);
}

.explore-shell .filter-group {
  display: grid;
  gap: 14rpx;
}

.explore-shell .filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.explore-shell .filter-chip {
  display: inline-flex;
  align-items: center;
  min-height: 58rpx;
  padding: 0 20rpx;
  border: 1rpx solid rgba(var(--theme-text-primary-rgb), 0.06);
  border-radius: 18rpx;
  font-size: 24rpx;
  color: var(--theme-text-secondary);
  background: rgba(var(--theme-text-primary-rgb), 0.03);
}

.explore-shell .filter-chip--active {
  color: #ffffff;
  border-color: var(--theme-primary);
  background: var(--theme-primary);
}

.explore-shell .filter-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
}

.explore-shell .filter-actions__reset,
.explore-shell .filter-actions__confirm {
  display: grid;
  place-items: center;
  min-height: 78rpx;
  border-radius: 22rpx;
  font-size: 26rpx;
}

.explore-shell .filter-actions__reset {
  color: var(--theme-primary);
  background: var(--theme-tag-bg);
}

.explore-shell .filter-actions__confirm {
  color: #ffffff;
  background: var(--theme-primary);
}

.explore-shell .filter-button::after,
.explore-shell .favorite-icon::after,
.explore-shell .filter-actions__reset::after,
.explore-shell .filter-actions__confirm::after {
  border: none;
}

@keyframes exploreRise {
  from {
    opacity: 0;
    transform: translateY(14rpx);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes sheetUp {
  from {
    opacity: 0;
    transform: translateY(28rpx);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
