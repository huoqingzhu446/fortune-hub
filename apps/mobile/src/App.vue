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
  --theme-primary: #6f91b7;
  --theme-soft: #eef5fa;
  --theme-accent: #afc8e5;
  --theme-page-top: #fbf9f5;
  --theme-page-bottom: #eef5fa;
  --theme-surface: rgba(255, 255, 255, 0.76);
  --theme-surface-strong: rgba(255, 255, 255, 0.9);
  --theme-surface-muted: rgba(244, 248, 252, 0.92);
  --theme-text-primary: #2f3a4a;
  --theme-text-secondary: #7f8793;
  --theme-text-tertiary: #aeb4bd;
  --theme-border: rgba(255, 255, 255, 0.82);
  --theme-tag-bg: rgba(238, 245, 250, 0.96);
  --theme-glow: rgba(175, 200, 229, 0.42);
  --theme-shadow: 0 16rpx 48rpx rgba(92, 112, 140, 0.12);
  --theme-shadow-soft: 0 8rpx 24rpx rgba(92, 112, 140, 0.12);
  --apple-bg-top: var(--theme-page-top);
  --apple-bg-bottom: var(--theme-page-bottom);
  --apple-surface: var(--theme-surface);
  --apple-surface-strong: var(--theme-surface-strong);
  --apple-border: var(--theme-border);
  --apple-text: var(--theme-text-primary);
  --apple-muted: var(--theme-text-secondary);
  --apple-subtle: var(--theme-text-tertiary);
  --apple-blue: var(--theme-primary);
  --apple-blue-soft: var(--theme-soft);
  --apple-mint: var(--theme-accent);
  --apple-mint-soft: var(--theme-soft);
  --apple-sun: var(--theme-accent);
  --apple-sun-soft: var(--theme-soft);
  --apple-shadow: var(--theme-shadow);
  background:
    radial-gradient(circle at top left, var(--theme-glow), transparent 30%),
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.72), transparent 24%),
    linear-gradient(180deg, var(--theme-page-top) 0%, var(--theme-page-bottom) 100%);
  color: var(--theme-text-primary);
  font-family:
    'PingFang SC',
    'Noto Serif SC',
    'Hiragino Mincho ProN',
    'Helvetica Neue',
    sans-serif;
}
</style>
