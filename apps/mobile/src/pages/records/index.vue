<template>
  <view class="page-shell" :style="themeVars">
    <view class="page">
      <view class="ambient ambient--glow"></view>
      <view class="ambient ambient--moon"></view>

      <view class="record-nav">
        <button class="record-nav__home" @tap="goHome">
          <view class="nav-home-glyph"></view>
        </button>
        <text class="record-nav__title">记录</text>
        <view class="record-nav__right">
          <!-- #ifndef MP-WEIXIN -->
          <view class="record-nav__capsule">
            <text class="record-nav__dots">•••</text>
            <view class="record-nav__divider"></view>
            <view class="record-nav__target"></view>
          </view>
          <!-- #endif -->
        </view>
      </view>

      <view class="record-hero">
        <view class="record-hero__copy">
          <text class="record-hero__title">记录</text>
          <text class="record-hero__subtitle">看见自己的情绪轨迹与疗愈变化</text>
        </view>
        <view class="record-hero__theme">
          <view class="record-hero__theme-icon">
            <view class="theme-flower"></view>
          </view>
          <text>{{ themePalette.name }}</text>
        </view>
      </view>

      <view class="tab-shell">
        <view
          v-for="tab in recordTabs"
          :key="tab.value"
          class="tab-item"
          :class="{ 'tab-item--active': activeTab === tab.value }"
          @tap="activeTab = tab.value"
        >
          <view class="tab-item__icon" :class="`tab-item__icon--${tab.value}`"></view>
          <text>{{ tab.label }}</text>
        </view>
      </view>

      <view class="overview-card">
        <view class="overview-card__copy">
          <view class="overview-card__eyebrow">
            <view class="spark-glyph"></view>
            <text>本周记录概览</text>
          </view>
          <text class="overview-card__title">{{ overview.encouragement }}</text>
          <view class="overview-card__sprig"></view>
          <button class="overview-card__button" @tap="continueRecord">{{ overview.actionText }}</button>
        </view>

        <view class="overview-card__stats">
          <view
            v-for="stat in overviewStats"
            :key="stat.label"
            class="overview-card__stat"
            :class="`overview-card__stat--${stat.tone}`"
          >
            <view class="overview-card__stat-icon">
              <text>{{ stat.icon }}</text>
            </view>
            <view>
              <text class="overview-card__stat-value">{{ stat.value }}</text>
              <text class="overview-card__stat-label">{{ stat.label }}</text>
            </view>
          </view>
        </view>
      </view>

      <view v-if="activeTab === 'meditation'" class="section">
        <view class="section__head">
          <text class="section__title">冥想洞察</text>
          <text class="section__meta">{{ meditationStats.insight }}</text>
        </view>

        <view class="meditation-insight">
          <view class="meditation-insight__primary">
            <text class="meditation-insight__label">本周练习</text>
            <text class="meditation-insight__value">{{ meditationStats.weeklyCount }}次</text>
            <text class="meditation-insight__text">{{ meditationStats.weeklyMinutes }} 分钟</text>
          </view>

          <view class="meditation-insight__grid">
            <view
              v-for="item in meditationStatCards"
              :key="item.label"
              class="meditation-insight__item"
            >
              <text class="meditation-insight__item-value">{{ item.value }}</text>
              <text class="meditation-insight__item-label">{{ item.label }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="section section--calendar">
        <view class="section__head">
          <view class="section__title-row">
            <view class="section__title-icon">
              <view class="calendar-glyph"></view>
            </view>
            <text class="section__title">心情打卡</text>
          </view>
          <view class="month-switch">
            <text class="month-switch__arrow">‹</text>
            <text>{{ currentMonthLabel }}</text>
            <text class="month-switch__arrow">›</text>
          </view>
        </view>

        <view class="weekday-row">
          <text v-for="day in weekdays" :key="day">{{ day }}</text>
        </view>

        <view class="calendar-grid">
          <view
            v-for="day in calendarDays"
            :key="day.date"
            class="calendar-day"
            :class="{
              'calendar-day--selected': day.isSelected,
              [`calendar-day--${day.moodType}`]: day.hasRecord,
            }"
            @tap="selectedDate = day.date"
          >
            <text class="calendar-day__num">{{ day.day }}</text>
            <view v-if="day.hasRecord" class="calendar-day__dot"></view>
          </view>
        </view>

        <view class="mood-legend">
          <view
            v-for="item in moodLegends"
            :key="item.type"
            class="mood-legend__item"
          >
            <view class="mood-legend__dot" :class="`mood-legend__dot--${item.type}`"></view>
            <text>{{ item.label }}</text>
          </view>
        </view>
      </view>

      <view class="section section--trend">
        <view class="section__head">
          <view class="section__title-row">
            <view class="section__title-icon">
              <view class="trend-glyph"></view>
            </view>
            <text class="section__title">情绪趋势</text>
          </view>
          <text class="section__meta">{{ recordOverview.trend.summary }}</text>
        </view>

        <view class="trend-card">
          <view class="trend-card__axis">
            <text>愉悦</text>
            <text>平静</text>
            <text>低落</text>
          </view>

          <view class="trend-card__plot">
            <view class="trend-card__grid trend-card__grid--top"></view>
            <view class="trend-card__grid trend-card__grid--mid"></view>
            <view class="trend-card__area"></view>
            <view
              v-for="segment in trendSegments"
              :key="segment.key"
              class="trend-card__segment"
              :style="{
                left: `${segment.x}%`,
                top: `${segment.y}%`,
                width: `${segment.length}%`,
                transform: `rotate(${segment.angle}deg)`,
              }"
            ></view>
            <view
              v-for="point in actualTrendPoints"
              :key="point.day"
              class="trend-card__point"
              :class="`trend-card__point--${point.mood}`"
              :style="{ left: `${point.x}%`, top: `${point.y}%` }"
            >
              <text>{{ point.shortLabel }}</text>
            </view>
          </view>

          <view class="trend-card__labels">
            <text v-for="point in trendPoints" :key="point.day">{{ point.day }}</text>
          </view>
        </view>
      </view>

      <view class="keyword-card" @tap="continueRecord">
        <view class="keyword-card__icon">
          <view class="bulb-glyph"></view>
        </view>
        <view class="keyword-card__copy">
          <text class="keyword-card__title">本周关键词：{{ growth.monthKeywords }}</text>
          <text class="keyword-card__text">每一次记录，都是走向更好自己的重要一步。</text>
        </view>
        <text class="keyword-card__arrow">›</text>
      </view>
    </view>

    <AppTabBar current-tab="record" />
  </view>
</template>

<script setup lang="ts">
import { onLoad, onShow } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import AppTabBar from '../../components/AppTabBar.vue';
import { fetchRecordOverview } from '../../api/records';
import { useThemePreference } from '../../composables/useThemePreference';
import { getErrorMessage, handleAuthExpired } from '../../services/errors';
import { clearSession, getAuthToken } from '../../services/session';
import { usePageStateStore } from '../../stores/page-state';
import type {
  MeditationLogItem,
  MoodJournalItem,
  RecordOverviewData,
  UnifiedRecordItem,
} from '../../types/records';

type RecordTab = 'emotion' | 'test' | 'meditation';
type RecentDisplayItem = {
  id: string;
  icon: string;
  title: string;
  tag: string;
  summary: string;
  time: string;
  route: string;
};
const fallbackOverviewData: RecordOverviewData = {
  isLoggedIn: false,
  overview: {
    recordedDays: 8,
    emotionalStability: 78,
    healingProgress: 86,
    encouragement: '你正在慢慢靠近更平和的自己',
    actionText: '继续记录',
  },
  calendar: {
    monthLabel: `${new Date().getFullYear()}年${new Date().getMonth() + 1}月`,
    weekdays: ['一', '二', '三', '四', '五', '六', '日'],
    days: [],
    legend: [
      { type: 'calm', label: '平静' },
      { type: 'low', label: '低落' },
      { type: 'anxious', label: '焦虑' },
      { type: 'happy', label: '愉悦' },
      { type: 'tired', label: '疲惫' },
    ],
  },
  trend: {
    summary: '继续记录几天后，就能看到更清晰的变化曲线',
    hasEnoughData: false,
    points: [],
  },
  moodRecords: [],
  testRecords: [],
  meditationRecords: [],
  meditationStats: {
    weeklyCount: 0,
    weeklyMinutes: 0,
    totalCount: 0,
    totalMinutes: 0,
    favoriteCategory: '暂无',
    favoriteCategoryCount: 0,
    improvementRate: 0,
    improvedCount: 0,
    bestAfterState: '暂无',
    insight: '登录后会根据冥想记录生成练习洞察。',
  },
  growth: {
    continuousDays: 0,
    monthKeywords: '放松 · 接纳 · 修复',
  },
  favorites: [
    {
      id: 'sleep',
      title: '睡前呼吸音频',
      description: '温柔呼吸，安心入眠',
      icon: '眠',
      action: '播放',
      route: '/pages/emotion/index',
    },
    {
      id: 'reset',
      title: '情绪复位练习',
      description: '平复情绪，找回平衡',
      icon: '莲',
      action: '练习',
      route: '/pages/emotion/index',
    },
  ],
};

const loading = ref(false);
const authToken = ref(getAuthToken());
const activeTab = ref<RecordTab>('emotion');
const selectedDate = ref(buildLocalDateString(new Date()));
const { themePalette, themeVars } = useThemePreference();
const recordOverview = ref<RecordOverviewData>(fallbackOverviewData);

const recordTabs: Array<{ label: string; value: RecordTab }> = [
  { label: '情绪日记', value: 'emotion' },
  { label: '测试记录', value: 'test' },
  { label: '冥想足迹', value: 'meditation' },
];
const isLoggedIn = computed(() => recordOverview.value.isLoggedIn);
const weekdays = computed(() => recordOverview.value.calendar.weekdays);
const moodLegends = computed(() => recordOverview.value.calendar.legend);
const growth = computed(() => recordOverview.value.growth);
const overview = computed(() => recordOverview.value.overview);
const currentMonthLabel = computed(() => recordOverview.value.calendar.monthLabel);
const pageStateStore = usePageStateStore();
let lastRecordsVersion = pageStateStore.versionOf('records');

const moodRecords = computed(() => recordOverview.value.moodRecords);
const testRecords = computed(() => recordOverview.value.testRecords);
const meditationRecords = computed(() => recordOverview.value.meditationRecords);
const meditationStats = computed(
  () => recordOverview.value.meditationStats ?? fallbackOverviewData.meditationStats,
);
const meditationStatCards = computed(() => [
  {
    label: '累计练习',
    value: `${meditationStats.value.totalMinutes}分钟`,
  },
  {
    label: '常用分类',
    value: meditationStats.value.favoriteCategory,
  },
  {
    label: '状态改善',
    value: `${meditationStats.value.improvementRate}%`,
  },
  {
    label: '常见练后',
    value: meditationStats.value.bestAfterState,
  },
]);

const visibleRecentRecords = computed<RecentDisplayItem[]>(() => {
  if (activeTab.value === 'emotion') {
    return moodRecords.value.slice(0, 4).map((item) => ({
      id: item.id,
      icon: '情',
      title: `${item.recordDate} · 情绪日记`,
      tag: moodLabel(item.moodType),
      summary: item.content || '记录了今天的心情。',
      time: formatTime(item.updatedAt),
      route: item.route,
    }));
  }

  if (activeTab.value === 'test') {
    return testRecords.value.slice(0, 4).map((item) => ({
      id: item.id,
      icon: recordIcon(item.recordType),
      title: item.title,
      tag: item.level || item.recordTypeLabel,
      summary: item.summary || item.subtitle || item.detailHint,
      time: formatTime(item.completedAt),
      route: item.route,
    }));
  }

  return meditationRecords.value.slice(0, 4).map((item) => ({
    id: item.id,
    icon: '静',
    title: item.title,
    tag: `${meditationCategoryLabel(item)} · ${item.durationMinutes} 分钟 · ${meditationStatusLabel(item.completionStatus)}`,
    summary: buildMeditationSummary(item),
    time: formatTime(item.updatedAt),
    route: item.route,
  }));
});

const overviewStats = computed(() => [
  {
    label: '已记录',
    value: `${overview.value.recordedDays}天`,
    icon: '日',
    tone: 'calendar',
  },
  {
    label: '情绪稳定度',
    value: `${overview.value.emotionalStability}%`,
    icon: '心',
    tone: 'heart',
  },
  {
    label: '疗愈进度',
    value: `${overview.value.healingProgress}`,
    icon: '章',
    tone: 'medal',
  },
]);

const calendarDays = computed(() =>
  (recordOverview.value.calendar.days.length
    ? recordOverview.value.calendar.days
    : buildFallbackCalendarDays()
  ).map((day) => ({
    ...day,
    isSelected: day.date === selectedDate.value,
  })),
);

const trendPoints = computed(() => {
  const list = recordOverview.value.trend.hasEnoughData
    ? recordOverview.value.trend.points
    : buildFallbackTrendPoints();
  const actualValues = list
    .map((item) => item.value)
    .filter((value): value is number => value !== null);
  const maxValue = Math.max(...actualValues, 100);

  return list.map((point, index) => ({
    ...point,
    x: list.length === 1 ? 50 : 6 + (index / (list.length - 1)) * 88,
    y:
      point.value === null
        ? 74
        : 16 + ((maxValue - point.value) / maxValue) * 58,
    mood: resolveTrendMood(point.value),
    shortLabel: resolveTrendShortLabel(point.value),
  }));
});
const actualTrendPoints = computed(() =>
  trendPoints.value.filter((point) => point.value !== null),
);
const trendSegments = computed(() => {
  const points = actualTrendPoints.value;

  return points.slice(0, -1).map((point, index) => {
    const next = points[index + 1];
    const dx = next.x - point.x;
    const dy = next.y - point.y;

    return {
      key: `${point.day}-${next.day}`,
      x: point.x,
      y: point.y,
      length: Math.sqrt(dx * dx + dy * dy),
      angle: Math.atan2(dy * 0.48, dx) * (180 / Math.PI),
    };
  });
});

const emptyRecordTitle = computed(() => {
  if (activeTab.value === 'emotion') {
    return '还没有情绪日记';
  }

  if (activeTab.value === 'test') {
    return '还没有测试记录';
  }

  return '还没有冥想足迹';
});

const emptyRecordText = computed(() => {
  if (!isLoggedIn.value) {
    return '登录后记录会自动保存到这里。';
  }

  if (activeTab.value === 'emotion') {
    return '完成一次情绪自检或日记后，就能在这里回看。';
  }

  if (activeTab.value === 'test') {
    return '完成心理测试、八字或星座报告后，这里会展示结果。';
  }

  return '开始一次放松练习后，这里会记录你的疗愈足迹。';
});

async function loadRecordOverview() {
  try {
    loading.value = true;
    const response = await fetchRecordOverview();
    recordOverview.value = response.data;
    lastRecordsVersion = pageStateStore.versionOf('records');
    if (!response.data.isLoggedIn && authToken.value) {
      clearSession();
      authToken.value = '';
    }
  } catch (error) {
    console.warn('load record overview failed', error);
    recordOverview.value = fallbackOverviewData;
    if (handleAuthExpired(error, true)) {
      authToken.value = '';
      return;
    }
    if (authToken.value) {
      uni.showToast({
        title: getErrorMessage(error, '记录读取失败'),
        icon: 'none',
      });
    }
  } finally {
    loading.value = false;
  }
}

function open(route: string) {
  uni.navigateTo({
    url: route,
  });
}

function goHome() {
  uni.redirectTo({
    url: '/pages/index/index',
  });
}

function openRecord(item: RecentDisplayItem | UnifiedRecordItem | MoodJournalItem | MeditationLogItem) {
  open(item.route);
}

function continueRecord() {
  if (!isLoggedIn.value) {
    goProfile();
    return;
  }

  if (activeTab.value === 'test') {
    open('/pages/emotion/index');
    return;
  }

  if (activeTab.value === 'meditation') {
    open('/pages/meditation/index');
    return;
  }

  open(`/pages/journal/index?recordDate=${encodeURIComponent(selectedDate.value)}`);
}

function goProfile() {
  open('/pages/profile/index');
}

function recordIcon(recordType: string) {
  if (recordType === 'mood_journal') {
    return '情';
  }

  if (recordType === 'bazi') {
    return '卦';
  }

  if (recordType === 'zodiac') {
    return '星';
  }

  return '测';
}

function moodLabel(moodType: string) {
  const mapping: Record<string, string> = {
    calm: '平静',
    low: '低落',
    anxious: '焦虑',
    happy: '愉悦',
    tired: '疲惫',
  };

  return mapping[moodType] || '今日状态';
}

function resolveTrendMood(value: number | null) {
  if (value === null) {
    return 'calm';
  }

  if (value >= 80) {
    return 'happy';
  }

  if (value >= 65) {
    return 'calm';
  }

  if (value >= 50) {
    return 'tired';
  }

  return value >= 35 ? 'low' : 'anxious';
}

function resolveTrendShortLabel(value: number | null) {
  return moodLabel(resolveTrendMood(value)).slice(0, 1);
}

function meditationStatusLabel(status: string) {
  const mapping: Record<string, string> = {
    completed: '完整完成',
    partial: '完成一半',
    skipped: '已跳过',
  };

  return mapping[status] || '已记录';
}

function meditationCategoryLabel(item: MeditationLogItem) {
  const mapping: Record<string, string> = {
    meditation: '基础静心',
    sleep: '睡前安睡',
    breath: '呼吸减压',
    focus: '专注启动',
    healing: '情绪修复',
    body: '身体扫描',
  };

  return item.categoryLabel || mapping[item.category] || '冥想练习';
}

function meditationMoodLabel(value: string) {
  const mapping: Record<string, string> = {
    tense: '紧绷',
    tired: '疲惫',
    anxious: '焦虑',
    scattered: '分心',
    calm: '平稳',
    settled: '更平静',
    clear: '更清晰',
    relaxed: '放松了',
    sleepy: '有点困',
    unchanged: '变化不大',
  };

  return mapping[value] || value;
}

function buildMeditationSummary(item: MeditationLogItem) {
  const leadingParts = [
    item.intention ? `目标：${item.intention}` : '',
    item.moodAfter ? `练后：${meditationMoodLabel(item.moodAfter)}` : '',
    item.focusScore ? `专注 ${item.focusScore}/5` : '',
  ].filter(Boolean);
  const detail = item.insight || item.summary || item.bodySignal || item.nextAction;

  if (leadingParts.length && detail) {
    return `${leadingParts.slice(0, 2).join(' · ')} · ${detail}`;
  }

  if (leadingParts.length) {
    return leadingParts.join(' · ');
  }

  return detail || `${item.sourceTitle || meditationCategoryLabel(item)} 练习`;
}

function formatTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const hour = `${date.getHours()}`.padStart(2, '0');
  const minute = `${date.getMinutes()}`.padStart(2, '0');
  return `${hour}:${minute}`;
}

function buildLocalDateString(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildFallbackCalendarDays() {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 12);
  const moodSequence = [
    'calm',
    'low',
    'tired',
    'calm',
    'happy',
    'tired',
    'anxious',
    'calm',
  ] as const;

  return Array.from({ length: 14 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const hasRecord = index >= 2 && index <= 9;

    return {
      date: buildLocalDateString(date),
      day: date.getDate(),
      moodType: moodSequence[Math.max(0, index - 2)] ?? 'calm',
      hasRecord,
    };
  });
}

function buildFallbackTrendPoints() {
  const today = new Date();
  const values = [62, 72, 55, 78, 66, 48, 70];

  return values.map((value, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - values.length + 1 + index);
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');

    return {
      day: `${month}/${day}`,
      value,
    };
  });
}

onLoad(() => {
  void loadRecordOverview();
});

onShow(() => {
  const latestToken = getAuthToken();
  if (latestToken !== authToken.value) {
    authToken.value = latestToken;
    pageStateStore.markDirty('records');
  }
  if (pageStateStore.versionOf('records') !== lastRecordsVersion) {
    void loadRecordOverview();
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
  top: 70rpx;
  right: -78rpx;
  width: 300rpx;
  height: 300rpx;
  background: var(--theme-glow);
}

.ambient--moon {
  top: 420rpx;
  left: -80rpx;
  width: 230rpx;
  height: 230rpx;
  background: rgba(255, 255, 255, 0.72);
}

.page-header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
  margin-bottom: 22rpx;
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
.section__link,
.month-switch {
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

.tab-shell {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8rpx;
  margin-bottom: 20rpx;
  padding: 8rpx;
  border-radius: 999rpx;
  background: var(--theme-surface);
  border: 1rpx solid var(--theme-border);
  box-shadow: var(--theme-shadow-soft);
}

.tab-item {
  display: grid;
  place-items: center;
  min-height: 66rpx;
  border-radius: 999rpx;
  font-size: 26rpx;
  color: var(--theme-text-secondary);
}

.tab-item--active {
  color: var(--theme-primary);
  background: var(--theme-tag-bg);
  box-shadow: var(--theme-shadow-soft);
}

.overview-card {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 214rpx;
  gap: 22rpx;
  margin-bottom: 18rpx;
  padding: 34rpx;
  overflow: hidden;
  border-radius: 38rpx;
  background:
    radial-gradient(circle at 82% 30%, rgba(255, 255, 255, 0.9), transparent 24%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.84) 0%, var(--theme-soft) 100%);
  border: 1rpx solid var(--theme-border);
  box-shadow: var(--theme-shadow);
}

.overview-card__copy {
  display: grid;
  gap: 14rpx;
}

.overview-card__eyebrow,
.section__link,
.record-row__tag {
  font-size: 22rpx;
  color: var(--theme-primary);
}

.overview-card__title {
  font-size: 38rpx;
  line-height: 1.35;
  font-weight: 500;
  color: var(--theme-text-primary);
}

.overview-card__button,
.login-card__button,
.empty-state__button {
  width: fit-content;
  min-height: 70rpx;
  margin: 0;
  padding: 0 28rpx;
  border-radius: 999rpx;
  line-height: 70rpx;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.96);
  background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-accent) 100%);
}

.overview-card__button::after,
.login-card__button::after,
.empty-state__button::after {
  border: none;
}

.overview-card__stats {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 12rpx;
}

.overview-card__stat {
  display: grid;
  gap: 4rpx;
  padding: 16rpx;
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.56);
}

.overview-card__stat-value {
  font-size: 36rpx;
  color: var(--theme-text-primary);
}

.overview-card__stat-label {
  font-size: 20rpx;
  color: var(--theme-text-secondary);
}

.overview-card__art {
  position: absolute;
  right: 32rpx;
  bottom: 24rpx;
  width: 180rpx;
  height: 180rpx;
  pointer-events: none;
}

.overview-card__moon,
.overview-card__lotus {
  position: absolute;
  border-radius: 50%;
}

.overview-card__moon {
  inset: 0;
  background:
    radial-gradient(circle at 32% 32%, rgba(255, 255, 255, 0.96), transparent 30%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, var(--theme-soft) 100%);
}

.overview-card__lotus {
  inset: 46rpx;
  display: grid;
  place-items: center;
  color: var(--theme-primary);
  background: rgba(255, 255, 255, 0.5);
}

.login-card,
.calendar-card,
.trend-card,
.empty-state,
.record-row,
.growth-card,
.favorite-card {
  border: 1rpx solid var(--theme-border);
  background: var(--theme-surface);
  box-shadow: var(--theme-shadow-soft);
}

.login-card {
  display: grid;
  gap: 12rpx;
  margin-bottom: 24rpx;
  padding: 28rpx;
  border-radius: 32rpx;
}

.login-card__title,
.section__title,
.empty-state__title,
.growth-card__value {
  font-size: 38rpx;
  font-weight: 500;
  color: var(--theme-text-primary);
}

.login-card__text,
.empty-state__text,
.growth-card__text,
.favorite-card__text {
  font-size: 24rpx;
  line-height: 1.7;
  color: var(--theme-text-secondary);
}

.meditation-insight {
  display: grid;
  grid-template-columns: 210rpx minmax(0, 1fr);
  gap: 16rpx;
  padding: 22rpx;
  border-radius: 30rpx;
  border: 1rpx solid var(--theme-border);
  background: var(--theme-surface);
  box-shadow: var(--theme-shadow-soft);
}

.meditation-insight__primary {
  display: grid;
  align-content: center;
  gap: 8rpx;
  min-height: 184rpx;
  padding: 22rpx;
  border-radius: 24rpx;
  color: rgba(255, 255, 255, 0.96);
  background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-accent) 100%);
}

.meditation-insight__label,
.meditation-insight__text {
  font-size: 22rpx;
  line-height: 1.5;
  opacity: 0.86;
}

.meditation-insight__value {
  font-size: 48rpx;
  font-weight: 600;
}

.meditation-insight__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12rpx;
}

.meditation-insight__item {
  display: grid;
  align-content: center;
  gap: 6rpx;
  min-height: 86rpx;
  padding: 16rpx;
  border-radius: 20rpx;
  background: var(--theme-surface-muted);
}

.meditation-insight__item-value {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--theme-text-primary);
}

.meditation-insight__item-label {
  font-size: 21rpx;
  color: var(--theme-text-secondary);
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

.month-switch {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.month-switch__arrow {
  color: var(--theme-primary);
}

.calendar-card,
.trend-card {
  display: grid;
  gap: 18rpx;
  padding: 26rpx;
  border-radius: 32rpx;
}

.weekday-row,
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 10rpx;
}

.weekday-row {
  text-align: center;
  font-size: 22rpx;
  color: var(--theme-text-secondary);
}

.calendar-day {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 58rpx;
  border-radius: 50%;
  color: var(--theme-text-secondary);
}

.calendar-day--selected {
  color: rgba(255, 255, 255, 0.96);
  background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-accent) 100%);
}

.calendar-day__num {
  font-size: 24rpx;
}

.calendar-day__dot {
  position: absolute;
  bottom: 6rpx;
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  background: currentColor;
}

.calendar-day--calm {
  color: rgba(var(--theme-primary-rgb), 0.74);
}

.calendar-day--low {
  color: rgba(var(--theme-text-secondary-rgb), 0.78);
}

.calendar-day--anxious {
  color: rgba(var(--theme-accent-rgb), 0.92);
}

.calendar-day--happy {
  color: rgba(var(--theme-primary-rgb), 0.58);
}

.calendar-day--tired {
  color: rgba(var(--theme-text-secondary-rgb), 0.62);
}

.mood-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx 22rpx;
  padding-top: 8rpx;
}

.mood-legend__item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 22rpx;
  color: var(--theme-text-secondary);
}

.mood-legend__dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
}

.mood-legend__dot--calm {
  background: rgba(var(--theme-primary-rgb), 0.78);
}

.mood-legend__dot--low {
  background: rgba(var(--theme-text-secondary-rgb), 0.82);
}

.mood-legend__dot--anxious {
  background: rgba(var(--theme-accent-rgb), 0.9);
}

.mood-legend__dot--happy {
  background: rgba(var(--theme-primary-rgb), 0.56);
}

.mood-legend__dot--tired {
  background: rgba(var(--theme-text-secondary-rgb), 0.58);
}

.trend-card {
  grid-template-columns: 70rpx minmax(0, 1fr);
}

.trend-card__axis {
  display: grid;
  align-content: space-between;
  min-height: 210rpx;
  font-size: 22rpx;
  color: var(--theme-text-secondary);
}

.trend-card__plot {
  position: relative;
  min-height: 210rpx;
  overflow: hidden;
  border-radius: 24rpx;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.38) 0%, var(--theme-soft) 100%);
}

.trend-card__grid {
  position: absolute;
  left: 0;
  right: 0;
  border-top: 1rpx dashed rgba(var(--theme-text-secondary-rgb), 0.22);
}

.trend-card__grid--top {
  top: 30%;
}

.trend-card__grid--mid {
  top: 62%;
}

.trend-card__area {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 54%;
  background: linear-gradient(180deg, var(--theme-glow) 0%, rgba(255, 255, 255, 0) 100%);
  clip-path: polygon(0 68%, 18% 48%, 34% 64%, 50% 36%, 66% 48%, 82% 24%, 100% 32%, 100% 100%, 0 100%);
}

.trend-card__point {
  position: absolute;
  width: 18rpx;
  height: 18rpx;
  margin: -9rpx 0 0 -9rpx;
  border-radius: 50%;
  background: var(--theme-primary);
  box-shadow: 0 0 0 8rpx rgba(255, 255, 255, 0.62);
}

.trend-card__labels {
  grid-column: 2;
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4rpx;
  text-align: center;
  font-size: 20rpx;
  color: var(--theme-text-secondary);
}

.record-list {
  display: grid;
  gap: 14rpx;
}

.record-row {
  display: grid;
  grid-template-columns: 76rpx minmax(0, 1fr) auto;
  gap: 16rpx;
  align-items: center;
  padding: 20rpx;
  border-radius: 28rpx;
}

.record-row__icon,
.favorite-card__icon {
  display: grid;
  place-items: center;
  border-radius: 24rpx;
  color: var(--theme-primary);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, var(--theme-soft) 100%);
}

.record-row__icon {
  width: 76rpx;
  height: 76rpx;
}

.record-row__body {
  display: grid;
  gap: 8rpx;
}

.record-row__head {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.record-row__title,
.favorite-card__title,
.growth-card__keyword {
  font-size: 28rpx;
  color: var(--theme-text-primary);
}

.record-row__tag {
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  background: var(--theme-tag-bg);
}

.record-row__summary,
.record-row__time,
.growth-card__label {
  font-size: 22rpx;
  line-height: 1.6;
  color: var(--theme-text-secondary);
}

.empty-state {
  display: grid;
  gap: 12rpx;
  padding: 30rpx;
  border-radius: 30rpx;
}

.growth-grid,
.favorite-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
}

.growth-card {
  display: grid;
  gap: 12rpx;
  min-height: 140rpx;
  padding: 26rpx;
  border-radius: 30rpx;
}

.growth-card--wide {
  background:
    radial-gradient(circle at 88% 28%, var(--theme-glow), transparent 30%),
    var(--theme-surface);
}

.favorite-card {
  display: grid;
  grid-template-columns: 70rpx minmax(0, 1fr);
  gap: 14rpx;
  padding: 18rpx;
  border-radius: 28rpx;
}

.favorite-card__icon {
  width: 70rpx;
  height: 70rpx;
}

.favorite-card__title,
.favorite-card__text {
  display: block;
}

.favorite-card__action {
  grid-column: 2;
  width: fit-content;
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  color: var(--theme-primary);
  background: var(--theme-tag-bg);
}

.page-shell {
  background:
    radial-gradient(circle at 14% 4%, rgba(var(--theme-accent-rgb), 0.16), transparent 26%),
    radial-gradient(circle at 100% 26%, rgba(var(--theme-primary-rgb), 0.08), transparent 28%),
    linear-gradient(180deg, var(--theme-page-top) 0%, var(--theme-page-bottom) 100%);
}

.page {
  padding: calc(var(--status-bar-height) + 14rpx) 26rpx 26rpx;
}

.ambient--glow {
  top: 92rpx;
  right: -92rpx;
  width: 318rpx;
  height: 318rpx;
  background: var(--theme-glow);
}

.ambient--moon {
  top: 360rpx;
  left: -84rpx;
  width: 232rpx;
  height: 232rpx;
  background: rgba(255, 255, 255, 0.7);
}

.record-nav {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 88rpx minmax(0, 1fr) 186rpx;
  align-items: center;
  min-height: 76rpx;
}

.record-nav__home,
.record-nav__home::after,
.record-nav__home::before {
  border: none;
}

.record-nav__home {
  display: grid;
  place-items: center;
  width: 62rpx;
  height: 62rpx;
  padding: 0;
  border-radius: 50%;
  color: var(--theme-text-primary);
  background: rgba(var(--theme-text-secondary-rgb), 0.12);
}

.nav-home-glyph {
  position: relative;
  width: 34rpx;
  height: 34rpx;
}

.nav-home-glyph::before,
.nav-home-glyph::after {
  content: '';
  position: absolute;
  border: 4rpx solid currentColor;
}

.nav-home-glyph::before {
  left: 3rpx;
  top: 9rpx;
  width: 24rpx;
  height: 22rpx;
  border-top: 0;
  border-radius: 4rpx;
}

.nav-home-glyph::after {
  left: 6rpx;
  top: 1rpx;
  width: 20rpx;
  height: 20rpx;
  border-right: 0;
  border-bottom: 0;
  transform: rotate(45deg);
  border-radius: 4rpx 0 0;
}

.record-nav__title {
  justify-self: center;
  font-size: 34rpx;
  font-weight: 700;
  color: var(--theme-text-primary);
}

.record-nav__right {
  display: flex;
  justify-content: flex-end;
}

.record-nav__capsule {
  display: flex;
  align-items: center;
  justify-content: space-around;
  width: 170rpx;
  height: 62rpx;
  border: 1rpx solid rgba(var(--theme-text-secondary-rgb), 0.18);
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 8rpx 22rpx rgba(var(--theme-text-primary-rgb), 0.06);
}

.record-nav__dots {
  font-size: 34rpx;
  line-height: 1;
  letter-spacing: 2rpx;
  color: var(--theme-text-primary);
  transform: translateY(-3rpx);
}

.record-nav__divider {
  width: 1rpx;
  height: 36rpx;
  background: rgba(var(--theme-text-secondary-rgb), 0.14);
}

.record-nav__target {
  position: relative;
  width: 34rpx;
  height: 34rpx;
  border: 5rpx solid currentColor;
  border-radius: 50%;
  color: var(--theme-text-primary);
}

.record-nav__target::after {
  content: '';
  position: absolute;
  inset: 7rpx;
  border-radius: 50%;
  background: currentColor;
}

.record-hero {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
  margin-top: 8rpx;
  margin-bottom: 20rpx;
}

.record-hero__copy {
  display: grid;
  min-width: 0;
  gap: 10rpx;
}

.record-hero__title {
  font-size: 70rpx;
  line-height: 0.95;
  font-weight: 700;
  color: var(--theme-text-primary);
  font-family:
    'Iowan Old Style',
    'Times New Roman',
    'Noto Serif SC',
    serif;
}

.record-hero__subtitle {
  font-size: 24rpx;
  line-height: 1.7;
  color: var(--theme-text-secondary);
}

.record-hero__theme {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 12rpx;
  padding: 14rpx 20rpx 14rpx 14rpx;
  border-radius: 999rpx;
  border: 1rpx solid rgba(var(--theme-primary-rgb), 0.12);
  color: var(--theme-text-primary);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.86), rgba(255, 255, 255, 0.56)),
    rgba(var(--theme-primary-rgb), 0.06);
}

.record-hero__theme-icon {
  display: grid;
  place-items: center;
  width: 50rpx;
  height: 50rpx;
  border-radius: 50%;
  color: var(--theme-primary);
  background: rgba(var(--theme-primary-rgb), 0.12);
}

.theme-flower {
  position: relative;
  width: 28rpx;
  height: 28rpx;
  color: currentColor;
}

.theme-flower::before,
.theme-flower::after {
  content: '';
  position: absolute;
  border-radius: 50%;
}

.theme-flower::before {
  inset: 0;
  border: 3rpx solid currentColor;
}

.theme-flower::after {
  left: 8rpx;
  top: 8rpx;
  width: 12rpx;
  height: 12rpx;
  background: currentColor;
}

.tab-shell {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8rpx;
  margin-bottom: 24rpx;
  padding: 8rpx;
  border-radius: 999rpx;
  border: 1rpx solid var(--theme-border);
  background: var(--theme-surface-strong);
  box-shadow: var(--theme-shadow-soft);
}

.tab-item {
  display: grid;
  justify-items: center;
  gap: 6rpx;
  min-height: 56rpx;
  padding: 8rpx 8rpx 4rpx;
  border-radius: 999rpx;
  color: var(--theme-text-secondary);
  font-size: 24rpx;
}

.tab-item--active {
  color: rgba(255, 255, 255, 0.96);
  background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-accent) 100%);
  box-shadow: 0 14rpx 28rpx rgba(var(--theme-primary-rgb), 0.2);
}

.tab-item__icon {
  position: relative;
  width: 34rpx;
  height: 28rpx;
  color: currentColor;
}

.tab-item__icon::before,
.tab-item__icon::after {
  content: '';
  position: absolute;
  box-sizing: border-box;
}

.tab-item__icon--emotion {
  width: 30rpx;
  height: 26rpx;
  border: 3rpx solid currentColor;
  border-radius: 5rpx 5rpx 7rpx 7rpx;
}

.tab-item__icon--emotion::before {
  left: 14rpx;
  top: 2rpx;
  width: 2rpx;
  height: 18rpx;
  background: currentColor;
}

.tab-item__icon--emotion::after {
  left: 6rpx;
  right: 6rpx;
  top: 9rpx;
  height: 2rpx;
  background: currentColor;
  opacity: 0.7;
}

.tab-item__icon--test {
  width: 28rpx;
  height: 32rpx;
  border: 3rpx solid currentColor;
  border-radius: 5rpx;
}

.tab-item__icon--test::before {
  left: 6rpx;
  right: 6rpx;
  top: -5rpx;
  height: 8rpx;
  border: 3rpx solid currentColor;
  border-bottom: 0;
  border-radius: 999rpx 999rpx 0 0;
  background: transparent;
}

.tab-item__icon--test::after {
  left: 6rpx;
  right: 6rpx;
  top: 12rpx;
  height: 2rpx;
  background: currentColor;
  box-shadow: 0 8rpx 0 currentColor;
  opacity: 0.72;
}

.tab-item__icon--meditation {
  width: 34rpx;
  height: 24rpx;
  border-bottom: 3rpx solid currentColor;
  border-radius: 0 0 18rpx 18rpx;
}

.tab-item__icon--meditation::before {
  left: 3rpx;
  right: 3rpx;
  top: 1rpx;
  height: 18rpx;
  border: 3rpx solid currentColor;
  border-bottom: 0;
  border-radius: 18rpx 18rpx 0 0;
}

.tab-item__icon--meditation::after {
  left: 12rpx;
  top: -4rpx;
  width: 10rpx;
  height: 20rpx;
  border: 3rpx solid currentColor;
  border-bottom: 0;
  border-radius: 50% 50% 0 0;
  transform: rotate(0deg);
}

.overview-card {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 224rpx;
  gap: 16rpx;
  margin-bottom: 16rpx;
  padding: 18rpx 22rpx;
  border-radius: 36rpx;
  border: 1rpx solid var(--theme-border);
  background:
    radial-gradient(circle at 86% 20%, rgba(255, 255, 255, 0.9), transparent 24%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.88) 0%, rgba(var(--theme-primary-rgb), 0.04) 100%);
  box-shadow: var(--theme-shadow);
}

.overview-card__copy {
  display: grid;
  gap: 12rpx;
}

.overview-card__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 10rpx;
  font-size: 22rpx;
  color: var(--theme-primary);
}

.spark-glyph {
  position: relative;
  width: 20rpx;
  height: 20rpx;
  color: currentColor;
  background: currentColor;
  clip-path: polygon(50% 0, 64% 36%, 100% 50%, 64% 64%, 50% 100%, 36% 64%, 0 50%, 36% 36%);
}

.overview-card__title {
  max-width: 360rpx;
  font-size: 35rpx;
  line-height: 1.22;
  font-weight: 700;
  color: var(--theme-text-primary);
}

.overview-card__sprig {
  width: 62rpx;
  height: 32rpx;
  margin-top: -6rpx;
  margin-left: auto;
  border-right: 4rpx solid rgba(var(--theme-primary-rgb), 0.2);
  border-bottom: 4rpx solid rgba(var(--theme-primary-rgb), 0.2);
  border-radius: 0 0 26rpx 0;
  transform: rotate(24deg);
  opacity: 0.68;
}

.overview-card__button,
.empty-state__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  min-height: 58rpx;
  margin: 0;
  padding: 0 30rpx;
  border-radius: 999rpx;
  line-height: 1;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.96);
  background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-accent) 100%);
  box-shadow: 0 16rpx 30rpx rgba(var(--theme-primary-rgb), 0.24);
}

.overview-card__button::after,
.empty-state__button::after {
  border: none;
}

.overview-card__stats {
  display: grid;
  gap: 12rpx;
}

.overview-card__stat {
  --stat-rgb: var(--theme-primary-rgb);
  display: grid;
  grid-template-columns: 58rpx minmax(0, 1fr);
  align-items: center;
  gap: 12rpx;
  min-height: 58rpx;
  padding: 10rpx 12rpx;
  border-radius: 24rpx;
  border: 1rpx solid rgba(var(--stat-rgb), 0.12);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.86), rgba(255, 255, 255, 0.56)),
    rgba(var(--stat-rgb), 0.08);
}

.overview-card__stat--calendar {
  --stat-rgb: var(--theme-primary-rgb);
}

.overview-card__stat--heart {
  --stat-rgb: var(--theme-accent-rgb);
}

.overview-card__stat--medal {
  --stat-rgb: var(--theme-primary-rgb);
}

.overview-card__stat-icon {
  display: grid;
  place-items: center;
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  color: rgb(var(--stat-rgb));
  background: rgba(var(--stat-rgb), 0.14);
  font-size: 24rpx;
  font-weight: 700;
}

.overview-card__stat-value {
  display: block;
  font-size: 30rpx;
  line-height: 1.05;
  font-weight: 700;
  color: var(--theme-text-primary);
}

.overview-card__stat-label {
  display: block;
  margin-top: 4rpx;
  font-size: 20rpx;
  color: var(--theme-text-secondary);
}

.section {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 10rpx;
  margin-bottom: 14rpx;
  padding: 16rpx 20rpx 14rpx;
  border-radius: 32rpx;
  border: 1rpx solid var(--theme-border);
  background: var(--theme-surface-strong);
  box-shadow: var(--theme-shadow-soft);
}

.section__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.section__title-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  min-width: 0;
}

.section__title-icon {
  display: grid;
  place-items: center;
  width: 44rpx;
  height: 44rpx;
  border-radius: 16rpx;
  color: var(--theme-primary);
  background: rgba(var(--theme-primary-rgb), 0.12);
}

.calendar-glyph,
.trend-glyph,
.bulb-glyph {
  position: relative;
  color: currentColor;
}

.calendar-glyph {
  width: 20rpx;
  height: 18rpx;
  border: 3rpx solid currentColor;
  border-radius: 4rpx;
}

.calendar-glyph::before,
.calendar-glyph::after {
  content: '';
  position: absolute;
  top: -4rpx;
  width: 3rpx;
  height: 6rpx;
  border-radius: 999rpx;
  background: currentColor;
}

.calendar-glyph::before {
  left: 3rpx;
}

.calendar-glyph::after {
  right: 3rpx;
}

.trend-glyph {
  width: 20rpx;
  height: 20rpx;
  border-bottom: 3rpx solid currentColor;
  border-left: 3rpx solid currentColor;
  transform: skew(-20deg);
}

.trend-glyph::before {
  content: '';
  position: absolute;
  left: 3rpx;
  top: 4rpx;
  width: 14rpx;
  height: 3rpx;
  background: currentColor;
  transform: rotate(-28deg);
}

.trend-glyph::after {
  content: '';
  position: absolute;
  right: -2rpx;
  top: -2rpx;
  width: 7rpx;
  height: 7rpx;
  border-top: 3rpx solid currentColor;
  border-right: 3rpx solid currentColor;
  transform: rotate(45deg);
}

.bulb-glyph {
  width: 20rpx;
  height: 22rpx;
  border: 3rpx solid currentColor;
  border-radius: 10rpx 10rpx 8rpx 8rpx;
}

.bulb-glyph::before {
  content: '';
  position: absolute;
  left: 5rpx;
  right: 5rpx;
  bottom: -5rpx;
  height: 5rpx;
  border-radius: 999rpx;
  background: currentColor;
}

.bulb-glyph::after {
  content: '';
  position: absolute;
  left: 5rpx;
  top: 6rpx;
  width: 10rpx;
  height: 6rpx;
  border-bottom: 3rpx solid currentColor;
  border-radius: 0 0 999rpx 999rpx;
}

.section__title,
.section__meta,
.month-switch {
  font-size: 24rpx;
  line-height: 1.6;
  color: var(--theme-text-secondary);
}

.section__title {
  font-size: 28rpx;
  font-weight: 700;
  color: var(--theme-text-primary);
}

.month-switch {
  display: inline-flex;
  align-items: center;
  gap: 16rpx;
}

.month-switch__arrow {
  color: var(--theme-primary);
}

.weekday-row,
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 8rpx;
}

.weekday-row {
  padding: 2rpx 4rpx 0;
  text-align: center;
  font-size: 22rpx;
  color: var(--theme-text-secondary);
}

.calendar-grid {
  margin-top: 2rpx;
}

.calendar-day {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 40rpx;
  border-radius: 999rpx;
  color: var(--theme-text-secondary);
}

.calendar-day__num {
  font-size: 24rpx;
  font-weight: 600;
}

.calendar-day__dot {
  position: absolute;
  bottom: 4rpx;
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  background: currentColor;
}

.calendar-day--selected {
  color: rgba(255, 255, 255, 0.96);
  background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-accent) 100%);
  box-shadow: 0 14rpx 24rpx rgba(var(--theme-primary-rgb), 0.2);
}

.calendar-day--calm {
  color: rgba(var(--theme-primary-rgb), 0.74);
}

.calendar-day--low {
  color: rgba(var(--theme-text-secondary-rgb), 0.78);
}

.calendar-day--anxious {
  color: rgba(var(--theme-accent-rgb), 0.92);
}

.calendar-day--happy {
  color: rgba(var(--theme-primary-rgb), 0.58);
}

.calendar-day--tired {
  color: rgba(var(--theme-text-secondary-rgb), 0.62);
}

.mood-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx 18rpx;
  padding-top: 8rpx;
}

.mood-legend__item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 22rpx;
  color: var(--theme-text-secondary);
}

.mood-legend__dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
}

.mood-legend__dot--calm {
  background: rgba(var(--theme-primary-rgb), 0.78);
}

.mood-legend__dot--low {
  background: rgba(var(--theme-text-secondary-rgb), 0.82);
}

.mood-legend__dot--anxious {
  background: rgba(var(--theme-accent-rgb), 0.9);
}

.mood-legend__dot--happy {
  background: rgba(var(--theme-primary-rgb), 0.56);
}

.mood-legend__dot--tired {
  background: rgba(var(--theme-text-secondary-rgb), 0.58);
}

.trend-card {
  display: grid;
  grid-template-columns: 70rpx minmax(0, 1fr);
  gap: 12rpx;
  padding: 14rpx 14rpx 8rpx;
  border-radius: 28rpx;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.82) 0%, rgba(var(--theme-primary-rgb), 0.04) 100%);
}

.trend-card__axis {
  display: grid;
  align-content: space-between;
  min-height: 128rpx;
  padding: 10rpx 0 14rpx;
  font-size: 22rpx;
  color: var(--theme-text-secondary);
}

.trend-card__plot {
  position: relative;
  min-height: 128rpx;
  overflow: hidden;
  border-radius: 22rpx;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.48) 0%, rgba(var(--theme-primary-rgb), 0.03) 100%);
}

.trend-card__grid {
  position: absolute;
  left: 0;
  right: 0;
  border-top: 1rpx dashed rgba(var(--theme-text-secondary-rgb), 0.18);
}

.trend-card__grid--top {
  top: 30%;
}

.trend-card__grid--mid {
  top: 62%;
}

.trend-card__area {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 56%;
  background: linear-gradient(180deg, rgba(var(--theme-accent-rgb), 0.18) 0%, rgba(255, 255, 255, 0) 100%);
  clip-path: polygon(0 68%, 18% 48%, 34% 64%, 50% 36%, 66% 48%, 82% 24%, 100% 32%, 100% 100%, 0 100%);
}

.trend-card__segment {
  position: absolute;
  height: 4rpx;
  margin-top: -2rpx;
  transform-origin: 0 50%;
  border-radius: 999rpx;
  background: var(--theme-primary);
  box-shadow: 0 0 0 7rpx rgba(var(--theme-primary-rgb), 0.08);
}

.trend-card__point {
  position: absolute;
  display: grid;
  place-items: center;
  width: 22rpx;
  height: 22rpx;
  margin: -11rpx 0 0 -11rpx;
  border-radius: 50%;
  color: rgba(255, 255, 255, 0.94);
  font-size: 16rpx;
  font-weight: 700;
  background: var(--theme-primary);
  box-shadow: 0 0 0 8rpx rgba(255, 255, 255, 0.62);
}

.trend-card__point--calm {
  background: rgba(var(--theme-primary-rgb), 0.8);
}

.trend-card__point--low {
  background: rgba(var(--theme-text-secondary-rgb), 0.8);
}

.trend-card__point--anxious {
  background: rgba(var(--theme-accent-rgb), 0.96);
}

.trend-card__point--happy {
  background: rgba(var(--theme-primary-rgb), 0.62);
}

.trend-card__point--tired {
  background: rgba(var(--theme-text-secondary-rgb), 0.66);
}

.trend-card__labels {
  grid-column: 2;
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4rpx;
  padding-top: 2rpx;
  text-align: center;
  font-size: 20rpx;
  color: var(--theme-text-secondary);
}

.keyword-card {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 72rpx minmax(0, 1fr) auto;
  gap: 16rpx;
  align-items: center;
  padding: 14rpx 18rpx 14rpx 16rpx;
  margin-bottom: 14rpx;
  border: 1rpx solid rgba(var(--theme-primary-rgb), 0.1);
  border-radius: 26rpx;
  background:
    radial-gradient(circle at 88% 28%, rgba(var(--theme-accent-rgb), 0.16), transparent 28%),
    linear-gradient(135deg, rgba(var(--theme-primary-rgb), 0.07), rgba(255, 255, 255, 0.84));
  box-shadow: var(--theme-shadow-soft);
}

.keyword-card__icon {
  display: grid;
  place-items: center;
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  color: var(--theme-primary);
  background: rgba(var(--theme-primary-rgb), 0.12);
}

.keyword-card__copy {
  display: grid;
  gap: 4rpx;
  min-width: 0;
}

.keyword-card__title {
  font-size: 28rpx;
  line-height: 1.45;
  font-weight: 700;
  color: var(--theme-text-primary);
}

.keyword-card__text {
  font-size: 22rpx;
  line-height: 1.55;
  color: var(--theme-text-secondary);
}

.keyword-card__arrow {
  font-size: 36rpx;
  color: rgba(var(--theme-text-secondary-rgb), 0.72);
}

.empty-state {
  display: grid;
  gap: 10rpx;
  padding: 24rpx;
  border-radius: 24rpx;
  background: var(--theme-surface-muted);
}

.empty-state__title {
  font-size: 28rpx;
  line-height: 1.4;
  color: var(--theme-text-primary);
}

.empty-state__text {
  font-size: 22rpx;
  line-height: 1.6;
  color: var(--theme-text-secondary);
}

.meditation-insight {
  grid-template-columns: 220rpx minmax(0, 1fr);
}

.section--calendar,
.section--trend {
  overflow: hidden;
}

.section--calendar .section__meta,
.section--trend .section__meta {
  max-width: 340rpx;
  text-align: right;
}
</style>
