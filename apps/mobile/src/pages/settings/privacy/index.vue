<template>
  <view class="page" :style="themeVars">
    <view class="panel">
      <text class="eyebrow">privacy</text>
      <text class="title">隐私与合规说明</text>
      <text class="summary">这是一版开发期隐私页，先把当前真实采集范围和用途说清楚，后面再接正式法务文案。</text>
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
      <text class="summary">情绪自检结果仅用于自我观察，不构成医学诊断。正式上线前，仍需要补充更完整的法务文案、授权页与删除机制。</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useThemePreference } from '../../../composables/useThemePreference';

const { themeVars } = useThemePreference();
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
</style>
