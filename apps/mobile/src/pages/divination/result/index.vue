<template>
  <view v-if="result" class="result-page">
    <view
      class="result-card"
      :class="{ 'result-card--best': result.hexagram.level === '大吉' }"
    >
      <view class="result-card__head">
        <view>
          <text class="result-eyebrow">{{ result.topicLabel }} · {{ result.casting?.methodLabel || '略筮法' }}</text>
          <text class="result-title">本卦：{{ result.hexagram.name }}</text>
          <text class="result-subtitle">{{ result.hexagram.meaning }}</text>
        </view>
        <view
          class="level-pill"
          :class="{ 'level-pill--best': result.hexagram.level === '大吉' }"
        >
          <text v-if="result.hexagram.level === '大吉'" class="level-pill__hint">上上签</text>
          <text class="level-pill__text">{{ result.hexagram.level }}</text>
        </view>
      </view>

      <view class="hexagram-area">
        <view class="hexagram-lines">
          <view
            v-for="(solid, index) in displayLines"
            :key="index"
            class="hex-line"
            :class="{ 'hex-line--broken': !solid }"
          >
            <view class="hex-line__segment"></view>
            <view class="hex-line__segment"></view>
          </view>
        </view>
        <view class="hexagram-copy">
          <text class="hexagram-symbol">{{ result.hexagram.symbol }}</text>
          <text class="hexagram-meta">{{ result.hexagram.upperTrigram }}上 · {{ result.hexagram.lowerTrigram }}下</text>
          <button v-if="result.changedHexagram" class="changed-button" @tap="showChangedHexagram">
            查看变卦：{{ result.changedHexagram.name }}
          </button>
        </view>
      </view>

      <view v-if="result.casting" class="casting-strip">
        <view class="casting-chip">
          <text class="casting-chip__label">起法</text>
          <text class="casting-chip__value">{{ result.casting.methodLabel }}</text>
        </view>
        <view class="casting-chip">
          <text class="casting-chip__label">动爻</text>
          <text class="casting-chip__value">{{ result.casting.movingLineLabel }}</text>
        </view>
        <view class="casting-chip">
          <text class="casting-chip__label">变卦</text>
          <text class="casting-chip__value">{{ result.changedHexagram?.name || '本卦不变' }}</text>
        </view>
      </view>
    </view>

    <view v-if="result.oracle" class="oracle-stack">
      <view class="oracle-card oracle-card--main">
        <text class="oracle-eyebrow">{{ result.oracle.title }}</text>
        <text class="oracle-title">{{ result.oracle.subject }}</text>
        <text class="oracle-text">{{ result.oracle.situation }}</text>
      </view>

      <view class="oracle-grid">
        <view class="oracle-panel">
          <text class="oracle-panel__label">动爻</text>
          <text class="oracle-panel__title">{{ result.casting?.movingLineLabel || movingLineFallback }}</text>
          <text class="oracle-panel__text">{{ result.oracle.moving }}</text>
          <text v-if="movingLineReading" class="oracle-panel__advice">{{ movingLineReading.advice }}</text>
        </view>
        <view class="oracle-panel">
          <text class="oracle-panel__label">变卦</text>
          <text class="oracle-panel__title">{{ result.changedHexagram?.name || '本卦不变' }}</text>
          <text class="oracle-panel__text">{{ result.oracle.tendency }}</text>
          <text class="oracle-panel__advice">{{ result.oracle.action }}</text>
        </view>
      </view>
    </view>

    <view v-if="result.topicReading" class="topic-reading">
      <text class="topic-reading__eyebrow">问事类型</text>
      <text class="topic-reading__title">{{ result.topicReading.title }}</text>
      <text class="topic-reading__text">{{ result.topicReading.summary }}</text>
      <view class="topic-reading__pair">
        <view>
          <text class="topic-reading__label">机会</text>
          <text class="topic-reading__body">{{ result.topicReading.opportunity }}</text>
        </view>
        <view>
          <text class="topic-reading__label topic-reading__label--risk">风险</text>
          <text class="topic-reading__body">{{ result.topicReading.risk }}</text>
        </view>
      </view>
      <text class="topic-reading__action">{{ result.topicReading.action }}</text>
    </view>

    <view class="score-row">
      <view
        v-for="item in scoreItems"
        :key="item.label"
        class="score-ring"
        :style="scoreStyle(item.value, item.color)"
      >
        <view class="score-ring__inner">
          <text class="score-value">{{ item.value }}</text>
          <text class="score-label">{{ item.label }}</text>
        </view>
      </view>
    </view>

    <view class="detail-stack">
      <view v-if="readingFlowItems.length" class="detail-card reading-flow-card">
        <text class="detail-title">高岛断法</text>
        <view class="reading-flow-list">
          <view v-for="item in readingFlowItems" :key="item.label" class="reading-flow-row">
            <text class="reading-flow-row__label">{{ item.label }}</text>
            <text class="reading-flow-row__text">{{ item.text }}</text>
          </view>
        </view>
      </view>

      <view class="detail-card">
        <text class="detail-title">完整解读</text>
        <text class="detail-text">{{ result.analysis }}</text>
      </view>

      <view class="detail-card">
        <text class="detail-title">为什么是这个结果</text>
        <text class="detail-text">{{ result.personalizedReason }}</text>
      </view>

      <view v-if="personalizationSnapshot" class="detail-card profile-card">
        <view class="profile-card__head">
          <view class="profile-card__title-block">
            <text class="detail-title">本次画像依据</text>
            <text class="profile-card__time">
              生成快照 · {{ formatDivinationDateTime(personalizationSnapshot.generatedAt) }}
            </text>
          </view>
          <text class="profile-tone" :class="`profile-tone--${personalizationSnapshot.tone}`">
            {{ personalizationSnapshot.toneLabel }}
          </text>
        </view>

        <text class="profile-summary">{{ personalizationSnapshot.toneSummary }}</text>

        <view class="profile-brief-grid">
          <view v-for="item in profileBriefItems" :key="item.label" class="profile-brief-item">
            <text class="profile-brief-item__label">{{ item.label }}</text>
            <text class="profile-brief-item__value">{{ item.value }}</text>
          </view>
        </view>

        <view v-if="personalizationSnapshot.hasPartialMiss" class="profile-alert">
          <text class="profile-alert__label">部分画像未命中</text>
          <text class="profile-alert__text">已用命中的资料作为断语旁参，未命中或已关闭的维度不会参与解释，也不会改变卦象。</text>
        </view>

        <view v-if="profileInsightRows.length" class="profile-insight-list">
          <view
            v-for="item in profileInsightRows"
            :key="item.key"
            class="profile-insight-row"
          >
            <view class="profile-insight-row__head">
              <text class="profile-insight-row__title">{{ item.title }}</text>
              <text class="profile-insight-row__weight">{{ item.weightLabel }}</text>
            </view>
            <text class="profile-insight-row__evidence">据：{{ item.evidence }}</text>
            <text class="profile-insight-row__text">{{ item.judgement }}</text>
            <text class="profile-insight-row__text">建议：{{ item.advice }}</text>
            <text class="profile-insight-row__risk">风险：{{ item.risk }}</text>
          </view>
        </view>

        <view v-else-if="personalizationSnapshot.signals.length" class="profile-signal-list">
          <view
            v-for="item in personalizationSnapshot.signals"
            :key="item.key"
            class="profile-signal-row"
          >
            <view class="profile-signal-row__main">
              <text class="profile-signal-row__label">{{ item.label }}</text>
              <text class="profile-signal-row__value">{{ item.value }}</text>
            </view>
            <text class="profile-signal-row__summary">{{ item.summary }}</text>
          </view>
        </view>

        <view v-else class="profile-empty">
          <text>{{ profileEmptyText }}</text>
        </view>

        <view v-if="missedPersonalizationRows.length" class="profile-missed">
          <text class="profile-missed__label">未命中资料</text>
          <text class="profile-missed__text">{{ missedPersonalizationRows.join('、') }}</text>
        </view>

        <view class="profile-adjust-grid">
          <view
            v-for="item in scoreAdjustmentItems"
            :key="item.label"
            class="profile-adjust-item"
            :class="`profile-adjust-item--${item.tone}`"
          >
            <text class="profile-adjust-item__label">{{ item.label }}</text>
            <text class="profile-adjust-item__value">{{ formatAdjustment(item.value) }}</text>
          </view>
        </view>
      </view>

      <view class="detail-card">
        <text class="detail-title">关键提醒</text>
        <view class="bullet-list">
          <text v-for="item in result.reminders" :key="item" class="bullet-item">{{ item }}</text>
        </view>
      </view>

      <view class="detail-card">
        <text class="detail-title">今天可以这样做</text>
        <view class="bullet-list">
          <text v-for="item in result.advice" :key="item" class="bullet-item">{{ item }}</text>
        </view>
      </view>

      <view class="lucky-card">
        <view class="lucky-item">
          <text class="lucky-label">幸运色</text>
          <text class="lucky-value">{{ result.lucky.color }}</text>
        </view>
        <view class="lucky-item">
          <text class="lucky-label">幸运数字</text>
          <text class="lucky-value">{{ result.lucky.number }}</text>
        </view>
        <view class="lucky-item">
          <text class="lucky-label">幸运方位</text>
          <text class="lucky-value">{{ result.lucky.direction }}</text>
        </view>
        <view class="lucky-item">
          <text class="lucky-label">幸运元素</text>
          <text class="lucky-value">{{ result.lucky.element }}</text>
        </view>
      </view>

      <view class="suitable-pair">
        <view class="suitable-panel suitable-panel--good">
          <text class="suitable-label">宜</text>
          <text class="suitable-text">{{ result.suitable.join('、') }}</text>
        </view>
        <view class="suitable-panel suitable-panel--avoid">
          <text class="suitable-label">忌</text>
          <text class="suitable-text">{{ result.avoid.join('、') }}</text>
        </view>
      </view>

      <view class="review-card">
        <view class="review-card__head">
          <view>
            <text class="detail-title">复盘记录</text>
            <text class="review-card__subtitle">收藏、标记应验，并留下之后回看的备注。</text>
          </view>
          <button class="favorite-button" :class="{ 'favorite-button--active': review.favorite }" @tap="toggleFavorite">
            {{ review.favorite ? '已收藏' : '收藏' }}
          </button>
        </view>

        <view class="outcome-row">
          <button
            v-for="item in outcomeOptions"
            :key="item.value"
            class="outcome-button"
            :class="{ 'outcome-button--active': review.outcome === item.value }"
            @tap="markOutcome(item.value)"
          >
            {{ item.label }}
          </button>
        </view>

        <textarea
          v-model="review.note"
          class="review-note"
          maxlength="500"
          placeholder="写下后续应验、偏差或当时的真实处境"
          placeholder-class="review-note__placeholder"
        />
        <view class="review-actions">
          <button class="review-save" @tap="saveReviewNote">保存复盘</button>
          <button class="review-list-button" @tap="openReviewList">复盘列表</button>
        </view>
      </view>
    </view>

    <view class="mood-feedback-card" v-if="!moodFeedbackDone">
      <text class="mood-feedback-card__title">看完这段解读，你现在感觉怎么样？</text>
      <view class="mood-feedback-card__grid">
        <view
          v-for="item in postMoodOptions"
          :key="item.value"
          class="mood-feedback-chip"
          :class="{ 'mood-feedback-chip--active': postMood === item.value }"
          @tap="selectPostMood(item.value)"
        >
          <text>{{ item.emoji }} {{ item.label }}</text>
        </view>
      </view>
      <button
        v-if="postMood"
        class="mood-feedback-card__submit"
        @tap="submitMoodFeedback"
      >
        记录感受
      </button>
      <text v-if="moodFeedbackSaved" class="mood-feedback-card__saved">✓ 已记录</text>
    </view>

    <view class="bottom-buttons">
      <button class="action-button action-button--ghost" @tap="saveResult">保存结果</button>
      <button class="action-button action-button--primary" @tap="openPoster">分享海报</button>
      <button class="action-button action-button--ghost" @tap="again">再占一次</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import {
  getDivinationReview,
  getDivinationResult,
  getOrCreateTodayDivinationResult,
  formatDivinationDateTime,
  saveDivinationResult,
  saveDivinationReview,
  syncDivinationReviewsFromServer,
} from '../../../services/divination';
import { getDivinationProfileMapping } from '../../../services/divination-content';
import type {
  DivinationPersonalizationKey,
  DivinationReview,
  DivinationResult,
} from '../../../types/divination';

const result = ref<DivinationResult | null>(null);
const review = ref<DivinationReview>(createDefaultReview(''));
const outcomeOptions: Array<{ value: DivinationReview['outcome']; label: string }> = [
  { value: 'pending', label: '待复盘' },
  { value: 'fulfilled', label: '已应验' },
  { value: 'unfulfilled', label: '未应验' },
];

const displayLines = computed(() => {
  if (!result.value) {
    return [];
  }

  return [...result.value.hexagram.lines].reverse();
});

const scoreItems = computed(() => {
  if (!result.value) {
    return [];
  }

  return [
    { label: '综合运势', value: result.value.scores.overall, color: '#8B6FD6' },
    { label: '情绪指数', value: result.value.scores.emotion, color: '#F3A6B5' },
    { label: '行动时机', value: result.value.scores.action, color: '#8FB99A' },
  ];
});

const readingFlowItems = computed(() => {
  const flow = result.value?.readingFlow;
  if (!flow) {
    return [];
  }

  return [
    { label: '本卦大势', text: flow.hexagramTrend },
    { label: '动爻爻辞', text: flow.movingLine },
    { label: '变卦后势', text: flow.changedTrend },
    { label: '问事分类', text: flow.topicJudgement },
    flow.profileReference ? { label: '画像旁参', text: flow.profileReference } : null,
    { label: '现实建议', text: flow.practicalAdvice },
  ].filter((item): item is { label: string; text: string } => Boolean(item?.text));
});

const movingLineFallback = computed(() => {
  const line = result.value?.changingLines?.[0] || 1;
  return `第 ${line} 爻`;
});

const movingLineReading = computed(() => {
  if (!result.value) {
    return null;
  }

  const line = result.value.casting?.movingLine || result.value.changingLines?.[0] || 1;
  return result.value.hexagram.lineReadings?.[line - 1] || null;
});

const personalizationSnapshot = computed(() => result.value?.personalizationSnapshot || null);
const profileBriefItems = computed(() => {
  const snapshot = personalizationSnapshot.value;
  if (!snapshot) {
    return [];
  }

  const moodState = snapshot.dimensionStates?.find((item) => item.key === 'mood');
  const moodValue = moodState?.state === 'active'
    ? moodState.valueLabel
    : moodState?.statusLabel || '暂无记录';
  const usedLabels = snapshot.signals.map((item) => item.label).join('、') || '无';

  return [
    { label: '当时心情', value: moodValue },
    { label: '当时策略', value: snapshot.toneLabel },
    { label: '当时用到', value: usedLabels },
  ];
});

const profileWeightLabels: Record<string, string> = {
  strong: '重参',
  medium: '中参',
  light: '轻参',
};

const profileInsightRows = computed(() => {
  const insights = personalizationSnapshot.value?.profileInsights || [];
  return insights.map((item) => ({
    ...item,
    evidence: item.evidence || '已命中的画像资料',
    weightLabel: profileWeightLabels[item.weight] || '轻参',
  }));
});

const missedPersonalizationRows = computed(() => {
  const snapshot = personalizationSnapshot.value;
  if (!snapshot) {
    return [];
  }

  const dimensionRows = snapshot.dimensionStates || [];
  if (dimensionRows.length) {
    return dimensionRows
      .filter((item) => item.enabled && item.state === 'missing')
      .map((item) => `${item.label}：${item.reason === 'api-failed' ? '部分画像未命中' : item.statusLabel}`);
  }

  return snapshot.enabledKeys
    .filter((key) => !snapshot.activeKeys.includes(key))
    .map(personalizationKeyLabel);
});

const scoreAdjustmentItems = computed(() => {
  const adjustments = personalizationSnapshot.value?.scoreAdjustments || {
    overall: 0,
    emotion: 0,
    action: 0,
  };

  return [
    { label: '综合修正', value: adjustments.overall },
    { label: '情绪修正', value: adjustments.emotion },
    { label: '行动修正', value: adjustments.action },
  ].map((item) => ({
    ...item,
    tone: item.value > 0 ? 'plus' : item.value < 0 ? 'minus' : 'zero',
  }));
});

const profileEmptyText = computed(() => {
  const snapshot = personalizationSnapshot.value;
  if (!snapshot?.enabledKeys.length) {
    return '本次没有启用画像维度，只按所问主题与卦象生成解读。';
  }

  return '本次已启用画像维度，但生成时没有命中可用资料。';
});

function scoreStyle(value: number, color: string) {
  return {
    background: `conic-gradient(${color} ${value * 3.6}deg, rgba(139,111,214,0.12) 0deg)`,
  };
}

function formatAdjustment(value: number) {
  if (value > 0) {
    return `+${value}`;
  }

  return String(value);
}

function personalizationKeyLabel(key: DivinationPersonalizationKey) {
  return getDivinationProfileMapping().dimensionLabels[key] || key;
}

const postMood = ref('');
const moodFeedbackDone = ref(false);
const moodFeedbackSaved = ref(false);
const postMoodOptions = [
  { value: 'happy', emoji: '😊', label: '安心多了' },
  { value: 'neutral', emoji: '😐', label: '有点启发' },
  { value: 'low', emoji: '😔', label: '还是不确定' },
  { value: 'anxious', emoji: '😰', label: '更焦虑了' },
];

function selectPostMood(mood: string) {
  postMood.value = mood;
}

async function submitMoodFeedback() {
  try {
    review.value = saveDivinationReview(result.value!.id, {
      postMood: postMood.value,
      postMoodIntensity: 3,
    });
    result.value!.review = review.value;
    moodFeedbackSaved.value = true;
    moodFeedbackDone.value = true;
  } catch { /* silent */ }
}

function showChangedHexagram() {
  if (!result.value?.changedHexagram) {
    return;
  }
  const changed = result.value.changedHexagram;

  uni.showModal({
    title: changed.name,
    content: [changed.meaning, changed.decision].filter(Boolean).join('\n'),
    showCancel: false,
    confirmText: '知道了',
  });
}

function saveResult() {
  if (!result.value) {
    return;
  }

  saveDivinationResult(result.value);
  uni.showToast({
    title: '已保存',
    icon: 'success',
  });
}

function openPoster() {
  if (!result.value) {
    return;
  }

  uni.navigateTo({
    url: `/pages/poster/generate/index?type=divination&id=${encodeURIComponent(result.value.id)}&auto=1`,
  });
}

function again() {
  uni.navigateTo({
    url: '/pages/divination/select/index',
  });
}

function toggleFavorite() {
  if (!result.value) {
    return;
  }

  review.value = saveDivinationReview(result.value.id, {
    favorite: !review.value.favorite,
  });
  result.value.review = review.value;
}

function markOutcome(outcome: DivinationReview['outcome']) {
  if (!result.value) {
    return;
  }

  review.value = saveDivinationReview(result.value.id, {
    outcome,
  });
  result.value.review = review.value;
}

function saveReviewNote() {
  if (!result.value) {
    return;
  }

  review.value = saveDivinationReview(result.value.id, {
    note: review.value.note,
  });
  result.value.review = review.value;
  uni.showToast({
    title: '复盘已保存',
    icon: 'success',
  });
}

function openReviewList() {
  uni.navigateTo({
    url: '/pages/divination/review/index',
  });
}

function createDefaultReview(resultId: string): DivinationReview {
  return {
    resultId,
    favorite: false,
    outcome: 'pending',
    note: '',
    updatedAt: Date.now(),
  };
}

async function refreshReviewFromServer(resultId: string) {
  await syncDivinationReviewsFromServer();
  const latestReview = getDivinationReview(resultId);

  if (!latestReview || result.value?.id !== resultId) {
    return;
  }

  review.value = latestReview;
  result.value.review = latestReview;
}

onLoad((query) => {
  const id = String(query?.id || '');
  const nextResult = getDivinationResult(id) || getOrCreateTodayDivinationResult();
  result.value = nextResult;
  review.value = getDivinationReview(nextResult.id) || nextResult.review || createDefaultReview(nextResult.id);
  void refreshReviewFromServer(nextResult.id);
});
</script>

<style lang="scss">
.result-page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: calc(env(safe-area-inset-top) + 24rpx) 24rpx 180rpx;
  background:
    radial-gradient(circle at 82% 12%, rgba(216, 166, 78, 0.16), transparent 28%),
    linear-gradient(180deg, #fff9ef 0%, #f5edff 48%, #fffaf0 100%);
  color: #4e3825;
}

.result-card,
.detail-card,
.lucky-card,
.suitable-panel,
.topic-reading,
.review-card {
  background: rgba(255, 255, 255, 0.84);
  border: 1rpx solid rgba(255, 255, 255, 0.92);
  box-shadow: 0 14rpx 38rpx rgba(80, 60, 120, 0.08);
}

.result-card {
  position: relative;
  overflow: hidden;
  padding: 28rpx;
  border-radius: 30rpx;
  border-color: rgba(216, 166, 78, 0.26);
}

.result-card--best {
  border-color: rgba(216, 166, 78, 0.58);
  box-shadow:
    0 16rpx 46rpx rgba(183, 119, 36, 0.14),
    inset 0 0 0 2rpx rgba(255, 214, 122, 0.32);
}

.result-card--best::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 220rpx;
  height: 220rpx;
  background: radial-gradient(circle at 72% 18%, rgba(255, 218, 126, 0.38), transparent 64%);
  pointer-events: none;
}

.result-card__head {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  gap: 20rpx;
}

.result-eyebrow,
.result-title,
.result-subtitle {
  display: block;
}

.result-eyebrow {
  font-size: 22rpx;
  color: #8b6fd6;
}

.result-title {
  margin-top: 8rpx;
  font-size: 42rpx;
  font-weight: 700;
  font-family:
    'Iowan Old Style',
    'Times New Roman',
    'Noto Serif SC',
    serif;
}

.result-subtitle {
  margin-top: 10rpx;
  font-size: 24rpx;
  color: rgba(78, 56, 37, 0.62);
}

.level-pill {
  flex: 0 0 auto;
  align-self: start;
  display: grid;
  justify-items: center;
  min-width: 72rpx;
  box-sizing: border-box;
  padding: 9rpx 20rpx;
  border-radius: 999rpx;
  color: #b97724;
  background: #fff3d8;
  border: 1rpx solid rgba(216, 166, 78, 0.34);
  font-size: 22rpx;
  font-weight: 700;
}

.level-pill__hint,
.level-pill__text {
  display: block;
  line-height: 1.1;
}

.level-pill--best {
  min-width: 104rpx;
  padding: 12rpx 22rpx 13rpx;
  color: #fff8e6;
  background: linear-gradient(135deg, #d18a28 0%, #f0bd57 48%, #b97724 100%);
  border-color: rgba(255, 224, 144, 0.88);
  box-shadow:
    0 8rpx 20rpx rgba(185, 119, 36, 0.3),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.45);
  transform: translateY(-4rpx);
}

.level-pill--best .level-pill__hint {
  margin-bottom: 3rpx;
  font-size: 17rpx;
  font-weight: 760;
  color: rgba(255, 248, 230, 0.76);
}

.level-pill--best .level-pill__text {
  font-size: 30rpx;
  font-weight: 860;
}

.hexagram-area {
  display: flex;
  gap: 30rpx;
  margin-top: 34rpx;
}

.hexagram-lines {
  display: grid;
  gap: 15rpx;
  flex: 0 0 192rpx;
}

.hex-line {
  display: flex;
  gap: 28rpx;
  height: 18rpx;
}

.hex-line__segment {
  flex: 1;
  border-radius: 999rpx;
  background: #3d3342;
}

.hex-line:not(.hex-line--broken) .hex-line__segment:first-child {
  flex-basis: 100%;
}

.hex-line:not(.hex-line--broken) .hex-line__segment:last-child {
  display: none;
}

.hexagram-copy {
  display: grid;
  align-content: center;
  gap: 10rpx;
  flex: 1;
  min-width: 0;
}

.hexagram-symbol {
  font-size: 72rpx;
  line-height: 1;
  color: rgba(139, 111, 214, 0.38);
}

.hexagram-meta {
  font-size: 23rpx;
  color: rgba(78, 56, 37, 0.58);
}

.changed-button {
  display: inline-grid;
  min-width: 228rpx;
  height: 52rpx;
  padding: 0 22rpx;
  margin: 4rpx 0 0;
  border-radius: 999rpx;
  background: rgba(139, 111, 214, 0.1);
  color: #8b6fd6;
  font-size: 22rpx;
}

.changed-button::after,
.action-button::after {
  border: 0;
}

.oracle-stack {
  display: grid;
  gap: 16rpx;
  margin-top: 20rpx;
}

.oracle-card,
.oracle-panel {
  background: rgba(255, 255, 255, 0.86);
  border: 1rpx solid rgba(255, 255, 255, 0.92);
  box-shadow: 0 14rpx 38rpx rgba(80, 60, 120, 0.08);
}

.oracle-card {
  padding: 28rpx;
  border-radius: 28rpx;
}

.oracle-card--main {
  border-color: rgba(139, 111, 214, 0.16);
}

.oracle-eyebrow,
.oracle-title,
.oracle-text,
.oracle-panel__label,
.oracle-panel__title,
.oracle-panel__text,
.oracle-panel__advice {
  display: block;
}

.oracle-eyebrow,
.oracle-panel__label {
  font-size: 21rpx;
  color: #8b6fd6;
}

.oracle-title {
  margin-top: 8rpx;
  font-size: 34rpx;
  font-weight: 760;
}

.oracle-text,
.oracle-panel__text {
  margin-top: 12rpx;
  font-size: 25rpx;
  line-height: 1.62;
  color: rgba(78, 56, 37, 0.74);
}

.oracle-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
}

.oracle-panel {
  min-width: 0;
  padding: 24rpx;
  border-radius: 26rpx;
}

.oracle-panel__title {
  margin-top: 8rpx;
  font-size: 30rpx;
  font-weight: 740;
  color: #4e3825;
}

.oracle-panel__advice {
  margin-top: 14rpx;
  padding-top: 14rpx;
  border-top: 1rpx solid rgba(139, 111, 214, 0.12);
  font-size: 23rpx;
  line-height: 1.5;
  color: #8b6fd6;
}

.topic-reading {
  display: grid;
  gap: 14rpx;
  margin-top: 20rpx;
  padding: 28rpx;
  border-radius: 28rpx;
  border-color: rgba(216, 166, 78, 0.2);
}

.topic-reading__eyebrow,
.topic-reading__title,
.topic-reading__text,
.topic-reading__label,
.topic-reading__body,
.topic-reading__action {
  display: block;
}

.topic-reading__eyebrow {
  font-size: 21rpx;
  color: #b97724;
}

.topic-reading__title {
  font-size: 34rpx;
  font-weight: 760;
}

.topic-reading__text,
.topic-reading__body {
  font-size: 24rpx;
  line-height: 1.58;
  color: rgba(78, 56, 37, 0.72);
}

.topic-reading__pair {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
}

.topic-reading__pair > view {
  min-width: 0;
  padding: 18rpx;
  border-radius: 20rpx;
  background: rgba(139, 111, 214, 0.07);
}

.topic-reading__label {
  margin-bottom: 8rpx;
  font-size: 20rpx;
  color: #8b6fd6;
}

.topic-reading__label--risk {
  color: #b97724;
}

.topic-reading__action {
  padding: 18rpx 20rpx;
  border-radius: 20rpx;
  background: rgba(216, 166, 78, 0.12);
  color: #7a5426;
  font-size: 24rpx;
  line-height: 1.55;
}

.casting-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
  margin-top: 28rpx;
}

.casting-chip {
  display: grid;
  gap: 6rpx;
  min-height: 82rpx;
  box-sizing: border-box;
  padding: 15rpx 16rpx;
  border-radius: 20rpx;
  background: rgba(139, 111, 214, 0.08);
}

.casting-chip__label {
  font-size: 19rpx;
  color: rgba(78, 56, 37, 0.52);
}

.casting-chip__value {
  min-width: 0;
  font-size: 22rpx;
  font-weight: 720;
  color: #4e3825;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.score-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16rpx;
  margin-top: 20rpx;
}

.score-ring {
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  border-radius: 50%;
}

.score-ring__inner {
  display: grid;
  place-items: center;
  width: calc(100% - 18rpx);
  height: calc(100% - 18rpx);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
}

.score-value {
  font-size: 36rpx;
  font-weight: 800;
  color: #4e3825;
}

.score-label {
  margin-top: 4rpx;
  font-size: 20rpx;
  color: rgba(78, 56, 37, 0.58);
}

.detail-stack {
  display: grid;
  gap: 18rpx;
  margin-top: 20rpx;
}

.detail-card {
  display: grid;
  gap: 14rpx;
  padding: 24rpx;
  border-radius: 24rpx;
}

.detail-title {
  font-size: 27rpx;
  font-weight: 700;
}

.detail-text,
.bullet-item {
  font-size: 24rpx;
  line-height: 1.72;
  color: rgba(78, 56, 37, 0.7);
}

.reading-flow-card {
  border-color: rgba(139, 111, 214, 0.18);
}

.reading-flow-list {
  display: grid;
  gap: 14rpx;
}

.reading-flow-row {
  display: grid;
  gap: 8rpx;
  padding: 16rpx 18rpx;
  border-radius: 18rpx;
  background: rgba(139, 111, 214, 0.07);
}

.reading-flow-row__label {
  font-size: 21rpx;
  font-weight: 760;
  color: #8b6fd6;
}

.reading-flow-row__text {
  font-size: 24rpx;
  line-height: 1.62;
  color: rgba(78, 56, 37, 0.72);
}

.profile-card {
  gap: 18rpx;
  border-color: rgba(139, 111, 214, 0.16);
}

.profile-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.profile-card__title-block {
  display: grid;
  gap: 8rpx;
  min-width: 0;
}

.profile-card__time {
  font-size: 21rpx;
  color: rgba(78, 56, 37, 0.5);
}

.profile-tone {
  flex: 0 0 auto;
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  font-size: 21rpx;
  font-weight: 760;
}

.profile-tone--move {
  color: #4f7c5a;
  background: #f3f8ee;
}

.profile-tone--clarify {
  color: #8b6fd6;
  background: rgba(139, 111, 214, 0.1);
}

.profile-tone--soften {
  color: #b97724;
  background: #fff3d8;
}

.profile-summary,
.profile-empty,
.profile-missed__text,
.profile-alert__text,
.profile-insight-row__evidence,
.profile-insight-row__text,
.profile-insight-row__risk,
.profile-signal-row__summary {
  font-size: 23rpx;
  line-height: 1.62;
  color: rgba(78, 56, 37, 0.66);
}

.profile-brief-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10rpx;
}

.profile-brief-item {
  display: grid;
  gap: 8rpx;
  min-width: 0;
  min-height: 92rpx;
  box-sizing: border-box;
  padding: 14rpx;
  border-radius: 18rpx;
  background: rgba(139, 111, 214, 0.07);
}

.profile-brief-item__label,
.profile-alert__label {
  font-size: 20rpx;
  color: rgba(78, 56, 37, 0.5);
}

.profile-brief-item__value {
  min-width: 0;
  font-size: 22rpx;
  line-height: 1.35;
  font-weight: 760;
  color: #4e3825;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.profile-alert {
  display: grid;
  gap: 8rpx;
  padding: 16rpx 18rpx;
  border-radius: 18rpx;
  background: rgba(216, 166, 78, 0.12);
  border: 1rpx solid rgba(216, 166, 78, 0.18);
}

.profile-alert__label {
  color: #b97724;
  font-weight: 760;
}

.profile-signal-list {
  display: grid;
  gap: 0;
  border-top: 1rpx solid rgba(139, 111, 214, 0.1);
  border-bottom: 1rpx solid rgba(139, 111, 214, 0.1);
}

.profile-insight-list {
  display: grid;
  gap: 14rpx;
}

.profile-insight-row {
  display: grid;
  gap: 8rpx;
  padding: 16rpx 18rpx;
  border-radius: 18rpx;
  background: rgba(139, 111, 214, 0.07);
}

.profile-insight-row__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.profile-insight-row__title {
  min-width: 0;
  font-size: 23rpx;
  font-weight: 760;
  color: #4e3825;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-insight-row__weight {
  flex: 0 0 auto;
  font-size: 20rpx;
  font-weight: 760;
  color: #8b6fd6;
}

.profile-insight-row__risk {
  color: rgba(183, 90, 79, 0.82);
}

.profile-signal-row {
  display: grid;
  gap: 8rpx;
  padding: 18rpx 0;
}

.profile-signal-row + .profile-signal-row {
  border-top: 1rpx solid rgba(139, 111, 214, 0.08);
}

.profile-signal-row__main,
.profile-missed,
.profile-adjust-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.profile-signal-row__label,
.profile-missed__label,
.profile-adjust-item__label {
  flex: 0 0 auto;
  font-size: 21rpx;
  color: rgba(78, 56, 37, 0.52);
}

.profile-signal-row__value {
  min-width: 0;
  text-align: right;
  color: #4e3825;
  font-size: 23rpx;
  font-weight: 760;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-empty,
.profile-missed {
  padding: 16rpx 18rpx;
  border-radius: 18rpx;
  background: rgba(139, 111, 214, 0.06);
}

.profile-adjust-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10rpx;
}

.profile-adjust-item {
  min-width: 0;
  min-height: 58rpx;
  box-sizing: border-box;
  padding: 10rpx 12rpx;
  border-radius: 16rpx;
  background: rgba(78, 56, 37, 0.05);
}

.profile-adjust-item__label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-adjust-item__value {
  flex: 0 0 auto;
  font-size: 23rpx;
  font-weight: 800;
}

.profile-adjust-item--plus .profile-adjust-item__value {
  color: #4f7c5a;
}

.profile-adjust-item--minus .profile-adjust-item__value {
  color: #b75a4f;
}

.profile-adjust-item--zero .profile-adjust-item__value {
  color: rgba(78, 56, 37, 0.48);
}

.bullet-list {
  display: grid;
  gap: 10rpx;
}

.bullet-item::before {
  content: '✦ ';
  color: #8b6fd6;
}

.lucky-card {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0;
  padding: 22rpx 10rpx;
  border-radius: 24rpx;
}

.lucky-item {
  display: grid;
  justify-items: center;
  gap: 8rpx;
  padding: 0 8rpx;
}

.lucky-item + .lucky-item {
  border-left: 1rpx solid rgba(78, 56, 37, 0.1);
}

.lucky-label {
  font-size: 20rpx;
  color: rgba(78, 56, 37, 0.5);
}

.lucky-value {
  font-size: 24rpx;
  font-weight: 700;
  color: #4e3825;
}

.suitable-pair {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18rpx;
}

.suitable-panel {
  min-height: 130rpx;
  padding: 24rpx;
  border-radius: 24rpx;
}

.suitable-panel--good {
  background: #f3f8ee;
}

.suitable-panel--avoid {
  background: #fff0ea;
}

.suitable-label {
  display: block;
  font-size: 28rpx;
  font-weight: 800;
}

.suitable-panel--good .suitable-label {
  color: #4f7c5a;
}

.suitable-panel--avoid .suitable-label {
  color: #b75a4f;
}

.suitable-text {
  display: block;
  margin-top: 12rpx;
  font-size: 23rpx;
  line-height: 1.5;
  color: rgba(78, 56, 37, 0.68);
}

.review-card {
  display: grid;
  gap: 18rpx;
  padding: 24rpx;
  border-radius: 24rpx;
}

.review-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
}

.review-card__subtitle {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: rgba(78, 56, 37, 0.56);
}

.favorite-button,
.outcome-button,
.review-save,
.review-list-button {
  padding: 0;
  margin: 0;
  border: 0;
}

.favorite-button::after,
.outcome-button::after,
.review-save::after,
.review-list-button::after {
  border: 0;
}

.favorite-button {
  flex: 0 0 auto;
  min-width: 116rpx;
  height: 54rpx;
  border-radius: 999rpx;
  color: #8b6fd6;
  background: rgba(139, 111, 214, 0.1);
  font-size: 22rpx;
}

.favorite-button--active {
  color: #ffffff;
  background: #8b6fd6;
}

.outcome-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
}

.outcome-button {
  height: 62rpx;
  border-radius: 999rpx;
  color: rgba(78, 56, 37, 0.62);
  background: rgba(139, 111, 214, 0.08);
  font-size: 22rpx;
}

.outcome-button--active {
  color: #ffffff;
  background: linear-gradient(135deg, #8b6fd6, #b898f0);
}

.review-note {
  width: 100%;
  min-height: 150rpx;
  box-sizing: border-box;
  padding: 20rpx;
  border-radius: 22rpx;
  background: rgba(255, 249, 239, 0.92);
  color: #4e3825;
  font-size: 24rpx;
  line-height: 1.55;
}

.review-note__placeholder {
  color: rgba(78, 56, 37, 0.42);
}

.review-actions {
  display: grid;
  grid-template-columns: minmax(0, 1.18fr) minmax(0, 1fr);
  gap: 12rpx;
}

.review-save {
  height: 68rpx;
  border-radius: 999rpx;
  color: #ffffff;
  background: #4e3825;
  font-size: 24rpx;
  font-weight: 700;
}

.review-list-button {
  height: 68rpx;
  border-radius: 999rpx;
  color: #8b6fd6;
  background: rgba(139, 111, 214, 0.1);
  font-size: 24rpx;
  font-weight: 700;
}

.bottom-buttons {
  position: fixed;
  left: 24rpx;
  right: 24rpx;
  bottom: calc(env(safe-area-inset-bottom) + 24rpx);
  display: grid;
  grid-template-columns: 1fr 1.2fr 1fr;
  gap: 14rpx;
  z-index: 10;
}

.action-button {
  display: grid;
  place-items: center;
  height: 76rpx;
  padding: 0;
  margin: 0;
  border-radius: 999rpx;
  font-size: 25rpx;
  font-weight: 700;
}

.action-button--primary {
  color: #ffffff;
  background: linear-gradient(135deg, #8b6fd6, #b898f0);
  box-shadow: 0 14rpx 32rpx rgba(139, 111, 214, 0.26);
}

.action-button--ghost {
  color: #8b6fd6;
  background: rgba(255, 255, 255, 0.9);
  border: 1rpx solid rgba(139, 111, 214, 0.18);
}

.mood-feedback-card {
  margin: 24rpx 24rpx 120rpx;
  padding: 28rpx 24rpx;
  border-radius: 20rpx;
  background: #fff;
  box-shadow: 0 2rpx 20rpx rgba(0,0,0,0.04);

  &__title { font-size: 27rpx; font-weight: 600; color: #2a2a3e; display: block; margin-bottom: 18rpx; text-align: center; }
  &__grid { display: flex; gap: 12rpx; justify-content: center; flex-wrap: wrap; }
  &__submit {
    margin-top: 18rpx; width: 100%; height: 72rpx; line-height: 72rpx; text-align: center;
    border-radius: 36rpx; background: linear-gradient(135deg, #8b6fd6, #b898f0); color: #fff;
    font-size: 26rpx; border: none;
  }
  &__saved { display: block; text-align: center; color: #8b6fd6; font-size: 24rpx; margin-top: 12rpx; }
}

.mood-feedback-chip {
  padding: 12rpx 20rpx; border-radius: 24rpx; border: 1.5rpx solid #e0e0e0; font-size: 24rpx; color: #666;
  &--active { border-color: #8b6fd6; background: rgba(139,111,214,0.08); color: #8b6fd6; }
}
</style>
