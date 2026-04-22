<template>
  <view class="page">
    <view class="panel hero-panel">
      <text class="eyebrow">settings center</text>
      <text class="title">设置与偏好</text>
      <text class="summary">把提醒、历史卡片和基础信息入口放到一个地方，后面也方便继续接推送和隐私配置。</text>
    </view>

    <view class="panel">
      <text class="section-title">使用偏好</text>

      <view class="setting-row">
        <view>
          <text class="setting-row__title">每日幸运提醒</text>
          <text class="setting-row__text">先用本地设置保留开关，后面可接系统推送。</text>
        </view>
        <switch :checked="settings.dailyReminderEnabled" color="#5f8dff" @change="toggle('dailyReminderEnabled', $event)" />
      </view>

      <view class="setting-row">
        <view>
          <text class="setting-row__title">幸运物推荐提醒</text>
          <text class="setting-row__text">每天看到一条轻量幸运提示。</text>
        </view>
        <switch :checked="settings.luckyPushEnabled" color="#5f8dff" @change="toggle('luckyPushEnabled', $event)" />
      </view>

      <view class="setting-row">
        <view>
          <text class="setting-row__title">安静模式</text>
          <text class="setting-row__text">晚上减少提醒，留出更稳的节奏。</text>
        </view>
        <switch :checked="settings.quietModeEnabled" color="#5f8dff" @change="toggle('quietModeEnabled', $event)" />
      </view>

      <view class="setting-row">
        <view>
          <text class="setting-row__title">保留历史卡片</text>
          <text class="setting-row__text">方便继续查看八字、性格和情绪结果。</text>
        </view>
        <switch :checked="settings.saveHistoryCardsEnabled" color="#5f8dff" @change="toggle('saveHistoryCardsEnabled', $event)" />
      </view>
    </view>

    <view class="panel">
      <text class="section-title">更多入口</text>
      <view class="link-list">
        <view class="link-card" @tap="goPrivacy">
          <text class="link-card__title">隐私说明</text>
          <text class="link-card__text">查看数据范围、用途和当前的合规说明。</text>
        </view>
        <view class="link-card" @tap="goFeedback">
          <text class="link-card__title">意见反馈</text>
          <text class="link-card__text">把 bug、想法和希望新增的功能记下来。</text>
        </view>
        <view class="link-card" @tap="goAbout">
          <text class="link-card__title">关于我们</text>
          <text class="link-card__text">查看当前版本、产品定位和开发里程碑。</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { getAppSettings, saveAppSettings, type AppSettings } from '../../services/preferences';

const settings = reactive<AppSettings>(getAppSettings());

function toggle(
  key: keyof AppSettings,
  event: Event | { detail?: { value?: boolean } },
) {
  const nextValue = (
    event as {
      detail?: {
        value?: boolean;
      };
    }
  ).detail?.value;
  settings[key] = Boolean(nextValue);
  saveAppSettings({ ...settings });
}

function goPrivacy() {
  uni.navigateTo({ url: '/pages/settings/privacy/index' });
}

function goFeedback() {
  uni.navigateTo({ url: '/pages/settings/feedback/index' });
}

function goAbout() {
  uni.navigateTo({ url: '/pages/settings/about/index' });
}
</script>

<style lang="scss">
.page {
  min-height: 100vh;
  padding: 24rpx;
  background: linear-gradient(180deg, #f8fbff 0%, #edf2f7 100%);
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
.section-title,
.setting-row__title,
.link-card__title {
  font-size: 34rpx;
  font-weight: 700;
  color: var(--apple-text);
}

.summary,
.setting-row__text,
.link-card__text {
  font-size: 26rpx;
  line-height: 1.7;
  color: var(--apple-muted);
}

.setting-row,
.link-list {
  display: grid;
  gap: 16rpx;
}

.setting-row {
  grid-template-columns: 1fr auto;
  align-items: center;
  padding: 22rpx;
  border-radius: 24rpx;
  background: rgba(246, 249, 252, 0.92);
}

.link-card {
  padding: 22rpx;
  border-radius: 24rpx;
  background: rgba(246, 249, 252, 0.92);
}
</style>
