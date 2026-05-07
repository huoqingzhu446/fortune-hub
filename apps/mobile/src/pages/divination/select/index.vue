<template>
  <view class="select-page">
    <view class="top-bar">
      <button class="back-button" @tap="back">‹</button>
      <text class="top-title">选择占卜主题</text>
      <view class="top-spacer"></view>
    </view>

    <scroll-view class="topic-scroll" scroll-x>
      <view class="topic-row">
        <view
          v-for="item in topicOptions"
          :key="item.value"
          class="topic-card"
          :class="{ 'topic-card--active': selectedTopic === item.value }"
          @tap="selectedTopic = item.value"
        >
          <text class="topic-card__icon">{{ item.icon }}</text>
          <text class="topic-card__label">{{ item.label }}</text>
          <text class="topic-card__subtitle">{{ item.subtitle }}</text>
        </view>
      </view>
    </scroll-view>

    <view class="input-card">
      <text class="card-title">输入你的问题</text>
      <text class="card-note">清晰的问题，更利于获得贴近当下的指引。</text>
      <textarea
        v-model="question"
        class="question-input"
        maxlength="200"
        placeholder="例如：最近适合主动联系对方吗？"
        placeholder-class="question-placeholder"
      />
      <text class="counter">{{ question.length }}/200</text>
    </view>

    <view class="dimension-card">
      <text class="card-title">增强维度，可多选</text>
      <text class="card-note">帮助我们作为断语旁参，不改变本卦、动爻和变卦。</text>
      <view v-if="profileLoading" class="dimension-hint">
        <text class="dimension-hint__text">正在同步资料状态…</text>
      </view>
      <view v-else class="dimension-hint">
        <text class="dimension-hint__text">{{ profileHint }}</text>
      </view>
      <view class="dimension-list">
        <view
          v-for="item in dimensionRows"
          :key="item.personalizationKey"
          class="dimension-item"
          :class="{ 'dimension-item--disabled': item.state === 'disabled' }"
          @tap="toggleDimension(item.flagKey)"
        >
          <view class="dimension-icon">{{ item.icon }}</view>
          <view class="dimension-copy">
            <view class="dimension-copy__head">
              <text class="dimension-title">{{ item.title }}</text>
              <text class="dimension-status" :class="`dimension-status--${item.state}`">{{ item.statusLabel }}</text>
            </view>
            <text class="dimension-value">{{ item.valueLabel }}</text>
            <text class="dimension-desc">{{ item.summary }}</text>
          </view>
          <view class="check-dot" :class="{ 'check-dot--active': flags[item.flagKey] }"></view>
        </view>
      </view>
    </view>

    <view class="bottom-action">
      <button class="start-button" @tap="startDivination">进入起卦</button>
      <text class="remain-text">下一步选择分策法或抽签法</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad, onShow } from '@dcloudio/uni-app';
import { computed, reactive, ref } from 'vue';
import {
  getDefaultPersonalizationFlags,
  setPendingDivinationRequest,
} from '../../../services/divination';
import {
  ensureDivinationContentCatalog,
  getDivinationPageTabs,
  getDivinationSelectTopicOptions,
  getDivinationTopicOptions,
} from '../../../services/divination-content';
import { resolveDivinationPersonalizationContext } from '../../../services/divination-profile';
import type { DivinationDimensionOption } from '../../../services/divination-runtime-config';
import type {
  DivinationPersonalizationContext,
  DivinationPersonalizationFlags,
  DivinationTopic,
} from '../../../types/divination';

const topicOptions = ref(getDivinationSelectTopicOptions());
const selectedTopic = ref<DivinationTopic>('general');
const question = ref('');
const flags = reactive<DivinationPersonalizationFlags>(getDefaultPersonalizationFlags());

const profileContext = ref<DivinationPersonalizationContext | null>(null);
const profileLoading = ref(false);
const dimensions = ref<DivinationDimensionOption[]>(getDivinationPageTabs().dimensionOptions);
let profileRequestId = 0;

const dimensionRows = computed(() =>
  dimensions.value.map((item) => {
    const state = profileContext.value?.dimensionStates.find(
      (entry) => entry.key === item.personalizationKey,
    );
    const enabled = flags[item.flagKey];

    return {
      ...item,
      state: state?.state || (enabled ? 'missing' : 'disabled'),
      statusLabel: state?.statusLabel || (enabled ? '待完善' : '已关闭'),
      valueLabel: state?.valueLabel || (enabled ? '暂无资料' : '未参与'),
      summary: state?.summary || item.desc,
    };
  }),
);

const profileHint = computed(() => {
  const states = profileContext.value?.dimensionStates || [];
  const active = states.filter((item) => item.enabled && item.state === 'active').length;
  const missing = states.filter((item) => item.enabled && item.state === 'missing').length;
  const disabled = states.filter((item) => !item.enabled).length;

  if (!states.length) {
    return '当前没有可用资料时，也会继续按卦象本身起卦。';
  }

  if (profileContext.value?.hasPartialMiss) {
    return `已命中 ${active} 项，${missing} 项未命中，${disabled} 项已关闭。`;
  }

  return `已命中 ${active} 项，${disabled} 项已关闭。`;
});

function toggleDimension(key: keyof DivinationPersonalizationFlags) {
  flags[key] = !flags[key];
  void refreshProfileContext();
}

function refreshPageConfig() {
  topicOptions.value = getDivinationSelectTopicOptions();
  dimensions.value = getDivinationPageTabs().dimensionOptions;
}

function startDivination() {
  setPendingDivinationRequest({
    userId: 'local-user',
    topic: selectedTopic.value,
    question: question.value.trim(),
    timestamp: Date.now(),
    useBazi: flags.useBazi,
    useZodiac: flags.useZodiac,
    useMood: flags.useMood,
    usePersonality: flags.usePersonality,
  });

  uni.navigateTo({
    url: '/pages/divination/loading/index',
  });
}

async function refreshProfileContext() {
  const requestId = profileRequestId + 1;
  profileRequestId = requestId;
  profileLoading.value = true;
  try {
    const nextContext = await resolveDivinationPersonalizationContext({
      useBazi: flags.useBazi,
      useZodiac: flags.useZodiac,
      useMood: flags.useMood,
      usePersonality: flags.usePersonality,
    });
    if (requestId === profileRequestId) {
      profileContext.value = nextContext;
    }
  } catch (error) {
    console.warn('resolve divination personalization context failed', error);
    if (requestId === profileRequestId) {
      profileContext.value = null;
    }
  } finally {
    if (requestId === profileRequestId) {
      profileLoading.value = false;
    }
  }
}

function back() {
  uni.navigateBack({
    fail: () => {
      uni.redirectTo({ url: '/pages/divination/index/index' });
    },
  });
}

onLoad((query) => {
  void ensureDivinationContentCatalog().then(refreshPageConfig);
  const topic = String(query?.topic || '') as DivinationTopic;
  if (getDivinationTopicOptions().some((item) => item.value === topic)) {
    selectedTopic.value = topic;
  }
});

onShow(() => {
  void refreshProfileContext();
});
</script>

<style lang="scss">
.select-page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: calc(env(safe-area-inset-top) + 24rpx) 28rpx 170rpx;
  background:
    radial-gradient(circle at 86% 14%, rgba(139, 111, 214, 0.14), transparent 30%),
    linear-gradient(180deg, #fff9ef 0%, #f7efff 48%, #fffaf0 100%);
  color: #4e3825;
}

.top-bar {
  display: grid;
  grid-template-columns: 64rpx 1fr 64rpx;
  align-items: center;
  margin-bottom: 28rpx;
}

.back-button {
  width: 60rpx;
  height: 60rpx;
  padding: 0;
  margin: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.7);
  color: #4e3825;
  font-size: 46rpx;
  line-height: 54rpx;
}

.back-button::after,
.start-button::after {
  border: 0;
}

.top-title {
  text-align: center;
  font-size: 32rpx;
  font-weight: 700;
}

.topic-scroll {
  white-space: nowrap;
  margin: 0 -28rpx;
  padding-left: 28rpx;
}

.topic-row {
  display: inline-flex;
  gap: 16rpx;
  padding: 0 28rpx 24rpx;
}

.topic-card {
  display: inline-grid;
  justify-items: center;
  align-content: center;
  gap: 10rpx;
  width: 122rpx;
  height: 148rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.78);
  border: 1rpx solid rgba(216, 166, 78, 0.22);
  color: rgba(78, 56, 37, 0.76);
}

.topic-card--active {
  color: #ffffff;
  background: linear-gradient(145deg, #8b6fd6, #b89bf2);
  box-shadow: 0 18rpx 36rpx rgba(139, 111, 214, 0.24);
}

.topic-card__icon {
  font-size: 36rpx;
}

.topic-card__label {
  font-size: 25rpx;
  font-weight: 700;
}

.topic-card__subtitle {
  font-size: 19rpx;
  opacity: 0.72;
}

.input-card,
.dimension-card {
  position: relative;
  margin-top: 20rpx;
  padding: 28rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.82);
  border: 1rpx solid rgba(255, 255, 255, 0.92);
  box-shadow: 0 14rpx 36rpx rgba(80, 60, 120, 0.08);
}

.card-title,
.card-note {
  display: block;
  text-align: center;
}

.card-title {
  font-size: 34rpx;
  font-weight: 700;
  font-family:
    'Iowan Old Style',
    'Times New Roman',
    'Noto Serif SC',
    serif;
}

.card-note {
  margin-top: 12rpx;
  font-size: 23rpx;
  color: rgba(78, 56, 37, 0.58);
}

.dimension-hint {
  margin-top: 18rpx;
  padding: 14rpx 16rpx;
  border-radius: 18rpx;
  background: rgba(139, 111, 214, 0.08);
}

.dimension-hint__text {
  display: block;
  font-size: 22rpx;
  color: rgba(78, 56, 37, 0.68);
  line-height: 1.5;
}

.question-input {
  width: 100%;
  min-height: 210rpx;
  box-sizing: border-box;
  margin-top: 26rpx;
  padding: 24rpx;
  border-radius: 22rpx;
  background: rgba(255, 250, 241, 0.82);
  border: 1rpx solid rgba(216, 166, 78, 0.22);
  font-size: 26rpx;
  line-height: 1.6;
  color: #4e3825;
}

.question-placeholder {
  color: rgba(78, 56, 37, 0.36);
}

.counter {
  display: block;
  margin-top: 10rpx;
  text-align: right;
  font-size: 22rpx;
  color: rgba(78, 56, 37, 0.46);
}

.dimension-list {
  display: grid;
  gap: 14rpx;
  margin-top: 24rpx;
}

.dimension-item {
  display: flex;
  align-items: center;
  gap: 18rpx;
  min-height: 96rpx;
  padding: 18rpx;
  border-radius: 22rpx;
  background: rgba(255, 250, 241, 0.78);
  border: 1rpx solid rgba(216, 166, 78, 0.18);
}

.dimension-icon {
  display: grid;
  place-items: center;
  flex: 0 0 58rpx;
  width: 58rpx;
  height: 58rpx;
  border-radius: 18rpx;
  background: #efe8ff;
  color: #8b6fd6;
  font-size: 28rpx;
}

.dimension-copy {
  display: grid;
  gap: 6rpx;
  flex: 1;
  min-width: 0;
}

.dimension-copy__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
  min-width: 0;
}

.dimension-title {
  font-size: 26rpx;
  font-weight: 650;
  color: #4e3825;
}

.dimension-status {
  flex: 0 0 auto;
  padding: 4rpx 10rpx;
  border-radius: 999rpx;
  font-size: 20rpx;
  font-weight: 700;
  color: #8b6fd6;
  background: rgba(139, 111, 214, 0.1);
}

.dimension-status--active {
  color: #4f7c5a;
  background: rgba(79, 124, 90, 0.12);
}

.dimension-status--missing {
  color: #b97724;
  background: rgba(216, 166, 78, 0.16);
}

.dimension-status--disabled {
  color: rgba(78, 56, 37, 0.52);
  background: rgba(78, 56, 37, 0.08);
}

.dimension-value {
  font-size: 22rpx;
  color: rgba(78, 56, 37, 0.76);
}

.dimension-desc {
  font-size: 20rpx;
  color: rgba(78, 56, 37, 0.52);
}

.dimension-item--disabled {
  opacity: 0.78;
}

.check-dot {
  position: relative;
  flex: 0 0 36rpx;
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  border: 2rpx solid rgba(139, 111, 214, 0.32);
  background: rgba(255, 255, 255, 0.72);
}

.check-dot--active {
  background: #8b6fd6;
  border-color: #8b6fd6;
}

.check-dot--active::after {
  content: '';
  position: absolute;
  left: 10rpx;
  top: 6rpx;
  width: 10rpx;
  height: 16rpx;
  border-right: 3rpx solid #ffffff;
  border-bottom: 3rpx solid #ffffff;
  transform: rotate(42deg);
}

.bottom-action {
  position: fixed;
  left: 28rpx;
  right: 28rpx;
  bottom: calc(env(safe-area-inset-bottom) + 24rpx);
  display: grid;
  gap: 14rpx;
  justify-items: center;
  z-index: 10;
}

.start-button {
  display: grid;
  place-items: center;
  width: 100%;
  height: 88rpx;
  padding: 0;
  margin: 0;
  border-radius: 44rpx;
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 700;
  background: linear-gradient(135deg, #8b6fd6, #b898f0);
  box-shadow: 0 18rpx 36rpx rgba(139, 111, 214, 0.28);
}

.remain-text {
  font-size: 22rpx;
  color: rgba(78, 56, 37, 0.56);
}
</style>
