<template>
  <view class="page-shell" :style="themeVars">
    <view class="page">
      <view class="page-header">
        <text class="page-header__title">情绪日记</text>
        <text class="page-header__subtitle">把今天的心情和感受温柔地记录下来</text>
      </view>

      <view v-if="loadingDetail" class="card">
        <text class="field__label">正在同步这一天的记录</text>
        <text class="page-header__subtitle">马上把之前写下的内容带回来。</text>
      </view>

      <view v-else-if="isEditMode" class="card">
        <text class="field__label">回看与编辑</text>
        <text class="picker">{{ form.recordDate }} 的记录已加载，可以继续补充或调整。</text>
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

      <button class="save-button" :loading="saving" @tap="submit">
        {{ isEditMode ? '更新这天的日记' : '保存今天的日记' }}
      </button>

      <view v-if="recentItems.length" class="card">
        <text class="field__label">最近几次记录</text>
        <view class="tag-grid">
          <view
            v-for="item in recentItems"
            :key="item.id"
            class="tag-chip"
            @tap="applyRecord(item)"
          >
            <text>{{ item.recordDate }} · {{ item.content || '已记录心情' }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';
import { computed, reactive, ref } from 'vue';
import { fetchMoodRecordDetail, saveMoodRecord } from '../../api/records';
import { useThemePreference } from '../../composables/useThemePreference';
import { getErrorMessage } from '../../services/errors';
import { usePageStateStore } from '../../stores/page-state';
import type { MoodJournalItem } from '../../types/records';

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
const loadingDetail = ref(false);
const currentRecordId = ref('');
const recentItems = ref<MoodJournalItem[]>([]);
const pageStateStore = usePageStateStore();

const moods: Array<{ label: string; value: MoodType; score: number }> = [
  { label: '平静', value: 'calm', score: 78 },
  { label: '低落', value: 'low', score: 42 },
  { label: '焦虑', value: 'anxious', score: 34 },
  { label: '愉悦', value: 'happy', score: 88 },
  { label: '疲惫', value: 'tired', score: 56 },
];

const tags = ['放松', '压力', '工作', '关系', '睡眠', '恢复', '呼吸', '自我照顾'];

const form = reactive<{
  recordId: string;
  recordDate: string;
  moodType: MoodType;
  moodScore: number;
  emotionTags: string[];
  content: string;
}>({
  recordId: '',
  recordDate: todayDate,
  moodType: 'calm',
  moodScore: 78,
  emotionTags: [],
  content: '',
});

const isEditMode = computed(() => Boolean(form.recordId));

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
      recordId: form.recordId || undefined,
      recordDate: form.recordDate,
      moodType: form.moodType,
      moodScore: form.moodScore,
      emotionTags: form.emotionTags,
      content: form.content,
    });
    pageStateStore.markDirty(['records', 'profile', 'home']);
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

function applyRecord(item: MoodJournalItem) {
  form.recordId = item.id;
  form.recordDate = item.recordDate;
  form.moodType = item.moodType;
  form.moodScore = item.moodScore;
  form.emotionTags = [...item.emotionTags];
  form.content = item.content;
}

async function loadDetail(input: { recordId?: string; recordDate?: string }) {
  if (!input.recordId && !input.recordDate) {
    return;
  }

  try {
    loadingDetail.value = true;
    const response = await fetchMoodRecordDetail(input);
    if (response.data.item) {
      currentRecordId.value = response.data.item.id;
      applyRecord(response.data.item);
    }
    recentItems.value = response.data.recentItems;
  } catch (error) {
    console.warn('load mood detail failed', error);
    uni.showToast({
      title: getErrorMessage(error, '记录读取失败'),
      icon: 'none',
    });
  } finally {
    loadingDetail.value = false;
  }
}

onLoad((options) => {
  let shouldLoadDetail = false;

  if (typeof options?.recordId === 'string' && options.recordId) {
    form.recordId = decodeURIComponent(options.recordId);
    shouldLoadDetail = true;
  }
  if (typeof options?.recordDate === 'string' && options.recordDate) {
    form.recordDate = decodeURIComponent(options.recordDate);
    shouldLoadDetail = true;
  }

  if (shouldLoadDetail) {
    void loadDetail({
      recordId: form.recordId || undefined,
      recordDate: form.recordDate || undefined,
    });
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
