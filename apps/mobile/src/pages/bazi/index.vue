<template>
  <view class="page">
    <view class="page-orb page-orb--jade"></view>
    <view class="page-orb page-orb--gold"></view>

    <view class="hero-sheet">
      <text class="hero-sheet__eyebrow">lite bazi chart</text>
      <text class="hero-sheet__title">八字解读</text>
      <text class="hero-sheet__subtitle">
        这是第一版简化排盘体验，会根据生日、时辰和性别生成一份可读的四柱概要、五行倾向与日常建议。
      </text>

      <view class="hero-sheet__meta">
        <view class="meta-pill">
          <text class="meta-pill__label">{{ loginStatusLabel }}</text>
          <text class="meta-pill__value">{{ loginStatusValue }}</text>
        </view>
        <view class="meta-pill">
          <text class="meta-pill__label">最近结果</text>
          <text class="meta-pill__value">{{ latestResultLabel }}</text>
        </view>
      </view>
    </view>

    <view class="input-sheet">
      <view class="sheet-header">
        <view>
          <text class="sheet-header__eyebrow">birth profile</text>
          <text class="sheet-header__title">出生信息</text>
        </view>
        <button class="ghost-button" @tap="applyProfileDefaults">
          带入我的资料
        </button>
      </view>

      <view class="field-grid">
        <view class="field-block">
          <text class="field-block__label">生日</text>
          <picker mode="date" :value="form.birthday" @change="handleBirthdayChange">
            <view class="field-block__picker">
              <text>{{ form.birthday || '请选择生日' }}</text>
            </view>
          </picker>
        </view>

        <view class="field-block">
          <text class="field-block__label">出生时间</text>
          <picker mode="time" :value="form.birthTime" @change="handleBirthTimeChange">
            <view class="field-block__picker">
              <text>{{ form.birthTime || '请选择时辰' }}</text>
            </view>
          </picker>
        </view>
      </view>

      <view class="field-block">
        <text class="field-block__label">性别</text>
        <view class="gender-row">
          <view
            v-for="option in genderOptions"
            :key="option.value"
            class="gender-chip"
            :class="{ 'gender-chip--active': form.gender === option.value }"
            @tap="form.gender = option.value"
          >
            <text>{{ option.label }}</text>
          </view>
        </view>
      </view>

      <view class="field-note">
        <text>体验版说明：当前为简化排盘，会直接使用公历日期与时辰做推演，不包含节气换月与真太阳时校正。</text>
      </view>

      <button class="primary-button" :loading="submitting" @tap="submitAnalyze">
        生成简化排盘
      </button>
    </view>

    <view v-if="latestResult" class="result-sheet">
      <view class="sheet-header">
        <view>
          <text class="sheet-header__eyebrow">chart result</text>
          <text class="sheet-header__title">{{ latestResult.title }}</text>
        </view>
        <text class="sheet-header__side">{{ latestResult.baseProfile.zodiac }} · {{ latestResult.baseProfile.dayMaster }}日主</text>
      </view>

      <text class="result-sheet__subtitle">{{ latestResult.subtitle }}</text>
      <text class="result-sheet__summary">{{ latestResult.summary }}</text>

      <view class="pillar-strip">
        <view class="pillar-cell">
          <text class="pillar-cell__label">年柱</text>
          <text class="pillar-cell__value">{{ latestResult.chart.yearPillar }}</text>
        </view>
        <view class="pillar-cell">
          <text class="pillar-cell__label">月柱</text>
          <text class="pillar-cell__value">{{ latestResult.chart.monthPillar }}</text>
        </view>
        <view class="pillar-cell">
          <text class="pillar-cell__label">日柱</text>
          <text class="pillar-cell__value">{{ latestResult.chart.dayPillar }}</text>
        </view>
        <view class="pillar-cell">
          <text class="pillar-cell__label">时柱</text>
          <text class="pillar-cell__value">{{ latestResult.chart.hourPillar }}</text>
        </view>
      </view>

      <view class="base-row">
        <text>{{ latestResult.baseProfile.birthMomentLabel }}</text>
        <text>主轴：{{ latestResult.dominantElement.name }}</text>
        <text>补位：{{ latestResult.supportElement.name }}</text>
      </view>

      <view class="keyword-row">
        <text v-for="keyword in latestResult.keywords" :key="keyword" class="keyword-chip">
          {{ keyword }}
        </text>
      </view>

      <view class="element-bars">
        <view v-for="item in latestResult.fiveElements" :key="item.name" class="element-row">
          <text class="element-row__name">{{ item.name }}</text>
          <view class="element-row__track">
            <view class="element-row__bar" :style="{ width: `${Math.max(item.value * 12, 16)}%` }"></view>
          </view>
          <text class="element-row__value">{{ item.value }}</text>
        </view>
      </view>

      <view class="reading-sheet">
        <text class="reading-sheet__title">事业节奏</text>
        <text class="reading-sheet__text">{{ latestResult.reading.career }}</text>
      </view>

      <view class="reading-sheet">
        <text class="reading-sheet__title">关系状态</text>
        <text class="reading-sheet__text">{{ latestResult.reading.relationship }}</text>
      </view>

      <view class="reading-sheet">
        <text class="reading-sheet__title">当前节奏建议</text>
        <text class="reading-sheet__text">{{ latestResult.reading.rhythm }}</text>
      </view>

      <view class="tip-grid">
        <view class="tip-tile">
          <text class="tip-tile__label">有利方位</text>
          <text class="tip-tile__value">{{ latestResult.practicalTips.favorableDirection }}</text>
        </view>
        <view class="tip-tile">
          <text class="tip-tile__label">辅助颜色</text>
          <text class="tip-tile__value">{{ latestResult.practicalTips.supportiveColor }}</text>
        </view>
      </view>

      <view class="focus-note">
        <text>{{ latestResult.practicalTips.dailyFocus }}</text>
      </view>

      <view class="compliance-note">
        <text>{{ latestResult.complianceNotice }}</text>
      </view>

      <view class="save-note">
        <text>
          {{
            latestSubmitSaved
              ? '这次解读已经写入你的历史记录。'
              : '当前结果已生成；登录后再次生成即可自动保存到历史。'
          }}
        </text>
      </view>

      <button class="primary-button" @tap="openFullReport">
        {{ latestRecordId ? '查看完整版 / 生成海报' : '登录后查看完整版' }}
      </button>
    </view>

    <view class="history-sheet">
      <view class="sheet-header">
        <view>
          <text class="sheet-header__eyebrow">history</text>
          <text class="sheet-header__title">最近排盘</text>
        </view>
        <text class="sheet-header__side">{{ historyItems.length ? '已保存' : '未保存' }}</text>
      </view>

      <view v-if="!isLoggedIn" class="history-empty">
        <text class="history-empty__title">登录后可保存排盘历史</text>
        <text class="history-empty__text">现在也可以直接体验；如果想保留结果，先去个人中心做快捷登录即可。</text>
      </view>

      <view v-else-if="loadingHistory" class="history-empty">
        <text class="history-empty__title">正在同步历史记录...</text>
        <text class="history-empty__text">马上就好。</text>
      </view>

      <view v-else-if="historyItems.length" class="history-list">
        <view v-for="item in historyItems" :key="item.id" class="history-item">
          <view class="history-item__top">
            <view>
              <text class="history-item__title">{{ item.title }}</text>
              <text class="history-item__subtitle">{{ item.yearPillar }} · {{ item.dayPillar }} · {{ item.dominantElementName }}</text>
            </view>
            <text class="history-item__time">{{ formatDateTime(item.createdAt) }}</text>
          </view>
          <text class="history-item__summary">{{ item.summary }}</text>
        </view>
      </view>

      <view v-else class="history-empty">
        <text class="history-empty__title">还没有保存的排盘记录</text>
        <text class="history-empty__text">完成一次解读后，这里会展示你最近的历史。</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad, onShow } from '@dcloudio/uni-app';
import { computed, reactive, ref } from 'vue';
import { analyzeBazi, fetchBaziHistory } from '../../api/bazi';
import { getAuthToken, getCachedUser } from '../../services/session';
import type { BaziHistoryItem, BaziResult } from '../../types/bazi';

type GenderValue = 'male' | 'female' | 'unknown';

const genderOptions: Array<{ label: string; value: GenderValue }> = [
  { label: '男', value: 'male' },
  { label: '女', value: 'female' },
  { label: '保密', value: 'unknown' },
];

const form = reactive<{
  birthday: string;
  birthTime: string;
  gender: GenderValue;
}>({
  birthday: '',
  birthTime: '',
  gender: 'unknown',
});

const latestResult = ref<BaziResult | null>(null);
const latestSubmitSaved = ref(false);
const latestRecordId = ref<string | null>(null);
const historyItems = ref<BaziHistoryItem[]>([]);
const loadingHistory = ref(false);
const submitting = ref(false);
const authToken = ref(getAuthToken());

const isLoggedIn = computed(() => Boolean(authToken.value));
const loginStatusLabel = computed(() => (isLoggedIn.value ? '当前状态' : '保存历史'));
const loginStatusValue = computed(() => (isLoggedIn.value ? '已登录' : '需登录'));
const latestResultLabel = computed(() => latestResult.value?.title || '等待生成');

function applyProfileDefaults() {
  const cachedUser = getCachedUser();

  form.birthday = cachedUser?.birthday || form.birthday;
  form.birthTime = cachedUser?.birthTime || form.birthTime || '08:30';
  form.gender = (cachedUser?.gender as GenderValue) || form.gender || 'unknown';

  if (!cachedUser?.birthday) {
    uni.showToast({
      title: '个人资料里还没有生日',
      icon: 'none',
    });
  }
}

async function loadHistory() {
  if (!getAuthToken()) {
    historyItems.value = [];
    return;
  }

  try {
    loadingHistory.value = true;
    const response = await fetchBaziHistory();
    historyItems.value = response.data.items;
  } catch (error) {
    console.warn('load bazi history failed', error);
    historyItems.value = [];
  } finally {
    loadingHistory.value = false;
  }
}

function handleBirthdayChange(event: { detail: { value: string } }) {
  form.birthday = event.detail.value;
}

function handleBirthTimeChange(event: { detail: { value: string } }) {
  form.birthTime = event.detail.value;
}

async function submitAnalyze() {
  if (!form.birthday || !form.birthTime) {
    uni.showToast({
      title: '请先填写生日和时辰',
      icon: 'none',
    });
    return;
  }

  try {
    submitting.value = true;
    const response = await analyzeBazi({
      birthday: form.birthday,
      birthTime: form.birthTime,
      gender: form.gender,
    });
    latestResult.value = response.data.result;
    latestSubmitSaved.value = response.data.isSaved;
    latestRecordId.value = response.data.recordId;

    if (response.data.isSaved) {
      await loadHistory();
      uni.showToast({
        title: '排盘已保存',
        icon: 'success',
      });
      return;
    }

    uni.showToast({
      title: '排盘已生成',
      icon: 'success',
    });
  } catch (error) {
    console.warn('analyze bazi failed', error);
    uni.showToast({
      title: '生成失败，请稍后再试',
      icon: 'none',
    });
  } finally {
    submitting.value = false;
  }
}

function openFullReport() {
  if (!latestRecordId.value) {
    uni.showToast({
      title: '请先登录并保存结果',
      icon: 'none',
    });
    return;
  }

  uni.navigateTo({
    url: `/pages/report/index?recordId=${latestRecordId.value}`,
  });
}

function formatDateTime(value: string) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');

  return `${month}-${day} ${hours}:${minutes}`;
}

onLoad(() => {
  applyProfileDefaults();
  void loadHistory();
});

onShow(() => {
  authToken.value = getAuthToken();
  applyProfileDefaults();
  void loadHistory();
});
</script>

<style lang="scss">
.page {
  position: relative;
  min-height: 100vh;
  padding: 24rpx 24rpx 42rpx;
  background:
    radial-gradient(circle at top right, rgba(206, 187, 130, 0.18), transparent 26%),
    linear-gradient(180deg, #f7f3eb 0%, #efe9dd 100%);
  overflow: hidden;
}

.page-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(12rpx);
  opacity: 0.8;
  pointer-events: none;
}

.page-orb--jade {
  top: 36rpx;
  right: -90rpx;
  width: 280rpx;
  height: 280rpx;
  background: radial-gradient(circle, rgba(117, 160, 142, 0.36) 0%, rgba(117, 160, 142, 0) 72%);
}

.page-orb--gold {
  top: 320rpx;
  left: -120rpx;
  width: 300rpx;
  height: 300rpx;
  background: radial-gradient(circle, rgba(205, 174, 117, 0.22) 0%, rgba(205, 174, 117, 0) 74%);
}

.hero-sheet,
.input-sheet,
.result-sheet,
.history-sheet {
  position: relative;
  z-index: 1;
  margin-bottom: 20rpx;
  padding: 28rpx;
  border-radius: 34rpx;
  background: rgba(255, 252, 247, 0.82);
  border: 1rpx solid rgba(255, 248, 236, 0.86);
  box-shadow: 0 18rpx 50rpx rgba(88, 67, 27, 0.08);
}

.hero-sheet {
  display: grid;
  gap: 18rpx;
}

.hero-sheet__eyebrow,
.sheet-header__eyebrow {
  font-size: 20rpx;
  text-transform: uppercase;
  letter-spacing: 0.28em;
  color: #9e8a62;
}

.hero-sheet__title,
.sheet-header__title,
.reading-sheet__title,
.history-item__title,
.history-empty__title {
  font-size: 38rpx;
  font-weight: 700;
  color: #312618;
}

.hero-sheet__subtitle,
.history-item__summary,
.history-empty__text,
.result-sheet__summary,
.reading-sheet__text,
.field-note,
.focus-note,
.save-note,
.compliance-note {
  font-size: 26rpx;
  line-height: 1.7;
  color: #6c5b43;
}

.hero-sheet__meta,
.field-grid,
.tip-grid,
.history-list {
  display: grid;
  gap: 14rpx;
}

.hero-sheet__meta,
.field-grid,
.tip-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.meta-pill,
.field-block,
.reading-sheet,
.tip-tile,
.history-item,
.history-empty {
  display: grid;
  gap: 10rpx;
  padding: 22rpx;
  border-radius: 26rpx;
  background: rgba(248, 243, 233, 0.92);
}

.meta-pill__label,
.field-block__label,
.sheet-header__side,
.result-sheet__subtitle,
.history-item__subtitle,
.pillar-cell__label,
.tip-tile__label {
  font-size: 22rpx;
  color: #9e8a62;
}

.meta-pill__value,
.field-block__picker,
.pillar-cell__value,
.tip-tile__value,
.history-item__time {
  font-size: 28rpx;
  font-weight: 600;
  color: #312618;
}

.sheet-header,
.base-row,
.history-item__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
}

.sheet-header {
  margin-bottom: 18rpx;
}

.ghost-button {
  padding: 0 24rpx;
  min-height: 72rpx;
  border-radius: 999rpx;
  background: rgba(245, 237, 219, 0.95);
  color: #7c6541;
  line-height: 72rpx;
  font-size: 24rpx;
}

.ghost-button::after,
.primary-button::after {
  border: none;
}

.field-block__picker {
  min-height: 84rpx;
  padding: 0 24rpx;
  display: flex;
  align-items: center;
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.82);
}

.gender-row,
.keyword-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.gender-chip,
.keyword-chip {
  padding: 12rpx 20rpx;
  border-radius: 999rpx;
}

.gender-chip {
  background: rgba(255, 255, 255, 0.82);
  color: #7b6746;
  font-size: 24rpx;
}

.gender-chip--active {
  background: linear-gradient(135deg, #907046 0%, #c9a774 100%);
  color: #ffffff;
  font-weight: 600;
}

.field-note,
.focus-note,
.save-note,
.compliance-note {
  padding: 18rpx 20rpx;
  border-radius: 22rpx;
  background: rgba(244, 236, 220, 0.9);
}

.primary-button {
  min-height: 84rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #8d6a3d 0%, #c29a63 100%);
  color: #ffffff;
  line-height: 84rpx;
  font-size: 26rpx;
}

.pillar-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12rpx;
  margin: 22rpx 0 18rpx;
}

.pillar-cell {
  display: grid;
  gap: 10rpx;
  padding: 20rpx;
  border-radius: 24rpx;
  background: linear-gradient(180deg, rgba(248, 243, 233, 0.98) 0%, rgba(241, 233, 217, 0.98) 100%);
  text-align: center;
}

.pillar-cell__value {
  font-size: 34rpx;
}

.base-row {
  margin-bottom: 16rpx;
  flex-wrap: wrap;
  font-size: 24rpx;
  color: #7b6746;
}

.keyword-chip {
  background: rgba(232, 223, 205, 0.92);
  color: #7a6542;
  font-size: 22rpx;
}

.element-bars {
  display: grid;
  gap: 14rpx;
  margin: 20rpx 0;
}

.element-row {
  display: grid;
  grid-template-columns: 72rpx 1fr 44rpx;
  align-items: center;
  gap: 14rpx;
}

.element-row__name,
.element-row__value {
  font-size: 24rpx;
  color: #4b3a26;
}

.element-row__track {
  height: 18rpx;
  border-radius: 999rpx;
  background: rgba(230, 219, 197, 0.95);
  overflow: hidden;
}

.element-row__bar {
  height: 100%;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #7f9b84 0%, #c8a56f 100%);
}

.reading-sheet {
  margin-bottom: 16rpx;
}

.tip-grid {
  margin: 18rpx 0;
}

.history-empty,
.history-item {
  background: rgba(248, 243, 233, 0.92);
}
</style>
