<template>
  <view class="page" :style="themeVars">
    <view class="panel">
      <text class="eyebrow">privacy</text>
      <text class="title">隐私与合规说明</text>
      <text class="summary">{{ privacySummary }}</text>
      <view class="consent-row">
        <text class="consent-row__status">{{ consentStatusText }}</text>
        <button class="hero-button" :loading="loading" @tap="toggleConsent">
          {{ consentButtonText }}
        </button>
      </view>
    </view>

    <view class="panel">
      <text class="section-title">当前会保存的数据</text>
      <view class="bullet-list">
        <text class="bullet-item">登录标识：`openid` 或开发环境 mock openid。</text>
        <text class="bullet-item">基础资料：昵称、生日、出生时间、性别、星座、简易五行结果。</text>
        <text class="bullet-item">结果历史：八字、性格测评、情绪自检生成的记录。</text>
        <text class="bullet-item">偏好设置：主题与提醒偏好登录后会同步到账号，反馈草稿仍保存在当前设备。</text>
      </view>
    </view>

    <view class="panel">
      <text class="section-title">使用目的</text>
      <view class="bullet-list">
        <text class="bullet-item">用于生成星座、八字、幸运体系和测评结果。</text>
        <text class="bullet-item">用于保存历史记录，方便后续回看。</text>
        <text class="bullet-item">用于个性化推荐幸运物和壁纸方向。</text>
      </view>
    </view>

    <view class="panel panel--soft">
      <text class="section-title">当前边界</text>
      <text class="summary">情绪自检结果仅用于自我观察，不构成医学诊断。隐私政策正式文本仍需由项目方确认，数据删除/注销申请可先通过下方入口进入人工处理。</text>
    </view>

    <view class="panel">
      <text class="section-title">数据删除与注销</text>
      <text class="summary">提交后会生成一条高优先级处理工单，人工完成身份核验、数据影响确认和结果通知。</text>
      <button class="danger-button" :loading="deletionLoading" @tap="requestDataDeletion">
        申请删除个人数据
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import {
  agreeConsent,
  fetchSettings,
  revokeConsent,
  submitDataDeletionRequest,
} from '../../../api/settings';
import { useThemePreference } from '../../../composables/useThemePreference';
import { getAuthToken } from '../../../services/session';
import type { UserConsentItem } from '../../../types/settings';

const { themeVars } = useThemePreference();
const privacyVersion = ref('2026-04-25');
const privacySummary = ref('用于登录、保存历史、同步偏好、发送订阅提醒与处理反馈。');
const consents = ref<UserConsentItem[]>([]);
const loading = ref(false);
const deletionLoading = ref(false);

const latestPrivacyConsent = computed(() =>
  consents.value.find((item) => item.consentType === 'privacy'),
);
const hasAgreed = computed(() => latestPrivacyConsent.value?.status === 'agreed');
const consentStatusText = computed(() =>
  hasAgreed.value
    ? `已确认隐私版本 ${latestPrivacyConsent.value?.version || privacyVersion.value}`
    : `待确认隐私版本 ${privacyVersion.value}`,
);
const consentButtonText = computed(() => (hasAgreed.value ? '撤回确认' : '确认并继续使用'));

async function loadPrivacyContext() {
  try {
    const response = await fetchSettings();
    privacyVersion.value = response.data.settings.privacyVersion;
    privacySummary.value = response.data.settings.privacySummary;
    consents.value = response.data.consents || [];
  } catch (error) {
    console.warn('load privacy context failed', error);
  }
}

async function toggleConsent() {
  if (!getAuthToken()) {
    uni.showToast({
      title: '请先登录',
      icon: 'none',
    });
    return;
  }

  try {
    loading.value = true;
    if (hasAgreed.value) {
      await revokeConsent('privacy');
    } else {
      await agreeConsent({
        consentType: 'privacy',
        version: privacyVersion.value,
        source: 'mobile',
      });
    }
    await loadPrivacyContext();
  } catch (error) {
    console.warn('update privacy consent failed', error);
    uni.showToast({
      title: '操作失败，请稍后再试',
      icon: 'none',
    });
  } finally {
    loading.value = false;
  }
}

async function requestDataDeletion() {
  if (!getAuthToken()) {
    uni.showToast({
      title: '请先登录',
      icon: 'none',
    });
    return;
  }

  uni.showModal({
    title: '确认提交申请',
    content: '提交后客服会核验身份并处理个人数据删除/注销申请，处理期间部分功能可能受影响。',
    confirmText: '提交申请',
    confirmColor: '#d92d20',
    success: async (result) => {
      if (!result.confirm) {
        return;
      }

      try {
        deletionLoading.value = true;
        await submitDataDeletionRequest({
          reason: '用户从隐私页主动提交个人数据删除/注销申请',
          clientInfo: {
            privacyVersion: privacyVersion.value,
            sourcePage: 'settings/privacy',
          },
        });
        uni.showToast({
          title: '申请已提交',
          icon: 'success',
        });
      } catch (error) {
        console.warn('submit data deletion request failed', error);
        uni.showToast({
          title: '提交失败，请稍后再试',
          icon: 'none',
        });
      } finally {
        deletionLoading.value = false;
      }
    },
  });
}

onShow(() => {
  void loadPrivacyContext();
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

.panel--soft {
  background: rgba(247, 250, 252, 0.94);
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
.bullet-item {
  font-size: 26rpx;
  line-height: 1.8;
  color: var(--apple-muted);
}

.bullet-list {
  display: grid;
  gap: 12rpx;
}

.consent-row {
  display: grid;
  gap: 14rpx;
}

.consent-row__status {
  font-size: 24rpx;
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

.danger-button {
  min-height: 82rpx;
  border-radius: 999rpx;
  line-height: 82rpx;
  font-size: 28rpx;
  color: #ffffff;
  background: #d92d20;
}

.danger-button::after {
  border: none;
}
</style>
