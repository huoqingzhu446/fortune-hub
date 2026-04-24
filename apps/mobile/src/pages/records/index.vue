<template>
  <view class="page-shell" :style="themeVars">
    <view class="page">
      <view class="ambient ambient--glow"></view>
      <view class="ambient ambient--moon"></view>

      <view class="page-header">
        <view>
          <text class="page-header__title">记录</text>
          <text class="page-header__subtitle">看见自己的情绪轨迹与疗愈变化</text>
        </view>
        <text class="page-header__theme">{{ themePalette.name }}</text>
      </view>

      <view class="tab-shell">
        <view
          v-for="tab in recordTabs"
          :key="tab.value"
          class="tab-item"
          :class="{ 'tab-item--active': activeTab === tab.value }"
          @tap="activeTab = tab.value"
        >
          <text>{{ tab.label }}</text>
        </view>
      </view>

      <view class="overview-card">
        <view class="overview-card__copy">
          <text class="overview-card__eyebrow">本周记录概览</text>
          <text class="overview-card__title">{{ overview.encouragement }}</text>
          <button class="overview-card__button" @tap="continueRecord">{{ overview.actionText }}</button>
        </view>

        <view class="overview-card__stats">
          <view
            v-for="stat in overviewStats"
            :key="stat.label"
            class="overview-card__stat"
          >
            <text class="overview-card__stat-value">{{ stat.value }}</text>
            <text class="overview-card__stat-label">{{ stat.label }}</text>
          </view>
        </view>

        <view class="overview-card__art">
          <view class="overview-card__moon"></view>
          <view class="overview-card__lotus">莲</view>
        </view>
      </view>

      <view v-if="!isLoggedIn" class="login-card">
        <text class="login-card__title">登录后开始沉淀记录</text>
        <text class="login-card__text">当前先展示记录页结构。完成登录后，测试、日记和冥想足迹会自动进入这里。</text>
        <button class="login-card__button" @tap="goProfile">去我的</button>
      </view>

      <view class="section">
        <view class="section__head">
          <text class="section__title">心情打卡</text>
          <view class="month-switch">
            <text class="month-switch__arrow">‹</text>
            <text>{{ currentMonthLabel }}</text>
            <text class="month-switch__arrow">›</text>
          </view>
        </view>

        <view class="calendar-card">
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
      </view>

      <view class="section">
        <view class="section__head">
          <text class="section__title">情绪趋势</text>
          <text class="section__meta">{{ recordOverview.trend.summary }}</text>
        </view>

        <view v-if="recordOverview.trend.hasEnoughData" class="trend-card">
          <view class="trend-card__axis">
            <text>愉悦</text>
            <text>平静</text>
            <text>低落</text>
            <text>焦虑</text>
          </view>

          <view class="trend-card__plot">
            <view class="trend-card__grid trend-card__grid--top"></view>
            <view class="trend-card__grid trend-card__grid--mid"></view>
            <view class="trend-card__area"></view>
            <view
              v-for="point in actualTrendPoints"
              :key="point.day"
              class="trend-card__point"
              :style="{ left: `${point.x}%`, top: `${point.y}%` }"
            ></view>
          </view>

          <view class="trend-card__labels">
            <text v-for="point in trendPoints" :key="point.day">{{ point.day }}</text>
          </view>
        </view>

        <view v-else class="empty-state">
          <text class="empty-state__title">记录 3 天以上后，就能看到你的情绪趋势。</text>
          <text class="empty-state__text">先从一次轻量打卡开始，趋势会随着记录慢慢形成。</text>
          <button class="empty-state__button" @tap="continueRecord">去记录</button>
        </view>
      </view>

      <view class="section">
        <view class="section__head">
          <text class="section__title">最近记录</text>
          <text class="section__link" @tap="activeTab = 'emotion'">查看全部 ›</text>
        </view>

        <view v-if="loading" class="empty-state">
          <text class="empty-state__title">正在同步记录...</text>
          <text class="empty-state__text">马上就好。</text>
        </view>

        <view v-else-if="visibleRecentRecords.length" class="record-list">
          <view
            v-for="item in visibleRecentRecords"
            :key="item.id"
            class="record-row"
            @tap="openRecord(item)"
          >
            <view class="record-row__icon">{{ item.icon }}</view>
            <view class="record-row__body">
              <view class="record-row__head">
                <text class="record-row__title">{{ item.title }}</text>
                <text v-if="item.tag" class="record-row__tag">{{ item.tag }}</text>
              </view>
              <text class="record-row__summary">{{ item.summary }}</text>
            </view>
            <text class="record-row__time">{{ item.time }}</text>
          </view>
        </view>

        <view v-else class="empty-state">
          <text class="empty-state__title">{{ emptyRecordTitle }}</text>
          <text class="empty-state__text">{{ emptyRecordText }}</text>
          <button class="empty-state__button" @tap="continueRecord">去记录</button>
        </view>
      </view>

      <view class="section">
        <view class="section__head">
          <text class="section__title">成长印记</text>
          <text class="section__meta">慢慢靠近更稳定的自己</text>
        </view>

        <view class="growth-grid">
          <view class="growth-card growth-card--wide">
            <text class="growth-card__label">连续记录</text>
            <text class="growth-card__value">{{ growth.continuousDays }}天</text>
            <text class="growth-card__text">保持微小但稳定的觉察。</text>
          </view>

          <view class="growth-card">
            <text class="growth-card__label">本月关键词</text>
            <text class="growth-card__keyword">{{ growth.monthKeywords }}</text>
          </view>
        </view>
      </view>

      <view class="section">
        <view class="section__head">
          <text class="section__title">疗愈收藏</text>
          <text class="section__link">查看全部 ›</text>
        </view>

        <view class="favorite-grid">
          <view
            v-for="item in favorites"
            :key="item.id"
            class="favorite-card"
            @tap="open(item.route)"
          >
            <view class="favorite-card__icon">{{ item.icon }}</view>
            <view>
              <text class="favorite-card__title">{{ item.title }}</text>
              <text class="favorite-card__text">{{ item.description }}</text>
            </view>
            <text class="favorite-card__action">{{ item.action }}</text>
          </view>
        </view>
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
    recordedDays: 0,
    emotionalStability: 0,
    healingProgress: 0,
    encouragement: '先建立第一条记录，变化会开始被看见',
    actionText: '去登录',
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
    summary: '登录后可以看到你的趋势变化',
    hasEnoughData: false,
    points: [
      { day: '周一', value: null },
      { day: '周二', value: null },
      { day: '周三', value: null },
      { day: '周四', value: null },
      { day: '周五', value: null },
      { day: '周六', value: null },
      { day: '周日', value: null },
    ],
  },
  moodRecords: [],
  testRecords: [],
  meditationRecords: [],
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
const favorites = computed(() => recordOverview.value.favorites);
const growth = computed(() => recordOverview.value.growth);
const overview = computed(() => recordOverview.value.overview);
const currentMonthLabel = computed(() => recordOverview.value.calendar.monthLabel);

const moodRecords = computed(() => recordOverview.value.moodRecords);
const testRecords = computed(() => recordOverview.value.testRecords);
const meditationRecords = computed(() => recordOverview.value.meditationRecords);

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
    tag: `${item.durationMinutes} 分钟`,
    summary: item.summary || `${item.category} 练习`,
    time: formatTime(item.updatedAt),
    route: item.route,
  }));
});

const overviewStats = computed(() => [
  {
    label: '已记录',
    value: `${overview.value.recordedDays}天`,
  },
  {
    label: '情绪稳定度',
    value: `${overview.value.emotionalStability}%`,
  },
  {
    label: '疗愈进度',
    value: `${overview.value.healingProgress}`,
  },
]);

const calendarDays = computed(() =>
  recordOverview.value.calendar.days.map((day) => ({
    ...day,
    isSelected: day.date === selectedDate.value,
  })),
);

const trendPoints = computed(() => {
  const list = recordOverview.value.trend.points;
  const actualValues = list
    .map((item) => item.value)
    .filter((value): value is number => value !== null);
  const maxValue = Math.max(...actualValues, 100);

  return list.map((point, index) => ({
    ...point,
    x: list.length === 1 ? 50 : (index / (list.length - 1)) * 100,
    y:
      point.value === null
        ? 74
        : 16 + ((maxValue - point.value) / maxValue) * 58,
  }));
});
const actualTrendPoints = computed(() =>
  trendPoints.value.filter((point) => point.value !== null),
);

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
    uni.showToast({
      title: getErrorMessage(error, '记录读取失败'),
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

  open('/pages/journal/index');
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

onLoad(() => {
  void loadRecordOverview();
});

onShow(() => {
  const latestToken = getAuthToken();
  if (latestToken !== authToken.value) {
    authToken.value = latestToken;
  }
  void loadRecordOverview();
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
  margin-bottom: 24rpx;
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
  color: #ffffff;
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
  color: #ffffff;
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
  color: #8d82bf;
}

.calendar-day--low {
  color: #9aa8d6;
}

.calendar-day--anxious {
  color: #e5bd85;
}

.calendar-day--happy {
  color: #d99aa2;
}

.calendar-day--tired {
  color: #8fbdb3;
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
  background: #8d82bf;
}

.mood-legend__dot--low {
  background: #9aa8d6;
}

.mood-legend__dot--anxious {
  background: #e5bd85;
}

.mood-legend__dot--happy {
  background: #d99aa2;
}

.mood-legend__dot--tired {
  background: #8fbdb3;
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
  border-top: 1rpx dashed rgba(127, 135, 147, 0.22);
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
</style>
