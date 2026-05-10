<template>
  <view class="pulse-card" v-if="visible">
    <view class="pulse-card__header" v-if="!submitted">
      <text class="pulse-card__title">今天感觉怎么样？</text>
      <text class="pulse-card__streak" v-if="streak > 1">🔥 连续 {{ streak }} 天</text>
    </view>

    <!-- Mood Selection -->
    <view v-if="!submitted" class="pulse-mood-grid">
      <view
        v-for="item in moodOptions"
        :key="item.value"
        class="pulse-mood-chip"
        :class="{ 'pulse-mood-chip--active': selectedMood === item.value }"
        @tap="selectMood(item.value)"
      >
        <text class="pulse-mood-chip__emoji">{{ item.emoji }}</text>
        <text class="pulse-mood-chip__label">{{ item.label }}</text>
      </view>
    </view>

    <!-- Intensity Slider -->
    <view v-if="!submitted && selectedMood" class="pulse-intensity">
      <text class="pulse-intensity__label">
        {{ intensityLabel }}
      </text>
      <view class="pulse-intensity__track">
        <view
          v-for="i in 5"
          :key="i"
          class="pulse-intensity__dot"
          :class="{ 'pulse-intensity__dot--active': i <= intensity }"
          @tap="intensity = i"
        ></view>
      </view>
    </view>

    <!-- Submit -->
    <button
      v-if="!submitted && selectedMood"
      class="pulse-submit"
      :loading="saving"
      @tap="submitPulse"
    >
      记录此刻
    </button>

    <!-- Submitted State -->
    <view v-if="submitted" class="pulse-response">
      <text class="pulse-response__greeting">{{ responseText }}</text>
      <text class="pulse-response__streak" v-if="streak > 1">
        ✨ 你已经连续签到 {{ streak }} 天了
      </text>
    </view>

    <!-- Login Required -->
    <view v-if="!isLoggedIn" class="pulse-login">
      <text class="pulse-login__text">登录后记录每日心情</text>
      <button class="pulse-login__btn" @tap="goProfile">去登录</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { saveDailyPulse, fetchPulseStreak } from '../api/pulse';
import { getAuthToken } from '../services/session';

const moodOptions = [
  { value: 'happy', emoji: '😊', label: '不错' },
  { value: 'neutral', emoji: '😐', label: '一般' },
  { value: 'low', emoji: '😔', label: '低落' },
  { value: 'anxious', emoji: '😰', label: '焦虑' },
  { value: 'irritable', emoji: '😤', label: '烦躁' },
];

const visible = ref(true);
const isLoggedIn = ref(false);
const selectedMood = ref('');
const intensity = ref(3);
const saving = ref(false);
const submitted = ref(false);
const responseText = ref('');
const streak = ref(0);

const intensityLabel = ref('感受强度');

onMounted(async () => {
  isLoggedIn.value = !!getAuthToken();
  if (isLoggedIn.value) {
    try {
      const res = await fetchPulseStreak();
      streak.value = res.data.streak;
    } catch {
      // silently fail
    }
  }
});

function selectMood(mood: string) {
  selectedMood.value = mood;
  intensity.value = 3;
}

async function submitPulse() {
  if (saving.value) return;
  saving.value = true;
  try {
    const res = await saveDailyPulse({
      mood: selectedMood.value,
      intensity: intensity.value,
    });
    responseText.value = res.data.response;
    streak.value = res.data.streak;
    submitted.value = true;
  } catch {
    // silently fail
  } finally {
    saving.value = false;
  }
}

function goProfile() {
  uni.navigateTo({ url: '/pages/profile/index' });
}
</script>

<style scoped lang="scss">
.pulse-card {
  margin: 16px 16px 0;
  padding: 20px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);
}

.pulse-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.pulse-card__title {
  font-size: 17px;
  font-weight: 600;
  color: #1a1a2e;
}

.pulse-card__streak {
  font-size: 13px;
  color: #f0a040;
  font-weight: 500;
}

.pulse-mood-grid {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.pulse-mood-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 8px;
  border-radius: 12px;
  border: 1.5px solid #e8e8e8;
  transition: all 0.2s;
  min-width: 56px;

  &--active {
    border-color: #7c6ff7;
    background: rgba(124, 111, 247, 0.08);
  }
}

.pulse-mood-chip__emoji {
  font-size: 26px;
}

.pulse-mood-chip__label {
  font-size: 12px;
  color: #666;
}

.pulse-intensity {
  margin-top: 16px;
  text-align: center;
}

.pulse-intensity__label {
  font-size: 13px;
  color: #999;
  display: block;
  margin-bottom: 10px;
}

.pulse-intensity__track {
  display: flex;
  justify-content: center;
  gap: 18px;
}

.pulse-intensity__dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #e0e0e0;
  transition: all 0.2s;

  &--active {
    background: #7c6ff7;
    transform: scale(1.3);
  }
}

.pulse-submit {
  margin-top: 16px;
  width: 100%;
  height: 42px;
  line-height: 42px;
  border-radius: 21px;
  background: linear-gradient(135deg, #7c6ff7, #5b4fcf);
  color: #fff;
  font-size: 15px;
  font-weight: 500;
  border: none;
  text-align: center;
}

.pulse-response {
  text-align: center;
  padding: 8px 0;
}

.pulse-response__greeting {
  font-size: 16px;
  color: #2a2a3e;
  font-weight: 500;
  display: block;
}

.pulse-response__streak {
  font-size: 13px;
  color: #f0a040;
  margin-top: 6px;
  display: block;
}

.pulse-login {
  text-align: center;
}

.pulse-login__text {
  font-size: 14px;
  color: #999;
  display: block;
  margin-bottom: 8px;
}

.pulse-login__btn {
  display: inline-block;
  font-size: 14px;
  color: #7c6ff7;
  background: none;
  border: none;
  padding: 0;
}
</style>
