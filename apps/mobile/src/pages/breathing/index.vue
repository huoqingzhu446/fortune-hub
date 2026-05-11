<template>
  <view class="breathing-page" :style="themeVars">
    <!-- Mode Selection -->
    <view v-if="screen === 'select'" class="screen">
      <view class="hero">
        <text class="hero__title">引导呼吸练习</text>
        <text class="hero__subtitle">选一个适合你当下状态的呼吸节奏</text>
      </view>

      <view class="pre-mood">
        <text class="pre-mood__label">开始前的状态</text>
        <view class="pre-mood__grid">
          <view
            v-for="item in preMoodOptions"
            :key="item.value"
            class="pre-mood-chip"
            :class="{ 'pre-mood-chip--active': preMood === item.value }"
            @tap="preMood = item.value"
          >
            <text>{{ item.emoji }} {{ item.label }}</text>
          </view>
        </view>
      </view>

      <view class="mode-list">
        <view
          v-for="mode in modes"
          :key="mode.value"
          class="mode-card"
          :style="{ borderColor: mode.color }"
          @tap="selectMode(mode)"
        >
          <view class="mode-card__head">
            <text class="mode-card__title">{{ mode.title }}</text>
            <text class="mode-card__badge" :style="{ color: mode.color }">
              {{ mode.inhale }}-{{ mode.hold1 || '0' }}-{{ mode.exhale }}{{ mode.hold2 ? '-' + mode.hold2 : '' }}
            </text>
          </view>
          <text class="mode-card__desc">{{ mode.description }}</text>
          <text class="mode-card__meta">{{ mode.defaultRounds }} 轮 · 约 {{ estimateDuration(mode) }} 秒</text>
        </view>
      </view>
    </view>

    <!-- Active Breathing -->
    <view v-if="screen === 'active'" class="screen screen--active" :style="{ background: activeColor + '10' }">
      <!-- Circle Animation -->
      <view class="breath-circle" :style="circleStyle">
        <text class="breath-circle__phase">{{ phaseLabel }}</text>
        <text class="breath-circle__timer">{{ countdown }}</text>
      </view>

      <view class="breath-info">
        <text class="breath-info__round">第 {{ currentRound }} / {{ totalRounds }} 轮</text>
        <text class="breath-info__guide">{{ guideText }}</text>
      </view>

      <view class="breath-actions">
        <button class="breath-btn breath-btn--pause" @tap="togglePause">
          {{ paused ? '继续' : '暂停' }}
        </button>
        <button class="breath-btn breath-btn--end" @tap="endSession">结束练习</button>
      </view>
    </view>

    <!-- Completed -->
    <view v-if="screen === 'done'" class="screen">
      <view class="done-card">
        <text class="done-card__emoji">{{ doneEmoji }}</text>
        <text class="done-card__title">练习完成</text>
        <text class="done-card__text">完成了 {{ completedRounds }} 轮 {{ completedMode?.title }}，共 {{ completedSeconds }} 秒</text>

        <view class="done-mood">
          <text class="done-mood__label">做完这次练习，你感觉怎么样？</text>
          <view class="done-mood__grid">
            <view
              v-for="item in postMoodOptions"
              :key="item.value"
              class="done-mood-chip"
              :class="{ 'done-mood-chip--active': feedbackMood === item.value }"
              @tap="feedbackMood = item.value"
            >
              <text>{{ item.emoji }} {{ item.label }}</text>
            </view>
          </view>
        </view>

        <button class="breath-btn breath-btn--primary" @tap="saveAndClose" :loading="saving">
          完成
        </button>
        <button class="breath-btn breath-btn--ghost" @tap="resetScreen">再来一次</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { http } from '../../services/request';
import { useThemePreference } from '../../composables/useThemePreference';

const { themeVars } = useThemePreference();

interface BreathingMode {
  value: string;
  title: string;
  description: string;
  inhale: number;
  hold1: number;
  exhale: number;
  hold2: number;
  defaultRounds: number;
  color: string;
}

const screen = ref<'select' | 'active' | 'done'>('select');
const modes = ref<BreathingMode[]>([]);
const activeMode = ref<BreathingMode | null>(null);
const activeColor = ref('#6CBFED');
const completedMode = ref<BreathingMode | null>(null);

// Breathing state
const phaseIndex = ref(0);
const phaseLabel = ref('吸气');
const countdown = ref(4);
const currentRound = ref(1);
const totalRounds = ref(4);
const paused = ref(false);
const guideText = ref('慢慢吸气，感受腹部隆起');

// Results
const completedRounds = ref(0);
const completedSeconds = ref(0);
const preMood = ref('');
const feedbackMood = ref('');
const saving = ref(false);
const doneEmoji = ref('🧘');

let intervalId: ReturnType<typeof setInterval> | null = null;

const phases = computed(() => {
  const m = activeMode.value;
  if (!m) return [];
  const p: { label: string; seconds: number }[] = [
    { label: '吸气', seconds: m.inhale },
  ];
  if (m.hold1 > 0) p.push({ label: '屏息', seconds: m.hold1 });
  p.push({ label: '呼气', seconds: m.exhale });
  if (m.hold2 > 0) p.push({ label: '屏息', seconds: m.hold2 });
  return p;
});

const circleStyle = computed(() => {
  const m = activeMode.value;
  if (!m) return {};
  const phase = phases.value[phaseIndex.value];
  const isInhale = phase?.label === '吸气';
  const scale = isInhale ? 1.15 : 0.85;
  const opacity = paused.value ? 0.6 : 1;
  return {
    width: `${180 * scale}px`,
    height: `${180 * scale}px`,
    borderColor: m.color,
    opacity,
    transition: `all ${phase?.seconds || 1}s ease-in-out`,
  };
});

const postMoodOptions = [
  { value: 'happy', emoji: '😊', label: '平静多了' },
  { value: 'neutral', emoji: '😐', label: '好一点' },
  { value: 'low', emoji: '😔', label: '还是低落' },
  { value: 'anxious', emoji: '😰', label: '仍然焦虑' },
];

const preMoodOptions = [
  { value: 'anxious', emoji: '😰', label: '焦虑' },
  { value: 'irritable', emoji: '😤', label: '烦躁' },
  { value: 'low', emoji: '😔', label: '低落' },
  { value: 'neutral', emoji: '😐', label: '一般' },
  { value: 'happy', emoji: '😊', label: '不错' },
];

function estimateDuration(mode: BreathingMode) {
  return mode.defaultRounds * (mode.inhale + mode.hold1 + mode.exhale + mode.hold2);
}

async function loadModes() {
  try {
    const res = await http.get<{ code: number; data: { modes: BreathingMode[] } }>('/wellness/breathing/modes');
    modes.value = (res as unknown as { data: { modes: BreathingMode[] } }).data.modes;
  } catch {
    // fallback modes
    modes.value = [
      { value: '478', title: '4-7-8 放松法', description: '缓解焦虑', inhale: 4, hold1: 7, exhale: 8, hold2: 0, defaultRounds: 4, color: '#6CBFED' },
      { value: 'box', title: '盒式呼吸', description: '提升专注', inhale: 4, hold1: 4, exhale: 4, hold2: 4, defaultRounds: 5, color: '#7BC86C' },
      { value: '55', title: '5-5 平静法', description: '日常放松', inhale: 5, hold1: 0, exhale: 5, hold2: 0, defaultRounds: 6, color: '#F0A860' },
    ];
  }
}

function selectMode(mode: BreathingMode) {
  activeMode.value = mode;
  activeColor.value = mode.color;
  totalRounds.value = mode.defaultRounds;
  currentRound.value = 1;
  phaseIndex.value = 0;
  paused.value = false;
  feedbackMood.value = '';

  screen.value = 'active';
  startPhase();
}

function startPhase() {
  stopTimer();
  const phase = phases.value[phaseIndex.value];
  if (!phase) return;
  phaseLabel.value = phase.label;
  countdown.value = phase.seconds;
  guideText.value = getPhaseGuide(phase.label);

  intervalId = setInterval(() => {
    if (paused.value) return;
    countdown.value--;
    if (countdown.value <= 0) {
      nextPhase();
    }
  }, 1000);
}

function getPhaseGuide(label: string) {
  const guides: Record<string, string> = {
    '吸气': '慢慢吸气，感受腹部隆起',
    '屏息': '轻轻屏住，保持平稳',
    '呼气': '缓缓呼出，感受身体放松',
  };
  return guides[label] || '';
}

function nextPhase() {
  stopTimer();
  if (phaseIndex.value < phases.value.length - 1) {
    phaseIndex.value++;
    startPhase();
  } else {
    // Round complete
    if (currentRound.value < totalRounds.value) {
      currentRound.value++;
      phaseIndex.value = 0;
      startPhase();
    } else {
      complete();
    }
  }
}

function togglePause() {
  paused.value = !paused.value;
}

function endSession() {
  stopTimer();
  complete();
}

function complete() {
  stopTimer();
  completedMode.value = activeMode.value;
  completedRounds.value = currentRound.value;
  completedSeconds.value = currentRound.value *
    (activeMode.value!.inhale + activeMode.value!.hold1 + activeMode.value!.exhale + activeMode.value!.hold2);
  screen.value = 'done';
}

async function saveAndClose() {
  saving.value = true;
  try {
    await http.post('/record/breathing', {
      mode: completedMode.value?.value,
      rounds: completedRounds.value,
      durationSeconds: completedSeconds.value,
      preMood: preMood.value || undefined,
      preMoodIntensity: preMood.value ? 3 : undefined,
      postMood: feedbackMood.value || undefined,
      postMoodIntensity: feedbackMood.value ? 3 : undefined,
    });
  } catch { /* silent */ }
  saving.value = false;
  uni.navigateBack();
}

function resetScreen() {
  stopTimer();
  screen.value = 'select';
  currentRound.value = 1;
  feedbackMood.value = '';
}

function stopTimer() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

onMounted(() => {
  loadModes();
});
</script>

<style scoped lang="scss">
.breathing-page {
  min-height: 100vh;
  background: #fafafe;
}

.screen {
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.screen--active {
  min-height: 100vh;
  align-items: center;
  justify-content: center;
}

.hero {
  margin-bottom: 24px;
  &__title { font-size: 24px; font-weight: 700; color: #1a1a2e; display: block; }
  &__subtitle { font-size: 14px; color: #888; margin-top: 4px; display: block; }
}

.pre-mood {
  margin-bottom: 18px;
  &__label { font-size: 13px; color: #777; display: block; margin-bottom: 10px; }
  &__grid { display: flex; gap: 8px; flex-wrap: wrap; }
}

.pre-mood-chip {
  padding: 8px 12px;
  border-radius: 18px;
  border: 1px solid #e4e4ec;
  background: #fff;
  font-size: 13px;
  color: #666;
  &--active { border-color: #7c6ff7; background: rgba(124,111,247,0.08); color: #4f45c7; }
}

.mode-list { display: flex; flex-direction: column; gap: 12px; }
.mode-card {
  padding: 16px;
  border-radius: 14px;
  border-left: 4px solid;
  background: #fff;
  box-shadow: 0 1px 8px rgba(0,0,0,0.04);
  &__head { display: flex; justify-content: space-between; align-items: center; }
  &__title { font-size: 17px; font-weight: 600; }
  &__badge { font-size: 13px; font-weight: 500; }
  &__desc { font-size: 13px; color: #888; margin-top: 4px; }
  &__meta { font-size: 12px; color: #bbb; margin-top: 6px; }
}

.breath-circle {
  width: 180px; height: 180px;
  border-radius: 50%;
  border: 3px solid;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.9);
  margin-bottom: 32px;
  transition: all 0.3s ease-in-out;

  &__phase { font-size: 18px; color: #555; font-weight: 500; }
  &__timer { font-size: 48px; font-weight: 700; color: #2a2a3e; }
}

.breath-info {
  text-align: center; margin-bottom: 32px;
  &__round { font-size: 15px; color: #888; }
  &__guide { font-size: 13px; color: #bbb; margin-top: 4px; display: block; }
}

.breath-actions {
  display: flex; gap: 16px;
}
.breath-btn {
  height: 44px; border-radius: 22px; font-size: 14px; border: none; padding: 0 28px; line-height: 44px;
  &--pause { background: #e8e8f0; color: #555; }
  &--end { background: transparent; color: #e88b8b; border: 1px solid #e88b8b; }
  &--primary { background: linear-gradient(135deg, #7c6ff7, #5b4fcf); color: #fff; margin-top: 16px; width: 100%; text-align: center; }
  &--ghost { background: none; color: #999; margin-top: 8px; text-align: center; }
}

.done-card {
  text-align: center; padding: 32px 24px;
  &__emoji { font-size: 56px; display: block; margin-bottom: 12px; }
  &__title { font-size: 22px; font-weight: 700; color: #1a1a2e; display: block; }
  &__text { font-size: 14px; color: #888; margin-top: 6px; display: block; }
}

.done-mood {
  margin-top: 24px;
  &__label { font-size: 14px; color: #666; display: block; margin-bottom: 10px; }
  &__grid { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
}
.done-mood-chip {
  padding: 8px 14px; border-radius: 20px; border: 1.5px solid #e0e0e0; font-size: 13px;
  &--active { border-color: #7c6ff7; background: rgba(124,111,247,0.08); }
}
</style>
