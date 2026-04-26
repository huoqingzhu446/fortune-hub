<template>
  <view class="page" :style="themeVars">
    <view class="summary-band">
      <text class="summary-band__eyebrow">professional bazi detail</text>
      <text class="summary-band__title">{{ detail?.title || '八字专业详情' }}</text>
      <text class="summary-band__subtitle">
        {{ detail?.subtitle || '读取专业排盘、真太阳时校正、大运与流年信息。' }}
      </text>

      <view v-if="detail" class="summary-band__meta">
        <view class="summary-meta">
          <text class="summary-meta__label">出生地</text>
          <text class="summary-meta__value">{{ detail.professional.birthPlace }}</text>
        </view>
        <view class="summary-meta">
          <text class="summary-meta__label">校正时间</text>
          <text class="summary-meta__value">
            {{ detail.professional.adjustedBirthday }} {{ detail.professional.adjustedBirthTime }}
          </text>
        </view>
      </view>
    </view>

    <view class="tab-bar">
      <view
        v-for="tab in tabs"
        :key="tab.value"
        class="tab-bar__item"
        :class="{ 'tab-bar__item--active': activeTab === tab.value }"
        @tap="activeTab = tab.value"
      >
        <text>{{ tab.label }}</text>
      </view>
    </view>

    <view v-if="loading" class="state-panel">
      <text class="state-panel__title">正在读取专业详情...</text>
      <text class="state-panel__text">会同步四柱、强弱、大运和流年数据。</text>
    </view>

    <view v-else-if="errorMessage" class="state-panel">
      <text class="state-panel__title">详情读取失败</text>
      <text class="state-panel__text">{{ errorMessage }}</text>
      <button class="quiet-button" @tap="reloadDetail">重新读取</button>
    </view>

    <template v-else-if="detail">
      <view v-if="activeTab === 'chart'" class="content-stack">
        <view class="section">
          <view class="section__header">
            <view>
              <text class="section__eyebrow">chart</text>
              <text class="section__title">四柱排盘</text>
            </view>
            <text class="section__side">{{ detail.professional.library }}</text>
          </view>

          <view class="pillar-grid">
            <view v-for="item in pillarRows" :key="item.label" class="pillar-cell">
              <text class="pillar-cell__label">{{ item.label }}</text>
              <text class="pillar-cell__value">{{ item.pillar }}</text>
              <text class="pillar-cell__meta">{{ item.tenGod || '-' }}</text>
              <text class="pillar-cell__sub">{{ item.hiddenStems || '藏干 -' }}</text>
              <text class="pillar-cell__sub">{{ item.naYin || '纳音 -' }}</text>
            </view>
          </view>
        </view>

        <view class="section">
          <view class="section__header">
            <view>
              <text class="section__eyebrow">calibration</text>
              <text class="section__title">校正信息</text>
            </view>
            <text class="section__side">{{ offsetLabel }}</text>
          </view>

          <view class="info-grid">
            <view v-for="item in profileRows" :key="item.label" class="info-row">
              <text class="info-row__label">{{ item.label }}</text>
              <text class="info-row__value">{{ item.value }}</text>
            </view>
          </view>

          <view class="note-line">
            <text>{{ detail.professional.monthRule }}</text>
          </view>
        </view>
      </view>

      <view v-else-if="activeTab === 'analysis'" class="content-stack">
        <view class="section">
          <view class="section__header">
            <view>
              <text class="section__eyebrow">day master</text>
              <text class="section__title">日主强弱</text>
            </view>
            <text class="section__side">{{ strengthLabel }}</text>
          </view>

          <view class="score-panel">
            <view class="score-panel__main">
              <text class="score-panel__stem">
                {{ detail.dayMasterAnalysis.dayStem }}{{ detail.dayMasterAnalysis.dayElement }}
              </text>
              <text class="score-panel__text">
                月令{{ detail.dayMasterAnalysis.monthBranch }}{{ detail.dayMasterAnalysis.monthElement }} ·
                {{ detail.baseProfile.zodiac }}年
              </text>
            </view>
            <view class="score-panel__numbers">
              <view class="score-number">
                <text>{{ detail.dayMasterAnalysis.supportScore }}</text>
                <text>支持</text>
              </view>
              <view class="score-number">
                <text>{{ detail.dayMasterAnalysis.pressureScore }}</text>
                <text>压力</text>
              </view>
              <view class="score-number">
                <text>{{ detail.dayMasterAnalysis.balanceScore }}</text>
                <text>平衡</text>
              </view>
            </view>
          </view>
        </view>

        <view class="section">
          <view class="section__header">
            <view>
              <text class="section__eyebrow">elements</text>
              <text class="section__title">五行分布</text>
            </view>
            <text class="section__side">主轴 {{ detail.dominantElement.name }}</text>
          </view>

          <view class="element-bars">
            <view v-for="item in detail.fiveElements" :key="item.name" class="element-row">
              <text class="element-row__name">{{ item.name }}</text>
              <view class="element-row__track">
                <view class="element-row__bar" :style="{ width: formatElementWidth(item.value) }"></view>
              </view>
              <text class="element-row__value">{{ item.value }}</text>
            </view>
          </view>
        </view>

        <view class="two-column">
          <view class="section section--flat">
            <text class="section__title">喜用参考</text>
            <view class="text-list">
              <text
                v-for="item in detail.dayMasterAnalysis.usefulElements"
                :key="`useful-${item.name}`"
                class="text-list__item"
              >
                {{ item.name }}：{{ item.reason }}
              </text>
            </view>
          </view>
          <view class="section section--flat">
            <text class="section__title">忌神提示</text>
            <view class="text-list">
              <text
                v-for="item in detail.dayMasterAnalysis.avoidElements"
                :key="`avoid-${item.name}`"
                class="text-list__item"
              >
                {{ item.name }}：{{ item.reason }}
              </text>
            </view>
          </view>
        </view>
      </view>

      <view v-else-if="activeTab === 'luck'" class="content-stack">
        <view class="section">
          <view class="section__header">
            <view>
              <text class="section__eyebrow">decade fortune</text>
              <text class="section__title">大运详情</text>
            </view>
            <text class="section__side">{{ majorLuckDirectionLabel }}</text>
          </view>

          <view v-if="!detail.majorLuck.available" class="note-line">
            <text>{{ detail.majorLuck.reason || '当前排盘暂未生成大运。' }}</text>
          </view>

          <template v-else>
            <view class="start-age">
              <text class="start-age__label">起运</text>
              <text class="start-age__value">{{ majorLuckStartLabel }}</text>
            </view>

            <view class="timeline-list">
              <view v-for="item in detail.majorLuck.cycles" :key="item.index" class="timeline-item">
                <view class="timeline-item__marker"></view>
                <view class="timeline-item__body">
                  <view class="timeline-item__top">
                    <text class="timeline-item__title">{{ item.ganZhi }}运 · {{ item.tenGod }}</text>
                    <text class="timeline-item__range">{{ item.startAge }}-{{ item.endAge }}岁</text>
                  </view>
                  <text class="timeline-item__meta">
                    {{ item.startYear }}-{{ item.endYear }} · {{ item.element }}势
                  </text>
                </view>
              </view>
            </view>
          </template>
        </view>
      </view>

      <view v-else class="content-stack">
        <view class="section">
          <view class="section__header">
            <view>
              <text class="section__eyebrow">annual fortune</text>
              <text class="section__title">流年详情</text>
            </view>
            <text class="section__side">{{ detail.annualFortunes.length }} 年</text>
          </view>

          <view class="annual-list">
            <view v-for="item in detail.annualFortunes" :key="item.year" class="annual-item">
              <view class="annual-item__year">
                <text>{{ item.year }}</text>
                <text>{{ item.ganZhi }}</text>
              </view>
              <view class="annual-item__body">
                <text class="annual-item__title">{{ item.tenGod }} · {{ relationLabel(item.relation) }}</text>
                <text class="annual-item__meta">{{ item.nominalAge }}岁 · {{ item.element }}势</text>
              </view>
            </view>
          </view>
        </view>

        <view class="section">
          <view class="section__header">
            <view>
              <text class="section__eyebrow">reading</text>
              <text class="section__title">年度使用建议</text>
            </view>
          </view>
          <view class="text-list">
            <text class="text-list__item">{{ detail.reading.career }}</text>
            <text class="text-list__item">{{ detail.reading.rhythm }}</text>
          </view>
        </view>
      </view>

      <view class="compliance-note">
        <text>{{ detail.complianceNotice }}</text>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { onLoad, onShow } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import { fetchProfessionalBaziDetail } from '../../../api/bazi';
import { useThemePreference } from '../../../composables/useThemePreference';
import { getAuthToken } from '../../../services/session';
import type { BaziProfessionalDetail } from '../../../types/bazi';

type DetailTab = 'chart' | 'analysis' | 'luck' | 'annual';

const tabs: Array<{ label: string; value: DetailTab }> = [
  { label: '排盘', value: 'chart' },
  { label: '强弱', value: 'analysis' },
  { label: '大运', value: 'luck' },
  { label: '流年', value: 'annual' },
];

const { themeVars } = useThemePreference();
const activeTab = ref<DetailTab>('chart');
const detail = ref<BaziProfessionalDetail | null>(null);
const loading = ref(false);
const errorMessage = ref('');
const recordId = ref('');

const pillarRows = computed(() => {
  if (!detail.value) {
    return [];
  }

  const { chart, professional } = detail.value;

  return [
    {
      label: '年柱',
      pillar: chart.yearPillar,
      tenGod: professional.tenGods.year,
      hiddenStems: formatPillarMetaValue(professional.hiddenStems.year),
      naYin: professional.naYin.year,
    },
    {
      label: '月柱',
      pillar: chart.monthPillar,
      tenGod: professional.tenGods.month,
      hiddenStems: formatPillarMetaValue(professional.hiddenStems.month),
      naYin: professional.naYin.month,
    },
    {
      label: '日柱',
      pillar: chart.dayPillar,
      tenGod: professional.tenGods.day,
      hiddenStems: formatPillarMetaValue(professional.hiddenStems.day),
      naYin: professional.naYin.day,
    },
    {
      label: '时柱',
      pillar: chart.hourPillar,
      tenGod: professional.tenGods.time,
      hiddenStems: formatPillarMetaValue(professional.hiddenStems.time),
      naYin: professional.naYin.time,
    },
  ];
});

const profileRows = computed(() => {
  if (!detail.value) {
    return [];
  }

  const { inputSnapshot, correctionSnapshot, professional } = detail.value;

  return [
    {
      label: '原始时间',
      value: `${inputSnapshot.birthday} ${inputSnapshot.birthTime}`,
    },
    {
      label: '真太阳时',
      value: `${correctionSnapshot.adjustedBirthday} ${correctionSnapshot.adjustedBirthTime}`,
    },
    {
      label: '经纬度',
      value: `${formatCoordinate(professional.longitude, 'E', 'W')} ${formatCoordinate(professional.latitude, 'N', 'S')}`,
    },
    {
      label: '时区',
      value: `UTC${professional.timezoneOffset >= 0 ? '+' : ''}${professional.timezoneOffset}`,
    },
    {
      label: '农历',
      value: `${professional.lunar.yearInChinese}年${professional.lunar.monthInChinese}月${professional.lunar.dayInChinese}`,
    },
    {
      label: '算法',
      value: detail.value.algorithmVersion,
    },
  ];
});

const offsetLabel = computed(() => {
  const offset = detail.value?.professional.trueSolarOffsetMinutes ?? 0;

  return `${offset >= 0 ? '+' : ''}${offset} 分钟`;
});

const strengthLabel = computed(() => {
  const strength = detail.value?.dayMasterAnalysis.strengthLevel;

  if (!strength) {
    return '';
  }

  return formatStrengthLevel(strength);
});

const majorLuckDirectionLabel = computed(() => {
  const direction = detail.value?.majorLuck.direction;

  if (!direction || direction === 'unknown') {
    return '未判定';
  }

  return direction === 'forward' ? '顺行' : '逆行';
});

const majorLuckStartLabel = computed(() => {
  const majorLuck = detail.value?.majorLuck;

  if (!majorLuck?.available) {
    return '-';
  }

  const parts = [
    formatAgePart(majorLuck.startAgeYears, '年'),
    formatAgePart(majorLuck.startAgeMonths, '个月'),
    formatAgePart(majorLuck.startAgeDays, '天'),
    formatAgePart(majorLuck.startAgeHours, '小时'),
  ].filter(Boolean);

  return parts.length ? parts.join(' ') : '起运时间未返回';
});

function reloadDetail() {
  if (!recordId.value) {
    errorMessage.value = '缺少专业排盘记录 ID';
    return;
  }

  void loadDetail(recordId.value);
}

async function loadDetail(targetRecordId: string) {
  if (!getAuthToken()) {
    detail.value = null;
    errorMessage.value = '请先登录后查看已保存的专业排盘详情。';
    return;
  }

  try {
    loading.value = true;
    errorMessage.value = '';
    const response = await fetchProfessionalBaziDetail(targetRecordId);
    detail.value = response.data.detail;
  } catch (error) {
    console.warn('load professional bazi detail failed', error);
    const message = (error as { message?: string })?.message;
    errorMessage.value = message || '服务暂时不可用，请稍后再试。';
  } finally {
    loading.value = false;
  }
}

function formatPillarMetaValue(value: string | string[]) {
  return Array.isArray(value) ? value.join('、') : value;
}

function formatCoordinate(value: number, positiveSuffix: string, negativeSuffix: string) {
  return `${Math.abs(value).toFixed(2)}${value >= 0 ? positiveSuffix : negativeSuffix}`;
}

function formatStrengthLevel(value: 'strong' | 'weak' | 'balanced') {
  const labels = {
    strong: '日主偏强',
    weak: '日主偏弱',
    balanced: '日主中和',
  };

  return labels[value];
}

function formatElementWidth(value: number) {
  return `${Math.min(100, Math.max(12, value * 12))}%`;
}

function relationLabel(value: 'support' | 'drain' | 'wealth' | 'officer' | 'peer') {
  const labels = {
    support: '生扶',
    drain: '泄秀',
    wealth: '财星',
    officer: '官杀',
    peer: '同类',
  };

  return labels[value];
}

function formatAgePart(value: number | null, unit: string) {
  if (value === null || value === undefined) {
    return '';
  }

  return `${value}${unit}`;
}

onLoad((options) => {
  const nextRecordId = String((options as { recordId?: string } | undefined)?.recordId || '');
  recordId.value = decodeURIComponent(nextRecordId);

  if (!recordId.value) {
    errorMessage.value = '缺少专业排盘记录 ID';
    return;
  }

  void loadDetail(recordId.value);
});

onShow(() => {
  if (recordId.value && !detail.value && !loading.value) {
    void loadDetail(recordId.value);
  }
});
</script>

<style lang="scss">
.page {
  min-height: 100vh;
  padding: 24rpx 24rpx 46rpx;
  background:
    linear-gradient(180deg, rgba(247, 244, 235, 0.98) 0%, rgba(239, 235, 223, 0.98) 100%);
}

.summary-band,
.section,
.state-panel,
.compliance-note {
  margin-bottom: 20rpx;
  padding: 28rpx;
  border-radius: 26rpx;
  background: rgba(255, 252, 247, 0.88);
  border: 1rpx solid rgba(219, 208, 186, 0.72);
  box-shadow: 0 16rpx 42rpx rgba(71, 55, 34, 0.06);
}

.summary-band {
  display: grid;
  gap: 16rpx;
  background:
    linear-gradient(135deg, rgba(54, 79, 72, 0.96) 0%, rgba(107, 82, 43, 0.94) 100%);
}

.summary-band__eyebrow,
.section__eyebrow {
  font-size: 20rpx;
  text-transform: uppercase;
  letter-spacing: 0.22em;
}

.summary-band__eyebrow {
  color: rgba(245, 231, 202, 0.78);
}

.summary-band__title {
  font-size: 42rpx;
  font-weight: 800;
  color: #fffaf0;
}

.summary-band__subtitle {
  font-size: 26rpx;
  line-height: 1.65;
  color: rgba(255, 250, 240, 0.78);
}

.summary-band__meta,
.info-grid,
.two-column {
  display: grid;
  gap: 14rpx;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.summary-meta {
  display: grid;
  gap: 8rpx;
  padding: 18rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.12);
}

.summary-meta__label {
  font-size: 22rpx;
  color: rgba(255, 250, 240, 0.66);
}

.summary-meta__value {
  font-size: 25rpx;
  font-weight: 700;
  color: #fffaf0;
}

.tab-bar {
  position: sticky;
  top: 0;
  z-index: 2;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8rpx;
  margin-bottom: 20rpx;
  padding: 8rpx;
  border-radius: 22rpx;
  background: rgba(231, 224, 209, 0.92);
}

.tab-bar__item {
  min-height: 68rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18rpx;
  color: #78664b;
  font-size: 24rpx;
  font-weight: 600;
}

.tab-bar__item--active {
  background: #365048;
  color: #fffaf0;
}

.content-stack {
  display: grid;
  gap: 18rpx;
}

.section {
  display: grid;
  gap: 18rpx;
}

.section--flat {
  box-shadow: none;
}

.section__header,
.timeline-item__top,
.annual-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
}

.section__eyebrow {
  color: #94825f;
}

.section__title,
.state-panel__title {
  font-size: 32rpx;
  font-weight: 800;
  color: #2d2518;
}

.section__side {
  flex: 0 0 auto;
  font-size: 22rpx;
  color: #8f794f;
}

.pillar-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12rpx;
}

.pillar-cell,
.info-row,
.score-panel,
.start-age,
.timeline-item__body,
.annual-item,
.note-line,
.text-list__item {
  border-radius: 20rpx;
  background: rgba(246, 240, 227, 0.92);
}

.pillar-cell {
  display: grid;
  gap: 8rpx;
  padding: 18rpx 12rpx;
  text-align: center;
}

.pillar-cell__label,
.pillar-cell__meta,
.pillar-cell__sub,
.info-row__label,
.state-panel__text,
.annual-item__meta,
.timeline-item__meta,
.score-panel__text,
.note-line,
.text-list__item,
.compliance-note {
  font-size: 23rpx;
  line-height: 1.55;
  color: #7a684c;
}

.pillar-cell__value {
  font-size: 34rpx;
  font-weight: 800;
  color: #2d2518;
}

.pillar-cell__sub {
  word-break: break-all;
}

.info-row {
  display: grid;
  gap: 8rpx;
  padding: 18rpx;
}

.info-row__value {
  font-size: 26rpx;
  font-weight: 700;
  color: #2d2518;
  word-break: break-word;
}

.note-line,
.text-list__item,
.compliance-note {
  padding: 18rpx 20rpx;
}

.score-panel {
  display: grid;
  gap: 18rpx;
  padding: 22rpx;
}

.score-panel__main {
  display: grid;
  gap: 8rpx;
}

.score-panel__stem {
  font-size: 48rpx;
  font-weight: 800;
  color: #365048;
}

.score-panel__numbers {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
}

.score-number {
  display: grid;
  gap: 6rpx;
  padding: 16rpx;
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.62);
  text-align: center;
}

.score-number text:first-child {
  font-size: 30rpx;
  font-weight: 800;
  color: #2d2518;
}

.score-number text:last-child {
  font-size: 22rpx;
  color: #8f794f;
}

.element-bars,
.text-list,
.timeline-list,
.annual-list {
  display: grid;
  gap: 12rpx;
}

.element-row {
  display: grid;
  grid-template-columns: 64rpx 1fr 46rpx;
  align-items: center;
  gap: 14rpx;
}

.element-row__name,
.element-row__value {
  font-size: 24rpx;
  font-weight: 700;
  color: #3f3322;
}

.element-row__track {
  height: 18rpx;
  overflow: hidden;
  border-radius: 999rpx;
  background: rgba(225, 216, 197, 0.95);
}

.element-row__bar {
  height: 100%;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #365048 0%, #bb935a 100%);
}

.start-age {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 22rpx;
}

.start-age__label {
  font-size: 24rpx;
  color: #8f794f;
}

.start-age__value {
  font-size: 28rpx;
  font-weight: 800;
  color: #2d2518;
}

.timeline-item {
  position: relative;
  display: grid;
  grid-template-columns: 28rpx 1fr;
  gap: 14rpx;
}

.timeline-item__marker {
  width: 18rpx;
  height: 18rpx;
  margin-top: 28rpx;
  border-radius: 50%;
  background: #365048;
}

.timeline-item__body {
  display: grid;
  gap: 8rpx;
  padding: 18rpx 20rpx;
}

.timeline-item__title,
.annual-item__title {
  font-size: 26rpx;
  font-weight: 800;
  color: #2d2518;
}

.timeline-item__range {
  flex: 0 0 auto;
  font-size: 22rpx;
  color: #8f794f;
}

.annual-item {
  padding: 18rpx;
}

.annual-item__year {
  flex: 0 0 128rpx;
  display: grid;
  gap: 6rpx;
  color: #365048;
  font-weight: 800;
}

.annual-item__year text:first-child {
  font-size: 30rpx;
}

.annual-item__year text:last-child {
  font-size: 24rpx;
}

.annual-item__body {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 8rpx;
}

.state-panel {
  display: grid;
  gap: 14rpx;
}

.quiet-button {
  min-height: 76rpx;
  border-radius: 999rpx;
  background: #365048;
  color: #fffaf0;
  line-height: 76rpx;
  font-size: 25rpx;
}

.quiet-button::after {
  border: none;
}

@media (max-width: 380px) {
  .summary-band__meta,
  .info-grid,
  .two-column,
  .pillar-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .tab-bar {
    gap: 6rpx;
  }

  .tab-bar__item {
    font-size: 22rpx;
  }
}
</style>
