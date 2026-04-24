<template>
  <view class="page-shell" :style="themeVars">
    <view class="home-page">
      <view class="ambient ambient--glow"></view>
      <view class="ambient ambient--mist"></view>

      <view class="page-header">
        <view class="page-header__copy">
          <text class="page-header__title">今日气运</text>
          <text class="page-header__subtitle">{{ pageSubtitle }}</text>
        </view>

        <view class="page-header__meta">
          <text class="page-header__date">{{ displayDate }}</text>
          <text class="page-header__hint">{{ dateHint }}</text>
        </view>
      </view>

      <FortuneScoreCard
        :label="fortuneCardLabel"
        :score="fortuneScore"
        :status="fortuneStatus"
        :title="fortuneTitle"
        :summary="fortuneSummary"
        :tags="fortuneTags"
        @select="goToReport"
      />

      <view class="section">
        <view class="section__head">
          <text class="section__title">状态一览</text>
          <text class="section__meta">今天可以先从这些线索看起</text>
        </view>

        <view class="status-grid">
          <view
            v-for="card in homeCards"
            :key="card.id"
            class="status-grid__item"
            @tap="handleRoute(card.route)"
          >
            <HomeStatusCard
              :icon="card.icon"
              :title="card.title"
              :value="card.value"
              :suffix="card.suffix"
              :badge="card.badge"
              :description="card.description"
            />
          </view>
        </view>
      </view>

      <TodayAdviceCard
        :title="adviceTitle"
        :summary="adviceSummary"
        :action-text="adviceAction.label"
        @action="handleRoute(adviceAction.route)"
      />

      <view class="section">
        <view class="section__head">
          <text class="section__title">便捷入口</text>
          <text class="section__meta">继续完善资料、查看历史或深入探索</text>
        </view>

        <QuickToolStrip :items="quickTools" @select="handleRoute" />
      </view>
    </view>

    <AppTabBar current-tab="home" />
  </view>
</template>

<script setup lang="ts">
import { onLoad, onPullDownRefresh, onShow } from '@dcloudio/uni-app';
import { computed, nextTick } from 'vue';
import AppTabBar from '../../components/AppTabBar.vue';
import FortuneScoreCard, { type FortuneCardTag } from '../../components/FortuneScoreCard.vue';
import HomeStatusCard from '../../components/HomeStatusCard.vue';
import QuickToolStrip, { type QuickToolItem } from '../../components/QuickToolStrip.vue';
import TodayAdviceCard from '../../components/TodayAdviceCard.vue';
import { useThemePreference } from '../../composables/useThemePreference';
import { useDashboardStore } from '../../stores/dashboard';
import type { ThemeKey } from '../../theme/tokens';

const dashboardStore = useDashboardStore();

const dashboard = computed(() => dashboardStore.dashboard);
const loading = computed(() => dashboardStore.loading);
const todayLuckyScore = computed(() => dashboard.value.todayLuckyScore);
const annualLuckyScore = computed(() => dashboard.value.annualLuckyScore);
const luckySign = computed(() => dashboard.value.todayLuckySign);
const stateOverview = computed(() => dashboard.value.stateOverview);
const userSummary = computed(() => dashboard.value.userSummary);
const featureEntries = computed(() => dashboard.value.featureEntries);
const quickEntries = computed(() => dashboard.value.quickEntries);
const dailyThemeKey = computed<ThemeKey | ''>(
  () => (dashboard.value.dailyThemeKey as ThemeKey | undefined) || '',
);
const { themePalette, themeVars } = useThemePreference(dailyThemeKey);

const fortuneScore = computed(() => {
  const parsed = Number(todayLuckyScore.value.value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, Math.round(parsed))) : 78;
});

const fortuneCardLabel = computed(() => todayLuckyScore.value.label || '综合气运指数');

const fortuneStatus = computed(() => {
  const score = fortuneScore.value;

  if (score >= 90) {
    return '极佳';
  }
  if (score >= 80) {
    return '良好';
  }
  if (score >= 70) {
    return '平稳';
  }
  if (score >= 60) {
    return '波动';
  }

  return '需调整';
});

const fortuneTitle = computed(() => stateOverview.value.title || '今天适合先稳住节奏');
const fortuneSummary = computed(
  () => stateOverview.value.primarySuggestion || stateOverview.value.summary,
);

const pageSubtitle = computed(
  () => dashboard.value.headline.subtitle || '身心和谐 · 顺势而为',
);

const displayDate = computed(() => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${year}年${month}月${day}日 ${weekdays[now.getDay()]}`;
});

const dateHint = computed(() =>
  loading.value ? '正在同步今日主题' : `今日主题 · ${themePalette.value.name}`,
);

const fortuneTags = computed<FortuneCardTag[]>(() => [
  {
    label: '今日主题',
    value: themePalette.value.name,
  },
  {
    label: '当前依据',
    value: shortConfidenceLabel(stateOverview.value.confidenceLabel),
  },
  {
    label: '幸运签',
    value: luckySign.value.tag || '静观有得',
  },
]);

const factorMap = computed(() => {
  const map = new Map<string, { label: string; value: string; hint: string }>();
  for (const item of stateOverview.value.factors) {
    map.set(item.id, {
      label: item.label,
      value: item.value,
      hint: item.hint,
    });
  }
  return map;
});

const homeCards = computed(() => {
  const emotionFactor = factorMap.value.get('emotion');
  const personalityFactor = factorMap.value.get('personality');
  const completionFactor = factorMap.value.get('completion');

  return [
    {
      id: 'emotion',
      icon: '情',
      title: emotionFactor?.label || '情绪稳定度',
      value: emotionFactor?.value || '--',
      suffix: emotionFactor?.value ? '/100' : '',
      badge: '当前状态',
      description: emotionFactor?.hint || '先通过一轮轻量自检了解最近的情绪变化。',
      route: '/pages/emotion/index',
    },
    {
      id: 'personality',
      icon: '节',
      title: personalityFactor?.label || '节奏掌控度',
      value: personalityFactor?.value || annualLuckyScore.value.value || '--',
      suffix: personalityFactor?.value || annualLuckyScore.value.value ? '/100' : '',
      badge: '自我认知',
      description:
        personalityFactor?.hint || annualLuckyScore.value.hint || '完成测评后会更清楚自己的推进方式。',
      route: '/pages/personality/index',
    },
    {
      id: 'completion',
      icon: '资',
      title: completionFactor?.label || '认知完善度',
      value: completionFactor?.value || '--',
      suffix: completionFactor?.value ? '/100' : '',
      badge: userSummary.value.profileCompleted ? '已完善' : '待补齐',
      description:
        completionFactor?.hint ||
        (userSummary.value.profileCompleted
          ? '资料已就绪，可以继续查看更完整的个性化内容。'
          : '补齐生日和基础资料后，首页解释会更贴近你。'),
      route: '/pages/profile/index',
    },
    {
      id: 'sign',
      icon: '签',
      title: '今日幸运签',
      value: luckySign.value.tag || '静观有得',
      suffix: '',
      badge: '轻提醒',
      description: luckySign.value.summary || '把节奏放慢一点，今天更适合温柔但清晰的推进。',
      route: buildLuckySignRoute(luckySign.value.bizCode),
    },
  ];
});

const adviceTitle = computed(() =>
  userSummary.value.profileCompleted ? '慢下来，先照顾好自己' : '先补齐资料，再继续探索',
);

const adviceSummary = computed(() => {
  if (!userSummary.value.isLoggedIn) {
    return '先登录并绑定当前账号，之后的测试、记录和主题偏好才能稳定沉淀下来。';
  }

  if (!userSummary.value.profileCompleted) {
    return '补齐生日和基础资料后，首页的个性化判断会更完整，也能更好地接住后续的八字与星座入口。';
  }

  return stateOverview.value.primarySuggestion || '今天更适合把注意力放回自己的节奏，再决定下一步要不要加码。';
});

const adviceAction = computed(() => {
  if (!userSummary.value.isLoggedIn) {
    return {
      label: '去登录',
      route: userSummary.value.primaryActionRoute || '/pages/profile/index',
    };
  }

  if (!userSummary.value.profileCompleted) {
    return {
      label: '完善资料',
      route: '/pages/profile/index',
    };
  }

  return {
    label: '查看完整报告',
    route: '/pages/report/index',
  };
});

const quickTools = computed<QuickToolItem[]>(() => {
  const items = quickEntries.value.slice(0, 4);
  const iconMap = ['我', '录', '设', '会'];

  return items.map((item, index) => ({
    id: item.id,
    title: item.title,
    description: item.badge,
    icon: iconMap[index] || '今',
    route: item.route,
  }));
});

let skipFirstShowRefresh = true;

async function refreshDashboard() {
  await dashboardStore.loadDashboard();
}

function resetScrollTop() {
  nextTick(() => {
    setTimeout(() => {
      uni.pageScrollTo({
        scrollTop: 0,
        duration: 0,
      });
    }, 0);
  });
}

function handleRoute(route: string) {
  if (!route) {
    return;
  }

  uni.navigateTo({
    url: route,
  });
}

function goToReport() {
  handleRoute('/pages/report/index');
}

function shortConfidenceLabel(label: string) {
  if (!label) {
    return '观察中';
  }

  return label
    .replace('依据', '')
    .replace('：', '')
    .replace(/\s+/g, '')
    .slice(0, 6);
}

function buildLuckySignRoute(bizCode?: string) {
  const code = bizCode || 'sign-breeze-open';
  return `/pages/lucky/sign/index?bizCode=${encodeURIComponent(code)}`;
}

onLoad(() => {
  resetScrollTop();
  void refreshDashboard();
});

onShow(() => {
  if (skipFirstShowRefresh) {
    skipFirstShowRefresh = false;
    return;
  }

  resetScrollTop();
  void refreshDashboard();
});

onPullDownRefresh(async () => {
  await refreshDashboard();
  uni.stopPullDownRefresh();
});
</script>

<style lang="scss">
.page-shell {
  position: relative;
  min-height: 100vh;
  padding-bottom: 144rpx;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, var(--theme-glow), transparent 32%),
    linear-gradient(180deg, var(--theme-page-top) 0%, var(--theme-page-bottom) 100%);
}

.home-page {
  position: relative;
  min-height: 100vh;
  padding: 28rpx 24rpx 0;
  overflow: hidden;
}

.ambient {
  position: absolute;
  border-radius: 999rpx;
  pointer-events: none;
  filter: blur(28rpx);
}

.ambient--glow {
  top: 56rpx;
  right: -58rpx;
  width: 280rpx;
  height: 280rpx;
  background: var(--theme-glow);
}

.ambient--mist {
  top: 360rpx;
  left: -74rpx;
  width: 240rpx;
  height: 240rpx;
  background: rgba(255, 255, 255, 0.76);
}

.page-header,
.section,
.section__head {
  display: grid;
  gap: 16rpx;
}

.page-header {
  position: relative;
  z-index: 1;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  margin-bottom: 24rpx;
}

.page-header__copy,
.page-header__meta {
  display: grid;
  gap: 8rpx;
}

.page-header__title {
  font-size: 72rpx;
  font-weight: 500;
  color: var(--theme-text-primary);
  font-family:
    'Iowan Old Style',
    'Times New Roman',
    'Noto Serif SC',
    serif;
}

.page-header__subtitle,
.page-header__date,
.page-header__hint,
.section__meta {
  font-size: 24rpx;
  line-height: 1.7;
  color: var(--theme-text-secondary);
}

.page-header__meta {
  justify-items: end;
  margin-top: 14rpx;
}

.section {
  position: relative;
  z-index: 1;
  margin-top: 26rpx;
}

.section__head {
  gap: 6rpx;
}

.section__title {
  font-size: 40rpx;
  font-weight: 500;
  color: var(--theme-text-primary);
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18rpx;
}

.status-grid__item {
  min-width: 0;
}
</style>
