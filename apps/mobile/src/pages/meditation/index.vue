<template>
  <view class="page-shell" :style="themeVars">
    <view class="page">
      <view class="page-header">
        <text class="page-header__title">冥想记录</text>
        <text class="page-header__subtitle">把一次放松练习安静地留在今天的记录里</text>
      </view>

      <view class="card">
        <text class="field__label">记录日期</text>
        <picker mode="date" :value="form.recordDate" :end="todayDate" @change="handleDateChange">
          <view class="picker">{{ form.recordDate }}</view>
        </picker>
      </view>

      <view class="card">
        <text class="field__label">练习标题</text>
        <input v-model="form.title" class="picker" placeholder="例如：睡前呼吸练习" />
      </view>

      <view class="card">
        <text class="field__label">分类</text>
        <view class="tag-grid">
          <view
            v-for="item in categories"
            :key="item"
            class="tag-chip"
            :class="{ 'tag-chip--active': form.category === item }"
            @tap="form.category = item"
          >
            <text>{{ item }}</text>
          </view>
        </view>
      </view>

      <view class="card">
        <text class="field__label">练习时长</text>
        <slider
          :value="form.durationMinutes"
          :min="1"
          :max="60"
          activeColor="var(--theme-primary)"
          backgroundColor="rgba(174,180,189,0.24)"
          @change="handleDurationChange"
        />
        <text class="duration-text">{{ form.durationMinutes }} 分钟</text>
      </view>

      <view class="card">
        <text class="field__label">一句备注</text>
        <textarea
          v-model="form.summary"
          class="textarea"
          maxlength="200"
          placeholder="例如：今晚比昨天更容易放松下来。"
        />
      </view>

      <button class="save-button" :loading="saving" @tap="submit">保存这次练习</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';
import { reactive, ref } from 'vue';
import { saveMeditationRecord } from '../../api/records';
import { useThemePreference } from '../../composables/useThemePreference';
import { getErrorMessage } from '../../services/errors';

function buildLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const { themeVars } = useThemePreference();
const todayDate = buildLocalDateString();
const saving = ref(false);
const categories = ['meditation', 'sleep', 'breath', 'focus'];

const form = reactive({
  recordDate: todayDate,
  title: '呼吸放松练习',
  category: 'meditation',
  durationMinutes: 8,
  summary: '',
});

function handleDateChange(event: { detail: { value: string } }) {
  form.recordDate = event.detail.value;
}

function handleDurationChange(event: { detail: { value: number } }) {
  form.durationMinutes = Number(event.detail.value);
}

async function submit() {
  try {
    saving.value = true;
    await saveMeditationRecord({
      recordDate: form.recordDate,
      title: form.title,
      category: form.category,
      durationMinutes: form.durationMinutes,
      completed: true,
      summary: form.summary,
    });
    uni.showToast({
      title: '练习已记录',
      icon: 'success',
    });
    setTimeout(() => {
      uni.navigateBack({
        delta: 1,
      });
    }, 300);
  } catch (error) {
    console.warn('save meditation record failed', error);
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
.field__label,
.duration-text {
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

.tag-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.tag-chip {
  padding: 14rpx 20rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  color: var(--theme-text-secondary);
  background: var(--theme-surface-muted);
}

.tag-chip--active {
  color: #ffffff;
  background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-accent) 100%);
}

.textarea {
  min-height: 180rpx;
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
