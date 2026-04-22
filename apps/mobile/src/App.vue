<script setup lang="ts">
import { onHide, onLaunch, onShow } from '@dcloudio/uni-app';

onLaunch(() => {
  console.log('Fortune Hub mobile launch');
});

onShow(() => {
  console.log('Fortune Hub mobile show');
});

onHide(() => {
  console.log('Fortune Hub mobile hide');
});
</script>

<style lang="scss">
page {
  --apple-bg-top: #f7fbff;
  --apple-bg-bottom: #e8f0f6;
  --apple-surface: rgba(255, 255, 255, 0.82);
  --apple-surface-strong: rgba(255, 255, 255, 0.94);
  --apple-border: rgba(255, 255, 255, 0.7);
  --apple-text: #142033;
  --apple-muted: #66778a;
  --apple-subtle: #8a9ab0;
  --apple-blue: #5b8def;
  --apple-blue-soft: #dce8ff;
  --apple-mint: #86d1b6;
  --apple-mint-soft: #ddf4ea;
  --apple-sun: #ffd596;
  --apple-sun-soft: #fff2d7;
  --apple-shadow: 0 20rpx 60rpx rgba(73, 106, 142, 0.12);
  background:
    radial-gradient(circle at top left, rgba(134, 209, 182, 0.34), transparent 28%),
    radial-gradient(circle at top right, rgba(91, 141, 239, 0.2), transparent 30%),
    linear-gradient(180deg, var(--apple-bg-top) 0%, var(--apple-bg-bottom) 100%);
  color: var(--apple-text);
  font-family:
    'SF Pro Display',
    'SF Pro Text',
    'PingFang SC',
    'Helvetica Neue',
    sans-serif;
}
</style>
