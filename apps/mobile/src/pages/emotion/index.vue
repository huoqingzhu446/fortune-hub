<template>
  <view class="page" :style="themeVars">
    <view class="status-hero" :class="`status-hero--${statusOverview.tone}`">
      <view class="status-hero__header">
        <view>
          <text class="eyebrow">mental health check</text>
          <text class="status-hero__title">心理健康自检</text>
        </view>
        <text class="status-hero__badge">{{ statusOverview.badge }}</text>
      </view>

      <text class="status-hero__subtitle">
        {{
          screen === 'list'
            ? '用轻量量表观察最近 7 天的低落、紧张和恢复节奏。这里不做诊断，只帮你判断下一步该先照顾什么。'
            : screen === 'quiz'
              ? '请按最近 7 天的真实体验作答，越接近直觉越好。'
              : '结果已经生成，先看建议和支持信号，再决定下一步怎么照顾自己。'
        }}
      </text>

      <view class="state-panel">
        <text class="state-panel__label">{{ statusOverview.label }}</text>
        <text class="state-panel__value">{{ statusOverview.title }}</text>
        <text class="state-panel__text">{{ statusOverview.description }}</text>
      </view>

      <view class="status-grid">
        <view v-for="item in statusMetrics" :key="item.label" class="status-metric">
          <text class="status-metric__label">{{ item.label }}</text>
          <text class="status-metric__value">{{ item.value }}</text>
          <text class="status-metric__hint">{{ item.hint }}</text>
        </view>
      </view>

      <view v-if="screen === 'list'" class="hero-actions">
        <button
          class="hero-button hero-button--primary"
          :disabled="loadingTests || !tests.length"
          :loading="loadingTests"
          @tap="startPrimaryCheck"
        >
          开始一次自检
        </button>
        <button class="hero-button hero-button--secondary" @tap="goJournal">
          记录今日心情
        </button>
      </view>
    </view>

    <view v-if="screen === 'list'" class="safety-strip">
      <view>
        <text class="safety-strip__title">安全优先</text>
        <text class="safety-strip__text">
          如果已经持续失眠、明显失控，或出现伤害自己的想法，请立即联系现实中的家人朋友、医院、急救或当地心理危机干预热线。
        </text>
      </view>
    </view>

    <view v-if="screen === 'list'" class="section-block">
      <view class="section-header">
        <view>
          <text class="eyebrow">available checks</text>
          <text class="section-header__title">可用自检</text>
        </view>
        <text class="section-header__side">{{ tests.length }} 套开放</text>
      </view>

      <view v-if="loadingTests" class="empty-state">
        <text class="empty-state__title">正在同步自检题库</text>
        <text class="empty-state__text">同步完成后会显示可用量表。</text>
      </view>

      <view v-else class="test-list">
        <view
          v-for="test in tests"
          :key="test.code"
          class="test-card"
          :class="{ 'test-card--recent': isRecentTest(test.code) }"
        >
          <view class="test-card__head">
            <view>
              <text v-if="isRecentTest(test.code)" class="test-card__marker">最近测过</text>
              <text class="test-card__title">{{ test.title }}</text>
              <text class="test-card__subtitle">{{ test.subtitle }}</text>
            </view>
            <view class="test-card__meta">
              <text>{{ test.questionCount }} 题</text>
              <text>{{ test.durationMinutes }} 分钟</text>
            </view>
          </view>

          <text class="test-card__description">{{ test.description }}</text>

          <view class="tag-row">
            <text v-for="tag in test.tags" :key="tag" class="tag-chip">{{ tag }}</text>
          </view>

          <button
            class="hero-button hero-button--primary"
            :loading="loadingDetailCode === test.code"
            @tap="startEmotionCheck(test.code)"
          >
            {{ getTestActionLabel(test.code) }}
          </button>
        </view>
      </view>
    </view>

    <view v-if="screen === 'list'" class="section-block">
      <view class="section-header">
        <view>
          <text class="eyebrow">saved records</text>
          <text class="section-header__title">最近记录</text>
        </view>
        <text class="section-header__side">{{ historyStatusLabel }}</text>
      </view>

      <view v-if="!isLoggedIn" class="empty-state">
        <text class="empty-state__title">登录后保存趋势</text>
        <text class="empty-state__text">也可以先完成自检并查看本次结果，登录后再次提交会写入历史。</text>
        <button class="hero-button hero-button--secondary" @tap="goProfile">去个人中心</button>
      </view>

      <view v-else-if="loadingHistory" class="empty-state">
        <text class="empty-state__title">正在读取最近记录</text>
        <text class="empty-state__text">这一步只是在同步历史，不代表结果还在生成。</text>
      </view>

      <view v-else-if="historyItems.length" class="history-list">
        <view
          v-for="item in historyItems"
          :key="item.id"
          class="history-card"
          :class="`history-card--${normalizeStatusTone(item.level)}`"
        >
          <view class="history-card__head">
            <view>
              <text class="history-card__level">{{ getLevelLabel(item.level) }}</text>
              <text class="history-card__title">{{ item.title }}</text>
            </view>
            <view class="history-card__scorebox">
              <text class="history-card__score">{{ item.score ?? '--' }}</text>
              <text class="history-card__time">{{ formatRelativeTime(item.completedAt) }}</text>
            </view>
          </view>
          <text class="history-card__summary">{{ item.summary }}</text>
          <text class="history-card__signal">{{ item.supportSignal }}</text>
          <text class="history-card__date">{{ formatDateTime(item.completedAt) }}</text>
        </view>
      </view>

      <view v-else class="empty-state">
        <text class="empty-state__title">暂无最近状态</text>
        <text class="empty-state__text">完成一次自检后，这里会显示结果、时间和后续建议。</text>
      </view>
    </view>

    <view v-if="screen === 'quiz' && activeTest && currentQuestion" class="work-panel">
      <view class="section-header">
        <view>
          <text class="eyebrow">question flow</text>
          <text class="section-header__title">{{ activeTest.title }}</text>
        </view>
        <text class="section-header__side">{{ currentQuestionIndex + 1 }} / {{ activeTest.questions.length }}</text>
      </view>

      <view class="progress-shell">
        <view class="progress-bar" :style="{ width: `${progressPercent}%` }"></view>
      </view>

      <view class="notice-inline">
        <text>{{ activeTest.disclaimer }}</text>
      </view>

      <view class="question-area">
        <text class="question-area__intro">{{ activeTest.intro }}</text>
        <text class="question-area__prompt">{{ currentQuestion.prompt }}</text>

        <view class="option-list">
          <view
            v-for="option in currentQuestion.options"
            :key="option.key"
            class="option-card"
            :class="{
              'option-card--active': answers[currentQuestion.id] === option.key,
              'option-card--locked': answering,
            }"
            @tap="pickAnswer(option.key)"
          >
            <text class="option-card__key">{{ option.key }}</text>
            <text class="option-card__label">{{ option.label }}</text>
          </view>
        </view>
      </view>

      <view class="action-row">
        <button class="hero-button hero-button--secondary" @tap="backToList">
          返回列表
        </button>
        <text class="action-row__hint">
          {{ submitting ? '正在生成本次结果' : '选择后自动进入下一题' }}
        </text>
      </view>

      <button v-if="currentQuestionIndex > 0" class="inline-back" @tap="previousQuestion">
        上一题
      </button>
    </view>

    <view v-if="screen === 'result' && latestResult && latestTest" class="work-panel">
      <view class="section-header">
        <view>
          <text class="eyebrow">result report</text>
          <text class="section-header__title">{{ latestResult.title }}</text>
        </view>
        <text class="section-header__side">{{ latestResult.scoreRangeLabel }}</text>
      </view>

      <view class="result-summary" :class="`result-summary--${normalizeStatusTone(latestResult.riskLevel)}`">
        <text class="result-summary__subtitle">{{ latestResult.subtitle }}</text>
        <text class="result-summary__text">{{ latestResult.summary }}</text>
      </view>

      <view class="signal-panel">
        <text class="signal-panel__title">现在优先做</text>
        <text class="signal-panel__text">{{ latestResult.primarySuggestion }}</text>
      </view>

      <view class="tips-panel">
        <text class="tips-panel__title">放松步骤</text>
        <text v-for="item in latestResult.relaxSteps" :key="item" class="tips-panel__item">{{ item }}</text>
      </view>

      <view class="favorite-strip">
        <text class="favorite-strip__text">把这组疗愈练习收藏起来，之后可以在“我的收藏”里继续查看。</text>
        <button
          class="favorite-strip__button"
          :class="{ 'favorite-strip__button--active': favoriteActive }"
          :loading="favoriteLoading"
          @tap="toggleHealingFavorite"
        >
          {{ favoriteActive ? '已收藏' : '收藏练习' }}
        </button>
      </view>

      <view class="tips-panel">
        <text class="tips-panel__title">支持信号</text>
        <text class="tips-panel__text">{{ latestResult.supportSignal }}</text>
      </view>

      <view class="notice-inline">
        <text>{{ latestResult.disclaimer }}</text>
      </view>

      <view class="poster-panel">
        <view class="poster-panel__head">
          <text class="tips-panel__title">分享海报</text>
          <text class="poster-panel__theme">{{ latestResult.sharePoster.themeName }}</text>
        </view>
        <view class="poster-panel__preview">
          <text class="poster-panel__title">{{ latestResult.sharePoster.title }}</text>
          <text class="poster-panel__subtitle">{{ latestResult.sharePoster.subtitle }}</text>
          <text class="poster-panel__accent">{{ latestResult.sharePoster.accentText }}</text>
          <text class="poster-panel__footer">{{ latestResult.sharePoster.footerText }}</text>
        </view>
        <view class="action-row">
          <button class="hero-button hero-button--primary" @tap="openSharePoster">
            生成分享海报
          </button>
          <button class="hero-button hero-button--secondary" @tap="copySharePoster">
            复制海报文案
          </button>
        </view>
      </view>

      <view class="save-note">
        <text>
          {{
            latestSubmitSaved
              ? '这次结果已经写入你的历史记录。'
              : '当前结果已生成；登录后再次提交即可自动保存到历史。'
          }}
        </text>
      </view>

      <button class="hero-button hero-button--primary" @tap="openFullReport">
        {{ latestRecordId ? '查看完整版' : '登录后查看完整版' }}
      </button>

      <view class="action-row">
        <button class="hero-button hero-button--secondary" @tap="restartLatestTest">
          再测一次
        </button>
        <button class="hero-button hero-button--secondary" @tap="backToList">
          查看其他自检
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad, onShow } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import {
  fetchEmotionHistory,
  fetchEmotionTestDetail,
  fetchEmotionTests,
  submitEmotionAssessment,
} from '../../api/emotion';
import { useFavoriteToggle } from '../../composables/useFavoriteToggle';
import { useThemePreference } from '../../composables/useThemePreference';
import { getAuthToken } from '../../services/session';
import type {
  EmotionHistoryItem,
  EmotionResult,
  EmotionTestDetail,
  EmotionTestSummary,
} from '../../types/emotion';

type ScreenMode = 'list' | 'quiz' | 'result';
type StatusTone = 'neutral' | 'ready' | 'watch' | 'support' | 'urgent' | 'loading';

const screen = ref<ScreenMode>('list');
const tests = ref<EmotionTestSummary[]>([]);
const activeTest = ref<EmotionTestDetail | null>(null);
const currentQuestionIndex = ref(0);
const answers = ref<Record<string, string>>({});
const latestResult = ref<EmotionResult | null>(null);
const latestTest = ref<EmotionTestSummary | null>(null);
const latestSubmitSaved = ref(false);
const latestRecordId = ref<string | null>(null);
const historyItems = ref<EmotionHistoryItem[]>([]);
const loadingTests = ref(false);
const loadingHistory = ref(false);
const loadingDetailCode = ref('');
const submitting = ref(false);
const answering = ref(false);
const authToken = ref(getAuthToken());
const {
  favoriteActive,
  favoriteLoading,
  syncFavoriteState,
  toggleCurrent,
} = useFavoriteToggle();
const { themeVars } = useThemePreference();

const isLoggedIn = computed(() => Boolean(authToken.value));
const currentQuestion = computed(
  () => activeTest.value?.questions[currentQuestionIndex.value] ?? null,
);
const isLastQuestion = computed(
  () => !activeTest.value || currentQuestionIndex.value === activeTest.value.questions.length - 1,
);
const progressPercent = computed(() => {
  if (!activeTest.value) {
    return 0;
  }

  return Math.round(((currentQuestionIndex.value + 1) / activeTest.value.questions.length) * 100);
});
const loginStatusValue = computed(() => (isLoggedIn.value ? '已登录' : '需登录'));
const latestHistoryItem = computed(() => historyItems.value[0] ?? null);
const latestResultLabel = computed(() => {
  if (submitting.value) {
    return '生成中';
  }

  if (latestResult.value) {
    return latestResult.value.title;
  }

  if (loadingHistory.value && isLoggedIn.value) {
    return '同步中';
  }

  if (latestHistoryItem.value) {
    return latestHistoryItem.value.title;
  }

  return isLoggedIn.value ? '未自检' : '未登录';
});
const latestFreshnessLabel = computed(() => {
  if (latestResult.value) {
    return '本次刚完成';
  }

  if (loadingHistory.value && isLoggedIn.value) {
    return '正在同步历史';
  }

  if (latestHistoryItem.value) {
    return formatRelativeTime(latestHistoryItem.value.completedAt);
  }

  return isLoggedIn.value ? '完成后显示最近状态' : '登录后可保存记录';
});
const latestStatusTone = computed(() =>
  normalizeStatusTone(latestResult.value?.riskLevel ?? latestHistoryItem.value?.level),
);
const historyStatusLabel = computed(() => {
  if (!isLoggedIn.value) {
    return '未登录';
  }

  if (loadingHistory.value) {
    return '同步中';
  }

  return historyItems.value.length ? `${historyItems.value.length} 条` : '暂无';
});
const suggestedAction = computed(() => {
  if (screen.value === 'quiz') {
    return {
      value: '完成当前题目',
      hint: `${currentQuestionIndex.value + 1}/${activeTest.value?.questions.length ?? 0}`,
    };
  }

  if (submitting.value) {
    return {
      value: '查看结果',
      hint: '结果生成后自动展示',
    };
  }

  if (!latestResult.value && !latestHistoryItem.value) {
    return {
      value: '开始自检',
      hint: '先建立最近状态',
    };
  }

  if (latestStatusTone.value === 'urgent') {
    return {
      value: '优先求助',
      hint: '联系现实支持资源',
    };
  }

  if (latestStatusTone.value === 'support') {
    return {
      value: '增加支持',
      hint: '减少独自承受',
    };
  }

  if (latestStatusTone.value === 'watch') {
    return {
      value: '今天减负',
      hint: '观察睡眠和紧张感',
    };
  }

  return {
    value: '保持记录',
    hint: '用日记追踪变化',
  };
});
const statusOverview = computed(() => {
  if (screen.value === 'quiz') {
    return {
      tone: 'loading' as StatusTone,
      badge: '自检中',
      label: '当前流程',
      title: activeTest.value?.title ?? '正在自检',
      description: '按最近 7 天的体验选择即可，不需要把答案想成标准答案。',
    };
  }

  if (submitting.value) {
    return {
      tone: 'loading' as StatusTone,
      badge: '生成中',
      label: '当前流程',
      title: '正在生成本次结果',
      description: '这只发生在提交后的短时间内，完成后会自动进入结果页。',
    };
  }

  if (latestResult.value) {
    return {
      tone: latestStatusTone.value,
      badge: '本次结果',
      label: '当前状态',
      title: latestResult.value.title,
      description: latestResult.value.primarySuggestion,
    };
  }

  if (loadingHistory.value && isLoggedIn.value) {
    return {
      tone: 'loading' as StatusTone,
      badge: '同步中',
      label: '状态来源',
      title: '正在读取最近记录',
      description: '正在确认已保存的最新自检，这不是后台生成排队。',
    };
  }

  if (latestHistoryItem.value) {
    return {
      tone: latestStatusTone.value,
      badge: '最近保存',
      label: '最近状态',
      title: latestHistoryItem.value.title,
      description: latestHistoryItem.value.subtitle || latestHistoryItem.value.summary,
    };
  }

  if (!isLoggedIn.value) {
    return {
      tone: 'neutral' as StatusTone,
      badge: '可先体验',
      label: '当前状态',
      title: '未登录保存',
      description: '可以先完成自检并查看结果；登录后结果会进入历史趋势。',
    };
  }

  return {
    tone: 'neutral' as StatusTone,
    badge: '未自检',
    label: '当前状态',
    title: '暂无最近结果',
    description: '完成一次 3 分钟自检后，这里会显示最近状态和建议动作。',
  };
});
const statusMetrics = computed(() => [
  {
    label: '登录状态',
    value: loginStatusValue.value,
    hint: isLoggedIn.value ? '结果自动保存' : '可先查看本次结果',
  },
  {
    label: '最近结果',
    value: latestResultLabel.value,
    hint: latestFreshnessLabel.value,
  },
  {
    label: '建议动作',
    value: suggestedAction.value.value,
    hint: suggestedAction.value.hint,
  },
]);

async function bootstrap() {
  authToken.value = getAuthToken();
  await loadTests();
  await loadHistory();
}

async function loadTests() {
  try {
    loadingTests.value = true;
    const response = await fetchEmotionTests();
    tests.value = response.data.tests;
  } catch (error) {
    console.warn('load emotion tests failed', error);
    uni.showToast({
      title: '自检列表加载失败',
      icon: 'none',
    });
  } finally {
    loadingTests.value = false;
  }
}

async function loadHistory() {
  if (!getAuthToken()) {
    historyItems.value = [];
    return;
  }

  try {
    loadingHistory.value = true;
    const response = await fetchEmotionHistory();
    historyItems.value = response.data.items;
  } catch (error) {
    console.warn('load emotion history failed', error);
    historyItems.value = [];
  } finally {
    loadingHistory.value = false;
  }
}

function normalizeStatusTone(level?: string | null): StatusTone {
  if (level === 'steady') {
    return 'ready';
  }

  if (level === 'watch' || level === 'support' || level === 'urgent') {
    return level;
  }

  return 'neutral';
}

function getLevelLabel(level?: string | null) {
  if (level === 'steady') {
    return '平稳';
  }

  if (level === 'watch') {
    return '需留意';
  }

  if (level === 'support') {
    return '需要支持';
  }

  if (level === 'urgent') {
    return '尽快求助';
  }

  return '已完成';
}

function isRecentTest(code: string) {
  return Boolean(
    (latestResult.value && latestTest.value?.code === code) ||
      latestHistoryItem.value?.testCode === code,
  );
}

function getTestActionLabel(code: string) {
  return isRecentTest(code) ? '重新自检' : '开始自检';
}

function startPrimaryCheck() {
  const preferredTest =
    tests.value.find((test) => test.code === latestHistoryItem.value?.testCode) ?? tests.value[0];

  if (!preferredTest) {
    uni.showToast({
      title: '自检题库同步中',
      icon: 'none',
    });
    return;
  }

  void startEmotionCheck(preferredTest.code);
}

async function startEmotionCheck(code: string) {
  try {
    loadingDetailCode.value = code;
    const response = await fetchEmotionTestDetail(code);
    activeTest.value = response.data.test;
    currentQuestionIndex.value = 0;
    answers.value = {};
    latestResult.value = null;
    latestTest.value = response.data.test;
    latestSubmitSaved.value = false;
    latestRecordId.value = null;
    screen.value = 'quiz';
  } catch (error) {
    console.warn('load emotion detail failed', error);
    uni.showToast({
      title: '自检详情加载失败',
      icon: 'none',
    });
  } finally {
    loadingDetailCode.value = '';
  }
}

function pickAnswer(optionKey: string) {
  if (!currentQuestion.value || answering.value || submitting.value) {
    return;
  }

  answers.value = {
    ...answers.value,
    [currentQuestion.value.id]: optionKey,
  };
  answering.value = true;

  setTimeout(() => {
    if (isLastQuestion.value) {
      answering.value = false;
      void submitEmotionCheck();
      return;
    }

    currentQuestionIndex.value += 1;
    answering.value = false;
  }, 140);
}

function previousQuestion() {
  if (currentQuestionIndex.value === 0) {
    return;
  }

  currentQuestionIndex.value -= 1;
}

function backToList() {
  screen.value = 'list';
  favoriteActive.value = false;
}

async function submitEmotionCheck() {
  if (!activeTest.value) {
    return;
  }

  const payload = {
    answers: activeTest.value.questions.map((question) => ({
      questionId: question.id,
      optionKey: answers.value[question.id],
    })),
  };

  if (payload.answers.some((item) => !item.optionKey)) {
    uni.showToast({
      title: '请先完成全部题目',
      icon: 'none',
    });
    return;
  }

  try {
    submitting.value = true;
    const response = await submitEmotionAssessment(activeTest.value.code, payload);
    latestResult.value = response.data.result;
    latestTest.value = response.data.test;
    latestSubmitSaved.value = response.data.isSaved;
    latestRecordId.value = response.data.recordId;
    screen.value = 'result';
    await syncFavoriteState(
      response.data.recordId ? `healing:${response.data.recordId}` : `healing:${activeTest.value.code}`,
    );

    if (response.data.isSaved) {
      await loadHistory();
      uni.showToast({
        title: '结果已保存',
        icon: 'success',
      });
    } else {
      uni.showToast({
        title: '结果已生成',
        icon: 'success',
      });
    }
  } catch (error) {
    console.warn('submit emotion assessment failed', error);
    uni.showToast({
      title: '提交失败，请稍后再试',
      icon: 'none',
    });
  } finally {
    submitting.value = false;
  }
}

async function toggleHealingFavorite() {
  if (!latestResult.value || !latestTest.value) {
    return;
  }

  const itemKey = latestRecordId.value
    ? `healing:${latestRecordId.value}`
    : `healing:${latestTest.value.code}`;

  await toggleCurrent({
    itemType: 'healing_practice',
    itemKey,
    title: `${latestTest.value.title} · 疗愈练习`,
    summary: latestResult.value.primarySuggestion,
    icon: '静',
    route: latestRecordId.value
      ? `/pages/report/index?recordId=${encodeURIComponent(latestRecordId.value)}`
      : '/pages/emotion/index',
    extraJson: {
      testCode: latestTest.value.code,
      resultTitle: latestResult.value.title,
    },
  });
}

function restartLatestTest() {
  if (!latestTest.value) {
    screen.value = 'list';
    return;
  }

  void startEmotionCheck(latestTest.value.code);
}

function openSharePoster() {
  if (!latestRecordId.value) {
    uni.showToast({
      title: '请先登录并保存结果',
      icon: 'none',
    });

    if (!isLoggedIn.value) {
      goProfile();
    }
    return;
  }

  uni.navigateTo({
    url: `/pages/poster/generate/index?type=report&recordId=${encodeURIComponent(latestRecordId.value)}&auto=1`,
  });
}

function openFullReport() {
  if (!latestRecordId.value) {
    uni.showToast({
      title: '请先登录并保存结果',
      icon: 'none',
    });

    if (!isLoggedIn.value) {
      goProfile();
    }
    return;
  }

  uni.navigateTo({
    url: `/pages/report/index?recordId=${encodeURIComponent(latestRecordId.value)}`,
  });
}

function goProfile() {
  uni.navigateTo({
    url: '/pages/profile/index',
  });
}

function goJournal() {
  uni.navigateTo({
    url: '/pages/journal/index',
  });
}

function copySharePoster() {
  if (!latestResult.value) {
    return;
  }

  const lines = [
    latestResult.value.sharePoster.title,
    latestResult.value.sharePoster.subtitle,
    latestResult.value.sharePoster.accentText,
    latestResult.value.sharePoster.footerText,
  ].filter(Boolean);

  uni.setClipboardData({
    data: lines.join('\n'),
    success: () => {
      uni.showToast({
        title: '海报文案已复制',
        icon: 'success',
      });
    },
  });
}

function formatDateTime(value: string) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');

  return `${month}-${day} ${hours}:${minutes}`;
}

function formatRelativeTime(value: string) {
  if (!value) {
    return '最近完成';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '最近完成';
  }

  const diffMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));

  if (diffMinutes < 1) {
    return '刚刚';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} 分钟前`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours} 小时前`;
  }

  const diffDays = Math.floor(diffHours / 24);

  if (diffDays <= 7) {
    return `${diffDays} 天前`;
  }

  return '建议复测';
}

onLoad(() => {
  void bootstrap();
});

onShow(() => {
  authToken.value = getAuthToken();
  void loadHistory();
});
</script>

<style lang="scss">
.page {
  min-height: 100vh;
  padding: 24rpx 24rpx 48rpx;
  background: linear-gradient(180deg, var(--theme-page-top) 0%, #f7fbfa 46%, var(--theme-page-bottom) 100%);
}

.status-hero,
.work-panel,
.test-card,
.history-card,
.empty-state,
.safety-strip,
.signal-panel,
.tips-panel,
.favorite-strip,
.poster-panel {
  border: 1rpx solid rgba(var(--theme-text-primary-rgb), 0.08);
  border-radius: 16rpx;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 10rpx 28rpx rgba(var(--theme-text-primary-rgb), 0.08);
}

.status-hero {
  display: grid;
  gap: 20rpx;
  margin-bottom: 24rpx;
  padding: 28rpx;
  border-color: rgba(var(--theme-primary-rgb), 0.18);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.94) 0%, rgba(247, 252, 250, 0.9) 100%);
}

.status-hero--loading .status-hero__badge,
.status-hero--loading .state-panel {
  background: rgba(var(--theme-primary-rgb), 0.08);
}

.status-hero--watch .status-hero__badge,
.status-hero--watch .state-panel {
  background: #fff6e6;
  color: #9a620e;
}

.status-hero--watch .state-panel {
  border-left-color: #d99a2b;
}

.status-hero--support .status-hero__badge,
.status-hero--support .state-panel {
  background: #fff1ec;
  color: #9a4d3d;
}

.status-hero--support .state-panel {
  border-left-color: #c47762;
}

.status-hero--urgent .status-hero__badge,
.status-hero--urgent .state-panel {
  background: #fff0f0;
  color: #a64242;
}

.status-hero--urgent .state-panel {
  border-left-color: #c95858;
}

.status-hero__header,
.section-header,
.test-card__head,
.history-card__head,
.poster-panel__head,
.action-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.eyebrow,
.status-hero__title,
.status-hero__subtitle,
.status-hero__badge,
.state-panel__label,
.state-panel__value,
.state-panel__text,
.status-metric__label,
.status-metric__value,
.status-metric__hint,
.section-header__title,
.section-header__side,
.safety-strip__title,
.safety-strip__text,
.test-card__marker,
.test-card__title,
.test-card__subtitle,
.test-card__description,
.history-card__level,
.history-card__title,
.history-card__summary,
.history-card__signal,
.history-card__date,
.history-card__score,
.history-card__time,
.empty-state__title,
.empty-state__text,
.question-area__intro,
.question-area__prompt,
.result-summary__subtitle,
.result-summary__text,
.signal-panel__title,
.signal-panel__text,
.tips-panel__title,
.tips-panel__text,
.tips-panel__item,
.poster-panel__title,
.poster-panel__subtitle,
.poster-panel__accent,
.poster-panel__footer,
.poster-panel__theme,
.favorite-strip__text,
.save-note {
  display: block;
}

.eyebrow {
  margin-bottom: 8rpx;
  font-size: 20rpx;
  text-transform: uppercase;
  color: var(--theme-text-tertiary);
}

.status-hero__title {
  font-size: 46rpx;
  line-height: 1.18;
  font-weight: 700;
  color: var(--theme-text-primary);
}

.status-hero__subtitle,
.test-card__description,
.history-card__summary,
.question-area__intro,
.result-summary__text,
.save-note,
.empty-state__text,
.safety-strip__text,
.signal-panel__text,
.tips-panel__text {
  font-size: 26rpx;
  line-height: 1.7;
  color: var(--theme-text-secondary);
}

.status-hero__badge,
.history-card__level,
.test-card__marker {
  flex-shrink: 0;
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  background: rgba(var(--theme-primary-rgb), 0.1);
  color: var(--theme-primary);
  font-size: 22rpx;
  font-weight: 600;
}

.state-panel {
  display: grid;
  gap: 8rpx;
  padding: 22rpx;
  border-left: 6rpx solid var(--theme-primary);
  border-radius: 12rpx;
  background: rgba(var(--theme-primary-rgb), 0.07);
}

.state-panel__label,
.status-metric__label,
.section-header__side,
.test-card__subtitle,
.history-card__time,
.empty-state__title,
.question-area__intro,
.result-summary__subtitle {
  font-size: 22rpx;
  color: var(--theme-text-tertiary);
}

.empty-state__title {
  font-size: 28rpx;
  font-weight: 700;
  color: var(--theme-text-primary);
}

.state-panel__value {
  font-size: 34rpx;
  line-height: 1.25;
  font-weight: 700;
  color: var(--theme-text-primary);
}

.state-panel__text {
  font-size: 25rpx;
  line-height: 1.65;
  color: var(--theme-text-secondary);
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
}

.status-metric {
  min-width: 0;
  padding: 18rpx 16rpx;
  border-radius: 12rpx;
  background: rgba(var(--theme-text-primary-rgb), 0.035);
}

.status-metric__value,
.history-card__score,
.question-area__prompt,
.option-card__label {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--theme-text-primary);
}

.status-metric__value {
  margin-top: 6rpx;
  line-height: 1.3;
}

.status-metric__hint {
  margin-top: 6rpx;
  font-size: 20rpx;
  line-height: 1.45;
  color: var(--theme-text-tertiary);
}

.hero-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
}

.section-block {
  margin-bottom: 28rpx;
}

.section-header {
  margin-bottom: 18rpx;
}

.section-header__title,
.test-card__title,
.history-card__title,
.tips-panel__title,
.signal-panel__title {
  font-size: 34rpx;
  line-height: 1.28;
  font-weight: 700;
  color: var(--theme-text-primary);
}

.safety-strip,
.work-panel,
.empty-state,
.test-card,
.history-card,
.signal-panel,
.tips-panel,
.favorite-strip,
.poster-panel {
  display: grid;
  gap: 14rpx;
  margin-bottom: 18rpx;
  padding: 22rpx;
}

.safety-strip {
  border-color: rgba(161, 107, 32, 0.16);
  background: #fff8eb;
}

.safety-strip__title {
  margin-bottom: 6rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: #7e5520;
}

.test-list,
.history-list,
.option-list {
  display: grid;
  gap: 16rpx;
}

.test-card--recent {
  border-color: rgba(var(--theme-primary-rgb), 0.28);
}

.test-card__head,
.history-card__head,
.poster-panel__head {
  align-items: flex-start;
}

.test-card__title {
  margin-top: 4rpx;
}

.test-card__description {
  margin-top: 2rpx;
}

.test-card__meta {
  display: grid;
  gap: 6rpx;
  flex-shrink: 0;
  padding: 12rpx 14rpx;
  border-radius: 12rpx;
  background: rgba(var(--theme-primary-rgb), 0.08);
  text-align: center;
  font-size: 22rpx;
  color: var(--theme-primary);
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.tag-chip {
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  background: var(--theme-tag-bg);
  font-size: 22rpx;
  color: var(--theme-primary);
}

.hero-button {
  min-height: 84rpx;
  font-size: 26rpx;
}

.hero-button::after,
.favorite-strip__button::after,
.inline-back::after {
  border: none;
}

.hero-button--primary {
  background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-accent) 100%);
  color: #ffffff;
}

.hero-button--secondary {
  background: rgba(255, 255, 255, 0.88);
  color: var(--theme-text-primary);
}

.history-card {
  border-left: 6rpx solid rgba(var(--theme-primary-rgb), 0.28);
}

.history-card--watch {
  border-left-color: #d99a2b;
}

.history-card--support {
  border-left-color: #c47762;
}

.history-card--urgent {
  border-left-color: #c95858;
}

.history-card__scorebox {
  display: grid;
  gap: 4rpx;
  flex-shrink: 0;
  text-align: right;
}

.history-card__summary {
  margin-top: 2rpx;
}

.history-card__signal,
.history-card__date {
  font-size: 23rpx;
  line-height: 1.6;
  color: var(--theme-text-tertiary);
}

.empty-state {
  background: rgba(255, 255, 255, 0.72);
}

.progress-shell {
  height: 12rpx;
  border-radius: 999rpx;
  background: rgba(var(--theme-primary-rgb), 0.12);
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: 999rpx;
  background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-accent) 100%);
  transition: width 220ms ease;
}

.notice-inline {
  padding: 18rpx 20rpx;
  border-radius: 12rpx;
  background: #fff8eb;
  font-size: 22rpx;
  line-height: 1.7;
  color: #7e5520;
}

.question-area {
  display: grid;
  gap: 18rpx;
}

.question-area__prompt {
  line-height: 1.55;
}

.action-row {
  align-items: center;
  margin-top: 2rpx;
}

.action-row__hint {
  flex: 1;
  text-align: right;
  font-size: 22rpx;
  line-height: 1.6;
  color: var(--theme-text-tertiary);
}

.option-card {
  display: flex;
  gap: 16rpx;
  align-items: flex-start;
  padding: 22rpx;
  border-radius: 14rpx;
  background: rgba(255, 255, 255, 0.92);
  border: 2rpx solid rgba(var(--theme-text-primary-rgb), 0.06);
}

.option-card--locked {
  pointer-events: none;
}

.option-card--active {
  border-color: rgba(var(--theme-primary-rgb), 0.62);
  background: rgba(var(--theme-primary-rgb), 0.08);
}

.option-card__key {
  display: inline-grid;
  place-items: center;
  width: 42rpx;
  height: 42rpx;
  border-radius: 999rpx;
  background: rgba(var(--theme-primary-rgb), 0.12);
  color: var(--theme-primary);
  font-size: 22rpx;
  font-weight: 700;
}

.result-summary {
  display: grid;
  gap: 12rpx;
  padding: 22rpx;
  border-radius: 14rpx;
  background: rgba(var(--theme-primary-rgb), 0.07);
  border-left: 6rpx solid var(--theme-primary);
}

.result-summary--watch {
  background: #fff6e6;
  border-left-color: #d99a2b;
}

.result-summary--support {
  background: #fff1ec;
  border-left-color: #c47762;
}

.result-summary--urgent {
  background: #fff0f0;
  border-left-color: #c95858;
}

.favorite-strip__text {
  font-size: 24rpx;
  line-height: 1.7;
  color: var(--theme-text-secondary);
}

.favorite-strip__button {
  align-self: flex-start;
  min-height: 68rpx;
  margin: 0;
  padding: 0 24rpx;
  font-size: 24rpx;
}

.favorite-strip__button--active {
  color: #ffffff;
  background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-accent) 100%);
}

.poster-panel {
  background: rgba(255, 255, 255, 0.78);
}

.poster-panel__theme {
  font-size: 22rpx;
  color: var(--theme-text-tertiary);
  text-transform: uppercase;
}

.poster-panel__preview {
  display: grid;
  gap: 10rpx;
  padding: 20rpx;
  border-radius: 14rpx;
  background: rgba(var(--theme-primary-rgb), 0.06);
}

.poster-panel__title {
  font-size: 34rpx;
  font-weight: 700;
  color: var(--theme-text-primary);
  line-height: 1.25;
}

.poster-panel__subtitle,
.poster-panel__footer {
  font-size: 24rpx;
  line-height: 1.7;
  color: var(--theme-text-secondary);
}

.poster-panel__accent {
  font-size: 24rpx;
  font-weight: 600;
  color: var(--theme-primary);
}

.tips-panel__item {
  font-size: 25rpx;
  line-height: 1.7;
  color: var(--theme-text-secondary);
}

.tips-panel__item::before {
  content: '• ';
}

.save-note {
  font-size: 23rpx;
  color: var(--theme-text-tertiary);
}

.inline-back {
  margin-top: 18rpx;
  padding: 0;
  background: transparent;
  color: var(--theme-text-tertiary);
  font-size: 24rpx;
  text-align: left;
}
</style>
