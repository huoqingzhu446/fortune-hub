<template>
  <view class="page" :style="themeVars">
    <view class="panel">
      <text class="eyebrow">feedback</text>
      <text class="title">意见反馈</text>
      <text class="summary">反馈会同步到服务端，后台可以跟进处理；网络异常时会先保留一份本地副本。</text>
    </view>

    <view class="panel">
      <text class="section-title">写点什么</text>
      <picker :range="categoryLabels" :value="categoryIndex" @change="changeCategory">
        <view class="input input--picker">{{ activeCategory.label }}</view>
      </picker>
      <textarea v-model="message" class="textarea" placeholder="例如：幸运壁纸想增加更多主题，或者某个页面在 H5 下报错。" />
      <input v-model="contact" class="input" placeholder="联系方式（可选）" />
      <button class="hero-button hero-button--primary" :loading="submitting" @tap="submitFeedbackForm">提交反馈</button>
    </view>

    <view class="panel">
      <text class="section-title">最近反馈</text>
      <view v-if="history.length" class="history-list">
        <view v-for="item in history" :key="item.id" class="history-card">
          <text class="history-card__time">{{ formatDateTime(item.createdAt) }}</text>
          <text class="history-card__message">{{ item.message }}</text>
          <text v-if="item.contact" class="history-card__contact">联系方式：{{ item.contact }}</text>
        </view>
      </view>
      <view v-else class="empty-card">
        <text class="empty-card__text">还没有反馈记录。</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import {
  fetchMyFeedback,
  fetchSettings,
  submitFeedback,
} from '../../../api/settings';
import { useThemePreference } from '../../../composables/useThemePreference';
import { getErrorMessage, handleAuthExpired } from '../../../services/errors';
import { appendFeedbackEntry, getFeedbackHistory } from '../../../services/preferences';
import { getAuthToken } from '../../../services/session';
import type { FeedbackItem } from '../../../types/settings';

const message = ref('');
const contact = ref('');
const history = ref<Array<FeedbackItem | ReturnType<typeof appendFeedbackEntry>>>(getFeedbackHistory());
const categories = ref([
  { label: '功能建议', value: 'feature' },
  { label: '问题反馈', value: 'bug' },
  { label: '内容纠错', value: 'content' },
  { label: '其他', value: 'general' },
]);
const categoryIndex = ref(0);
const submitting = ref(false);
const { themeVars } = useThemePreference();

const categoryLabels = computed(() => categories.value.map((item) => item.label));
const activeCategory = computed(() => categories.value[categoryIndex.value] ?? categories.value[0]);

function changeCategory(event: Event | { detail?: { value?: number } }) {
  const nextValue = Number((event as { detail?: { value?: number } }).detail?.value ?? 0);
  categoryIndex.value = Number.isFinite(nextValue) ? nextValue : 0;
}

async function loadFeedbackContext() {
  try {
    const settingsResponse = await fetchSettings();
    categories.value = settingsResponse.data.settings.feedbackCategories.length
      ? settingsResponse.data.settings.feedbackCategories
      : categories.value;
  } catch (error) {
    console.warn('load feedback settings failed', error);
  }

  if (!getAuthToken()) {
    history.value = getFeedbackHistory();
    return;
  }

  try {
    const response = await fetchMyFeedback();
    history.value = response.data.items;
  } catch (error) {
    if (handleAuthExpired(error, true)) {
      history.value = getFeedbackHistory();
      return;
    }
    console.warn('load feedback history failed', error);
  }
}

async function submitFeedbackForm() {
  if (!message.value.trim()) {
    uni.showToast({
      title: '先写一点反馈内容',
      icon: 'none',
    });
    return;
  }

  try {
    submitting.value = true;
    const systemInfo = uni.getSystemInfoSync() as unknown as Record<string, unknown>;
    const response = await submitFeedback({
      message: message.value.trim(),
      contact: contact.value.trim(),
      category: activeCategory.value.value,
      source: 'mobile',
      clientInfo: {
        platform: systemInfo.platform,
        system: systemInfo.system,
        uniPlatform: systemInfo.uniPlatform,
      },
    });
    history.value = [response.data.item, ...history.value].slice(0, 20);
    message.value = '';
    contact.value = '';
    uni.showToast({
      title: '反馈已提交',
      icon: 'success',
    });
  } catch (error) {
    console.warn('submit feedback failed', error);
    appendFeedbackEntry({
      message: message.value.trim(),
      contact: contact.value.trim(),
    });
    history.value = getFeedbackHistory();
    uni.showToast({
      title: getErrorMessage(error, '已先保存到本地'),
      icon: 'none',
    });
  } finally {
    submitting.value = false;
  }
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hour = `${date.getHours()}`.padStart(2, '0');
  const minute = `${date.getMinutes()}`.padStart(2, '0');
  return `${month}-${day} ${hour}:${minute}`;
}

onShow(() => {
  void loadFeedbackContext();
});
</script>

<style lang="scss">
.page {
  min-height: 100vh;
  padding: 24rpx;
  background:
    radial-gradient(circle at top left, var(--theme-glow), transparent 30%),
    linear-gradient(180deg, var(--theme-page-top) 0%, var(--theme-page-bottom) 100%);
}

.panel {
  display: grid;
  gap: 18rpx;
  margin-bottom: 20rpx;
  padding: 28rpx;
  border-radius: 32rpx;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: var(--apple-shadow);
}

.eyebrow {
  font-size: 20rpx;
  text-transform: uppercase;
  letter-spacing: 0.28em;
  color: var(--apple-subtle);
}

.title,
.section-title {
  font-size: 36rpx;
  font-weight: 700;
  color: var(--apple-text);
}

.summary,
.history-card__message,
.history-card__contact,
.empty-card__text {
  font-size: 26rpx;
  line-height: 1.7;
  color: var(--apple-muted);
}

.textarea,
.input {
  width: 100%;
  min-height: 120rpx;
  padding: 22rpx 24rpx;
  border-radius: 24rpx;
  background: rgba(246, 249, 252, 0.92);
  color: var(--apple-text);
}

.input {
  min-height: 88rpx;
}

.input--picker {
  min-height: 88rpx;
  line-height: 44rpx;
}

.hero-button {
  min-height: 82rpx;
  border-radius: 999rpx;
  line-height: 82rpx;
  font-size: 28rpx;
  color: #ffffff;
  background: linear-gradient(135deg, var(--apple-blue) 0%, #7ba7ff 100%);
}

.hero-button::after {
  border: none;
}

.history-list {
  display: grid;
  gap: 16rpx;
}

.history-card,
.empty-card {
  display: grid;
  gap: 10rpx;
  padding: 22rpx;
  border-radius: 24rpx;
  background: rgba(246, 249, 252, 0.92);
}

.history-card__time {
  font-size: 22rpx;
  color: var(--apple-subtle);
}
</style>
