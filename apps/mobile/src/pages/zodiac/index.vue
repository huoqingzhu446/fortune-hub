<template>
  <view class="page" :style="themeVars">
    <view class="sky-layer">
      <view class="sky-layer__star sky-layer__star--one"></view>
      <view class="sky-layer__star sky-layer__star--two"></view>
      <view class="sky-layer__constellation">
        <view class="sky-line sky-line--one"></view>
        <view class="sky-line sky-line--two"></view>
        <view class="sky-dot sky-dot--one"></view>
        <view class="sky-dot sky-dot--two"></view>
        <view class="sky-dot sky-dot--three"></view>
        <view class="sky-dot sky-dot--four"></view>
      </view>
    </view>

    <view class="topbar">
      <view class="topbar__copy">
        <text class="page-title">星座运势</text>
        <text class="page-subtitle">探索星空 · 发现更好的自己</text>
      </view>
    </view>

    <view class="fortune-shell">
      <view v-if="loading" class="sync-pill">
        <view class="sync-pill__spark"></view>
        <text>正在刷新 {{ selectedSign }} 运势</text>
      </view>

      <view class="profile-panel" :style="zodiacArtStyle">
        <view class="profile-panel__info">
          <view class="zodiac-mark">
            <text class="zodiac-mark__glyph">{{ zodiacVisual.glyph }}</text>
          </view>
          <view class="profile-panel__copy">
            <text class="profile-panel__title">{{ selectedSign }}</text>
            <text class="profile-panel__en">{{ zodiacEnglishName }}</text>
            <text class="profile-panel__date">{{ zodiacDateRange }}</text>
            <text class="profile-panel__traits">{{ zodiacTraits }}</text>
          </view>
        </view>

        <view class="score-ring" :style="scoreRingStyle">
          <view class="score-ring__glow"></view>
          <view class="score-ring__handle"></view>
          <text class="score-ring__value">{{ todayFortune.score.overall }}</text>
          <text class="score-ring__unit">/100</text>
          <text class="score-ring__label">今日运势</text>
        </view>
      </view>

      <view class="soft-divider">
        <view class="soft-divider__star"></view>
      </view>

      <text class="summary-line">{{ heroSummary }}</text>

      <view class="action-banner">
        <view class="action-banner__copy">
          <text class="section-label section-label--light">今日行动签</text>
          <text class="action-banner__title">{{ todayFortune.action.title }}</text>
          <text class="action-banner__text">{{ todayFortune.action.description }}</text>
        </view>
        <button class="check-button" :class="{ 'check-button--done': actionChecked }" @tap="toggleActionCheck">
          <text class="check-button__icon">✓</text>
          <text>{{ actionChecked ? '已完成' : todayFortune.action.checkInText }}</text>
        </button>
        <view class="action-banner__flag"></view>
        <view class="action-banner__mountains" :style="mountainImageStyle"></view>
      </view>

      <view class="dimension-grid">
        <view
          v-for="item in dimensionCards"
          :key="item.key"
          class="dimension-card"
          :class="`dimension-card--${item.key}`"
        >
          <view class="dimension-card__content">
            <text class="dimension-card__label">{{ item.displayLabel }}</text>
            <view class="dimension-card__score">
              <text class="dimension-card__value">{{ item.score }}</text>
              <text class="dimension-card__unit">/100</text>
            </view>
            <text class="dimension-card__title">{{ item.title }}</text>
            <text class="dimension-card__summary">{{ item.summary }}</text>
          </view>
          <view class="dimension-card__icon">
            <text>{{ item.icon }}</text>
          </view>
        </view>
      </view>

      <view class="sign-section">
        <view class="section-heading">
          <text class="section-heading__spark">✦</text>
          <text class="section-heading__title">选择星座</text>
          <text class="section-heading__spark">✦</text>
        </view>
        <view class="sign-grid">
          <view
            v-for="item in zodiacTiles"
            :key="item.sign"
            class="sign-tile"
            :class="{ 'sign-tile--active': item.sign === selectedSign }"
            @tap="selectSign(item.sign)"
          >
            <text class="sign-tile__glyph">{{ item.glyph }}</text>
            <text class="sign-tile__label">{{ item.sign }}</text>
          </view>
        </view>
      </view>

      <view class="view-tabs">
        <view
          v-for="item in viewOptions"
          :key="item.value"
          class="view-tab"
          :class="{ 'view-tab--active': item.value === activeView }"
          @tap="activeView = item.value"
        >
          <text>{{ item.label }}</text>
        </view>
      </view>

      <view v-if="activeView === 'daily'" class="period-panel period-panel--daily">
        <view class="period-panel__copy">
          <view class="section-heading section-heading--compact">
            <text class="section-heading__icon">◷</text>
            <text class="section-heading__title">今日时间节奏</text>
          </view>
          <view class="daypart-list">
            <view
              v-for="item in todayFortune.dayparts"
              :key="item.label"
              class="daypart-item"
              :class="`daypart-item--${getDaypartKey(item.label)}`"
            >
              <view class="daypart-item__icon">
                <text>{{ getDaypartIcon(item.label) }}</text>
              </view>
              <view class="daypart-item__copy">
                <text class="daypart-item__label">{{ item.label }}</text>
                <text class="daypart-item__line">适合：{{ item.suitable }}</text>
                <text class="daypart-item__line">避免：{{ item.avoid }}</text>
              </view>
            </view>
          </view>
        </view>
        <view class="compass-art">
          <view class="compass-art__outer"></view>
          <view class="compass-art__dial"></view>
          <view class="compass-art__needle"></view>
          <view class="compass-art__pin"></view>
        </view>
      </view>

      <view v-else-if="activeView === 'weekly'" class="period-panel">
        <view class="period-hero">
          <text class="section-label">本周主题</text>
          <text class="period-title">{{ weeklyFortune.theme }}</text>
          <text class="period-meta">{{ weeklyFortune.weekRange || '本周节奏' }}</text>
          <text class="period-copy">{{ weeklyFortune.overview }}</text>
        </view>
        <view class="rhythm-list">
          <view v-for="item in weeklyFortune.rhythm" :key="item.label" class="rhythm-item">
            <text class="rhythm-item__label">{{ item.label }}</text>
            <text class="rhythm-item__copy">{{ item.summary }}</text>
          </view>
        </view>
        <view class="focus-grid">
          <view v-for="metric in weeklyMetrics" :key="metric.label" class="focus-card">
            <text class="focus-card__label">{{ metric.label }}</text>
            <text class="focus-card__copy">{{ metric.value }}</text>
          </view>
        </view>
        <view class="insight-strip">
          <text>幸运窗口：{{ weeklyFortune.luckyWindow }}</text>
          <text>本周搭档：{{ weeklyFortune.bestMatch }}</text>
        </view>
      </view>

      <view v-else-if="activeView === 'monthly'" class="period-panel">
        <view class="period-hero">
          <text class="section-label">{{ monthlyFortune.month }} 月运</text>
          <text class="period-title">{{ monthlyFortune.theme.title }}</text>
          <text class="period-copy">{{ monthlyFortune.theme.summary }}</text>
        </view>
        <view class="rhythm-list">
          <view v-for="item in monthlyFortune.rhythm" :key="item.label" class="rhythm-item">
            <text class="rhythm-item__label">{{ item.label }}</text>
            <text class="rhythm-item__copy">{{ item.summary }}</text>
          </view>
        </view>
        <view class="focus-grid">
          <view v-for="metric in monthlyMetrics" :key="metric.label" class="focus-card">
            <text class="focus-card__label">{{ metric.label }}</text>
            <text class="focus-card__copy">{{ metric.value }}</text>
          </view>
        </view>
        <view class="tag-row">
          <text v-for="item in monthlyFortune.keyDays" :key="item" class="tag-chip">{{ item }}</text>
        </view>
        <view class="insight-strip">
          <text>{{ monthlyFortune.action }}</text>
        </view>
      </view>

      <view v-else-if="activeView === 'yearly'" class="period-panel">
        <view class="period-hero">
          <text class="section-label">{{ yearlyFortune.year }} 年度主题</text>
          <text class="period-title">{{ yearlyFortune.theme.title }}</text>
          <text class="period-copy">{{ yearlyFortune.theme.summary }}</text>
        </view>
        <view class="rhythm-list rhythm-list--quarters">
          <view v-for="item in yearlyFortune.quarterForecasts" :key="item.quarter" class="rhythm-item">
            <text class="rhythm-item__label">{{ item.quarter }} · {{ item.title }}</text>
            <text class="rhythm-item__copy">{{ item.summary }}</text>
          </view>
        </view>
        <view class="focus-grid">
          <view v-for="metric in yearlyMetrics" :key="metric.label" class="focus-card">
            <text class="focus-card__label">{{ metric.label }}</text>
            <text class="focus-card__copy">{{ metric.value }}</text>
          </view>
        </view>
        <view class="tag-row">
          <text v-for="month in yearlyFortune.keyMonths" :key="month" class="tag-chip">{{ month }}</text>
        </view>
        <view class="insight-strip">
          <text>{{ yearlyFortune.anchorAdvice }}</text>
        </view>
      </view>

      <view class="poster-cta">
        <view class="poster-cta__copy">
          <text class="poster-cta__title">生成专属星座海报</text>
          <text class="poster-cta__text">分享你的今日运势，传递好运能量</text>
        </view>
        <button class="poster-cta__button" @tap="openPosterGenerate">
          <text class="poster-cta__star">★</text>
          <text>生成海报</text>
        </button>
      </view>

      <text class="footer-wish">愿星光指引你，遇见更好的每一天 ✦</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad, onPullDownRefresh } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import {
  fetchZodiacCompatibility,
  fetchZodiacKnowledge,
  fetchZodiacMonthly,
  fetchZodiacToday,
  fetchZodiacWeekly,
  fetchZodiacYearly,
} from '../../api/zodiac';
import { useThemePreference } from '../../composables/useThemePreference';
import { getCachedUser } from '../../services/session';
import heroMountainsSvg from '../../static/illustrations/hero_mountains.svg?raw';
import type {
  ZodiacCompatibilityData,
  ZodiacDailyData,
  ZodiacKnowledgeData,
  ZodiacMonthlyData,
  ZodiacSign,
  ZodiacTodayData,
  ZodiacViewMode,
  ZodiacWeeklyData,
  ZodiacYearlyData,
} from '../../types/zodiac';
import { zodiacSigns } from '../../types/zodiac';

const viewOptions: Array<{ label: string; value: ZodiacViewMode }> = [
  { label: '今日', value: 'daily' },
  { label: '本周', value: 'weekly' },
  { label: '月运', value: 'monthly' },
  { label: '年度', value: 'yearly' },
];

type ZodiacVisualPoint = {
  x: number;
  y: number;
  size?: number;
};

type ZodiacVisualConfig = {
  glyph: string;
  label: string;
  accent: string;
  deep: string;
  wash: string;
  points: ZodiacVisualPoint[];
  links: Array<[number, number]>;
};

type ZodiacDimensionKey = ZodiacTodayData['dimensions'][number]['key'];

const zodiacDateRangeMap: Record<ZodiacSign, string> = {
  白羊座: '03.21 - 04.19',
  金牛座: '04.20 - 05.20',
  双子座: '05.21 - 06.21',
  巨蟹座: '06.22 - 07.22',
  狮子座: '07.23 - 08.22',
  处女座: '08.23 - 09.22',
  天秤座: '09.23 - 10.23',
  天蝎座: '10.24 - 11.22',
  射手座: '11.23 - 12.21',
  摩羯座: '12.22 - 01.19',
  水瓶座: '01.20 - 02.18',
  双鱼座: '02.19 - 03.20',
};

const zodiacTraitMap: Record<ZodiacSign, string> = {
  白羊座: '热烈 · 勇敢 · 行动力 · 开拓感',
  金牛座: '稳定 · 审美 · 耐心 · 价值感',
  双子座: '灵活 · 好奇 · 沟通 · 新鲜感',
  巨蟹座: '温柔 · 守护 · 直觉 · 安全感',
  狮子座: '自信 · 创造 · 热情 · 表现力',
  处女座: '细致 · 秩序 · 专注 · 完成度',
  天秤座: '优雅 · 平衡 · 协调 · 关系感',
  天蝎座: '深刻 · 专注 · 洞察 · 转化力',
  射手座: '自由 · 乐观 · 探索 · 远方感',
  摩羯座: '坚韧 · 务实 · 责任感 · 成就导向',
  水瓶座: '独立 · 创新 · 理性 · 未来感',
  双鱼座: '浪漫 · 共情 · 想象 · 治愈力',
};

const dimensionUiMap: Record<
  ZodiacDimensionKey,
  {
    displayLabel: string;
    icon: string;
  }
> = {
  love: {
    displayLabel: '关系运',
    icon: '人',
  },
  career: {
    displayLabel: '事业运',
    icon: '事',
  },
  wealth: {
    displayLabel: '财富运',
    icon: '¥',
  },
  wellbeing: {
    displayLabel: '身心运',
    icon: '心',
  },
};

const zodiacVisualMap: Record<ZodiacSign, ZodiacVisualConfig> = {
  白羊座: {
    glyph: '♈',
    label: 'Aries',
    accent: '#f9735b',
    deep: '#9f3d33',
    wash: '#fff0eb',
    points: [
      { x: 28, y: 60, size: 8 },
      { x: 38, y: 42, size: 12 },
      { x: 50, y: 28, size: 9 },
      { x: 62, y: 42, size: 12 },
      { x: 72, y: 60, size: 8 },
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ],
  },
  金牛座: {
    glyph: '♉',
    label: 'Taurus',
    accent: '#9ab56f',
    deep: '#58703c',
    wash: '#f1f7e9',
    points: [
      { x: 24, y: 36, size: 8 },
      { x: 38, y: 25, size: 10 },
      { x: 52, y: 38, size: 12 },
      { x: 66, y: 28, size: 8 },
      { x: 75, y: 52, size: 9 },
      { x: 45, y: 68, size: 8 },
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [2, 4],
      [2, 5],
    ],
  },
  双子座: {
    glyph: '♊',
    label: 'Gemini',
    accent: '#66a6d9',
    deep: '#32658f',
    wash: '#edf7ff',
    points: [
      { x: 32, y: 24, size: 9 },
      { x: 66, y: 22, size: 9 },
      { x: 36, y: 50, size: 11 },
      { x: 64, y: 50, size: 11 },
      { x: 30, y: 76, size: 9 },
      { x: 68, y: 74, size: 9 },
    ],
    links: [
      [0, 2],
      [2, 4],
      [1, 3],
      [3, 5],
      [2, 3],
    ],
  },
  巨蟹座: {
    glyph: '♋',
    label: 'Cancer',
    accent: '#8eb8d8',
    deep: '#496b87',
    wash: '#edf6fb',
    points: [
      { x: 24, y: 58, size: 8 },
      { x: 38, y: 44, size: 12 },
      { x: 52, y: 50, size: 9 },
      { x: 62, y: 34, size: 12 },
      { x: 76, y: 44, size: 8 },
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ],
  },
  狮子座: {
    glyph: '♌',
    label: 'Leo',
    accent: '#f2aa42',
    deep: '#9b6420',
    wash: '#fff6e8',
    points: [
      { x: 24, y: 62, size: 8 },
      { x: 38, y: 42, size: 11 },
      { x: 55, y: 30, size: 13 },
      { x: 70, y: 43, size: 9 },
      { x: 76, y: 66, size: 8 },
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ],
  },
  处女座: {
    glyph: '♍',
    label: 'Virgo',
    accent: '#7fb58a',
    deep: '#3f7251',
    wash: '#edf8ef',
    points: [
      { x: 22, y: 48, size: 8 },
      { x: 36, y: 34, size: 10 },
      { x: 50, y: 42, size: 12 },
      { x: 62, y: 30, size: 9 },
      { x: 74, y: 50, size: 8 },
      { x: 60, y: 70, size: 9 },
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [2, 5],
    ],
  },
  天秤座: {
    glyph: '♎',
    label: 'Libra',
    accent: '#8ca7e8',
    deep: '#5267a3',
    wash: '#f1f4ff',
    points: [
      { x: 20, y: 58, size: 8 },
      { x: 36, y: 48, size: 9 },
      { x: 50, y: 34, size: 12 },
      { x: 64, y: 48, size: 9 },
      { x: 80, y: 58, size: 8 },
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ],
  },
  天蝎座: {
    glyph: '♏',
    label: 'Scorpio',
    accent: '#a678d6',
    deep: '#6a428e',
    wash: '#f6efff',
    points: [
      { x: 24, y: 30, size: 8 },
      { x: 36, y: 48, size: 10 },
      { x: 50, y: 36, size: 12 },
      { x: 64, y: 54, size: 9 },
      { x: 78, y: 42, size: 8 },
      { x: 70, y: 72, size: 8 },
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [3, 5],
    ],
  },
  射手座: {
    glyph: '♐',
    label: 'Sagittarius',
    accent: '#f0a653',
    deep: '#97602d',
    wash: '#fff5e8',
    points: [
      { x: 24, y: 74, size: 8 },
      { x: 38, y: 58, size: 9 },
      { x: 52, y: 42, size: 11 },
      { x: 70, y: 24, size: 13 },
      { x: 62, y: 62, size: 8 },
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [2, 4],
    ],
  },
  摩羯座: {
    glyph: '♑',
    label: 'Capricorn',
    accent: '#8b6df3',
    deep: '#5b45b7',
    wash: '#f1ecff',
    points: [
      { x: 22, y: 42, size: 8 },
      { x: 36, y: 28, size: 10 },
      { x: 52, y: 40, size: 12 },
      { x: 66, y: 58, size: 9 },
      { x: 80, y: 50, size: 8 },
      { x: 58, y: 76, size: 9 },
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [3, 5],
    ],
  },
  水瓶座: {
    glyph: '♒',
    label: 'Aquarius',
    accent: '#61b6c8',
    deep: '#2f7382',
    wash: '#eaf9fb',
    points: [
      { x: 18, y: 42, size: 8 },
      { x: 34, y: 34, size: 10 },
      { x: 50, y: 44, size: 8 },
      { x: 66, y: 36, size: 10 },
      { x: 82, y: 46, size: 8 },
      { x: 34, y: 66, size: 8 },
      { x: 66, y: 66, size: 8 },
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [5, 6],
    ],
  },
  双鱼座: {
    glyph: '♓',
    label: 'Pisces',
    accent: '#7da7dc',
    deep: '#456696',
    wash: '#eef6ff',
    points: [
      { x: 28, y: 30, size: 9 },
      { x: 42, y: 48, size: 11 },
      { x: 28, y: 68, size: 9 },
      { x: 72, y: 30, size: 9 },
      { x: 58, y: 48, size: 11 },
      { x: 72, y: 68, size: 9 },
    ],
    links: [
      [0, 1],
      [1, 2],
      [3, 4],
      [4, 5],
      [1, 4],
    ],
  },
};

function getSignIndex(sign: string) {
  const index = zodiacSigns.indexOf(sign as ZodiacSign);
  return index >= 0 ? index : 4;
}

function getOffsetSign(sign: string, offset: number) {
  const nextIndex = (getSignIndex(sign) + offset + zodiacSigns.length) % zodiacSigns.length;
  return zodiacSigns[nextIndex];
}

function buildProfileSummary(sign: string) {
  return {
    element: '星座能量',
    modality: '完整视图',
    keywords: ['节奏', '连接', '表达'],
  };
}

function buildDailyFallback(sign: string): ZodiacDailyData {
  return {
    zodiac: sign,
    date: '',
    profile: buildProfileSummary(sign),
    summary: `${sign}今天适合先定节奏，再让状态慢慢升温。`,
    metrics: {
      love: '先把感受表达清楚，互动会更轻松。',
      career: '优先处理最关键的一件事，效率会更高。',
      wealth: '控制冲动消费，把预算留给真正重要的安排。',
      health: '留一点休息和补水时间，整体状态会更稳。',
    },
    lucky: {
      color: '雾光蓝',
      number: String(getSignIndex(sign) + 1),
      direction: '东南',
    },
    compatibility: {
      bestMatch: getOffsetSign(sign, 1),
      message: `今天和${getOffsetSign(sign, 1)}更容易聊到一起，适合轻松互动。`,
    },
    knowledge: `${sign}今天最适合把注意力放到真正重要的人和事上。`,
    suggestion: '先完成一个小目标，再决定要不要把精力继续往外放。',
  };
}

function buildTodayFallback(sign: string): ZodiacTodayData {
  const base = buildDailyFallback(sign);
  const index = getSignIndex(sign);
  const dimensions: ZodiacTodayData['dimensions'] = [
    {
      key: 'love',
      label: '关系',
      score: 76 + (index % 9),
      title: '先让表达变轻一点',
      summary: base.metrics.love,
      action: '把在意说清楚，不用反复试探。',
    },
    {
      key: 'career',
      label: '事业',
      score: 80 + (index % 8),
      title: '抓住主线推进',
      summary: base.metrics.career,
      action: '先完成最关键的一件事，再处理分支。',
    },
    {
      key: 'wealth',
      label: '财富',
      score: 70 + (index % 10),
      title: '把预算放回现实',
      summary: base.metrics.wealth,
      action: '延迟冲动消费，把钱留给真正重要的安排。',
    },
    {
      key: 'wellbeing',
      label: '身心',
      score: 74 + (index % 7),
      title: '给状态留缓冲',
      summary: base.metrics.health,
      action: '安排一次短休息，别用硬撑换效率。',
    },
  ];

  return {
    zodiac: sign,
    date: base.date,
    profile: base.profile,
    score: {
      overall: Math.round(dimensions.reduce((total, item) => total + item.score, 0) / dimensions.length),
      love: dimensions[0].score,
      career: dimensions[1].score,
      wealth: dimensions[2].score,
      wellbeing: dimensions[3].score,
    },
    theme: {
      title: `${sign}今日气运`,
      summary: base.summary,
      keywords: base.profile.keywords,
    },
    dimensions,
    dayparts: [
      {
        label: '上午',
        suitable: '定目标、处理主线',
        avoid: '临时答应太多事',
        hint: '先推进一个最小动作，今天的节奏会更稳。',
      },
      {
        label: '下午',
        suitable: '沟通、协作、确认资源',
        avoid: '信息不完整时做决定',
        hint: '把需求和边界讲清楚，会比反复猜测有效。',
      },
      {
        label: '晚上',
        suitable: '复盘、放松、整理关系',
        avoid: '带着疲惫继续硬撑',
        hint: '留一点安静时间，给明天一个清爽起点。',
      },
    ],
    lucky: {
      ...base.lucky,
      item: '透明水杯',
    },
    action: {
      id: `${sign}-today-fallback`,
      title: '完成一个小而确定的行动',
      description: '今天只选一件能让你更接近目标的小事，完成后就停下来确认状态。',
      difficulty: 'normal',
      checkInText: '我做到了',
    },
    compatibility: base.compatibility,
    sharePoster: {
      title: `${sign}今日气运`,
      subtitle: `${base.profile.element} · 今日指数`,
      accentText: '完成一个小而确定的行动',
      footerText: `幸运色 ${base.lucky.color} · 数字 ${base.lucky.number}`,
      themeName: 'sky-current',
    },
  };
}

function buildWeeklyFallback(sign: string): ZodiacWeeklyData {
  return {
    zodiac: sign,
    weekRange: '',
    profile: buildProfileSummary(sign),
    theme: `${sign}的节奏整合周`,
    overview: `这一周适合${sign}先理顺优先级，再把资源投向最有确定感的方向。`,
    rhythm: [
      { label: '周初', summary: '先把目标定清楚，再开始推进。' },
      { label: '周中', summary: '沟通和协作效率更高，适合处理重点事项。' },
      { label: '周末', summary: '留一点复盘和放松时间，状态会更稳。' },
    ],
    focus: {
      love: '关系里适合说清期待，减少猜测。',
      career: '工作上先抓主线，不必一次做满。',
      wealth: '预算上先稳住，再考虑额外支出。',
      health: '照顾睡眠与饮食，能量感会更稳定。',
    },
    luckyWindow: '周三到周五午后',
    bestMatch: getOffsetSign(sign, 2),
    action: '先完成一件最重要的事，再处理其他分支任务。',
    caution: '不要因为一时情绪或冲动改变整周计划。',
  };
}

function buildMonthlyFallback(sign: string): ZodiacMonthlyData {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  return {
    zodiac: sign,
    month,
    profile: buildProfileSummary(sign),
    theme: {
      title: `${sign}的月度节奏`,
      summary: `这个月适合${sign}把分散的想法收束成少数稳定行动。`,
    },
    rhythm: [
      { label: '上旬', summary: '先定方向，把本月最重要的事项排到前面。' },
      { label: '中旬', summary: '沟通与协作会变多，适合处理关键关系和资源。' },
      { label: '下旬', summary: '复盘成果，减少无效消耗，为下个月留余地。' },
    ],
    focus: {
      relationship: '关系里需要清晰表达，不用靠猜测维持默契。',
      career: '事业上适合围绕核心任务持续推进。',
      money: '财务上先稳住预算，再考虑额外投入。',
      wellbeing: '作息和情绪恢复会影响整个月的发挥。',
    },
    opportunities: ['开启一个可持续的小计划。', '把擅长的事变成可见成果。'],
    cautions: ['不要同时推进太多方向。', '重要决定先等状态稳定后再确认。'],
    keyDays: [`${month}-06`, `${month}-15`, `${month}-24`],
    action: '每周固定一次复盘，把计划变成真实进度。',
  };
}

function buildYearlyFallback(sign: string): ZodiacYearlyData {
  const year = new Date().getFullYear();
  return {
    zodiac: sign,
    year,
    profile: buildProfileSummary(sign),
    theme: {
      title: `${sign}的长期成长年`,
      summary: `这一年适合${sign}把个人优势沉淀成更稳定的输出方式。`,
    },
    quarterForecasts: [
      {
        quarter: 'Q1',
        title: '定下主轴',
        summary: '先确认今年最重要的方向和边界。',
      },
      {
        quarter: 'Q2',
        title: '持续推进',
        summary: '适合把前期判断变成持续动作。',
      },
      {
        quarter: 'Q3',
        title: '调整结构',
        summary: '会有几次必要的取舍，聚焦很重要。',
      },
      {
        quarter: 'Q4',
        title: '回收成果',
        summary: '复盘与沉淀会让明年的起点更高。',
      },
    ],
    focus: {
      relationship: '关系里需要更多清晰表达和稳定行动。',
      career: '事业和学业适合围绕核心能力持续打磨。',
      money: '财务上优先考虑长期收益和可持续投入。',
      wellbeing: '作息、情绪和身体节奏都是长期底盘。',
    },
    keyMonths: ['3月', '7月', '11月'],
    anchorAdvice: '把注意力放到少数关键事情上，长期会更有回报。',
  };
}

function buildCompatibilityFallback(sign: string, partner?: string): ZodiacCompatibilityData {
  const nextPartner = partner || getOffsetSign(sign, 1);
  return {
    zodiac: sign,
    partner: nextPartner,
    score: 78,
    level: '顺畅互补',
    summary: `${sign}和${nextPartner}属于比较容易找到默契的组合，关键在于把节奏说清楚。`,
    chemistry: {
      emotion: '情绪互动整体顺畅，适合多给对方明确回应。',
      communication: '只要把优先级讲清楚，沟通就会越来越轻松。',
      growth: '这组关系适合在互相支持里一起成长。',
    },
    highlights: [
      `${sign}负责点亮气氛时，${nextPartner}更容易给出稳定反馈。`,
      '相处里的亮点通常来自真诚表达，而不是技巧。',
      '只要节奏对齐，这组组合的舒适度会越来越高。',
    ],
    caution: '别把想当然当成默契，重要话题还是要直接说。',
    tips: ['先说清楚期待。', '给彼此一点空间。', '在状态稳定时谈重要问题。'],
  };
}

function buildKnowledgeFallback(sign: string): ZodiacKnowledgeData {
  return {
    zodiac: sign,
    title: `${sign}性格速写`,
    overview: `${sign}通常会在自己熟悉的节奏里释放最稳定的能量。`,
    quickFacts: [
      { label: '元素', value: '星座能量' },
      { label: '模式', value: '完整视图' },
      { label: '季节', value: '全年适用' },
    ],
    strengths: ['有自己的节奏感', '遇事有直觉', '在熟悉领域更容易发光'],
    relationshipStyle: '适合用真诚和明确来建立关系，而不是反复试探。',
    workStyle: '找到主线后会更有表现力，分散过多反而容易损耗。',
    growthTip: '给自己留一点复盘与缓冲时间，会更容易稳定发挥。',
    keywords: ['真实', '节奏', '连接'],
  };
}

const fallbackSign: ZodiacSign = '摩羯座';
const selectedSign = ref<ZodiacSign | string>(fallbackSign);
const activeView = ref<ZodiacViewMode>('daily');
const loading = ref(false);
const actionChecked = ref(false);
const { themeVars } = useThemePreference();
const todayFortune = ref<ZodiacTodayData>(buildTodayFallback(fallbackSign));
const weeklyFortune = ref<ZodiacWeeklyData>(buildWeeklyFallback(fallbackSign));
const monthlyFortune = ref<ZodiacMonthlyData>(buildMonthlyFallback(fallbackSign));
const yearlyFortune = ref<ZodiacYearlyData>(buildYearlyFallback(fallbackSign));
const compatibility = ref<ZodiacCompatibilityData>(buildCompatibilityFallback(fallbackSign));
const knowledge = ref<ZodiacKnowledgeData>(buildKnowledgeFallback(fallbackSign));

const zodiacVisual = computed(() => {
  const sign = String(selectedSign.value) as ZodiacSign;
  return zodiacVisualMap[sign] || zodiacVisualMap.狮子座;
});

const zodiacArtStyle = computed<Record<string, string>>(() => ({
  '--zodiac-art-accent': zodiacVisual.value.accent,
  '--zodiac-art-accent-rgb': hexToRgb(zodiacVisual.value.accent),
  '--zodiac-art-deep': zodiacVisual.value.deep,
  '--zodiac-art-wash': zodiacVisual.value.wash,
}));

const zodiacEnglishName = computed(() => zodiacVisual.value.label.toUpperCase());

const zodiacDateRange = computed(() => {
  const sign = String(selectedSign.value) as ZodiacSign;
  return zodiacDateRangeMap[sign] || zodiacDateRangeMap[fallbackSign];
});

const zodiacTraits = computed(() => {
  const sign = String(selectedSign.value) as ZodiacSign;

  return zodiacTraitMap[sign] || zodiacTraitMap[fallbackSign];
});

const zodiacTiles = computed(() =>
  zodiacSigns.map((sign) => ({
    sign,
    glyph: zodiacVisualMap[sign].glyph,
  })),
);

const scoreRingStyle = computed<Record<string, string>>(() => {
  const score = clampNumber(todayFortune.value.score.overall, 0, 100);
  return {
    '--score-angle': `${Math.round(score * 3.6)}deg`,
  };
});

const mountainImageStyle = computed<Record<string, string>>(() => ({
  backgroundImage: `url("${buildSvgDataUrl(heroMountainsSvg, '#ffffff')}")`,
}));

const dimensionCards = computed(() =>
  todayFortune.value.dimensions.map((item) => {
    const ui = dimensionUiMap[item.key];

    return {
      ...item,
      displayLabel: ui.displayLabel,
      icon: ui.icon,
    };
  }),
);

function hexToRgb(value: string) {
  const normalized = value.replace('#', '');
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  if ([red, green, blue].some((item) => Number.isNaN(item))) {
    return '122, 168, 255';
  }

  return `${red}, ${green}, ${blue}`;
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

function buildSvgDataUrl(markup: string, color: string) {
  const nextMarkup = markup.replace(/currentColor/g, color);
  return `data:image/svg+xml;utf8,${encodeURIComponent(nextMarkup)}`;
}

function getDaypartIcon(label: string) {
  if (label.includes('上午')) {
    return '☀';
  }

  if (label.includes('下午')) {
    return '✹';
  }

  return '☾';
}

function getDaypartKey(label: string) {
  if (label.includes('上午')) {
    return 'morning';
  }

  if (label.includes('下午')) {
    return 'afternoon';
  }

  return 'evening';
}

const heroSummary = computed(() => {
  switch (activeView.value) {
    case 'weekly':
      return weeklyFortune.value.overview;
    case 'monthly':
      return monthlyFortune.value.theme.summary;
    case 'yearly':
      return yearlyFortune.value.theme.summary;
    case 'compatibility':
      return compatibility.value.summary;
    case 'knowledge':
      return knowledge.value.overview;
    default:
      return todayFortune.value.theme.summary;
  }
});

const heroKeywords = computed(() => {
  if (todayFortune.value.theme.keywords?.length) {
    return todayFortune.value.theme.keywords.slice(0, 4);
  }

  return knowledge.value.keywords.slice(0, 3);
});

const weeklyMetrics = computed(() => [
  { label: '关系', value: weeklyFortune.value.focus.love },
  { label: '工作', value: weeklyFortune.value.focus.career },
  { label: '财务', value: weeklyFortune.value.focus.wealth },
  { label: '身心', value: weeklyFortune.value.focus.health },
]);

const monthlyMetrics = computed(() => [
  { label: '关系', value: monthlyFortune.value.focus.relationship },
  { label: '事业', value: monthlyFortune.value.focus.career },
  { label: '财务', value: monthlyFortune.value.focus.money },
  { label: '身心', value: monthlyFortune.value.focus.wellbeing },
]);

const yearlyMetrics = computed(() => [
  { label: '关系', value: yearlyFortune.value.focus.relationship },
  { label: '事业', value: yearlyFortune.value.focus.career },
  { label: '财务', value: yearlyFortune.value.focus.money },
  { label: '身心', value: yearlyFortune.value.focus.wellbeing },
]);

const compatibilityMetrics = computed(() => [
  { label: '情绪互动', value: compatibility.value.chemistry.emotion },
  { label: '沟通节奏', value: compatibility.value.chemistry.communication },
  { label: '共同成长', value: compatibility.value.chemistry.growth },
]);

async function loadModule(sign: string) {
  loading.value = true;
  actionChecked.value = false;

  const [todayResult, weeklyResult, monthlyResult, yearlyResult, compatibilityResult, knowledgeResult] =
    await Promise.allSettled([
      fetchZodiacToday(sign),
      fetchZodiacWeekly(sign),
      fetchZodiacMonthly(sign),
      fetchZodiacYearly(sign),
      fetchZodiacCompatibility(sign),
      fetchZodiacKnowledge(sign),
    ]);

  todayFortune.value = todayResult.status === 'fulfilled' ? todayResult.value.data : buildTodayFallback(sign);
  weeklyFortune.value = weeklyResult.status === 'fulfilled' ? weeklyResult.value.data : buildWeeklyFallback(sign);
  monthlyFortune.value = monthlyResult.status === 'fulfilled' ? monthlyResult.value.data : buildMonthlyFallback(sign);
  yearlyFortune.value = yearlyResult.status === 'fulfilled' ? yearlyResult.value.data : buildYearlyFallback(sign);
  compatibility.value =
    compatibilityResult.status === 'fulfilled' ? compatibilityResult.value.data : buildCompatibilityFallback(sign);
  knowledge.value = knowledgeResult.status === 'fulfilled' ? knowledgeResult.value.data : buildKnowledgeFallback(sign);
  loading.value = false;
}

async function selectSign(sign: string) {
  if (sign === selectedSign.value && !loading.value) {
    return;
  }

  selectedSign.value = sign;
  await loadModule(sign);
}

function toggleActionCheck() {
  actionChecked.value = !actionChecked.value;
  uni.showToast({
    title: actionChecked.value ? '今日行动已记录' : '已取消完成状态',
    icon: 'none',
  });
}

function openPosterGenerate() {
  uni.navigateTo({
    url: `/pages/poster/generate/index?type=zodiac&bizCode=${encodeURIComponent(String(selectedSign.value))}&auto=1`,
  });
}

function decodeRouteValue(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function readSceneParam(scene: unknown, key: string) {
  if (typeof scene !== 'string' || !scene) {
    return '';
  }

  const decodedScene = decodeRouteValue(scene);
  const pairs = decodedScene.split('&');

  for (const pair of pairs) {
    const [rawKey, ...rawValueParts] = pair.split('=');

    if (decodeRouteValue(rawKey) === key) {
      return decodeRouteValue(rawValueParts.join('='));
    }
  }

  return '';
}

onLoad((query) => {
  const cachedUser = getCachedUser();
  const sceneSign = readSceneParam(query?.scene, 'zodiac');
  const routeSign = query && typeof query.zodiac === 'string' ? decodeRouteValue(query.zodiac) : sceneSign;
  const initialSign = zodiacSigns.includes(routeSign as ZodiacSign) ? routeSign : cachedUser?.zodiac || fallbackSign;

  selectedSign.value = initialSign;
  void loadModule(initialSign);
});

onPullDownRefresh(async () => {
  await loadModule(String(selectedSign.value));
  uni.stopPullDownRefresh();
});
</script>

<style lang="scss">
.page {
  --zodiac-purple: #8d6ff4;
  --zodiac-purple-deep: #2c3199;
  --zodiac-blue: #447ce8;
  --zodiac-ink: #263252;
  --zodiac-muted: #72809d;
  --zodiac-soft-line: rgba(144, 125, 218, 0.18);
  position: relative;
  width: 100vw;
  max-width: 100vw;
  min-height: 100vh;
  box-sizing: border-box;
  overflow: hidden;
  padding: calc(var(--status-bar-height, 0px) + 42rpx) 32rpx 56rpx;
  background:
    radial-gradient(circle at 84% 3%, rgba(255, 255, 255, 0.5), transparent 22%),
    radial-gradient(circle at 11% 16%, rgba(109, 122, 255, 0.38), transparent 25%),
    linear-gradient(180deg, #202aa5 0%, #777df3 25%, #f8f7ff 52%, #f7f8ff 100%);
  color: var(--zodiac-ink);
  font-family:
    'PingFang SC',
    'Helvetica Neue',
    Arial,
    sans-serif;
}

.sky-layer {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: 520rpx;
  overflow: hidden;
  pointer-events: none;
  background:
    radial-gradient(circle at 3% 54%, rgba(255, 255, 255, 0.92) 0 3rpx, transparent 4rpx),
    radial-gradient(circle at 53% 9%, rgba(255, 255, 255, 0.92) 0 2rpx, transparent 4rpx),
    radial-gradient(circle at 64% 26%, rgba(255, 255, 255, 0.72) 0 2rpx, transparent 4rpx),
    radial-gradient(circle at 93% 12%, rgba(255, 255, 255, 0.86) 0 2rpx, transparent 4rpx),
    radial-gradient(circle at 27% 34%, rgba(255, 255, 255, 0.42) 0 2rpx, transparent 4rpx);
}

.sky-layer::before,
.sky-layer::after {
  position: absolute;
  content: '';
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 24rpx rgba(255, 255, 255, 0.76);
}

.sky-layer::before {
  top: 104rpx;
  left: 640rpx;
  width: 10rpx;
  height: 10rpx;
}

.sky-layer::after {
  top: 214rpx;
  left: 18rpx;
  width: 6rpx;
  height: 6rpx;
}

.sky-layer__star {
  position: absolute;
  width: 34rpx;
  height: 34rpx;
}

.sky-layer__star::before,
.sky-layer__star::after {
  position: absolute;
  content: '';
  background: rgba(255, 255, 255, 0.92);
  border-radius: 999rpx;
  box-shadow: 0 0 28rpx rgba(255, 255, 255, 0.88);
}

.sky-layer__star::before {
  top: 16rpx;
  left: 0;
  width: 34rpx;
  height: 2rpx;
}

.sky-layer__star::after {
  top: 0;
  left: 16rpx;
  width: 2rpx;
  height: 34rpx;
}

.sky-layer__star--one {
  top: 92rpx;
  right: 232rpx;
}

.sky-layer__star--two {
  top: 318rpx;
  left: 418rpx;
  transform: scale(0.68);
  opacity: 0.82;
}

.sky-layer__constellation {
  position: absolute;
  top: 82rpx;
  right: 98rpx;
  width: 252rpx;
  height: 108rpx;
  opacity: 0.68;
}

.sky-line {
  position: absolute;
  height: 2rpx;
  transform-origin: 0 50%;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.88), rgba(255, 255, 255, 0.08));
}

.sky-line--one {
  top: 50rpx;
  left: 26rpx;
  width: 142rpx;
  transform: rotate(18deg);
}

.sky-line--two {
  top: 74rpx;
  left: 112rpx;
  width: 112rpx;
  transform: rotate(-16deg);
}

.sky-dot {
  position: absolute;
  width: 9rpx;
  height: 9rpx;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 0 18rpx rgba(255, 255, 255, 0.9);
}

.sky-dot--one {
  top: 42rpx;
  left: 24rpx;
}

.sky-dot--two {
  top: 70rpx;
  left: 110rpx;
}

.sky-dot--three {
  top: 54rpx;
  left: 170rpx;
}

.sky-dot--four {
  top: 30rpx;
  right: 14rpx;
}

.topbar {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 22rpx;
  width: calc(100vw - 64rpx);
  box-sizing: border-box;
  min-height: 92rpx;
  min-width: 0;
}

.topbar__copy {
  display: flex;
  align-items: baseline;
  gap: 12rpx;
  flex: 1 1 auto;
  min-width: 0;
}

.page-title {
  color: #ffffff;
  font-size: 46rpx;
  font-weight: 800;
  line-height: 1;
  white-space: nowrap;
  text-shadow: 0 10rpx 24rpx rgba(19, 22, 90, 0.22);
}

.page-subtitle {
  color: rgba(255, 255, 255, 0.68);
  font-size: 20rpx;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-capsule {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18rpx;
  flex: 0 0 auto;
  min-width: 138rpx;
  height: 52rpx;
  padding: 0 16rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.62);
  box-shadow:
    0 10rpx 24rpx rgba(28, 31, 110, 0.16),
    0 0 0 1rpx rgba(255, 255, 255, 0.72) inset;
  backdrop-filter: blur(16rpx);
}

.menu-dots {
  display: flex;
  gap: 8rpx;
}

.menu-dot {
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  background: #1f2030;
}

.menu-separator {
  width: 1rpx;
  height: 30rpx;
  background: rgba(47, 48, 82, 0.16);
}

.menu-dash {
  width: 28rpx;
  height: 6rpx;
  border-radius: 999rpx;
  background: #1f2030;
}

.menu-target {
  position: relative;
  width: 28rpx;
  height: 28rpx;
  border-radius: 50%;
  border: 5rpx solid #1f2030;
  box-sizing: border-box;
}

.menu-target::after {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8rpx;
  height: 8rpx;
  content: '';
  border-radius: 50%;
  background: #1f2030;
  transform: translate(-50%, -50%);
}

.fortune-shell {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 26rpx;
  width: calc(100vw - 64rpx);
  max-width: calc(100vw - 64rpx);
  box-sizing: border-box;
  margin-top: 28rpx;
  padding: 34rpx 28rpx 32rpx;
  border-radius: 30rpx;
  background:
    radial-gradient(circle at 100% 4%, rgba(var(--theme-accent-rgb), 0.18), transparent 24%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(252, 252, 255, 0.95) 100%);
  border: 1rpx solid rgba(255, 255, 255, 0.82);
  box-shadow:
    0 24rpx 64rpx rgba(39, 44, 120, 0.18),
    0 0 0 1rpx rgba(143, 124, 239, 0.08) inset;
  backdrop-filter: blur(20rpx);
}

.sync-pill {
  position: absolute;
  top: 22rpx;
  right: 28rpx;
  z-index: 4;
  display: flex;
  align-items: center;
  gap: 10rpx;
  height: 46rpx;
  padding: 0 18rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.86);
  color: var(--zodiac-purple-deep);
  font-size: 22rpx;
  font-weight: 600;
  box-shadow: 0 12rpx 28rpx rgba(74, 72, 165, 0.12);
}

.sync-pill__spark {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: var(--zodiac-purple);
  box-shadow: 0 0 16rpx rgba(141, 111, 244, 0.86);
}

.profile-panel {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 188rpx;
  gap: 18rpx;
  align-items: start;
  min-height: 224rpx;
  min-width: 0;
  padding: 18rpx 2rpx 0 0;
}

.profile-panel__info {
  display: flex;
  align-items: flex-start;
  gap: 18rpx;
  min-width: 0;
  padding-top: 28rpx;
}

.zodiac-mark {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 72rpx;
  height: 72rpx;
  border-radius: 17rpx;
  background:
    radial-gradient(circle at 30% 24%, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.1) 31%),
    linear-gradient(145deg, #b38cff 0%, var(--zodiac-art-deep) 100%);
  box-shadow:
    0 12rpx 26rpx rgba(var(--zodiac-art-accent-rgb), 0.28),
    0 0 0 1rpx rgba(255, 255, 255, 0.44) inset;
}

.zodiac-mark__glyph {
  color: #ffffff;
  font-size: 54rpx;
  font-weight: 800;
  line-height: 1;
}

.profile-panel__copy {
  display: grid;
  gap: 9rpx;
  min-width: 0;
}

.profile-panel__title {
  color: #273257;
  font-size: 40rpx;
  font-weight: 800;
  line-height: 1.08;
}

.profile-panel__en {
  color: #828ba8;
  font-size: 22rpx;
  font-weight: 700;
  line-height: 1;
}

.profile-panel__date,
.profile-panel__traits {
  color: #7c88a8;
  font-size: 22rpx;
  line-height: 1.35;
}

.profile-panel__traits {
  color: #7180a0;
  font-size: 20rpx;
  white-space: nowrap;
}

.score-ring {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  justify-self: end;
  align-self: start;
  width: 188rpx;
  height: 188rpx;
  margin-top: 18rpx;
  border-radius: 50%;
  background:
    radial-gradient(circle at 42% 34%, rgba(255, 255, 255, 0.9), transparent 31%),
    radial-gradient(circle, rgba(255, 255, 255, 0.42), rgba(255, 255, 255, 0.1) 64%, transparent 65%);
  box-shadow:
    0 16rpx 42rpx rgba(98, 84, 178, 0.11),
    0 0 0 1rpx rgba(255, 255, 255, 0.72) inset;
}

.score-ring::before {
  position: absolute;
  inset: 0;
  z-index: 0;
  content: '';
  border-radius: 50%;
  background: conic-gradient(
    from 138deg,
    var(--zodiac-purple) 0deg var(--score-angle),
    rgba(149, 126, 233, 0.18) var(--score-angle) 286deg,
    transparent 286deg 360deg
  );
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 15rpx), #000 calc(100% - 14rpx));
  mask: radial-gradient(farthest-side, transparent calc(100% - 15rpx), #000 calc(100% - 14rpx));
}

.score-ring::after {
  position: absolute;
  inset: 24rpx;
  z-index: 0;
  content: '';
  border-radius: 50%;
  background:
    radial-gradient(circle at 38% 24%, rgba(255, 255, 255, 0.98), transparent 30%),
    rgba(255, 255, 255, 0.7);
  box-shadow: 0 18rpx 42rpx rgba(95, 84, 174, 0.08) inset;
}

.score-ring__glow {
  position: absolute;
  inset: 20rpx;
  z-index: 0;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(148, 122, 249, 0.16), transparent 66%);
}

.score-ring__handle {
  position: absolute;
  top: 75rpx;
  right: -2rpx;
  z-index: 3;
  width: 26rpx;
  height: 26rpx;
  border-radius: 50%;
  background: #ffffff;
  box-shadow:
    0 6rpx 18rpx rgba(96, 83, 184, 0.2),
    0 0 0 1rpx rgba(148, 122, 249, 0.2) inset;
}

.score-ring__value,
.score-ring__unit,
.score-ring__label {
  position: relative;
  z-index: 2;
}

.score-ring__value {
  color: #2a3355;
  font-size: 60rpx;
  font-weight: 800;
  line-height: 0.9;
}

.score-ring__unit {
  margin-top: 8rpx;
  color: #737f9d;
  font-size: 22rpx;
  font-weight: 600;
  line-height: 1;
}

.score-ring__label {
  margin-top: 8rpx;
  color: #697592;
  font-size: 20rpx;
  font-weight: 600;
  line-height: 1;
}

.soft-divider {
  position: relative;
  height: 1rpx;
  margin-top: 2rpx;
  background: linear-gradient(90deg, transparent 0%, rgba(135, 145, 190, 0.22) 8%, rgba(135, 145, 190, 0.22) 58%, transparent 88%);
}

.soft-divider__star {
  position: absolute;
  top: -8rpx;
  left: 64%;
  width: 18rpx;
  height: 18rpx;
  transform: rotate(45deg);
  background: rgba(161, 134, 248, 0.66);
}

.summary-line {
  color: #52607f;
  font-size: 26rpx;
  font-weight: 600;
  line-height: 1.62;
}

.action-banner {
  position: relative;
  min-height: 176rpx;
  overflow: hidden;
  box-sizing: border-box;
  padding: 24rpx 196rpx 22rpx 24rpx;
  border-radius: 24rpx;
  background:
    radial-gradient(circle at 92% 18%, rgba(255, 255, 255, 0.62), transparent 24%),
    linear-gradient(135deg, #5e68e8 0%, #9f8fff 52%, #d9d6ff 100%);
  box-shadow: 0 18rpx 42rpx rgba(86, 88, 185, 0.18);
}

.action-banner::before,
.action-banner::after {
  position: absolute;
  content: '';
  background: rgba(255, 255, 255, 0.86);
  transform: rotate(45deg);
}

.action-banner::before {
  top: 42rpx;
  left: 134rpx;
  width: 10rpx;
  height: 10rpx;
}

.action-banner::after {
  top: 28rpx;
  right: 206rpx;
  width: 8rpx;
  height: 8rpx;
}

.action-banner__copy {
  position: relative;
  z-index: 2;
  display: grid;
  gap: 12rpx;
}

.section-label,
.section-heading__title,
.focus-card__label,
.dimension-card__label {
  color: #6b78a0;
  font-size: 23rpx;
  font-weight: 700;
  line-height: 1.25;
}

.section-label--light {
  color: rgba(255, 255, 255, 0.82);
  font-weight: 600;
}

.action-banner__title {
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 800;
  line-height: 1.25;
}

.action-banner__text {
  color: rgba(255, 255, 255, 0.9);
  font-size: 24rpx;
  line-height: 1.55;
}

.check-button {
  position: absolute;
  right: 24rpx;
  bottom: 24rpx;
  z-index: 4;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  min-width: 150rpx;
  min-height: 58rpx;
  margin: 0;
  padding: 0 22rpx;
  border-radius: 999rpx;
  color: #2d31b2;
  font-size: 24rpx;
  font-weight: 800;
  line-height: 1;
  background: rgba(255, 255, 255, 0.84);
  box-shadow:
    0 12rpx 28rpx rgba(63, 55, 153, 0.2),
    0 0 0 1rpx rgba(255, 255, 255, 0.62) inset;
}

.check-button::after,
.poster-cta__button::after {
  border: 0;
}

.check-button__icon {
  display: grid;
  place-items: center;
  width: 28rpx;
  height: 28rpx;
  border-radius: 50%;
  color: #ffffff;
  font-size: 18rpx;
  line-height: 1;
  background: #4034c9;
}

.check-button--done {
  color: #1f8c72;
  background: rgba(255, 255, 255, 0.9);
}

.check-button--done .check-button__icon {
  background: #20a982;
}

.action-banner__flag {
  position: absolute;
  right: 82rpx;
  top: 32rpx;
  z-index: 2;
  width: 54rpx;
  height: 42rpx;
  border-left: 4rpx solid rgba(45, 49, 178, 0.34);
  background: linear-gradient(90deg, rgba(79, 71, 213, 0.86), rgba(153, 132, 246, 0.72));
  clip-path: polygon(0 0, 100% 0, 84% 50%, 100% 100%, 0 100%);
  box-shadow: 0 10rpx 20rpx rgba(60, 57, 160, 0.18);
}

.action-banner__mountains {
  position: absolute;
  right: -8rpx;
  bottom: -42rpx;
  z-index: 1;
  width: 282rpx;
  height: 170rpx;
  background-repeat: no-repeat;
  background-position: right bottom;
  background-size: contain;
  opacity: 0.86;
}

.dimension-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20rpx;
  min-width: 0;
}

.dimension-card {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 82rpx;
  gap: 10rpx;
  min-height: 132rpx;
  box-sizing: border-box;
  padding: 24rpx 20rpx 22rpx;
  overflow: hidden;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.86);
  border: 1rpx solid rgba(145, 126, 224, 0.18);
  box-shadow:
    0 14rpx 34rpx rgba(65, 78, 128, 0.07),
    0 0 0 1rpx rgba(255, 255, 255, 0.76) inset;
}

.dimension-card--love {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.92) 0%, rgba(250, 245, 255, 0.78) 100%);
  border-color: rgba(177, 127, 244, 0.22);
}

.dimension-card--career {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.94) 0%, rgba(240, 247, 255, 0.8) 100%);
  border-color: rgba(76, 133, 230, 0.22);
}

.dimension-card--wealth {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.94) 0%, rgba(255, 248, 236, 0.84) 100%);
  border-color: rgba(234, 177, 83, 0.28);
}

.dimension-card--wellbeing {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.94) 0%, rgba(238, 251, 249, 0.84) 100%);
  border-color: rgba(69, 185, 181, 0.24);
}

.dimension-card__content {
  display: grid;
  gap: 7rpx;
  min-width: 0;
}

.dimension-card__score {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
}

.dimension-card__value {
  color: #293254;
  font-size: 32rpx;
  font-weight: 800;
  line-height: 1;
}

.dimension-card__unit {
  color: #8993ac;
  font-size: 20rpx;
  font-weight: 600;
}

.dimension-card__title {
  color: #273253;
  font-size: 25rpx;
  font-weight: 800;
  line-height: 1.28;
}

.dimension-card__summary {
  color: #72809a;
  font-size: 21rpx;
  line-height: 1.36;
}

.dimension-card__icon {
  align-self: center;
  display: grid;
  place-items: center;
  width: 70rpx;
  height: 70rpx;
  border-radius: 50%;
  font-size: 28rpx;
  font-weight: 800;
  background: rgba(255, 255, 255, 0.72);
  box-shadow:
    0 14rpx 32rpx rgba(75, 89, 140, 0.12),
    0 0 0 1rpx rgba(255, 255, 255, 0.72) inset;
}

.dimension-card--love .dimension-card__icon {
  color: #8f57df;
  background: linear-gradient(180deg, rgba(248, 243, 255, 0.98), rgba(221, 199, 255, 0.56));
}

.dimension-card--career .dimension-card__icon {
  color: #2f71dc;
  background: linear-gradient(180deg, rgba(242, 248, 255, 0.98), rgba(196, 218, 255, 0.62));
}

.dimension-card--wealth .dimension-card__icon {
  color: #d99024;
  background: linear-gradient(180deg, rgba(255, 250, 242, 0.98), rgba(255, 224, 163, 0.68));
}

.dimension-card--wellbeing .dimension-card__icon {
  color: #2aaea5;
  background: linear-gradient(180deg, rgba(241, 252, 250, 0.98), rgba(186, 238, 232, 0.66));
}

.sign-section {
  display: grid;
  gap: 16rpx;
}

.section-heading {
  display: flex;
  align-items: center;
  gap: 9rpx;
}

.section-heading__spark {
  color: var(--zodiac-purple);
  font-size: 20rpx;
}

.section-heading__icon {
  display: grid;
  place-items: center;
  width: 30rpx;
  height: 30rpx;
  border-radius: 50%;
  color: #ffffff;
  font-size: 20rpx;
  background: var(--zodiac-purple);
}

.section-heading--compact {
  margin-bottom: 12rpx;
}

.sign-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 14rpx;
  min-width: 0;
}

.sign-tile {
  display: grid;
  place-items: center;
  align-content: center;
  gap: 8rpx;
  min-height: 92rpx;
  border-radius: 14rpx;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(248, 249, 255, 0.86));
  border: 1rpx solid rgba(128, 139, 170, 0.12);
  box-shadow:
    0 12rpx 24rpx rgba(73, 83, 130, 0.05),
    0 0 0 1rpx rgba(255, 255, 255, 0.76) inset;
  transition:
    transform 160ms ease,
    background 180ms ease,
    box-shadow 180ms ease;
}

.sign-tile:active {
  transform: scale(0.97);
}

.sign-tile__glyph {
  color: #98a2ba;
  font-size: 34rpx;
  line-height: 1;
}

.sign-tile__label {
  color: #667493;
  font-size: 22rpx;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
}

.sign-tile--active {
  background: linear-gradient(135deg, #ad8dff 0%, #7a67ee 100%);
  border-color: rgba(255, 255, 255, 0.42);
  box-shadow:
    0 16rpx 28rpx rgba(116, 96, 224, 0.24),
    0 0 0 1rpx rgba(255, 255, 255, 0.4) inset;
}

.sign-tile--active .sign-tile__glyph,
.sign-tile--active .sign-tile__label {
  color: #ffffff;
}

.view-tabs {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0;
  height: 58rpx;
  padding: 5rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.86);
  border: 1rpx solid rgba(126, 136, 176, 0.12);
  box-shadow:
    0 12rpx 30rpx rgba(71, 82, 132, 0.08),
    0 0 0 1rpx rgba(255, 255, 255, 0.72) inset;
}

.view-tab {
  display: grid;
  place-items: center;
  border-radius: 999rpx;
  color: #5f6c8f;
  font-size: 25rpx;
  font-weight: 700;
}

.view-tab--active {
  color: #ffffff;
  background: linear-gradient(135deg, #a582ff 0%, #7d69ef 100%);
  box-shadow: 0 10rpx 20rpx rgba(117, 96, 223, 0.26);
}

.period-panel {
  display: grid;
  gap: 20rpx;
  box-sizing: border-box;
  padding: 26rpx 24rpx;
  overflow: hidden;
  border-radius: 20rpx;
  background:
    radial-gradient(circle at 92% 12%, rgba(151, 126, 248, 0.18), transparent 26%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.88) 0%, rgba(248, 247, 255, 0.88) 100%);
  border: 1rpx solid rgba(143, 126, 225, 0.14);
}

.period-panel--daily {
  position: relative;
  grid-template-columns: minmax(0, 1fr) 250rpx;
  min-height: 250rpx;
}

.period-panel__copy,
.period-hero,
.rhythm-list,
.focus-grid,
.daypart-list {
  display: grid;
}

.daypart-list {
  gap: 18rpx;
}

.daypart-item {
  display: grid;
  grid-template-columns: 54rpx minmax(0, 1fr);
  gap: 18rpx;
  align-items: center;
}

.daypart-item__icon {
  display: grid;
  place-items: center;
  width: 54rpx;
  height: 54rpx;
  border-radius: 50%;
  font-size: 30rpx;
  background: rgba(255, 255, 255, 0.66);
  box-shadow: 0 8rpx 20rpx rgba(70, 78, 140, 0.08);
}

.daypart-item--morning .daypart-item__icon {
  color: #8b65ef;
  background: #f0eaff;
}

.daypart-item--afternoon .daypart-item__icon {
  color: #ef9d29;
  background: #fff4de;
}

.daypart-item--evening .daypart-item__icon {
  color: #5a83d9;
  background: #eaf2ff;
}

.daypart-item__copy {
  display: grid;
  gap: 4rpx;
  min-width: 0;
}

.daypart-item__label {
  color: #364264;
  font-size: 23rpx;
  font-weight: 800;
  line-height: 1.22;
}

.daypart-item__line {
  color: #657391;
  font-size: 21rpx;
  line-height: 1.42;
}

.compass-art {
  position: relative;
  align-self: center;
  justify-self: end;
  width: 232rpx;
  height: 232rpx;
  opacity: 0.92;
}

.compass-art__outer,
.compass-art__dial {
  position: absolute;
  border-radius: 50%;
}

.compass-art__outer {
  inset: 0;
  background:
    repeating-conic-gradient(from 0deg, rgba(141, 111, 244, 0.16) 0deg 8deg, transparent 8deg 18deg),
    radial-gradient(circle, rgba(255, 255, 255, 0.86) 0 49%, rgba(155, 137, 241, 0.16) 50% 63%, transparent 64%);
  box-shadow: 0 20rpx 42rpx rgba(96, 90, 190, 0.16);
}

.compass-art__dial {
  inset: 38rpx;
  background:
    radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.94), rgba(210, 204, 255, 0.62) 72%),
    conic-gradient(from 24deg, rgba(142, 113, 244, 0.34), rgba(255, 255, 255, 0.2), rgba(142, 113, 244, 0.34));
  border: 1rpx solid rgba(255, 255, 255, 0.7);
}

.compass-art__needle {
  position: absolute;
  top: 40rpx;
  left: 107rpx;
  width: 18rpx;
  height: 158rpx;
  border-radius: 999rpx;
  background: linear-gradient(180deg, #7665e9 0%, #ffffff 48%, #a9a0ef 100%);
  transform: rotate(42deg);
  transform-origin: 50% 76rpx;
  box-shadow: 0 10rpx 22rpx rgba(93, 82, 185, 0.16);
}

.compass-art__pin {
  position: absolute;
  top: 102rpx;
  left: 102rpx;
  width: 28rpx;
  height: 28rpx;
  border-radius: 50%;
  background: #ffcd6b;
  box-shadow:
    0 0 0 8rpx rgba(255, 255, 255, 0.72),
    0 8rpx 20rpx rgba(88, 78, 170, 0.2);
}

.period-hero {
  gap: 10rpx;
}

.period-title {
  color: #2d385b;
  font-size: 31rpx;
  font-weight: 800;
  line-height: 1.3;
}

.period-meta,
.period-copy,
.rhythm-item__copy,
.focus-card__copy,
.insight-strip,
.poster-cta__text {
  color: #667391;
  font-size: 23rpx;
  line-height: 1.56;
}

.rhythm-list {
  gap: 14rpx;
}

.rhythm-item {
  display: grid;
  gap: 6rpx;
  padding-bottom: 14rpx;
  border-bottom: 1rpx solid rgba(128, 140, 180, 0.12);
}

.rhythm-item:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.rhythm-item__label {
  color: #34405f;
  font-size: 24rpx;
  font-weight: 800;
}

.focus-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
}

.focus-card {
  display: grid;
  gap: 8rpx;
  min-height: 106rpx;
  box-sizing: border-box;
  padding: 18rpx;
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.62);
  border: 1rpx solid rgba(143, 126, 225, 0.12);
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  min-height: 42rpx;
  padding: 0 18rpx;
  border-radius: 999rpx;
  color: #6653d9;
  font-size: 22rpx;
  font-weight: 700;
  background: rgba(132, 104, 239, 0.1);
}

.insight-strip {
  display: grid;
  gap: 6rpx;
  padding: 18rpx 20rpx;
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.66);
  border: 1rpx solid rgba(143, 126, 225, 0.1);
}

.poster-cta {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 20rpx;
  align-items: center;
  min-height: 92rpx;
  box-sizing: border-box;
  padding: 22rpx 26rpx;
  overflow: hidden;
  border-radius: 18rpx;
  background:
    radial-gradient(circle at 83% 6%, rgba(255, 255, 255, 0.2), transparent 26%),
    linear-gradient(135deg, #22299c 0%, #4240c9 58%, #1d2591 100%);
  box-shadow: 0 18rpx 38rpx rgba(37, 41, 146, 0.24);
}

.poster-cta__copy {
  display: grid;
  gap: 6rpx;
  min-width: 0;
}

.poster-cta__title {
  color: #ffffff;
  font-size: 28rpx;
  font-weight: 800;
  line-height: 1.2;
}

.poster-cta__text {
  color: rgba(255, 255, 255, 0.74);
}

.poster-cta__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  min-width: 166rpx;
  min-height: 58rpx;
  margin: 0;
  padding: 0 24rpx;
  border-radius: 999rpx;
  color: #3234bb;
  font-size: 24rpx;
  font-weight: 800;
  line-height: 1;
  background: rgba(255, 255, 255, 0.96);
  box-shadow:
    0 12rpx 26rpx rgba(17, 20, 88, 0.18),
    0 0 0 2rpx rgba(142, 115, 247, 0.22) inset;
}

.poster-cta__star {
  color: #5547d0;
  font-size: 24rpx;
}

.footer-wish {
  justify-self: center;
  color: #b1b6c7;
  font-size: 22rpx;
  line-height: 1.4;
}

@media (max-width: 360px) {
  .page {
    padding-right: 24rpx;
    padding-left: 24rpx;
  }

  .topbar__copy {
    grid-template-columns: minmax(0, 1fr);
    gap: 8rpx;
  }

  .page-title {
    font-size: 46rpx;
  }

  .fortune-shell {
    padding-right: 22rpx;
    padding-left: 22rpx;
  }

  .profile-panel {
    grid-template-columns: minmax(0, 1fr);
  }

  .score-ring {
    justify-self: center;
  }

  .period-panel--daily {
    grid-template-columns: minmax(0, 1fr);
  }

  .compass-art {
    justify-self: center;
    width: 210rpx;
    height: 210rpx;
  }
}
</style>
