<template>
  <view class="page">
    <view class="panel">
      <text class="eyebrow">lucky system</text>
      <text class="title">幸运物模块开发中</text>
      <text class="summary">
        后续会接今日幸运签、幸运物推荐、幸运壁纸和年度幸运指数内容。
      </text>
      <button class="primary-button" @tap="backHome">返回首页</button>
    </view>
  </view>
</template>

<script setup lang="ts">
function backHome() {
  uni.reLaunch({
    url: '/pages/index/index',
  });
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
  padding: 28rpx;
  border-radius: 32rpx;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: var(--apple-shadow);
}

.eyebrow {
  font-size: 20rpx;
  text-transform: uppercase;
  letter-spacing: 0.28em;
  color: var(--apple-subtle);
}

.title {
  font-size: 38rpx;
  font-weight: 700;
  color: var(--apple-text);
}

.summary {
  font-size: 26rpx;
  line-height: 1.7;
  color: var(--apple-muted);
}

.primary-button {
  min-height: 78rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, var(--apple-blue) 0%, #7ba7ff 100%);
  color: #ffffff;
  line-height: 78rpx;
}

.primary-button::after {
  border: none;
}
</style>
