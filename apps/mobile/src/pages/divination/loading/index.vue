<template>
  <view class="casting-page">
    <view class="ambient ambient--moon"></view>
    <view class="ambient ambient--mist"></view>

    <view class="casting-head">
      <text class="casting-eyebrow">高岛略筮</text>
      <text class="casting-title">{{ castComplete ? '卦象已成' : isCasting ? '正在起卦' : '静心一问' }}</text>
      <text class="casting-summary">只问一事，凝神后起卦；结果作自我觉察与行动参考。</text>
    </view>

    <view v-if="request.question" class="question-line">
      <text class="question-line__label">所问</text>
      <text class="question-line__text">{{ request.question }}</text>
    </view>

    <view v-if="!isCasting" class="method-grid">
      <view
        v-for="item in methodOptions"
        :key="item.value"
        class="method-option"
        :class="{ 'method-option--active': selectedMethod === item.value }"
        @tap="selectMethod(item.value)"
      >
        <text class="method-option__title">{{ item.title }}</text>
        <text class="method-option__desc">{{ item.desc }}</text>
      </view>
    </view>

    <view v-if="!isCasting && selectedMethod === 'split-stalk'" class="flow-switch">
      <text class="flow-switch__label">取数顺序</text>
      <view class="flow-switch__options">
        <view
          v-for="item in flowOptions"
          :key="item.value"
          class="flow-pill"
          :class="{ 'flow-pill--active': selectedFlow === item.value }"
          @tap="selectedFlow = item.value"
        >
          {{ item.label }}
        </view>
      </view>
    </view>

    <view class="ritual-stage" :class="[`ritual-stage--${selectedMethod}`, { 'ritual-stage--active': isCasting }]">
      <view v-if="selectedMethod === 'split-stalk'" class="stalk-scene">
        <view class="taiji-stick">
          <text>太极</text>
        </view>
        <view class="stalk-bundle">
          <view
            v-for="stick in visualSticks"
            :key="stick"
            class="stalk"
            :class="{
              'stalk--left': isCasting && stick % 2 === 0,
              'stalk--right': isCasting && stick % 2 === 1,
            }"
            :style="{ animationDelay: `${stick * 0.025}s` }"
          ></view>
        </view>
        <view class="split-meter">
          <view class="split-meter__side">
            <text class="split-meter__label">左</text>
            <text class="split-meter__value">{{ currentStep?.leftCount ?? '--' }}</text>
          </view>
          <view class="split-meter__center">
            <text>{{ currentStep?.selectedSide === 'right' ? '取右' : '取左' }}</text>
          </view>
          <view class="split-meter__side">
            <text class="split-meter__label">右</text>
            <text class="split-meter__value">{{ currentStep?.rightCount ?? '--' }}</text>
          </view>
        </view>
      </view>

      <view v-else class="lot-scene">
        <view class="lot-tube">
          <view
            v-for="lot in 8"
            :key="lot"
            class="lot-stick"
            :class="{ 'lot-stick--drawn': isCasting && lot === activeLotIndex }"
            :style="{ animationDelay: `${lot * 0.04}s` }"
          ></view>
        </view>
        <view class="drawn-lot">
          <text class="drawn-lot__label">{{ currentStep?.resultLabel || '待抽' }}</text>
          <text class="drawn-lot__value">{{ currentStep?.resultValue || '凝神后抽签' }}</text>
        </view>
      </view>
    </view>

    <view class="step-list">
      <view
        v-for="(step, index) in displaySteps"
        :key="step.key"
        class="step-item"
        :class="{
          'step-item--active': currentStepIndex === index,
          'step-item--done': index < revealedSteps.length,
        }"
      >
        <view class="step-dot">{{ index + 1 }}</view>
        <view class="step-copy">
          <text class="step-title">{{ step.title }}</text>
          <text class="step-desc">{{ step.resultValue ? `${step.resultLabel}：${step.resultValue}` : step.action }}</text>
        </view>
      </view>
    </view>

    <view class="bottom-action">
      <button v-if="!isCasting" class="primary-button" @tap="startCasting">凝神起卦</button>
      <button v-else-if="castComplete" class="primary-button" @tap="openResult">查看卦象</button>
      <view v-else class="casting-status">
        <text>{{ currentStep?.title || '正在凝神' }}</text>
        <view class="status-pulse"></view>
      </view>
      <text class="ritual-note">{{ ritualNote }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad, onUnload } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import {
  clearPendingDivinationRequest,
  createTodayDivinationRequest,
  generateDivinationResult,
  getPendingDivinationRequest,
  saveDivinationResult,
} from '../../../services/divination';
import type {
  DivinationCastingStep,
  DivinationFlow,
  DivinationMethod,
  DivinationRequest,
  DivinationResult,
} from '../../../types/divination';

type TapEvent = {
  timeStamp?: number;
  changedTouches?: Array<{ clientX?: number; clientY?: number; pageX?: number; pageY?: number }>;
  touches?: Array<{ clientX?: number; clientY?: number; pageX?: number; pageY?: number }>;
};

const methodOptions: Array<{ value: DivinationMethod; title: string; desc: string }> = [
  { value: 'split-stalk', title: '分策法', desc: '三次分策，取余定上下卦与动爻' },
  { value: 'draw-lots', title: '抽签法', desc: '三次抽签，快速定卦与动爻' },
];

const flowOptions: Array<{ value: DivinationFlow; label: string }> = [
  { value: 'yang', label: '阳式 左右左' },
  { value: 'yin', label: '阴式 右左右' },
];

const request = ref<DivinationRequest>(createTodayDivinationRequest());
const selectedMethod = ref<DivinationMethod>('split-stalk');
const selectedFlow = ref<DivinationFlow>('yang');
const isCasting = ref(false);
const castComplete = ref(false);
const pendingResult = ref<DivinationResult | null>(null);
const revealedSteps = ref<DivinationCastingStep[]>([]);
const currentStepIndex = ref(-1);
const visualSticks = Array.from({ length: 24 }, (_, index) => index + 1);
let stepTimer: ReturnType<typeof setTimeout> | null = null;

const fallbackSteps = computed<DivinationCastingStep[]>(() => {
  if (selectedMethod.value === 'draw-lots') {
    return [
      buildPlaceholderStep('upper', '一抽定上卦', '八卦签筒取一签'),
      buildPlaceholderStep('lower', '二抽定下卦', '八卦签筒再取一签'),
      buildPlaceholderStep('moving', '三抽定动爻', '六爻签筒取一签'),
    ];
  }

  return [
    buildPlaceholderStep('upper', '一分定上卦', '取余除八，定上卦'),
    buildPlaceholderStep('lower', '二分定下卦', '取余除八，定下卦'),
    buildPlaceholderStep('moving', '三分定动爻', '取余除六，定动爻'),
  ];
});

const displaySteps = computed(() => {
  const resultSteps = pendingResult.value?.casting?.steps || fallbackSteps.value;

  return resultSteps.map((step, index) => revealedSteps.value[index] || step);
});

const currentStep = computed(() => revealedSteps.value[revealedSteps.value.length - 1] || null);
const activeLotIndex = computed(() => currentStep.value?.remainder || 1);
const ritualNote = computed(() => {
  if (castComplete.value) {
    return '本卦、动爻、变卦已生成。';
  }

  if (isCasting.value) {
    return selectedMethod.value === 'split-stalk' ? '竹策分合中，请稍候。' : '签已入筒，正在抽取。';
  }

  return '默想所问之事，心定后再点起卦。';
});

function selectMethod(method: DivinationMethod) {
  if (isCasting.value) {
    return;
  }

  selectedMethod.value = method;
}

function startCasting(event?: TapEvent) {
  if (isCasting.value) {
    return;
  }

  const nextRequest: DivinationRequest = {
    ...request.value,
    method: selectedMethod.value,
    flow: selectedFlow.value,
    interactionSeed: buildInteractionSeed(event),
  };
  const result = generateDivinationResult(nextRequest);

  pendingResult.value = result;
  request.value = nextRequest;
  isCasting.value = true;
  revealedSteps.value = [];
  currentStepIndex.value = -1;

  runStep(0);
}

function runStep(index: number) {
  const steps = pendingResult.value?.casting?.steps || [];

  if (!steps.length) {
    return;
  }

  if (index >= steps.length) {
    finishCasting();
    return;
  }

  currentStepIndex.value = index;
  revealedSteps.value = [...revealedSteps.value, steps[index]];
  stepTimer = setTimeout(() => runStep(index + 1), selectedMethod.value === 'split-stalk' ? 920 : 760);
}

function finishCasting() {
  if (!pendingResult.value) {
    return;
  }

  currentStepIndex.value = -1;
  castComplete.value = true;
  saveDivinationResult(pendingResult.value);
  clearPendingDivinationRequest();
}

function openResult() {
  if (!pendingResult.value) {
    return;
  }

  uni.redirectTo({
    url: `/pages/divination/result/index?id=${encodeURIComponent(pendingResult.value.id)}`,
  });
}

function buildInteractionSeed(event?: TapEvent) {
  const touch = event?.changedTouches?.[0] || event?.touches?.[0];
  return [
    Date.now(),
    event?.timeStamp || '',
    touch?.clientX ?? touch?.pageX ?? '',
    touch?.clientY ?? touch?.pageY ?? '',
    selectedMethod.value,
    selectedFlow.value,
  ].join('|');
}

function buildPlaceholderStep(
  key: DivinationCastingStep['key'],
  title: string,
  action: string,
): DivinationCastingStep {
  return {
    key,
    title,
    action,
    remainder: 0,
    resultLabel: '',
    resultValue: '',
  };
}

onLoad(() => {
  const pending = getPendingDivinationRequest();
  request.value = pending || createTodayDivinationRequest();
  selectedMethod.value = request.value.method || 'split-stalk';
  selectedFlow.value = request.value.flow || 'yang';
});

onUnload(() => {
  if (stepTimer) {
    clearTimeout(stepTimer);
  }
});
</script>

<style lang="scss">
.casting-page {
  position: relative;
  min-height: 100vh;
  box-sizing: border-box;
  padding: calc(env(safe-area-inset-top) + 40rpx) 30rpx 180rpx;
  overflow: hidden;
  background:
    radial-gradient(circle at 82% 8%, rgba(216, 166, 78, 0.18), transparent 26%),
    radial-gradient(circle at 18% 2%, rgba(139, 111, 214, 0.16), transparent 28%),
    linear-gradient(180deg, #fff9ef 0%, #f4edff 48%, #fff8ec 100%);
  color: #4e3825;
}

.ambient {
  position: absolute;
  pointer-events: none;
}

.ambient--moon {
  right: 76rpx;
  top: 118rpx;
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: rgba(216, 166, 78, 0.28);
  box-shadow: -22rpx 2rpx 0 #fff9ef inset;
  animation: moonFloat 4.8s ease-in-out infinite;
}

.ambient--mist {
  left: -100rpx;
  top: 420rpx;
  width: 330rpx;
  height: 210rpx;
  border-radius: 50%;
  background: rgba(139, 111, 214, 0.14);
  filter: blur(34rpx);
}

.casting-head,
.question-line,
.method-grid,
.flow-switch,
.ritual-stage,
.step-list,
.bottom-action {
  position: relative;
  z-index: 1;
}

.casting-head {
  display: grid;
  gap: 12rpx;
  margin-bottom: 24rpx;
}

.casting-eyebrow,
.casting-summary,
.question-line__label,
.ritual-note {
  color: rgba(78, 56, 37, 0.62);
}

.casting-eyebrow {
  font-size: 23rpx;
  letter-spacing: 0;
}

.casting-title {
  font-size: 58rpx;
  line-height: 1.08;
  font-weight: 760;
  font-family:
    'Iowan Old Style',
    'Times New Roman',
    'Noto Serif SC',
    serif;
}

.casting-summary {
  max-width: 560rpx;
  font-size: 25rpx;
  line-height: 1.6;
}

.question-line {
  display: flex;
  gap: 16rpx;
  padding: 18rpx 22rpx;
  margin-bottom: 22rpx;
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.66);
}

.question-line__label {
  flex: 0 0 auto;
  font-size: 22rpx;
}

.question-line__text {
  flex: 1;
  min-width: 0;
  font-size: 24rpx;
  line-height: 1.45;
}

.method-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
  margin-bottom: 18rpx;
}

.method-option {
  min-height: 134rpx;
  box-sizing: border-box;
  padding: 24rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.74);
  border: 2rpx solid rgba(139, 111, 214, 0.08);
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    background 0.18s ease;
}

.method-option--active {
  transform: translateY(-4rpx);
  border-color: rgba(139, 111, 214, 0.34);
  background: rgba(255, 255, 255, 0.92);
}

.method-option__title,
.method-option__desc {
  display: block;
}

.method-option__title {
  font-size: 30rpx;
  font-weight: 740;
}

.method-option__desc {
  margin-top: 10rpx;
  font-size: 22rpx;
  line-height: 1.45;
  color: rgba(78, 56, 37, 0.58);
}

.flow-switch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  margin-bottom: 22rpx;
}

.flow-switch__label {
  flex: 0 0 auto;
  font-size: 24rpx;
  color: rgba(78, 56, 37, 0.7);
}

.flow-switch__options {
  display: inline-flex;
  gap: 10rpx;
}

.flow-pill {
  padding: 12rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.68);
  color: rgba(78, 56, 37, 0.64);
  font-size: 21rpx;
}

.flow-pill--active {
  color: #ffffff;
  background: #8b6fd6;
}

.ritual-stage {
  display: grid;
  place-items: center;
  min-height: 410rpx;
  margin-top: 10rpx;
  border-radius: 34rpx;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 42%, rgba(255, 255, 255, 0.78), transparent 42%),
    linear-gradient(145deg, rgba(139, 111, 214, 0.18), rgba(216, 166, 78, 0.13));
  border: 1rpx solid rgba(255, 255, 255, 0.78);
}

.stalk-scene,
.lot-scene {
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  height: 410rpx;
}

.taiji-stick {
  position: absolute;
  top: 42rpx;
  left: 50%;
  display: grid;
  place-items: center;
  width: 20rpx;
  height: 160rpx;
  margin-left: -10rpx;
  border-radius: 999rpx;
  background: #d8a64e;
  box-shadow: 0 14rpx 28rpx rgba(120, 74, 26, 0.18);
}

.taiji-stick text {
  position: absolute;
  top: -34rpx;
  width: 80rpx;
  text-align: center;
  color: rgba(78, 56, 37, 0.5);
  font-size: 20rpx;
}

.stalk-bundle {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7rpx;
  width: 540rpx;
  height: 230rpx;
}

.stalk {
  width: 9rpx;
  height: 190rpx;
  border-radius: 999rpx;
  background: linear-gradient(180deg, #e4c27b, #9f7d3a);
  transform-origin: 50% 96%;
  animation: stalkBreathe 1.7s ease-in-out infinite;
  transition:
    transform 0.5s ease,
    opacity 0.5s ease;
}

.ritual-stage--active .stalk--left {
  transform: translateX(-54rpx) rotate(-8deg);
}

.ritual-stage--active .stalk--right {
  transform: translateX(54rpx) rotate(8deg);
}

.split-meter {
  position: absolute;
  left: 56rpx;
  right: 56rpx;
  bottom: 34rpx;
  display: grid;
  grid-template-columns: 1fr 120rpx 1fr;
  align-items: center;
  gap: 18rpx;
}

.split-meter__side,
.split-meter__center {
  display: grid;
  place-items: center;
  min-height: 76rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.66);
}

.split-meter__label {
  font-size: 20rpx;
  color: rgba(78, 56, 37, 0.5);
}

.split-meter__value {
  margin-top: 4rpx;
  font-size: 30rpx;
  font-weight: 760;
}

.split-meter__center {
  color: #8b6fd6;
  font-size: 24rpx;
  font-weight: 700;
}

.lot-tube {
  position: relative;
  width: 230rpx;
  height: 230rpx;
  border-radius: 42rpx 42rpx 66rpx 66rpx;
  background: linear-gradient(180deg, #8b6fd6, #5d4a9a);
  box-shadow: 0 20rpx 48rpx rgba(93, 74, 154, 0.22);
}

.lot-tube::after {
  content: '';
  position: absolute;
  left: 26rpx;
  right: 26rpx;
  bottom: 26rpx;
  height: 26rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
}

.lot-stick {
  position: absolute;
  left: 50%;
  bottom: 122rpx;
  width: 12rpx;
  height: 190rpx;
  margin-left: -6rpx;
  border-radius: 999rpx;
  background: linear-gradient(180deg, #ffe0a6, #c9963f);
  transform: rotate(calc((var(--rotate, 0) + 1) * 1deg));
  animation: lotShake 1.4s ease-in-out infinite;
}

.lot-stick:nth-child(1) {
  transform: translateX(-70rpx) rotate(-14deg);
}

.lot-stick:nth-child(2) {
  transform: translateX(-50rpx) rotate(-9deg);
}

.lot-stick:nth-child(3) {
  transform: translateX(-30rpx) rotate(-5deg);
}

.lot-stick:nth-child(4) {
  transform: translateX(-10rpx) rotate(-2deg);
}

.lot-stick:nth-child(5) {
  transform: translateX(10rpx) rotate(2deg);
}

.lot-stick:nth-child(6) {
  transform: translateX(30rpx) rotate(5deg);
}

.lot-stick:nth-child(7) {
  transform: translateX(50rpx) rotate(9deg);
}

.lot-stick:nth-child(8) {
  transform: translateX(70rpx) rotate(14deg);
}

.lot-stick--drawn {
  background: linear-gradient(180deg, #fff6d9, #d8a64e);
  animation: drawLot 0.7s ease forwards;
}

.drawn-lot {
  position: absolute;
  right: 58rpx;
  bottom: 54rpx;
  display: grid;
  place-items: center;
  width: 170rpx;
  height: 128rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.78);
}

.drawn-lot__label {
  font-size: 20rpx;
  color: rgba(78, 56, 37, 0.52);
}

.drawn-lot__value {
  margin-top: 8rpx;
  font-size: 30rpx;
  font-weight: 760;
  color: #4e3825;
}

.step-list {
  display: grid;
  gap: 14rpx;
  margin-top: 22rpx;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 18rpx;
  min-height: 86rpx;
  padding: 0 20rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.62);
  opacity: 0.68;
  transition:
    opacity 0.18s ease,
    transform 0.18s ease,
    background 0.18s ease;
}

.step-item--active,
.step-item--done {
  opacity: 1;
  background: rgba(255, 255, 255, 0.88);
}

.step-item--active {
  transform: translateX(8rpx);
}

.step-dot {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 46rpx;
  height: 46rpx;
  border-radius: 50%;
  color: #ffffff;
  background: rgba(139, 111, 214, 0.5);
  font-size: 22rpx;
  font-weight: 700;
}

.step-item--done .step-dot,
.step-item--active .step-dot {
  background: #8b6fd6;
}

.step-copy {
  display: grid;
  gap: 5rpx;
  min-width: 0;
}

.step-title {
  font-size: 25rpx;
  font-weight: 700;
}

.step-desc {
  font-size: 21rpx;
  color: rgba(78, 56, 37, 0.58);
}

.bottom-action {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 5;
  box-sizing: border-box;
  padding: 22rpx 30rpx calc(env(safe-area-inset-bottom) + 24rpx);
  background: linear-gradient(180deg, rgba(255, 248, 236, 0), rgba(255, 248, 236, 0.96) 28%);
}

.primary-button {
  height: 90rpx;
  padding: 0;
  margin: 0;
  border-radius: 999rpx;
  color: #ffffff;
  background: linear-gradient(135deg, #8b6fd6, #d8a64e);
  font-size: 29rpx;
  font-weight: 760;
}

.primary-button::after {
  border: 0;
}

.casting-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  height: 90rpx;
  border-radius: 999rpx;
  color: #8b6fd6;
  background: rgba(255, 255, 255, 0.82);
  font-size: 27rpx;
  font-weight: 700;
}

.status-pulse {
  width: 18rpx;
  height: 18rpx;
  border-radius: 50%;
  background: #8b6fd6;
  animation: pulse 0.9s ease-in-out infinite;
}

.ritual-note {
  display: block;
  margin-top: 13rpx;
  text-align: center;
  font-size: 22rpx;
}

@keyframes moonFloat {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(12rpx);
  }
}

@keyframes stalkBreathe {
  0%,
  100% {
    opacity: 0.72;
  }
  50% {
    opacity: 1;
  }
}

@keyframes lotShake {
  0%,
  100% {
    filter: brightness(1);
  }
  50% {
    filter: brightness(1.15);
  }
}

@keyframes drawLot {
  to {
    transform: translateY(-106rpx) scale(1.08);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.28;
    transform: scale(0.75);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
