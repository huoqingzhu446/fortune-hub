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
  --theme-primary: #2f7fbd;
  --theme-primary-rgb: 47, 127, 189;
  --theme-soft: #eaf4fb;
  --theme-accent: #8cc5ee;
  --theme-accent-rgb: 140, 197, 238;
  --theme-page-top: #f9fcfe;
  --theme-page-bottom: #eaf4fb;
  --theme-surface: rgba(255, 255, 255, 0.94);
  --theme-surface-strong: rgba(255, 255, 255, 0.98);
  --theme-surface-muted: rgba(238, 246, 252, 0.96);
  --theme-text-primary: #252a36;
  --theme-text-primary-rgb: 37, 42, 54;
  --theme-text-secondary: #5e6878;
  --theme-text-secondary-rgb: 94, 104, 120;
  --theme-text-tertiary: #8a94a3;
  --theme-border: rgba(39, 48, 66, 0.1);
  --theme-tag-bg: rgba(225, 240, 250, 0.96);
  --theme-glow: rgba(80, 151, 207, 0.22);
  --theme-shadow: 0 16rpx 48rpx rgba(43, 76, 108, 0.14);
  --theme-shadow-soft: 0 8rpx 24rpx rgba(43, 76, 108, 0.14);
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
    radial-gradient(circle at top left, var(--theme-glow), transparent 26%),
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.5), transparent 22%),
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
    linear-gradient(135deg, rgba(var(--theme-primary-rgb), 1) 0%, rgba(var(--theme-primary-rgb), 0.84) 100%);
  box-shadow:
    0 16rpx 30rpx rgba(var(--theme-primary-rgb), 0.24),
    0 0 0 1rpx rgba(255, 255, 255, 0.18) inset;
}

.app-button--secondary {
  color: var(--theme-text-primary);
  background: rgba(255, 255, 255, 0.94);
  border-color: var(--theme-border);
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
    linear-gradient(135deg, rgba(var(--theme-primary-rgb), 1) 0%, rgba(var(--theme-primary-rgb), 0.84) 100%) !important;
  box-shadow:
    0 16rpx 30rpx rgba(var(--theme-primary-rgb), 0.24),
    0 0 0 1rpx rgba(255, 255, 255, 0.18) inset !important;
}

button.hero-button--secondary,
button.ghost-button,
button.filter-actions__reset,
button.hero-login-row__button--secondary {
  color: var(--theme-text-primary) !important;
  background: rgba(255, 255, 255, 0.94) !important;
  border-color: var(--theme-border) !important;
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
    linear-gradient(135deg, rgba(var(--theme-primary-rgb), 0.98) 0%, rgba(var(--theme-primary-rgb), 0.78) 100%) !important;
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
