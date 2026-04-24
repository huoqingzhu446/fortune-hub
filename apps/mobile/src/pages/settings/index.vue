<template>
  <view class="page-shell" :style="themeVars">
    <view class="page">
      <view class="panel hero-panel">
        <text class="eyebrow">偏好中心</text>
        <text class="title">设置与偏好</text>
        <text class="summary">
          整体风格默认跟随今日幸运色，也可以固定成你更喜欢的疗愈主题。提醒、隐私与反馈也统一放在这里管理。
        </text>

        <view class="theme-status">
          <text class="theme-status__label">当前生效主题</text>
          <text class="theme-status__value">{{ effectiveThemeSummary }}</text>
        </view>
      </view>

      <view class="panel">
        <text class="section-title">整体风格</text>
        <text class="section-summary">
          跟随今日主题时会每天变化；切到手动后，会固定为你选中的风格。
        </text>

        <view class="mode-row">
          <view
            class="mode-pill"
            :class="{ 'mode-pill--active': settings.themeMode === 'auto' }"
            @tap="setThemeMode('auto')"
          >
            <text class="mode-pill__title">跟随今日幸运色</text>
            <text class="mode-pill__desc">每天自动切换</text>
          </view>

          <view
            class="mode-pill"
            :class="{ 'mode-pill--active': settings.themeMode === 'manual' }"
            @tap="setThemeMode('manual')"
          >
            <text class="mode-pill__title">手动选择主题</text>
            <text class="mode-pill__desc">固定为你喜欢的色调</text>
          </view>
        </view>

        <view class="hint-strip">
          <text>{{ modeHint }}</text>
        </view>

        <view class="theme-grid">
          <ThemePreviewCard
            v-for="palette in themeOptions"
            :key="palette.key"
            :palette="palette"
            :active="palette.key === resolvedTheme.effectiveThemeKey"
            :muted="settings.themeMode === 'auto' && palette.key !== resolvedTheme.effectiveThemeKey"
            @select="setManualTheme(palette.key)"
          />
        </view>
      </view>

      <view class="panel">
        <text class="section-title">提醒偏好</text>

        <view class="setting-row">
          <view>
            <text class="setting-row__title">每日幸运提醒</text>
            <text class="setting-row__text">在合适的时间收到今日状态提示。</text>
          </view>
          <switch :checked="settings.dailyReminderEnabled" :color="themePalette.primary" @change="toggle('dailyReminderEnabled', $event)" />
        </view>

        <view class="setting-row">
          <view>
            <text class="setting-row__title">幸运物推荐提醒</text>
            <text class="setting-row__text">收到一条轻量好运建议。</text>
          </view>
          <switch :checked="settings.luckyPushEnabled" :color="themePalette.primary" @change="toggle('luckyPushEnabled', $event)" />
        </view>

        <view class="setting-row">
          <view>
            <text class="setting-row__title">安静模式</text>
            <text class="setting-row__text">晚间减少提醒，留出更稳的节奏。</text>
          </view>
          <switch :checked="settings.quietModeEnabled" :color="themePalette.primary" @change="toggle('quietModeEnabled', $event)" />
        </view>

        <view class="setting-row">
          <view>
            <text class="setting-row__title">保留历史卡片</text>
            <text class="setting-row__text">方便继续查看测试、记录和报告。</text>
          </view>
          <switch :checked="settings.saveHistoryCardsEnabled" :color="themePalette.primary" @change="toggle('saveHistoryCardsEnabled', $event)" />
        </view>
      </view>

      <view class="panel">
        <text class="section-title">更多入口</text>

        <view class="link-list">
          <view class="link-card" @tap="goPrivacy">
            <text class="link-card__title">隐私说明</text>
            <text class="link-card__text">查看数据范围、用途和当前合规说明。</text>
          </view>

          <view class="link-card" @tap="goFeedback">
            <text class="link-card__title">意见反馈</text>
            <text class="link-card__text">把 bug、想法和希望新增的功能记下来。</text>
          </view>

          <view class="link-card" @tap="goAbout">
            <text class="link-card__title">关于我们</text>
            <text class="link-card__text">查看当前版本、定位和开发里程碑。</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import ThemePreviewCard from '../../components/ThemePreviewCard.vue';
import { useThemePreference } from '../../composables/useThemePreference';
import { themePalettes } from '../../theme/themes';
import type { AppSettings } from '../../services/preferences';

type ToggleSettingKey =
  | 'dailyReminderEnabled'
  | 'luckyPushEnabled'
  | 'quietModeEnabled'
  | 'saveHistoryCardsEnabled';

const {
  settings,
  resolvedTheme,
  themePalette,
  themeVars,
  setThemeMode,
  setManualTheme,
  patchSettings,
} = useThemePreference();

const themeOptions = Object.values(themePalettes);

const effectiveThemeSummary = computed(() =>
  settings.themeMode === 'manual'
    ? `已固定为 ${themePalette.value.name}，不随每日变化`
    : `今日主题：${themePalette.value.name}`,
);

const modeHint = computed(() => {
  if (settings.themeMode === 'manual') {
    return `当前使用手动主题 ${themePalette.value.name}。返回自动模式后，会重新跟随今日幸运色。`;
  }

  if (resolvedTheme.value.source === 'fallback') {
    return `今天的主题数据暂未拿到，先使用默认主题 ${themePalette.value.name}。`;
  }

  return `当前处于自动模式，今日主题为 ${themePalette.value.name}。`;
});

function toggle(
  key: ToggleSettingKey,
  event: Event | { detail?: { value?: boolean } },
) {
  const nextValue = (
    event as {
      detail?: {
        value?: boolean;
      };
    }
  ).detail?.value;

  patchSettings({
    [key]: Boolean(nextValue),
  } as Partial<AppSettings>);
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
.page-shell {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, var(--theme-glow), transparent 32%),
    linear-gradient(180deg, var(--theme-page-top) 0%, var(--theme-page-bottom) 100%);
}

.page {
  min-height: 100vh;
  padding: 28rpx 24rpx 40rpx;
}

.panel {
  display: grid;
  gap: 18rpx;
  margin-bottom: 24rpx;
  padding: 30rpx;
  border-radius: 32rpx;
  background: var(--theme-surface);
  border: 1rpx solid var(--theme-border);
  box-shadow: var(--theme-shadow);
}

.eyebrow {
  font-size: 22rpx;
  letter-spacing: 0.18em;
  color: var(--theme-primary);
}

.title,
.section-title,
.setting-row__title,
.link-card__title,
.mode-pill__title,
.theme-status__value {
  font-size: 36rpx;
  font-weight: 600;
  color: var(--theme-text-primary);
}

.summary,
.section-summary,
.setting-row__text,
.link-card__text,
.mode-pill__desc,
.theme-status__label,
.hint-strip {
  font-size: 24rpx;
  line-height: 1.7;
  color: var(--theme-text-secondary);
}

.theme-status {
  display: grid;
  gap: 8rpx;
  padding: 24rpx;
  border-radius: 24rpx;
  background: var(--theme-tag-bg);
}

.mode-row,
.theme-grid,
.link-list {
  display: grid;
  gap: 16rpx;
}

.mode-row,
.theme-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.mode-pill {
  display: grid;
  gap: 10rpx;
  padding: 24rpx;
  border-radius: 26rpx;
  background: var(--theme-surface-muted);
  border: 1rpx solid transparent;
}

.mode-pill--active {
  border-color: var(--theme-primary);
  background: var(--theme-tag-bg);
}

.mode-pill__title {
  font-size: 28rpx;
}

.mode-pill__desc {
  font-size: 22rpx;
}

.hint-strip {
  padding: 22rpx 24rpx;
  border-radius: 24rpx;
  background: var(--theme-surface-muted);
}

.setting-row {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 16rpx;
  padding: 24rpx;
  border-radius: 24rpx;
  background: var(--theme-surface-muted);
}

.setting-row__title,
.link-card__title {
  font-size: 30rpx;
}

.link-card {
  display: grid;
  gap: 8rpx;
  padding: 24rpx;
  border-radius: 24rpx;
  background: var(--theme-surface-muted);
}
</style>
