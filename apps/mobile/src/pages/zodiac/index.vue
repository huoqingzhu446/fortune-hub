<template>
  <view class="page" :style="themeVars">
    <view class="hero-shell">
      <view class="hero-topline">
        <text class="eyebrow">zodiac today</text>
        <text class="hero-note">{{ todayFortune.profile.element }} · {{ todayFortune.profile.modality }}</text>
      </view>
      <view class="hero-heading">
        <view class="hero-copy">
          <text class="title">{{ selectedSign }}</text>
          <text class="hero-theme">{{ todayFortune.theme.title }}</text>
        </view>
        <view class="zodiac-art" :style="zodiacArtStyle">
          <view class="zodiac-art__constellation">
            <view
              v-for="line in constellationLines"
              :key="line.id"
              class="zodiac-art__line"
              :style="line.style"
            ></view>
            <view
              v-for="star in constellationStars"
              :key="star.id"
              class="zodiac-art__star"
              :style="star.style"
            ></view>
          </view>
          <text class="zodiac-art__glyph">{{ zodiacVisual.glyph }}</text>
          <text class="zodiac-art__label">{{ zodiacVisual.label }}</text>
          <view class="score-orbit">
            <text class="score-orbit__value">{{ todayFortune.score.overall }}</text>
            <text class="score-orbit__label">今日</text>
          </view>
        </view>
      </view>
      <text class="summary">{{ heroSummary }}</text>

      <view class="hero-glance">
        <view class="glance-item">
          <text class="glance-label">幸运色</text>
          <text class="glance-value">{{ todayFortune.lucky.color }}</text>
        </view>
        <view class="glance-item">
          <text class="glance-label">幸运物</text>
          <text class="glance-value">{{ todayFortune.lucky.item }}</text>
        </view>
        <view class="glance-item">
          <text class="glance-label">行动签</text>
          <text class="glance-value">{{ todayFortune.action.title }}</text>
        </view>
      </view>

      <view class="hero-actions">
        <view class="tag-row">
          <text v-for="keyword in heroKeywords" :key="keyword" class="tag-chip">{{ keyword }}</text>
        </view>
        <button class="share-button" :loading="posterLoading" @tap="generateZodiacPoster">生成分享图</button>
      </view>
    </view>

    <view v-if="poster" class="panel poster-preview-panel">
      <view class="section-head">
        <view class="section-head__copy">
          <text class="section-kicker">分享图预览</text>
          <text class="section-title">{{ poster.title }}</text>
        </view>
        <text class="section-note">{{ poster.width }} × {{ poster.height }}</text>
      </view>

      <image class="poster-image" :src="posterImageSource" mode="widthFix" @tap="previewGeneratedPoster" />

      <view class="poster-actions">
        <button class="poster-button poster-button--secondary" @tap="previewGeneratedPoster">
          大图预览
        </button>
        <button class="poster-button poster-button--primary" @tap="saveGeneratedPoster">
          保存到手机
        </button>
        <button
          v-if="isMpWeixin"
          class="poster-button poster-button--ghost"
          @tap="shareGeneratedPoster"
        >
          微信发好友
        </button>
      </view>
    </view>

    <view class="panel">
      <text class="section-kicker">选择星座</text>
      <view class="sign-grid">
        <view
          v-for="sign in zodiacSigns"
          :key="sign"
          class="sign-chip"
          :class="{ 'sign-chip--active': sign === selectedSign }"
          @tap="selectSign(sign)"
        >
          <text>{{ sign }}</text>
        </view>
      </view>
    </view>

    <scroll-view class="view-tabs" scroll-x>
      <view class="view-tabs__row">
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
    </scroll-view>

    <view v-if="loading" class="panel state-panel">
      <text class="state-title">正在刷新 {{ selectedSign }} 的今日气运...</text>
      <text class="state-copy">聚合页、行动签、四象限、月运和配对内容会一起更新。</text>
    </view>

    <template v-else>
      <view v-if="activeView === 'daily'" class="content-stack">
        <view class="panel action-panel">
          <view class="action-panel__copy">
            <text class="section-kicker">今日行动签</text>
            <text class="section-title">{{ todayFortune.action.title }}</text>
            <text class="body-copy">{{ todayFortune.action.description }}</text>
          </view>
          <button class="check-button" :class="{ 'check-button--done': actionChecked }" @tap="toggleActionCheck">
            {{ actionChecked ? '已完成' : todayFortune.action.checkInText }}
          </button>
        </view>

        <view class="dimension-grid">
          <view v-for="item in todayFortune.dimensions" :key="item.key" class="dimension-card">
            <view class="dimension-card__head">
              <text class="metric-label">{{ item.label }}</text>
              <text class="dimension-score">{{ item.score }}</text>
            </view>
            <text class="dimension-title">{{ item.title }}</text>
            <text class="metric-copy">{{ item.summary }}</text>
            <text class="dimension-action">{{ item.action }}</text>
          </view>
        </view>

        <view class="panel section-panel">
          <text class="section-kicker">今日时间节奏</text>
          <view class="daypart-list">
            <view v-for="item in todayFortune.dayparts" :key="item.label" class="daypart-item">
              <text class="timeline-label">{{ item.label }}</text>
              <text class="timeline-copy">适合：{{ item.suitable }}</text>
              <text class="timeline-copy">避免：{{ item.avoid }}</text>
              <text class="daypart-hint">{{ item.hint }}</text>
            </view>
          </view>
        </view>

        <view class="panel split-panel">
          <view class="split-block">
            <text class="section-kicker">今日配对</text>
            <text class="split-copy">{{ todayFortune.compatibility.bestMatch }}</text>
            <text class="mini-copy">{{ todayFortune.compatibility.message }}</text>
          </view>
          <view class="split-block">
            <text class="section-kicker">幸运方位</text>
            <text class="split-copy">{{ todayFortune.lucky.direction }}</text>
            <text class="mini-copy">数字 {{ todayFortune.lucky.number }}</text>
          </view>
        </view>
      </view>

      <view v-else-if="activeView === 'weekly'" class="content-stack">
        <view class="panel section-panel">
          <text class="section-kicker">本周主题</text>
          <text class="section-title">{{ weeklyFortune.theme }}</text>
          <text class="section-note">{{ weeklyFortune.weekRange }}</text>
          <text class="body-copy">{{ weeklyFortune.overview }}</text>
        </view>

        <view class="panel section-panel">
          <text class="section-kicker">本周节奏</text>
          <view class="timeline-list">
            <view v-for="item in weeklyFortune.rhythm" :key="item.label" class="timeline-item">
              <text class="timeline-label">{{ item.label }}</text>
              <text class="timeline-copy">{{ item.summary }}</text>
            </view>
          </view>
        </view>

        <view class="metrics-grid">
          <view v-for="metric in weeklyMetrics" :key="metric.label" class="metric-card">
            <text class="metric-label">{{ metric.label }}</text>
            <text class="metric-copy">{{ metric.value }}</text>
          </view>
        </view>

        <view class="panel split-panel">
          <view class="split-block">
            <text class="section-kicker">幸运窗口</text>
            <text class="split-copy">{{ weeklyFortune.luckyWindow }}</text>
          </view>
          <view class="split-block">
            <text class="section-kicker">本周搭档</text>
            <text class="split-copy">{{ weeklyFortune.bestMatch }}</text>
          </view>
        </view>

        <view class="panel section-panel">
          <text class="section-kicker">行动建议</text>
          <text class="body-copy">{{ weeklyFortune.action }}</text>
        </view>

        <view class="panel section-panel">
          <text class="section-kicker">需要留意</text>
          <text class="body-copy">{{ weeklyFortune.caution }}</text>
        </view>
      </view>

      <view v-else-if="activeView === 'monthly'" class="content-stack">
        <view class="panel section-panel">
          <text class="section-kicker">{{ monthlyFortune.month }} 月运</text>
          <text class="section-title">{{ monthlyFortune.theme.title }}</text>
          <text class="body-copy">{{ monthlyFortune.theme.summary }}</text>
        </view>

        <view class="panel section-panel">
          <text class="section-kicker">月内节奏</text>
          <view class="timeline-list">
            <view v-for="item in monthlyFortune.rhythm" :key="item.label" class="timeline-item">
              <text class="timeline-label">{{ item.label }}</text>
              <text class="timeline-copy">{{ item.summary }}</text>
            </view>
          </view>
        </view>

        <view class="metrics-grid">
          <view v-for="metric in monthlyMetrics" :key="metric.label" class="metric-card">
            <text class="metric-label">{{ metric.label }}</text>
            <text class="metric-copy">{{ metric.value }}</text>
          </view>
        </view>

        <view class="panel section-panel">
          <text class="section-kicker">机会窗口</text>
          <view class="bullet-list">
            <text v-for="item in monthlyFortune.opportunities" :key="item" class="bullet-item">· {{ item }}</text>
          </view>
        </view>

        <view class="panel section-panel">
          <text class="section-kicker">关键日期</text>
          <view class="tag-row">
            <text v-for="item in monthlyFortune.keyDays" :key="item" class="tag-chip tag-chip--soft">{{ item }}</text>
          </view>
        </view>

        <view class="panel section-panel">
          <text class="section-kicker">本月行动</text>
          <text class="body-copy">{{ monthlyFortune.action }}</text>
        </view>
      </view>

      <view v-else-if="activeView === 'yearly'" class="content-stack">
        <view class="panel section-panel">
          <text class="section-kicker">{{ yearlyFortune.year }} 年度主题</text>
          <text class="section-title">{{ yearlyFortune.theme.title }}</text>
          <text class="body-copy">{{ yearlyFortune.theme.summary }}</text>
        </view>

        <view class="panel section-panel">
          <text class="section-kicker">季度节奏</text>
          <view class="timeline-list">
            <view v-for="item in yearlyFortune.quarterForecasts" :key="item.quarter" class="timeline-item">
              <text class="timeline-label">{{ item.quarter }} · {{ item.title }}</text>
              <text class="timeline-copy">{{ item.summary }}</text>
            </view>
          </view>
        </view>

        <view class="metrics-grid">
          <view v-for="metric in yearlyMetrics" :key="metric.label" class="metric-card">
            <text class="metric-label">{{ metric.label }}</text>
            <text class="metric-copy">{{ metric.value }}</text>
          </view>
        </view>

        <view class="panel section-panel">
          <text class="section-kicker">关键月份</text>
          <view class="tag-row">
            <text v-for="month in yearlyFortune.keyMonths" :key="month" class="tag-chip tag-chip--soft">{{ month }}</text>
          </view>
        </view>

        <view class="panel section-panel">
          <text class="section-kicker">年度提醒</text>
          <text class="body-copy">{{ yearlyFortune.anchorAdvice }}</text>
        </view>
      </view>

      <view v-else-if="activeView === 'compatibility'" class="content-stack">
        <view class="panel section-panel">
          <text class="section-kicker">选择配对对象</text>
          <view class="partner-grid">
            <view
              v-for="sign in zodiacSigns"
              :key="sign"
              class="partner-chip"
              :class="{ 'partner-chip--active': sign === selectedPartner }"
              @tap="selectPartner(sign)"
            >
              <text>{{ sign }}</text>
            </view>
          </view>
          <text v-if="compatibilityLoading" class="section-note">正在更新配对结果...</text>
        </view>

        <view class="panel compatibility-panel">
          <view class="score-badge">
            <text class="score-value">{{ compatibility.score }}</text>
            <text class="score-label">{{ compatibility.level }}</text>
          </view>
          <view class="compatibility-copy">
            <text class="section-title">{{ selectedSign }} × {{ compatibility.partner }}</text>
            <text class="body-copy">{{ compatibility.summary }}</text>
          </view>
        </view>

        <view class="metrics-grid">
          <view v-for="metric in compatibilityMetrics" :key="metric.label" class="metric-card">
            <text class="metric-label">{{ metric.label }}</text>
            <text class="metric-copy">{{ metric.value }}</text>
          </view>
        </view>

        <view class="panel section-panel">
          <text class="section-kicker">相处亮点</text>
          <view class="bullet-list">
            <text v-for="item in compatibility.highlights" :key="item" class="bullet-item">· {{ item }}</text>
          </view>
        </view>

        <view class="panel section-panel">
          <text class="section-kicker">相处提醒</text>
          <text class="body-copy">{{ compatibility.caution }}</text>
        </view>

        <view class="panel section-panel">
          <text class="section-kicker">关系建议</text>
          <view class="bullet-list">
            <text v-for="item in compatibility.tips" :key="item" class="bullet-item">· {{ item }}</text>
          </view>
        </view>
      </view>

      <view v-else class="content-stack">
        <view class="panel section-panel">
          <text class="section-kicker">{{ knowledge.title }}</text>
          <text class="body-copy">{{ knowledge.overview }}</text>
        </view>

        <view class="facts-grid">
          <view v-for="item in knowledge.quickFacts" :key="item.label" class="fact-card">
            <text class="fact-label">{{ item.label }}</text>
            <text class="fact-value">{{ item.value }}</text>
          </view>
        </view>

        <view class="panel section-panel">
          <text class="section-kicker">核心优势</text>
          <view class="bullet-list">
            <text v-for="item in knowledge.strengths" :key="item" class="bullet-item">· {{ item }}</text>
          </view>
        </view>

        <view class="panel section-panel">
          <text class="section-kicker">关系风格</text>
          <text class="body-copy">{{ knowledge.relationshipStyle }}</text>
        </view>

        <view class="panel section-panel">
          <text class="section-kicker">工作方式</text>
          <text class="body-copy">{{ knowledge.workStyle }}</text>
        </view>

        <view class="panel section-panel">
          <text class="section-kicker">成长建议</text>
          <text class="body-copy">{{ knowledge.growthTip }}</text>
        </view>

        <view class="panel section-panel">
          <text class="section-kicker">关键词</text>
          <view class="tag-row">
            <text v-for="item in knowledge.keywords" :key="item" class="tag-chip tag-chip--soft">{{ item }}</text>
          </view>
        </view>
      </view>
    </template>
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
import { generateZodiacTodayPosterAsync } from '../../api/posters';
import { useThemePreference } from '../../composables/useThemePreference';
import {
  handlePosterImageError,
  previewPosterImage,
  resolvePreferredImageSource,
  savePosterImage,
  sharePosterImageToWechat,
} from '../../services/poster-image';
import { getCachedUser } from '../../services/session';
import type { GeneratedPoster } from '../../types/poster';
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
  { label: '配对', value: 'compatibility' },
  { label: '知识', value: 'knowledge' },
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
    links: [[0, 1], [1, 2], [2, 3], [3, 4]],
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
    links: [[0, 1], [1, 2], [2, 3], [2, 4], [2, 5]],
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
    links: [[0, 2], [2, 4], [1, 3], [3, 5], [2, 3]],
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
    links: [[0, 1], [1, 2], [2, 3], [3, 4]],
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
    links: [[0, 1], [1, 2], [2, 3], [3, 4]],
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
    links: [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5]],
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
    links: [[0, 1], [1, 2], [2, 3], [3, 4]],
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
    links: [[0, 1], [1, 2], [2, 3], [3, 4], [3, 5]],
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
    links: [[0, 1], [1, 2], [2, 3], [2, 4]],
  },
  摩羯座: {
    glyph: '♑',
    label: 'Capricorn',
    accent: '#7f8ea5',
    deep: '#3c485c',
    wash: '#eff3f8',
    points: [
      { x: 22, y: 42, size: 8 },
      { x: 36, y: 28, size: 10 },
      { x: 52, y: 40, size: 12 },
      { x: 66, y: 58, size: 9 },
      { x: 80, y: 50, size: 8 },
      { x: 58, y: 76, size: 9 },
    ],
    links: [[0, 1], [1, 2], [2, 3], [3, 4], [3, 5]],
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
    links: [[0, 1], [1, 2], [2, 3], [3, 4], [5, 6]],
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
    links: [[0, 1], [1, 2], [3, 4], [4, 5], [1, 4]],
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
      { quarter: 'Q1', title: '定下主轴', summary: '先确认今年最重要的方向和边界。' },
      { quarter: 'Q2', title: '持续推进', summary: '适合把前期判断变成持续动作。' },
      { quarter: 'Q3', title: '调整结构', summary: '会有几次必要的取舍，聚焦很重要。' },
      { quarter: 'Q4', title: '回收成果', summary: '复盘与沉淀会让明年的起点更高。' },
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

const selectedSign = ref<ZodiacSign | string>('狮子座');
const selectedPartner = ref<ZodiacSign | string>('白羊座');
const activeView = ref<ZodiacViewMode>('daily');
const loading = ref(false);
const compatibilityLoading = ref(false);
const posterLoading = ref(false);
const poster = ref<GeneratedPoster | null>(null);
const actionChecked = ref(false);
const { themeVars } = useThemePreference();
const isMpWeixin = String(
  (uni.getSystemInfoSync() as { uniPlatform?: string }).uniPlatform ?? '',
).toLowerCase() === 'mp-weixin';
const todayFortune = ref<ZodiacTodayData>(buildTodayFallback('狮子座'));
const weeklyFortune = ref<ZodiacWeeklyData>(buildWeeklyFallback('狮子座'));
const monthlyFortune = ref<ZodiacMonthlyData>(buildMonthlyFallback('狮子座'));
const yearlyFortune = ref<ZodiacYearlyData>(buildYearlyFallback('狮子座'));
const compatibility = ref<ZodiacCompatibilityData>(buildCompatibilityFallback('狮子座', '白羊座'));
const knowledge = ref<ZodiacKnowledgeData>(buildKnowledgeFallback('狮子座'));
const posterImageSource = computed(() =>
  poster.value ? resolvePreferredImageSource(poster.value) : '',
);

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

const constellationStars = computed(() =>
  zodiacVisual.value.points.map((point, index) => {
    const size = point.size ?? 8;

    return {
      id: `${zodiacVisual.value.label}-star-${index}`,
      style: {
        left: `${point.x}%`,
        top: `${point.y}%`,
        width: `${size}rpx`,
        height: `${size}rpx`,
      },
    };
  }),
);

const constellationLines = computed(() =>
  zodiacVisual.value.links.map(([fromIndex, toIndex], index) => {
    const from = zodiacVisual.value.points[fromIndex];
    const to = zodiacVisual.value.points[toIndex];

    if (!from || !to) {
      return {
        id: `${zodiacVisual.value.label}-line-${index}`,
        style: {},
      };
    }

    const deltaX = to.x - from.x;
    const deltaY = to.y - from.y;
    const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

    return {
      id: `${zodiacVisual.value.label}-line-${index}`,
      style: {
        left: `${from.x}%`,
        top: `${from.y}%`,
        width: `${length}%`,
        transform: `rotate(${angle}deg)`,
      },
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

async function loadCompatibility(sign: string, partner?: string) {
  try {
    compatibilityLoading.value = true;
    const response = await fetchZodiacCompatibility(sign, partner);
    compatibility.value = response.data;
    selectedPartner.value = response.data.partner;
  } catch (error) {
    console.warn('load zodiac compatibility fallback', error);
    compatibility.value = buildCompatibilityFallback(sign, partner);
    selectedPartner.value = compatibility.value.partner;
  } finally {
    compatibilityLoading.value = false;
  }
}

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

  todayFortune.value =
    todayResult.status === 'fulfilled' ? todayResult.value.data : buildTodayFallback(sign);
  weeklyFortune.value =
    weeklyResult.status === 'fulfilled' ? weeklyResult.value.data : buildWeeklyFallback(sign);
  monthlyFortune.value =
    monthlyResult.status === 'fulfilled' ? monthlyResult.value.data : buildMonthlyFallback(sign);
  yearlyFortune.value =
    yearlyResult.status === 'fulfilled' ? yearlyResult.value.data : buildYearlyFallback(sign);
  compatibility.value =
    compatibilityResult.status === 'fulfilled'
      ? compatibilityResult.value.data
      : buildCompatibilityFallback(sign);
  knowledge.value =
    knowledgeResult.status === 'fulfilled' ? knowledgeResult.value.data : buildKnowledgeFallback(sign);
  selectedPartner.value = compatibility.value.partner;
  loading.value = false;
}

async function selectSign(sign: string) {
  if (sign === selectedSign.value && !loading.value) {
    return;
  }

  selectedSign.value = sign;
  poster.value = null;
  await loadModule(sign);
}

async function selectPartner(sign: string) {
  if (sign === selectedPartner.value && !compatibilityLoading.value) {
    return;
  }

  selectedPartner.value = sign;
  await loadCompatibility(String(selectedSign.value), sign);
}

function toggleActionCheck() {
  actionChecked.value = !actionChecked.value;
  uni.showToast({
    title: actionChecked.value ? '今日行动已记录' : '已取消完成状态',
    icon: 'none',
  });
}

async function generateZodiacPoster() {
  if (posterLoading.value) {
    return;
  }

  try {
    posterLoading.value = true;
    poster.value = await generateZodiacTodayPosterAsync(String(selectedSign.value));
    if (!posterImageSource.value) {
      throw new Error('星座分享图生成失败，请稍后再试');
    }
    uni.showToast({
      title: '分享图已生成',
      icon: 'success',
    });
  } catch (error) {
    uni.showToast({
      title: handlePosterImageError(error, '星座分享图生成失败'),
      icon: 'none',
    });
  } finally {
    posterLoading.value = false;
  }
}

async function previewGeneratedPoster() {
  if (!poster.value || !posterImageSource.value) {
    return;
  }

  try {
    await previewPosterImage(posterImageSource.value, poster.value.downloadFileName);
  } catch (error) {
    uni.showToast({
      title: handlePosterImageError(error, '预览失败，请稍后再试'),
      icon: 'none',
    });
  }
}

async function saveGeneratedPoster() {
  if (!poster.value || !posterImageSource.value) {
    return;
  }

  try {
    await savePosterImage(posterImageSource.value, poster.value.downloadFileName);
    uni.showToast({
      title: typeof window !== 'undefined' ? '已开始下载' : '已保存到相册',
      icon: 'success',
    });
  } catch (error) {
    uni.showToast({
      title: handlePosterImageError(error, '保存失败，请稍后再试'),
      icon: 'none',
    });
  }
}

async function shareGeneratedPoster() {
  if (!poster.value || !posterImageSource.value) {
    return;
  }

  try {
    await sharePosterImageToWechat(posterImageSource.value, poster.value.downloadFileName);
  } catch (error) {
    uni.showToast({
      title: handlePosterImageError(error, '当前微信版本暂不支持直接发图，请先保存到相册'),
      icon: 'none',
    });
  }
}

onLoad((query) => {
  const cachedUser = getCachedUser();
  const routeSign =
    query && typeof query.zodiac === 'string' ? decodeURIComponent(query.zodiac) : '';
  const initialSign = zodiacSigns.includes(routeSign as ZodiacSign)
    ? routeSign
    : cachedUser?.zodiac || '狮子座';

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
  min-height: 100vh;
  padding: 24rpx 24rpx 120rpx;
  background:
    radial-gradient(circle at top right, rgba(var(--theme-accent-rgb), 0.22), transparent 26%),
    radial-gradient(circle at top left, var(--theme-glow), transparent 24%),
    linear-gradient(180deg, var(--theme-page-top) 0%, var(--theme-page-bottom) 100%);
}

.hero-shell,
.panel {
  border-radius: 32rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.78);
  box-shadow: var(--apple-shadow);
}

.hero-shell {
  position: relative;
  display: grid;
  gap: 18rpx;
  padding: 32rpx 28rpx;
  overflow: hidden;
  background:
    radial-gradient(circle at 88% 18%, rgba(var(--theme-accent-rgb), 0.18), transparent 30%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.92) 0%, rgba(246, 249, 255, 0.86) 100%),
    rgba(255, 255, 255, 0.82);
}

.hero-topline,
.hero-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.panel {
  margin-top: 20rpx;
  padding: 26rpx;
  background: rgba(255, 255, 255, 0.88);
}

.poster-preview-panel {
  display: grid;
  gap: 20rpx;
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
}

.section-head__copy {
  display: grid;
  gap: 6rpx;
  min-width: 0;
}

.poster-image {
  width: 100%;
  border-radius: 28rpx;
  background: rgba(245, 249, 255, 0.92);
  box-shadow: 0 18rpx 46rpx rgba(57, 78, 116, 0.12);
}

.poster-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14rpx;
}

.eyebrow,
.section-kicker,
.glance-label,
.metric-label,
.fact-label,
.section-note {
  font-size: 20rpx;
  letter-spacing: 0.12em;
  color: var(--apple-subtle);
}

.eyebrow,
.section-kicker {
  text-transform: uppercase;
}

.hero-heading,
.compatibility-panel {
  display: flex;
  justify-content: space-between;
  gap: 20rpx;
}

.hero-heading {
  align-items: stretch;
}

.hero-copy {
  display: grid;
  gap: 8rpx;
  align-content: start;
  min-width: 0;
  padding-top: 10rpx;
}

.title,
.section-title {
  color: var(--apple-text);
  font-weight: 700;
}

.title {
  font-size: 44rpx;
}

.section-title {
  font-size: 34rpx;
  line-height: 1.4;
}

.hero-theme {
  color: var(--apple-text);
  font-size: 28rpx;
  font-weight: 600;
  line-height: 1.45;
}

.hero-note,
.glance-value,
.fact-value,
.split-copy,
.score-label,
.state-title {
  color: var(--apple-text);
  font-weight: 600;
}

.hero-note,
.glance-value,
.fact-value,
.split-copy {
  font-size: 24rpx;
}

.score-orbit {
  position: absolute;
  right: 16rpx;
  bottom: 16rpx;
  display: grid;
  align-content: center;
  place-items: center;
  gap: 2rpx;
  width: 112rpx;
  height: 112rpx;
  border-radius: 50%;
  background:
    radial-gradient(circle at 50% 42%, rgba(255, 255, 255, 0.96), rgba(255, 255, 255, 0.62) 58%, transparent 60%),
    conic-gradient(from 140deg, rgba(255, 255, 255, 0.4), var(--zodiac-art-accent), rgba(255, 255, 255, 0.46));
  box-shadow: 0 20rpx 44rpx rgba(57, 78, 116, 0.12);
}

.score-orbit__value {
  color: var(--apple-text);
  font-size: 40rpx;
  font-weight: 800;
  line-height: 1;
}

.score-orbit__label {
  color: var(--apple-subtle);
  font-size: 20rpx;
}

.zodiac-art {
  position: relative;
  width: 258rpx;
  height: 258rpx;
  flex: 0 0 258rpx;
  overflow: hidden;
  border-radius: 42rpx;
  background:
    radial-gradient(circle at 70% 24%, rgba(255, 255, 255, 0.84), transparent 28%),
    radial-gradient(circle at 22% 78%, var(--zodiac-art-wash), transparent 42%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.78), var(--zodiac-art-wash));
  border: 1rpx solid rgba(255, 255, 255, 0.76);
  box-shadow: inset 0 0 0 1rpx rgba(255, 255, 255, 0.5);
}

.zodiac-art::before {
  position: absolute;
  inset: 20rpx;
  content: '';
  border: 1rpx solid rgba(var(--zodiac-art-accent-rgb), 0.28);
  border-radius: 34rpx;
}

.zodiac-art__constellation {
  position: absolute;
  inset: 20rpx;
}

.zodiac-art__line {
  position: absolute;
  height: 2rpx;
  transform-origin: 0 50%;
  background: linear-gradient(90deg, rgba(var(--zodiac-art-accent-rgb), 0.68), transparent);
}

.zodiac-art__star {
  position: absolute;
  margin-left: -4rpx;
  margin-top: -4rpx;
  border-radius: 50%;
  background: #ffffff;
  box-shadow:
    0 0 0 3rpx rgba(var(--zodiac-art-accent-rgb), 0.22),
    0 0 18rpx rgba(var(--zodiac-art-accent-rgb), 0.72);
}

.zodiac-art__glyph {
  position: absolute;
  left: 24rpx;
  top: 18rpx;
  color: var(--zodiac-art-deep);
  font-size: 88rpx;
  font-weight: 700;
  line-height: 1;
  opacity: 0.9;
}

.zodiac-art__label {
  position: absolute;
  left: 28rpx;
  bottom: 24rpx;
  max-width: 120rpx;
  color: var(--zodiac-art-deep);
  font-size: 20rpx;
  font-weight: 700;
  letter-spacing: 0.14em;
  opacity: 0.68;
  text-transform: uppercase;
}

.summary,
.body-copy,
.metric-copy,
.timeline-copy,
.state-copy,
.bullet-item {
  font-size: 26rpx;
  line-height: 1.7;
  color: var(--apple-muted);
}

.hero-glance,
.sign-grid,
.metrics-grid,
.facts-grid,
.partner-grid {
  display: grid;
  gap: 14rpx;
}

.hero-glance {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.glance-item,
.metric-card,
.fact-card {
  display: grid;
  gap: 8rpx;
  padding: 18rpx;
  border-radius: 24rpx;
  background: rgba(245, 249, 255, 0.92);
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.tag-chip {
  padding: 10rpx 20rpx;
  border-radius: 999rpx;
  background: rgba(120, 174, 255, 0.14);
  color: var(--apple-text);
  font-size: 22rpx;
}

.tag-chip--soft {
  background: rgba(64, 120, 255, 0.08);
  color: var(--apple-muted);
}

.share-button,
.poster-button,
.check-button {
  min-width: 176rpx;
  min-height: 72rpx;
  margin: 0;
  border-radius: 999rpx;
  background: var(--apple-blue);
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 700;
  line-height: 72rpx;
}

.share-button::after,
.poster-button::after,
.check-button::after {
  border: 0;
}

.poster-button {
  min-width: 0;
}

.poster-button--primary {
  background: linear-gradient(135deg, var(--apple-blue) 0%, #78a4ff 100%);
}

.poster-button--secondary,
.poster-button--ghost {
  color: var(--apple-text);
  background: rgba(244, 247, 250, 0.94);
}

.check-button {
  align-self: end;
  background: linear-gradient(135deg, var(--apple-blue) 0%, #78a4ff 100%);
}

.check-button--done {
  background: linear-gradient(135deg, #4fbd93 0%, #7bd7b4 100%);
}

.sign-grid,
.partner-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: 18rpx;
}

.sign-chip,
.partner-chip,
.view-tab {
  display: grid;
  place-items: center;
  min-height: 74rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.76);
  color: var(--apple-muted);
  font-size: 24rpx;
}

.sign-chip--active,
.partner-chip--active,
.view-tab--active {
  background: linear-gradient(135deg, var(--apple-blue) 0%, #7ba7ff 100%);
  color: #ffffff;
  font-weight: 600;
}

.view-tabs {
  margin-top: 18rpx;
}

.view-tabs__row {
  display: flex;
  gap: 12rpx;
  width: max-content;
  min-width: 100%;
  padding: 2rpx 0 4rpx;
}

.view-tab {
  min-width: 136rpx;
  padding: 0 20rpx;
}

.content-stack {
  display: grid;
  gap: 20rpx;
  margin-top: 20rpx;
}

.section-panel {
  display: grid;
  gap: 14rpx;
}

.metrics-grid,
.facts-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.dimension-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
}

.dimension-card {
  display: grid;
  gap: 10rpx;
  min-height: 264rpx;
  padding: 24rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.86);
  border: 1rpx solid rgba(255, 255, 255, 0.8);
}

.dimension-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.dimension-score {
  color: var(--apple-text);
  font-size: 40rpx;
  font-weight: 800;
}

.dimension-title {
  color: var(--apple-text);
  font-size: 28rpx;
  font-weight: 700;
  line-height: 1.35;
}

.dimension-action,
.mini-copy,
.daypart-hint {
  color: var(--apple-subtle);
  font-size: 23rpx;
  line-height: 1.55;
}

.action-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 20rpx;
}

.action-panel__copy {
  display: grid;
  gap: 12rpx;
}

.daypart-list {
  display: grid;
  gap: 16rpx;
}

.daypart-item {
  display: grid;
  gap: 8rpx;
  padding: 20rpx 0;
  border-bottom: 1rpx solid rgba(132, 151, 176, 0.12);
}

.daypart-item:last-child {
  border-bottom: 0;
}

.timeline-list,
.bullet-list {
  display: grid;
  gap: 14rpx;
}

.timeline-item {
  display: grid;
  gap: 6rpx;
  padding: 18rpx 0;
  border-bottom: 1rpx solid rgba(132, 151, 176, 0.12);
}

.timeline-item:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.timeline-label {
  font-size: 24rpx;
  color: var(--apple-text);
  font-weight: 600;
}

.split-panel {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
}

.split-block {
  display: grid;
  gap: 10rpx;
  padding: 8rpx 0;
}

.compatibility-panel {
  align-items: center;
}

.score-badge {
  display: grid;
  place-items: center;
  min-width: 170rpx;
  min-height: 170rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(64, 120, 255, 0.16) 0%, rgba(123, 167, 255, 0.26) 100%);
}

.score-value {
  font-size: 52rpx;
  color: var(--apple-text);
  font-weight: 700;
}

.compatibility-copy {
  display: grid;
  gap: 10rpx;
  flex: 1;
}

.state-panel {
  display: grid;
  gap: 10rpx;
}

@media (max-width: 480px) {
  .metrics-grid,
  .facts-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .compatibility-panel,
  .hero-actions,
  .action-panel {
    display: grid;
  }

  .zodiac-art {
    width: 238rpx;
    height: 238rpx;
    flex-basis: 238rpx;
  }

  .hero-glance {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .dimension-grid,
  .split-panel {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .score-badge {
    min-width: 150rpx;
    min-height: 150rpx;
  }
}
</style>
