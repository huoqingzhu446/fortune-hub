<template>
  <view class="pulse-card" v-if="visible">
    <view v-if="!submitted && isLoggedIn" class="pulse-entry">
      <view class="pulse-card__header">
        <view class="pulse-card__heading">
          <text class="pulse-card__eyebrow">此刻状态</text>
          <text class="pulse-card__title">今天感觉怎么样？</text>
        </view>
        <text class="pulse-card__streak" v-if="streak > 1">连签 {{ streak }} 天</text>
      </view>

      <view class="pulse-mood-rail">
        <view
          v-for="item in moodOptions"
          :key="item.value"
          class="pulse-mood-chip"
          :class="{ 'pulse-mood-chip--active': selectedMood === item.value }"
          @tap="selectMood(item.value)"
        >
          <view class="pulse-mood-chip__icon">
            <text class="pulse-mood-chip__mark">{{ item.mark }}</text>
          </view>
          <text class="pulse-mood-chip__label">{{ item.label }}</text>
        </view>
      </view>

      <view v-if="selectedMood" class="pulse-action-row">
        <view class="pulse-intensity">
          <view class="pulse-intensity__head">
            <text class="pulse-intensity__label">{{ intensityLabel }}</text>
            <text class="pulse-intensity__value">{{ intensity }}/5</text>
          </view>
          <view class="pulse-intensity__track">
            <view
              v-for="i in 5"
              :key="i"
              class="pulse-intensity__step"
              :class="{ 'pulse-intensity__step--active': i <= intensity }"
              @tap="intensity = i"
            >
              <view class="pulse-intensity__bar"></view>
            </view>
          </view>
        </view>

        <button
          class="pulse-submit"
          :loading="saving"
          @tap="submitPulse"
        >
          记录此刻
        </button>
      </view>

      <view v-else class="pulse-prompt">
        <text class="pulse-prompt__text">选择一个心绪，给今日建议加一点当下参考。</text>
      </view>
    </view>

    <view v-else-if="submitted" class="pulse-response">
      <view class="pulse-response__seal">
        <text class="pulse-response__seal-text">已</text>
      </view>
      <view class="pulse-response__copy">
        <text class="pulse-response__greeting">{{ responseText }}</text>
        <text class="pulse-response__streak" v-if="streak > 1">
          连续记录 {{ streak }} 天
        </text>
      </view>
    </view>

    <view v-else class="pulse-login">
      <view class="pulse-login__copy">
        <text class="pulse-login__title">记录今日心绪</text>
        <text class="pulse-login__text">登录后同步每日状态与气运建议。</text>
      </view>
      <button class="pulse-login__btn" @tap="goProfile">去登录</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { saveDailyPulse, fetchPulseStreak } from '../api/pulse';
import { getAuthToken } from '../services/session';

const moodOptions = [
  { value: 'happy', mark: '晴', label: '不错' },
  { value: 'neutral', mark: '平', label: '一般' },
  { value: 'low', mark: '沉', label: '低落' },
  { value: 'anxious', mark: '紧', label: '焦虑' },
  { value: 'irritable', mark: '躁', label: '烦躁' },
];

const visible = ref(true);
const isLoggedIn = ref(!!getAuthToken());
const selectedMood = ref('');
const intensity = ref(3);
const saving = ref(false);
const submitted = ref(false);
const responseText = ref('');
const streak = ref(0);

const selectedMoodOption = computed(() =>
  moodOptions.find((item) => item.value === selectedMood.value),
);

const intensityLabel = computed(() =>
  selectedMoodOption.value ? `${selectedMoodOption.value.label}强度` : '感受强度',
);

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
  if (!isLoggedIn.value) {
    goProfile();
    return;
  }

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
  position: relative;
  box-sizing: border-box;
  margin: 0 32rpx 28rpx;
  padding: 30rpx;
  overflow: hidden;
  border-radius: 40rpx;
  color: var(--theme-text-primary);
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.52)),
    linear-gradient(180deg, rgba(var(--theme-primary-rgb), 0.06), rgba(var(--theme-accent-rgb), 0.04));
  border: 1rpx solid rgba(255, 255, 255, 0.76);
  box-shadow:
    0 22rpx 56rpx rgba(var(--theme-text-primary-rgb), 0.075),
    0 1rpx 0 rgba(255, 255, 255, 0.84) inset,
    0 0 0 1rpx rgba(var(--theme-primary-rgb), 0.055) inset;
  backdrop-filter: blur(18rpx);
  animation: pulseCardIn 460ms ease 70ms both;
}

.pulse-card::before {
  content: '';
  position: absolute;
  left: 28rpx;
  right: 28rpx;
  top: 0;
  height: 1rpx;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(var(--theme-primary-rgb), 0.28), rgba(255, 255, 255, 0));
  pointer-events: none;
}

.pulse-entry,
.pulse-response,
.pulse-login {
  position: relative;
  z-index: 1;
}

.pulse-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
  margin-bottom: 24rpx;
}

.pulse-card__heading {
  display: grid;
  gap: 7rpx;
  min-width: 0;
}

.pulse-card__eyebrow {
  font-size: 21rpx;
  line-height: 1.2;
  color: rgba(var(--theme-primary-rgb), 0.78);
  letter-spacing: 0.08em;
}

.pulse-card__title {
  font-size: 32rpx;
  line-height: 1.34;
  font-weight: 600;
  color: rgba(var(--theme-text-primary-rgb), 0.84);
}

.pulse-card__streak {
  flex: 0 0 auto;
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  font-size: 21rpx;
  line-height: 1.2;
  color: rgba(var(--theme-primary-rgb), 0.86);
  background: rgba(var(--theme-primary-rgb), 0.08);
  border: 1rpx solid rgba(var(--theme-primary-rgb), 0.12);
}

.pulse-mood-rail {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  overflow: hidden;
  border-radius: 30rpx;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0.46)),
    rgba(var(--theme-primary-rgb), 0.035);
  border: 1rpx solid rgba(var(--theme-primary-rgb), 0.095);
  box-shadow: 0 12rpx 30rpx rgba(var(--theme-text-primary-rgb), 0.04) inset;
}

.pulse-mood-chip {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 8rpx;
  min-width: 0;
  padding: 18rpx 4rpx 16rpx;
  transition:
    background 180ms ease,
    color 180ms ease;
}

.pulse-mood-chip + .pulse-mood-chip {
  border-left: 1rpx solid rgba(var(--theme-text-secondary-rgb), 0.09);
}

.pulse-mood-chip__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52rpx;
  height: 52rpx;
  border-radius: 50%;
  background: rgba(var(--theme-primary-rgb), 0.075);
  border: 1rpx solid rgba(var(--theme-primary-rgb), 0.11);
  transition:
    transform 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease;
}

.pulse-mood-chip__mark {
  font-size: 23rpx;
  line-height: 1;
  font-weight: 600;
  color: rgba(var(--theme-primary-rgb), 0.72);
}

.pulse-mood-chip__label {
  max-width: 100%;
  overflow: hidden;
  font-size: 22rpx;
  line-height: 1.25;
  color: rgba(var(--theme-text-secondary-rgb), 0.78);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pulse-mood-chip--active {
  background: rgba(var(--theme-primary-rgb), 0.07);
}

.pulse-mood-chip--active .pulse-mood-chip__icon {
  background: linear-gradient(145deg, var(--theme-primary), var(--theme-accent));
  border-color: rgba(255, 255, 255, 0.72);
  box-shadow: 0 12rpx 28rpx rgba(var(--theme-primary-rgb), 0.22);
  transform: translateY(-2rpx);
}

.pulse-mood-chip--active .pulse-mood-chip__mark {
  color: #fff;
}

.pulse-mood-chip--active .pulse-mood-chip__label {
  color: rgba(var(--theme-primary-rgb), 0.92);
  font-weight: 600;
}

.pulse-action-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14rpx;
  align-items: center;
  margin-top: 24rpx;
  padding-top: 24rpx;
  border-top: 1rpx solid rgba(var(--theme-text-secondary-rgb), 0.1);
}

.pulse-intensity {
  min-width: 0;
}

.pulse-intensity__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
  margin-bottom: 6rpx;
}

.pulse-intensity__label,
.pulse-intensity__value {
  font-size: 22rpx;
  line-height: 1.3;
}

.pulse-intensity__label {
  color: rgba(var(--theme-text-secondary-rgb), 0.72);
}

.pulse-intensity__value {
  flex: 0 0 auto;
  color: rgba(var(--theme-primary-rgb), 0.82);
  font-weight: 600;
}

.pulse-intensity__track {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10rpx;
}

.pulse-intensity__step {
  padding: 12rpx 0;
}

.pulse-intensity__bar {
  height: 8rpx;
  border-radius: 999rpx;
  background: rgba(var(--theme-text-secondary-rgb), 0.16);
  transition:
    background 180ms ease,
    box-shadow 180ms ease,
    transform 180ms ease;
}

.pulse-intensity__step--active .pulse-intensity__bar {
  background: linear-gradient(90deg, var(--theme-primary), var(--theme-accent));
  box-shadow: 0 6rpx 14rpx rgba(var(--theme-primary-rgb), 0.18);
  transform: scaleY(1.18);
}

.pulse-submit,
.pulse-login__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 999rpx;
  color: #fff;
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-accent));
  box-shadow: 0 14rpx 30rpx rgba(var(--theme-primary-rgb), 0.2);
}

.pulse-submit::after,
.pulse-login__btn::after {
  border: 0;
}

.pulse-submit {
  width: 100%;
  height: 76rpx;
  font-size: 25rpx;
  line-height: 76rpx;
  font-weight: 600;
}

.pulse-prompt {
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid rgba(var(--theme-text-secondary-rgb), 0.1);
}

.pulse-prompt__text {
  font-size: 23rpx;
  line-height: 1.55;
  color: rgba(var(--theme-text-secondary-rgb), 0.78);
}

.pulse-response {
  display: grid;
  grid-template-columns: 62rpx minmax(0, 1fr);
  gap: 18rpx;
  align-items: center;
  min-height: 104rpx;
}

.pulse-response__seal {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 62rpx;
  height: 62rpx;
  border-radius: 50%;
  background: linear-gradient(145deg, rgba(var(--theme-primary-rgb), 0.16), rgba(var(--theme-accent-rgb), 0.12));
  border: 1rpx solid rgba(var(--theme-primary-rgb), 0.12);
}

.pulse-response__seal-text {
  font-size: 25rpx;
  font-weight: 600;
  color: rgba(var(--theme-primary-rgb), 0.84);
}

.pulse-response__copy {
  display: grid;
  gap: 8rpx;
  min-width: 0;
}

.pulse-response__greeting {
  display: block;
  font-size: 27rpx;
  line-height: 1.5;
  font-weight: 600;
  color: rgba(var(--theme-text-primary-rgb), 0.84);
}

.pulse-response__streak {
  display: block;
  font-size: 22rpx;
  line-height: 1.35;
  color: rgba(var(--theme-primary-rgb), 0.78);
}

.pulse-login {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 150rpx;
  gap: 22rpx;
  align-items: center;
  min-height: 108rpx;
}

.pulse-login__copy {
  display: grid;
  gap: 8rpx;
  min-width: 0;
}

.pulse-login__title {
  font-size: 30rpx;
  line-height: 1.35;
  font-weight: 600;
  color: rgba(var(--theme-text-primary-rgb), 0.84);
}

.pulse-login__text {
  font-size: 23rpx;
  line-height: 1.5;
  color: rgba(var(--theme-text-secondary-rgb), 0.78);
}

.pulse-login__btn {
  width: 150rpx;
  height: 68rpx;
  font-size: 24rpx;
  line-height: 68rpx;
  font-weight: 600;
}

@keyframes pulseCardIn {
  from {
    opacity: 0;
    transform: translateY(18rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 360px) {
  .pulse-card {
    margin-right: 26rpx;
    margin-left: 26rpx;
    padding: 26rpx;
    border-radius: 36rpx;
  }

  .pulse-card__title {
    font-size: 30rpx;
  }

  .pulse-mood-chip__icon {
    width: 48rpx;
    height: 48rpx;
  }

}
</style>
