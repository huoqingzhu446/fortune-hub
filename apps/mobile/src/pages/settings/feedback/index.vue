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
      <view class="attachment-section">
        <view class="attachment-head">
          <text class="attachment-title">附件（可选）</text>
          <button
            class="attachment-button"
            size="mini"
            :loading="uploadingAttachment"
            :disabled="uploadingAttachment || attachments.length >= 5"
            @tap="chooseAttachments"
          >
            添加图片
          </button>
        </view>
        <view v-if="attachments.length" class="attachment-list">
          <view v-for="(item, index) in attachments" :key="item.url" class="attachment-item">
            <image
              v-if="isImageAttachment(item)"
              class="attachment-image"
              :src="item.url"
              mode="aspectFill"
              @tap="previewAttachment(index)"
            />
            <view v-else class="attachment-file">
              <text class="attachment-file__name">{{ item.originalName || item.fileName }}</text>
            </view>
            <button class="attachment-remove" size="mini" @tap="removeAttachment(index)">移除</button>
          </view>
        </view>
        <text class="attachment-hint">最多 5 张截图，提交后客服可在后台查看。</text>
      </view>
      <button class="hero-button hero-button--primary" :loading="submitting" @tap="submitFeedbackForm">提交反馈</button>
    </view>

    <view class="panel">
      <text class="section-title">最近反馈</text>
      <view v-if="history.length" class="history-list">
        <view v-for="item in history" :key="item.id" class="history-card">
          <view class="history-card__head">
            <text class="history-card__time">{{ formatDateTime(item.createdAt) }}</text>
            <text class="history-card__status">{{ formatStatus(resolveFeedbackStatus(item)) }}</text>
          </view>
          <text class="history-card__message">{{ item.message }}</text>
          <text v-if="item.contact" class="history-card__contact">联系方式：{{ item.contact }}</text>
          <text v-if="resolveAttachmentCount(item)" class="history-card__contact">
            附件：{{ resolveAttachmentCount(item) }} 个
          </text>
          <view v-if="'adminReply' in item && item.adminReply" class="reply-card">
            <text class="reply-card__label">后台回复</text>
            <text class="reply-card__text">{{ item.adminReply }}</text>
          </view>
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
  uploadFeedbackAttachment,
} from '../../../api/settings';
import { subscribeNotification } from '../../../api/notifications';
import { useThemePreference } from '../../../composables/useThemePreference';
import { getErrorMessage, handleAuthExpired } from '../../../services/errors';
import { appendFeedbackEntry, getFeedbackHistory } from '../../../services/preferences';
import { getAuthToken } from '../../../services/session';
import type { FeedbackAttachment, FeedbackItem } from '../../../types/settings';

const message = ref('');
const contact = ref('');
const attachments = ref<FeedbackAttachment[]>([]);
const history = ref<Array<FeedbackItem | ReturnType<typeof appendFeedbackEntry>>>(getFeedbackHistory());
const categories = ref([
  { label: '功能建议', value: 'feature' },
  { label: '问题反馈', value: 'bug' },
  { label: '内容纠错', value: 'content' },
  { label: '其他', value: 'general' },
]);
const categoryIndex = ref(0);
const submitting = ref(false);
const uploadingAttachment = ref(false);
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
    const subscriptionPromise = requestFeedbackReplySubscription();
    const systemInfo = uni.getSystemInfoSync() as unknown as Record<string, unknown>;
    const response = await submitFeedback({
      message: message.value.trim(),
      contact: contact.value.trim(),
      category: activeCategory.value.value,
      source: 'mobile',
      attachments: attachments.value.length ? attachments.value : undefined,
      clientInfo: {
        platform: systemInfo.platform,
        system: systemInfo.system,
        uniPlatform: systemInfo.uniPlatform,
      },
    });
    void subscriptionPromise;
    history.value = [response.data.item, ...history.value].slice(0, 20);
    message.value = '';
    contact.value = '';
    attachments.value = [];
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

async function chooseAttachments() {
  const remaining = 5 - attachments.value.length;

  if (remaining <= 0) {
    uni.showToast({
      title: '最多上传 5 个附件',
      icon: 'none',
    });
    return;
  }

  try {
    uploadingAttachment.value = true;
    const filePaths = await chooseImagePaths(remaining);

    for (const filePath of filePaths) {
      const response = await uploadFeedbackAttachment(filePath);
      attachments.value = [...attachments.value, response.data.item].slice(0, 5);
    }

    if (filePaths.length) {
      uni.showToast({
        title: '附件已添加',
        icon: 'success',
      });
    }
  } catch (error) {
    const messageText = getErrorMessage(error, '附件上传失败');

    if (!messageText.includes('cancel')) {
      uni.showToast({
        title: messageText,
        icon: 'none',
      });
    }
  } finally {
    uploadingAttachment.value = false;
  }
}

function chooseImagePaths(count: number) {
  return new Promise<string[]>((resolve, reject) => {
    uni.chooseImage({
      count,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (response) => {
        const rawPaths = response.tempFilePaths;
        const paths = Array.isArray(rawPaths) ? rawPaths : rawPaths ? [rawPaths] : [];
        resolve(paths.map((item) => String(item)));
      },
      fail: reject,
    });
  });
}

function removeAttachment(index: number) {
  attachments.value = attachments.value.filter((_, currentIndex) => currentIndex !== index);
}

function previewAttachment(index: number) {
  const urls = attachments.value
    .filter((item) => isImageAttachment(item))
    .map((item) => item.url)
    .filter(Boolean);
  const current = attachments.value[index]?.url;

  if (!current || !urls.includes(current)) {
    return;
  }

  uni.previewImage({
    urls,
    current,
  });
}

function isImageAttachment(item: FeedbackAttachment) {
  return item.mimeType.startsWith('image/');
}

async function requestFeedbackReplySubscription() {
  const templateId = import.meta.env.VITE_WECHAT_FEEDBACK_REPLY_TEMPLATE_ID || '';

  if (!templateId || !getAuthToken()) {
    return;
  }

  try {
    if (typeof uni.requestSubscribeMessage === 'function') {
      await new Promise<void>((resolve, reject) => {
        uni.requestSubscribeMessage({
          tmplIds: [templateId],
          success: () => resolve(),
          fail: reject,
        });
      });
    }

    await subscribeNotification({
      scene: 'feedback_reply',
      templateIds: [templateId],
      extra: {
        source: 'feedback',
      },
    });
  } catch (error) {
    console.warn('request feedback reply subscription failed', error);
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

function formatStatus(status: string) {
  const labels: Record<string, string> = {
    open: '待处理',
    processing: '处理中',
    resolved: '已处理',
    closed: '已关闭',
    local: '本地保存',
  };
  return labels[status] || status;
}

function resolveFeedbackStatus(item: FeedbackItem | ReturnType<typeof appendFeedbackEntry>) {
  return 'status' in item ? item.status : 'local';
}

function resolveAttachmentCount(item: FeedbackItem | ReturnType<typeof appendFeedbackEntry>) {
  return 'attachments' in item && Array.isArray(item.attachments) ? item.attachments.length : 0;
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

.attachment-section {
  display: grid;
  gap: 14rpx;
}

.attachment-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
}

.attachment-title {
  font-size: 26rpx;
  font-weight: 600;
  color: var(--apple-text);
}

.attachment-button,
.attachment-remove {
  margin: 0;
  border-radius: 999rpx;
  font-size: 24rpx;
  color: var(--apple-blue);
  background: rgba(46, 125, 246, 0.1);
}

.attachment-button::after,
.attachment-remove::after {
  border: none;
}

.attachment-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14rpx;
}

.attachment-item {
  position: relative;
  min-height: 160rpx;
  overflow: hidden;
  border-radius: 22rpx;
  background: rgba(246, 249, 252, 0.92);
}

.attachment-image,
.attachment-file {
  width: 100%;
  height: 160rpx;
}

.attachment-file {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16rpx;
}

.attachment-file__name {
  font-size: 22rpx;
  line-height: 1.35;
  color: var(--apple-muted);
  word-break: break-all;
}

.attachment-remove {
  position: absolute;
  right: 8rpx;
  bottom: 8rpx;
  min-width: 84rpx;
  min-height: 44rpx;
  line-height: 44rpx;
  color: #ffffff;
  background: rgba(20, 27, 45, 0.72);
}

.attachment-hint {
  font-size: 22rpx;
  color: var(--apple-subtle);
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

.history-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.history-card__time {
  font-size: 22rpx;
  color: var(--apple-subtle);
}

.history-card__status {
  padding: 4rpx 14rpx;
  border-radius: 999rpx;
  background: rgba(46, 125, 246, 0.1);
  font-size: 22rpx;
  color: var(--apple-blue);
}

.reply-card {
  display: grid;
  gap: 6rpx;
  padding: 16rpx;
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.72);
}

.reply-card__label {
  font-size: 22rpx;
  color: var(--apple-subtle);
}

.reply-card__text {
  font-size: 25rpx;
  line-height: 1.7;
  color: var(--apple-text);
}
</style>
