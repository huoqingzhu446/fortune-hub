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
  --theme-primary: #5ea6e3;
  --theme-soft: #eef5fa;
  --theme-accent: #a9d4f7;
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
  --theme-glow: rgba(169, 212, 247, 0.44);
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

button,
.app-button {
  box-sizing: border-box;
  transition:
    transform 180ms ease,
    opacity 180ms ease,
    box-shadow 220ms ease,
    background 220ms ease,
    color 220ms ease,
    border-color 220ms ease;
}

button::after,
.app-button::after {
  border: none;
}

.app-button,
.app-button--primary,
.app-button--secondary,
.app-button--ghost,
.app-button--pill,
.app-button--danger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  min-height: 84rpx;
  padding: 0 28rpx;
  border-radius: 999rpx;
  border: 1rpx solid transparent;
  font-size: 26rpx;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.01em;
}

.app-button--primary {
  color: #ffffff;
  background:
    linear-gradient(135deg, rgba(var(--theme-primary-rgb), 0.96) 0%, rgba(var(--theme-accent-rgb), 0.94) 100%);
  box-shadow:
    0 16rpx 30rpx rgba(var(--theme-primary-rgb), 0.22),
    0 0 0 1rpx rgba(255, 255, 255, 0.18) inset;
}

.app-button--secondary {
  color: var(--theme-text-primary);
  background: rgba(255, 255, 255, 0.86);
  border-color: rgba(var(--theme-primary-rgb), 0.12);
  box-shadow:
    0 12rpx 26rpx rgba(var(--theme-text-primary-rgb), 0.08),
    0 0 0 1rpx rgba(255, 255, 255, 0.44) inset;
}

.app-button--ghost {
  color: var(--theme-primary);
  background: rgba(var(--theme-primary-rgb), 0.08);
  border-color: rgba(var(--theme-primary-rgb), 0.16);
}

.app-button--pill {
  min-height: 60rpx;
  padding: 0 20rpx;
  font-size: 22rpx;
  font-weight: 600;
  color: var(--theme-primary);
  background: var(--theme-tag-bg);
  border-color: rgba(var(--theme-primary-rgb), 0.12);
}

.app-button--danger {
  color: #ffffff;
  background: linear-gradient(135deg, #d26d6d 0%, #c85656 100%);
  box-shadow: 0 14rpx 26rpx rgba(210, 109, 109, 0.18);
}

.app-button--full {
  width: 100%;
}

button.hero-button,
button.primary-button,
button.save-button,
button.favorite-button,
button.content-card__button,
button.content-card__favorite,
button.feature-card__favorite,
button.topic-card__favorite,
button.filter-actions__confirm,
button.filter-actions__reset,
button.overview-card__button,
button.login-card__button,
button.empty-state__button,
button.vip-card__button,
button.hero-login-row__button,
button.bottom-actions__button,
button.advice-card__button,
button.favorite-strip__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  min-height: 84rpx;
  padding: 0 28rpx;
  border-radius: 999rpx !important;
  border: 1rpx solid transparent !important;
  font-size: 26rpx !important;
  font-weight: 600 !important;
  line-height: 1 !important;
  letter-spacing: 0.01em;
  transition:
    transform 180ms ease,
    opacity 180ms ease,
    box-shadow 220ms ease,
    background 220ms ease,
    color 220ms ease,
    border-color 220ms ease;
}

button.hero-button--primary,
button.primary-button,
button.save-button,
button.content-card__button,
button.filter-actions__confirm,
button.overview-card__button,
button.login-card__button,
button.empty-state__button,
button.vip-card__button,
button.hero-login-row__button--primary,
button.advice-card__button {
  color: #ffffff !important;
  background:
    linear-gradient(135deg, rgba(var(--theme-primary-rgb), 0.96) 0%, rgba(var(--theme-accent-rgb), 0.94) 100%) !important;
  box-shadow:
    0 16rpx 30rpx rgba(var(--theme-primary-rgb), 0.22),
    0 0 0 1rpx rgba(255, 255, 255, 0.18) inset !important;
}

button.hero-button--secondary,
button.ghost-button,
button.filter-actions__reset,
button.hero-login-row__button--secondary {
  color: var(--theme-text-primary) !important;
  background: rgba(255, 255, 255, 0.86) !important;
  border-color: rgba(var(--theme-primary-rgb), 0.12) !important;
  box-shadow:
    0 12rpx 26rpx rgba(var(--theme-text-primary-rgb), 0.08),
    0 0 0 1rpx rgba(255, 255, 255, 0.44) inset !important;
}

button.hero-button--ghost,
button.favorite-button,
button.content-card__favorite,
button.feature-card__favorite,
button.topic-card__favorite,
button.favorite-strip__button {
  min-height: 60rpx;
  padding: 0 20rpx;
  font-size: 22rpx !important;
  font-weight: 600 !important;
  color: var(--theme-primary) !important;
  background: var(--theme-tag-bg) !important;
  border-color: rgba(var(--theme-primary-rgb), 0.12) !important;
  box-shadow: none !important;
}

button.bottom-actions__button {
  color: #ffffff !important;
  background: linear-gradient(135deg, #d26d6d 0%, #c85656 100%) !important;
  box-shadow: 0 14rpx 26rpx rgba(210, 109, 109, 0.18) !important;
}

button.favorite-button--active,
button.content-card__favorite--active,
button.feature-card__favorite--active,
button.topic-card__favorite--active,
button.favorite-strip__button--active {
  color: #ffffff !important;
  background:
    linear-gradient(135deg, rgba(var(--theme-primary-rgb), 0.92) 0%, rgba(var(--theme-accent-rgb), 0.88) 100%) !important;
  box-shadow: 0 12rpx 24rpx rgba(var(--theme-primary-rgb), 0.18) !important;
}

.app-button[disabled],
button[disabled] {
  opacity: 0.46;
  transform: none;
  box-shadow: none;
}

.app-button:active,
button:active {
  transform: translateY(1rpx) scale(0.985);
}
</style>
