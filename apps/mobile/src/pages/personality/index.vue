<template>
  <view class="page-shell">
    <view class="page">
    <view class="page-orb page-orb--mint"></view>
    <view class="page-orb page-orb--peach"></view>

    <view class="hero-card">
      <text class="hero-card__eyebrow">personality lab</text>
      <text class="hero-card__title">性格测评</text>
      <text class="hero-card__subtitle">
        {{
          screen === 'list'
            ? '先选一套轻量测评，几分钟内就能拿到第一版结果。'
            : screen === 'quiz'
              ? '按直觉选择更贴近你的答案，不需要想成标准答案。'
              : '结果已经生成，你可以继续查看维度和建议。'
        }}
      </text>

      <view class="hero-card__status">
        <view class="status-pill">
          <text class="status-pill__label">{{ loginStatusLabel }}</text>
          <text class="status-pill__value">{{ loginStatusValue }}</text>
        </view>
        <view class="status-pill">
          <text class="status-pill__label">最近结果</text>
          <text class="status-pill__value">{{ latestResultLabel }}</text>
        </view>
      </view>
    </view>

    <view v-if="screen === 'list'" class="section-card">
      <view class="section-header">
        <view>
          <text class="section-header__eyebrow">assessment list</text>
          <text class="section-header__title">测评列表</text>
        </view>
        <text class="section-header__side">{{ tests.length }} 套已开放</text>
      </view>

      <view v-if="loadingTests" class="empty-card">
        <text class="empty-card__title">正在同步测评题库...</text>
        <text class="empty-card__text">马上就好，稍等一下。</text>
      </view>

      <view v-else class="test-list">
        <view v-for="test in tests" :key="test.code" class="test-card">
          <view class="test-card__top">
            <view>
              <text class="test-card__title">{{ test.title }}</text>
              <text class="test-card__subtitle">{{ test.subtitle }}</text>
            </view>
            <text class="test-card__meta">{{ test.questionCount }} 题 · {{ test.durationMinutes }} 分钟</text>
          </view>

          <text class="test-card__description">{{ test.description }}</text>

          <view class="tag-row">
            <text v-for="tag in test.tags" :key="tag" class="tag-chip">{{ tag }}</text>
          </view>

          <button class="hero-button hero-button--primary" :loading="loadingDetailCode === test.code" @tap="startAssessment(test.code)">
            开始测评
          </button>
        </view>
      </view>
    </view>

    <view v-if="screen === 'list'" class="section-card section-card--soft">
      <view class="section-header">
        <view>
          <text class="section-header__eyebrow">history</text>
          <text class="section-header__title">最近记录</text>
        </view>
        <text class="section-header__side">{{ historyItems.length ? '已保存' : '未保存' }}</text>
      </view>

      <view v-if="!isLoggedIn" class="empty-card">
        <text class="empty-card__title">登录后可保存历史</text>
        <text class="empty-card__text">开发环境可以先去个人中心做快捷登录，之后测评结果会自动进入历史。</text>
        <button class="hero-button hero-button--secondary" @tap="goProfile">去个人中心</button>
      </view>

      <view v-else-if="loadingHistory" class="empty-card">
        <text class="empty-card__title">正在读取历史记录...</text>
        <text class="empty-card__text">马上同步完成。</text>
      </view>

      <view v-else-if="historyItems.length" class="history-list">
        <view v-for="item in historyItems" :key="item.id" class="history-card">
          <view class="history-card__top">
            <view>
              <text class="history-card__title">{{ item.title }}</text>
              <text class="history-card__subtitle">{{ item.dominantDimensionLabel || item.subtitle }}</text>
            </view>
            <text class="history-card__score">{{ item.score ? `${item.score}` : '--' }}</text>
          </view>
          <text class="history-card__summary">{{ item.summary }}</text>
          <text class="history-card__time">{{ formatDateTime(item.completedAt) }}</text>
        </view>
      </view>

      <view v-else class="empty-card">
        <text class="empty-card__title">还没有保存的测评记录</text>
        <text class="empty-card__text">完成一次测评后，这里会展示你最近的结果。</text>
      </view>
    </view>

    <view v-if="screen === 'quiz' && activeTest && currentQuestion" class="section-card">
      <view class="section-header">
        <view>
          <text class="section-header__eyebrow">question flow</text>
          <text class="section-header__title">{{ activeTest.title }}</text>
        </view>
        <text class="section-header__side">{{ currentQuestionIndex + 1 }} / {{ activeTest.questions.length }}</text>
      </view>

      <view class="progress-shell">
        <view class="progress-bar" :style="{ width: `${progressPercent}%` }"></view>
      </view>

      <view class="question-card">
        <text class="question-card__intro">{{ activeTest.intro }}</text>
        <text class="question-card__prompt">{{ currentQuestion.prompt }}</text>

        <view class="option-list">
          <view
            v-for="option in currentQuestion.options"
            :key="option.key"
            class="option-card"
            :class="{ 'option-card--active': answers[currentQuestion.id] === option.key }"
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
        <button
          v-if="!isLastQuestion"
          class="hero-button hero-button--primary"
          :disabled="!answers[currentQuestion.id]"
          @tap="nextQuestion"
        >
          下一题
        </button>
        <button
          v-else
          class="hero-button hero-button--primary"
          :loading="submitting"
          :disabled="!answers[currentQuestion.id]"
          @tap="submitAssessment"
        >
          提交并生成结果
        </button>
      </view>

      <button
        v-if="currentQuestionIndex > 0"
        class="inline-back"
        @tap="previousQuestion"
      >
        上一题
      </button>
    </view>

    <view v-if="screen === 'result' && latestResult && latestTest" class="section-card">
      <view class="section-header">
        <view>
          <text class="section-header__eyebrow">result report</text>
          <text class="section-header__title">{{ latestResult.title }}</text>
        </view>
        <text class="section-header__side">{{ latestResult.score }} 分</text>
      </view>

      <view class="result-hero">
        <text class="result-hero__subtitle">{{ latestResult.subtitle }}</text>
        <text class="result-hero__summary">{{ latestResult.summary }}</text>
      </view>

      <view class="dimension-grid">
        <view v-for="item in latestResult.dimensionScores" :key="item.key" class="dimension-card">
          <text class="dimension-card__label">{{ item.label }}</text>
          <text class="dimension-card__value">{{ item.ratio }}%</text>
          <text class="dimension-card__hint">权重 {{ item.value }}</text>
        </view>
      </view>

      <view class="tips-card">
        <text class="tips-card__title">你的优势</text>
        <text v-for="item in latestResult.strengths" :key="item" class="tips-card__item">{{ item }}</text>
      </view>

      <view class="tips-card">
        <text class="tips-card__title">今日建议</text>
        <text v-for="item in latestResult.suggestions" :key="item" class="tips-card__item">{{ item }}</text>
      </view>

      <view class="poster-card">
        <view class="poster-card__head">
          <text class="tips-card__title">分享海报</text>
          <text class="poster-card__theme">{{ latestResult.sharePoster.themeName }}</text>
        </view>
        <view class="poster-card__shell">
          <text class="poster-card__title">{{ latestResult.sharePoster.title }}</text>
          <text class="poster-card__subtitle">{{ latestResult.sharePoster.subtitle }}</text>
          <text class="poster-card__accent">{{ latestResult.sharePoster.accentText }}</text>
          <text class="poster-card__footer">{{ latestResult.sharePoster.footerText }}</text>
        </view>
        <button class="hero-button hero-button--secondary" @tap="copySharePoster">
          复制海报文案
        </button>
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
        {{ latestRecordId ? '查看完整版 / 生成海报' : '登录后查看完整版' }}
      </button>

      <view class="action-row">
        <button class="hero-button hero-button--secondary" @tap="restartLatestTest">
          再测一次
        </button>
        <button class="hero-button hero-button--primary" @tap="backToList">
          查看其他测评
        </button>
      </view>
    </view>
    </view>
    <AppTabBar current-tab="personality" />
  </view>
</template>

<script setup lang="ts">
import { onLoad, onShow } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import AppTabBar from '../../components/AppTabBar.vue';
import {
  fetchPersonalityHistory,
  fetchPersonalityTestDetail,
  fetchPersonalityTests,
  submitPersonalityAssessment,
} from '../../api/assessment';
import { getAuthToken } from '../../services/session';
import type {
  PersonalityHistoryItem,
  PersonalityResult,
  PersonalityTestDetail,
  PersonalityTestSummary,
} from '../../types/assessment';

type ScreenMode = 'list' | 'quiz' | 'result';

const screen = ref<ScreenMode>('list');
const tests = ref<PersonalityTestSummary[]>([]);
const activeTest = ref<PersonalityTestDetail | null>(null);
const currentQuestionIndex = ref(0);
const answers = ref<Record<string, string>>({});
const latestResult = ref<PersonalityResult | null>(null);
const latestTest = ref<PersonalityTestSummary | null>(null);
const latestSubmitSaved = ref(false);
const latestRecordId = ref<string | null>(null);
const historyItems = ref<PersonalityHistoryItem[]>([]);
const loadingTests = ref(false);
const loadingHistory = ref(false);
const loadingDetailCode = ref('');
const submitting = ref(false);
const authToken = ref(getAuthToken());

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
const loginStatusLabel = computed(() => (isLoggedIn.value ? '当前状态' : '保存历史'));
const loginStatusValue = computed(() => (isLoggedIn.value ? '已登录' : '需登录'));
const latestResultLabel = computed(() => latestResult.value?.title || '等待生成');

async function bootstrap() {
  authToken.value = getAuthToken();
  await loadTests();
  await loadHistory();
}

async function loadTests() {
  try {
    loadingTests.value = true;
    const response = await fetchPersonalityTests();
    tests.value = response.data.tests;
  } catch (error) {
    console.warn('load personality tests failed', error);
    uni.showToast({
      title: '测评列表加载失败',
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
    const response = await fetchPersonalityHistory();
    historyItems.value = response.data.items;
  } catch (error) {
    console.warn('load personality history failed', error);
    historyItems.value = [];
  } finally {
    loadingHistory.value = false;
  }
}

async function startAssessment(code: string) {
  try {
    loadingDetailCode.value = code;
    const response = await fetchPersonalityTestDetail(code);
    activeTest.value = response.data.test;
    currentQuestionIndex.value = 0;
    answers.value = {};
    latestResult.value = null;
    latestTest.value = response.data.test;
    latestSubmitSaved.value = false;
    latestRecordId.value = null;
    screen.value = 'quiz';
  } catch (error) {
    console.warn('load personality detail failed', error);
    uni.showToast({
      title: '测评详情加载失败',
      icon: 'none',
    });
  } finally {
    loadingDetailCode.value = '';
  }
}

function pickAnswer(optionKey: string) {
  if (!currentQuestion.value) {
    return;
  }

  answers.value = {
    ...answers.value,
    [currentQuestion.value.id]: optionKey,
  };
}

function nextQuestion() {
  if (!activeTest.value || !currentQuestion.value || !answers.value[currentQuestion.value.id]) {
    return;
  }

  currentQuestionIndex.value += 1;
}

function previousQuestion() {
  if (currentQuestionIndex.value === 0) {
    return;
  }

  currentQuestionIndex.value -= 1;
}

function backToList() {
  screen.value = 'list';
}

async function submitAssessment() {
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
    const response = await submitPersonalityAssessment(activeTest.value.code, payload);
    latestResult.value = response.data.result;
    latestTest.value = response.data.test;
    latestSubmitSaved.value = response.data.isSaved;
    latestRecordId.value = response.data.recordId;
    screen.value = 'result';

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
    console.warn('submit personality assessment failed', error);
    uni.showToast({
      title: '提交失败，请稍后再试',
      icon: 'none',
    });
  } finally {
    submitting.value = false;
  }
}

function restartLatestTest() {
  if (!latestTest.value) {
    screen.value = 'list';
    return;
  }

  void startAssessment(latestTest.value.code);
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
    url: `/pages/report/index?recordId=${latestRecordId.value}`,
  });
}

function goProfile() {
  uni.navigateTo({
    url: '/pages/profile/index',
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
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');

  return `${month}-${day} ${hours}:${minutes}`;
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
.page-shell {
  min-height: 100vh;
  padding-bottom: 138rpx;
  overflow-x: hidden;
}

.page {
  position: relative;
  min-height: 100vh;
  padding: 24rpx 24rpx 24rpx;
  background:
    radial-gradient(circle at top right, rgba(255, 190, 148, 0.24), transparent 26%),
    linear-gradient(180deg, #f8fbff 0%, #edf3f7 100%);
  overflow: visible;
  overflow-x: hidden;
}

.page-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(10rpx);
  opacity: 0.72;
  pointer-events: none;
}

.page-orb--mint {
  top: 32rpx;
  right: -90rpx;
  width: 280rpx;
  height: 280rpx;
  background: radial-gradient(circle, rgba(134, 209, 182, 0.72) 0%, rgba(134, 209, 182, 0) 70%);
}

.page-orb--peach {
  top: 280rpx;
  left: -100rpx;
  width: 320rpx;
  height: 320rpx;
  background: radial-gradient(circle, rgba(255, 182, 145, 0.22) 0%, rgba(255, 182, 145, 0) 72%);
}

.hero-card,
.section-card {
  position: relative;
  z-index: 1;
  margin-bottom: 20rpx;
  padding: 28rpx;
  border-radius: 34rpx;
  background: rgba(255, 255, 255, 0.84);
  border: 1rpx solid rgba(255, 255, 255, 0.86);
  box-shadow: var(--apple-shadow);
}

.section-card--soft {
  background: rgba(249, 251, 255, 0.82);
}

.hero-card {
  display: grid;
  gap: 18rpx;
}

.hero-card__eyebrow,
.section-header__eyebrow {
  font-size: 20rpx;
  text-transform: uppercase;
  letter-spacing: 0.3em;
  color: var(--apple-subtle);
}

.hero-card__title,
.section-header__title,
.test-card__title,
.history-card__title,
.tips-card__title {
  font-size: 38rpx;
  font-weight: 700;
  color: var(--apple-text);
}

.hero-card__subtitle,
.test-card__description,
.history-card__summary,
.question-card__intro,
.result-hero__summary,
.save-note,
.empty-card__text {
  font-size: 26rpx;
  line-height: 1.7;
  color: var(--apple-muted);
}

.hero-card__status,
.test-list,
.history-list,
.dimension-grid,
.option-list {
  display: grid;
  gap: 14rpx;
}

.hero-card__status,
.dimension-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.status-pill,
.dimension-card,
.history-card,
.test-card,
.question-card,
.tips-card,
.empty-card {
  display: grid;
  gap: 10rpx;
  padding: 22rpx;
  border-radius: 28rpx;
  background: rgba(246, 249, 255, 0.84);
}

.status-pill__label,
.section-header__side,
.test-card__subtitle,
.history-card__subtitle,
.question-card__intro,
.dimension-card__hint,
.empty-card__title,
.result-hero__subtitle {
  font-size: 22rpx;
  color: var(--apple-subtle);
}

.status-pill__value,
.history-card__score,
.dimension-card__value,
.question-card__prompt,
.option-card__label {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--apple-text);
}

.section-header,
.test-card__top,
.history-card__top,
.action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
}

.section-header {
  margin-bottom: 18rpx;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.tag-chip {
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(229, 238, 255, 0.9);
  font-size: 22rpx;
  color: var(--apple-blue);
}

.hero-button {
  min-height: 84rpx;
  border-radius: 999rpx;
  line-height: 84rpx;
  font-size: 26rpx;
}

.hero-button::after,
.inline-back::after {
  border: none;
}

.hero-button--primary {
  background: linear-gradient(135deg, var(--apple-blue) 0%, #84aafc 100%);
  color: #ffffff;
}

.hero-button--secondary {
  background: rgba(255, 255, 255, 0.88);
  color: var(--apple-text);
}

.progress-shell {
  height: 14rpx;
  margin-bottom: 18rpx;
  border-radius: 999rpx;
  background: rgba(222, 231, 245, 0.9);
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #7d9cff 0%, #7ad6c0 100%);
  transition: width 220ms ease;
}

.question-card__prompt {
  line-height: 1.5;
}

.option-card {
  display: flex;
  gap: 16rpx;
  align-items: flex-start;
  padding: 22rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.92);
  border: 2rpx solid transparent;
}

.option-card--active {
  border-color: rgba(111, 142, 246, 0.72);
  background: rgba(241, 246, 255, 0.96);
}

.option-card__key {
  display: inline-grid;
  place-items: center;
  width: 42rpx;
  height: 42rpx;
  border-radius: 999rpx;
  background: rgba(111, 142, 246, 0.14);
  color: var(--apple-blue);
  font-size: 22rpx;
  font-weight: 700;
}

.result-hero {
  display: grid;
  gap: 12rpx;
  margin-bottom: 18rpx;
}

.tips-card {
  margin-bottom: 16rpx;
}

.poster-card {
  display: grid;
  gap: 16rpx;
  margin-bottom: 16rpx;
  padding: 22rpx;
  border-radius: 28rpx;
  background:
    radial-gradient(circle at top left, rgba(134, 209, 182, 0.2), transparent 40%),
    radial-gradient(circle at bottom right, rgba(255, 188, 156, 0.22), transparent 36%),
    rgba(246, 249, 255, 0.88);
}

.poster-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.poster-card__theme {
  font-size: 22rpx;
  color: var(--apple-subtle);
  text-transform: uppercase;
  letter-spacing: 0.16em;
}

.poster-card__shell {
  display: grid;
  gap: 10rpx;
  padding: 20rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.78);
}

.poster-card__title {
  font-size: 34rpx;
  font-weight: 700;
  color: var(--apple-text);
  line-height: 1.25;
}

.poster-card__subtitle,
.poster-card__footer {
  font-size: 24rpx;
  line-height: 1.7;
  color: var(--apple-muted);
}

.poster-card__accent {
  font-size: 24rpx;
  font-weight: 600;
  color: var(--apple-blue);
}

.tips-card__item {
  font-size: 25rpx;
  line-height: 1.7;
  color: var(--apple-muted);
}

.tips-card__item::before {
  content: '• ';
}

.inline-back {
  margin-top: 18rpx;
  padding: 0;
  background: transparent;
  color: var(--apple-subtle);
  font-size: 24rpx;
  text-align: left;
}

.save-note,
.history-card__time {
  font-size: 23rpx;
  color: var(--apple-subtle);
}
</style>
