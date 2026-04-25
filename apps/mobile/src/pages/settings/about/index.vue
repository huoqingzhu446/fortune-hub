<template>
  <view class="page" :style="themeVars">
    <view class="panel">
      <text class="eyebrow">about</text>
      <text class="title">关于 Fortune Hub</text>
      <text class="summary">当前项目是一套面向微信小程序 / H5 / 管理端 / API 的首版原型，重点已经推进到题库配置化、幸运体系和多模块联调。</text>
    </view>

    <view class="panel">
      <text class="section-title">当前版本关注点</text>
      <view class="bullet-list">
        <text class="bullet-item">星座、八字、性格测评、情绪自检已具备首版页面与接口。</text>
        <text class="bullet-item">幸运体系已有幸运签、幸运物推荐和壁纸生成首版。</text>
        <text class="bullet-item">管理端已有题库管理后台首版。</text>
      </view>
    </view>

    <view class="panel panel--soft">
      <text class="section-title">接下来</text>
      <view class="bullet-list">
        <text class="bullet-item">分享海报图片生成</text>
        <text class="bullet-item">会员 / 广告 / 订单闭环</text>
        <text class="bullet-item">正式后台鉴权与内容中心</text>
      </view>
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
