<template>
  <view class="page-shell" :style="themeVars">
    <view class="page">
      <view class="page-header">
        <text class="page-header__title">情绪日记</text>
        <text class="page-header__subtitle">把今天的心情和感受温柔地记录下来</text>
      </view>

      <view class="card">
        <text class="field__label">记录日期</text>
        <picker mode="date" :value="form.recordDate" :end="todayDate" @change="handleDateChange">
          <view class="picker">{{ form.recordDate }}</view>
        </picker>
      </view>

      <view class="card">
        <text class="field__label">今天的情绪</text>
        <view class="mood-grid">
          <view
            v-for="item in moods"
            :key="item.value"
            class="mood-chip"
            :class="{ 'mood-chip--active': form.moodType === item.value }"
            @tap="selectMood(item.value, item.score)"
          >
            <text>{{ item.label }}</text>
          </view>
        </view>
      </view>

      <view class="card">
        <text class="field__label">情绪标签</text>
        <view class="tag-grid">
          <view
            v-for="tag in tags"
            :key="tag"
            class="tag-chip"
            :class="{ 'tag-chip--active': form.emotionTags.includes(tag) }"
            @tap="toggleTag(tag)"
          >
            <text>{{ tag }}</text>
          </view>
        </view>
      </view>

      <view class="card">
        <text class="field__label">想说的话</text>
        <textarea
          v-model="form.content"
          class="textarea"
          maxlength="500"
          placeholder="写下一点此刻的心情、触发点，或者今天想给自己的话。"
        />
      </view>

      <button class="save-button" :loading="saving" @tap="submit">保存今天的日记</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';
import { reactive, ref } from 'vue';
import { saveMoodRecord } from '../../api/records';
import { useThemePreference } from '../../composables/useThemePreference';
import { getErrorMessage } from '../../services/errors';

type MoodType = 'calm' | 'low' | 'anxious' | 'happy' | 'tired';

function buildLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const { themeVars } = useThemePreference();
const todayDate = buildLocalDateString();
const saving = ref(false);

const moods: Array<{ label: string; value: MoodType; score: number }> = [
  { label: '平静', value: 'calm', score: 78 },
  { label: '低落', value: 'low', score: 42 },
  { label: '焦虑', value: 'anxious', score: 34 },
  { label: '愉悦', value: 'happy', score: 88 },
  { label: '疲惫', value: 'tired', score: 56 },
];

const tags = ['放松', '压力', '工作', '关系', '睡眠', '恢复', '呼吸', '自我照顾'];

const form = reactive<{
  recordDate: string;
  moodType: MoodType;
  moodScore: number;
  emotionTags: string[];
  content: string;
}>({
  recordDate: todayDate,
  moodType: 'calm',
  moodScore: 78,
  emotionTags: [],
  content: '',
});

function handleDateChange(event: { detail: { value: string } }) {
  form.recordDate = event.detail.value;
}

function selectMood(moodType: MoodType, score: number) {
  form.moodType = moodType;
  form.moodScore = score;
}

function toggleTag(tag: string) {
  form.emotionTags = form.emotionTags.includes(tag)
    ? form.emotionTags.filter((item) => item !== tag)
    : [...form.emotionTags, tag];
}

async function submit() {
  try {
    saving.value = true;
    await saveMoodRecord({
      recordDate: form.recordDate,
      moodType: form.moodType,
      moodScore: form.moodScore,
      emotionTags: form.emotionTags,
      content: form.content,
    });
    uni.showToast({
      title: '日记已保存',
      icon: 'success',
    });
    setTimeout(() => {
      uni.navigateBack({
        delta: 1,
      });
    }, 300);
  } catch (error) {
    console.warn('save mood record failed', error);
    uni.showToast({
      title: getErrorMessage(error, '保存失败'),
      icon: 'none',
    });
  } finally {
    saving.value = false;
  }
}

onLoad((options) => {
  if (typeof options?.recordDate === 'string' && options.recordDate) {
    form.recordDate = decodeURIComponent(options.recordDate);
  }
});
</script>

<style lang="scss">
.page-shell {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, var(--theme-glow), transparent 34%),
    linear-gradient(180deg, var(--theme-page-top) 0%, var(--theme-page-bottom) 100%);
}

.page {
  min-height: 100vh;
  padding: 28rpx 24rpx 40rpx;
}

.page-header,
.card {
  margin-bottom: 20rpx;
}

.page-header__title {
  display: block;
  font-size: 60rpx;
  color: var(--theme-text-primary);
}

.page-header__subtitle,
.field__label {
  font-size: 24rpx;
  line-height: 1.7;
  color: var(--theme-text-secondary);
}

.card {
  display: grid;
  gap: 16rpx;
  padding: 24rpx;
  border-radius: 28rpx;
  border: 1rpx solid var(--theme-border);
  background: var(--theme-surface);
  box-shadow: var(--theme-shadow-soft);
}

.picker,
.textarea {
  padding: 18rpx 20rpx;
  border-radius: 20rpx;
  background: var(--theme-surface-muted);
  font-size: 26rpx;
  color: var(--theme-text-primary);
}

.mood-grid,
.tag-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.mood-chip,
.tag-chip {
  padding: 14rpx 20rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  color: var(--theme-text-secondary);
  background: var(--theme-surface-muted);
}

.mood-chip--active,
.tag-chip--active {
  color: #ffffff;
  background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-accent) 100%);
}

.textarea {
  min-height: 220rpx;
  width: 100%;
  box-sizing: border-box;
}

.save-button {
  min-height: 82rpx;
  border-radius: 999rpx;
  font-size: 28rpx;
  color: #ffffff;
  background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-accent) 100%);
}

.save-button::after {
  border: none;
}
</style>
