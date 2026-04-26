<template>
  <view class="page" :style="themeVars">
    <view class="page-orb page-orb--jade"></view>
    <view class="page-orb page-orb--gold"></view>

    <view class="hero-sheet">
      <text class="hero-sheet__eyebrow">{{ heroEyebrow }}</text>
      <text class="hero-sheet__title">{{ heroTitle }}</text>
      <text class="hero-sheet__subtitle">
        {{ heroSubtitle }}
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

      <view class="mode-switch">
        <view
          v-for="option in modeOptions"
          :key="option.value"
          class="mode-switch__option"
          :class="{ 'mode-switch__option--active': activeMode === option.value }"
          @tap="selectMode(option.value)"
        >
          <text class="mode-switch__title">{{ option.label }}</text>
          <text class="mode-switch__desc">{{ option.description }}</text>
        </view>
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

      <view v-if="isProfessionalMode" class="professional-inputs">
        <view class="sheet-header sheet-header--compact">
          <view>
            <text class="sheet-header__eyebrow">true solar time</text>
            <text class="sheet-header__title">专业校正</text>
          </view>
        </view>
        <view class="field-block">
          <text class="field-block__label">出生地</text>
          <input
            v-model="citySearch"
            class="field-block__input"
            placeholder="搜索城市，如杭州 / hangzhou"
            @input="handleBirthPlaceSearchInput"
          />
          <view class="city-result-list">
            <view
              v-for="option in filteredBirthPlaces"
              :key="option.value"
              class="city-result"
              :class="{ 'city-result--active': option.value === selectedBirthPlace.value }"
              @tap="selectBirthPlace(option)"
            >
              <text class="city-result__name">{{ option.label }}</text>
              <text class="city-result__meta">{{ formatBirthPlaceMeta(option) }}</text>
            </view>
            <view v-if="loadingBirthPlaces" class="city-result city-result--empty">
              <text class="city-result__name">正在搜索出生地...</text>
            </view>
            <view v-else-if="!filteredBirthPlaces.length" class="city-result city-result--empty">
              <text class="city-result__name">未找到匹配城市</text>
            </view>
          </view>
        </view>
      </view>

      <view class="field-note">
        <text>{{ modeNotice }}</text>
      </view>

      <button class="primary-button" :loading="submitting" @tap="submitAnalyze">
        {{ submitButtonLabel }}
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

      <view v-if="latestResult.professional" class="professional-sheet">
        <view class="sheet-header sheet-header--compact">
          <view>
            <text class="sheet-header__eyebrow">professional details</text>
            <text class="sheet-header__title">专业排盘信息</text>
          </view>
          <text class="sheet-header__side">{{ latestResult.professional.library }}</text>
        </view>

        <view class="professional-meta">
          <view v-for="item in professionalProfileRows" :key="item.label" class="professional-meta__item">
            <text class="professional-meta__label">{{ item.label }}</text>
            <text class="professional-meta__value">{{ item.value }}</text>
          </view>
        </view>

        <view class="reading-sheet">
          <text class="reading-sheet__title">节气规则</text>
          <text class="reading-sheet__text">{{ latestResult.professional.monthRule }}</text>
        </view>

        <view class="professional-grid">
          <view class="professional-group">
            <text class="professional-group__title">十神</text>
            <text
              v-for="item in formatPillarMetaRows(latestResult.professional.tenGods)"
              :key="`ten-${item.label}`"
              class="professional-group__row"
            >
              {{ item.label }}：{{ item.value || '-' }}
            </text>
          </view>
          <view class="professional-group">
            <text class="professional-group__title">藏干</text>
            <text
              v-for="item in formatPillarMetaRows(latestResult.professional.hiddenStems)"
              :key="`hide-${item.label}`"
              class="professional-group__row"
            >
              {{ item.label }}：{{ item.value || '-' }}
            </text>
          </view>
          <view class="professional-group">
            <text class="professional-group__title">纳音</text>
            <text
              v-for="item in formatPillarMetaRows(latestResult.professional.naYin)"
              :key="`nayin-${item.label}`"
              class="professional-group__row"
            >
              {{ item.label }}：{{ item.value || '-' }}
            </text>
          </view>
        </view>

        <view class="reading-sheet">
          <text class="reading-sheet__title">日主强弱</text>
          <text class="reading-sheet__text">{{ professionalDayMasterSummary }}</text>
        </view>

        <view class="professional-grid professional-grid--two">
          <view class="professional-group">
            <text class="professional-group__title">喜用参考</text>
            <text
              v-for="item in professionalUsefulElements"
              :key="`useful-${item.name}`"
              class="professional-group__row"
            >
              {{ item.name }}：{{ item.reason }}
            </text>
          </view>
          <view class="professional-group">
            <text class="professional-group__title">忌神提示</text>
            <text
              v-for="item in professionalAvoidElements"
              :key="`avoid-${item.name}`"
              class="professional-group__row"
            >
              {{ item.name }}：{{ item.reason }}
            </text>
          </view>
        </view>

        <view class="reading-sheet">
          <text class="reading-sheet__title">大运起运</text>
          <text v-if="!latestResult.professional.majorLuck.available" class="reading-sheet__text">
            {{ latestResult.professional.majorLuck.reason }}
          </text>
          <view v-else class="fortune-list">
            <view v-for="item in professionalMajorLuckRows" :key="item.key" class="fortune-row">
              <text class="fortune-row__title">{{ item.title }}</text>
              <text class="fortune-row__meta">{{ item.meta }}</text>
            </view>
          </view>
        </view>

        <view class="reading-sheet">
          <text class="reading-sheet__title">近年流年</text>
          <view class="fortune-list">
            <view v-for="item in professionalAnnualFortuneRows" :key="item.key" class="fortune-row">
              <text class="fortune-row__title">{{ item.title }}</text>
              <text class="fortune-row__meta">{{ item.meta }}</text>
            </view>
          </view>
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

      <button
        v-if="latestResult.professional"
        class="secondary-button"
        @tap="openProfessionalDetail"
      >
        {{ latestRecordId ? '查看专业详情' : '登录后查看专业详情' }}
      </button>

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
        <view
          v-for="item in historyItems"
          :key="item.id"
          class="history-item"
          :class="{ 'history-item--actionable': item.isProfessional }"
          @tap="openHistoryItem(item)"
        >
          <view class="history-item__top">
            <view>
              <view class="history-item__title-row">
                <text class="history-item__title">{{ item.title }}</text>
                <text v-if="item.isProfessional" class="history-item__badge">专业</text>
              </view>
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
import {
  analyzeBazi,
  analyzeProfessionalBazi,
  fetchBaziHistory,
  searchBaziBirthPlaces,
} from '../../api/bazi';
import { useThemePreference } from '../../composables/useThemePreference';
import { getAuthToken, getCachedUser } from '../../services/session';
import type { BaziBirthPlace, BaziHistoryItem, BaziResult } from '../../types/bazi';

type GenderValue = 'male' | 'female' | 'unknown';
type AnalyzeMode = 'lite' | 'professional';

type PillarMeta = {
  year: string | string[];
  month: string | string[];
  day: string | string[];
  time: string | string[];
};

type BirthPlaceOption = {
  label: string;
  value: string;
  province?: string;
  country?: string;
  longitude: number;
  latitude?: number;
  timezoneOffset: number;
  keywords?: string[];
};

const BIRTH_PLACE_RESULT_LIMIT = 8;

const genderOptions: Array<{ label: string; value: GenderValue }> = [
  { label: '男', value: 'male' },
  { label: '女', value: 'female' },
  { label: '保密', value: 'unknown' },
];

const modeOptions: Array<{ label: string; value: AnalyzeMode; description: string }> = [
  {
    label: '轻解读',
    value: 'lite',
    description: '快速生成四柱概要、五行倾向和日常建议。',
  },
  {
    label: '专业解读',
    value: 'professional',
    description: '按节气换月、立春年界和真太阳时校正。',
  },
];

const DEFAULT_BIRTH_PLACE_OPTIONS: BirthPlaceOption[] = [
  { label: '杭州', value: 'hangzhou', longitude: 120.16, timezoneOffset: 8, keywords: ['浙江'] },
  { label: '北京', value: 'beijing', longitude: 116.4, timezoneOffset: 8, keywords: ['bj'] },
  { label: '上海', value: 'shanghai', longitude: 121.47, timezoneOffset: 8, keywords: ['sh'] },
  { label: '广州', value: 'guangzhou', longitude: 113.26, timezoneOffset: 8, keywords: ['广东'] },
  { label: '深圳', value: 'shenzhen', longitude: 114.06, timezoneOffset: 8, keywords: ['广东'] },
  { label: '南京', value: 'nanjing', longitude: 118.78, timezoneOffset: 8, keywords: ['江苏'] },
  { label: '徐州', value: 'xuzhou', longitude: 117.18, timezoneOffset: 8, keywords: ['江苏', 'xz'] },
  { label: '无锡', value: 'wuxi', longitude: 120.31, timezoneOffset: 8, keywords: ['江苏'] },
  { label: '常州', value: 'changzhou', longitude: 119.95, timezoneOffset: 8, keywords: ['江苏'] },
  { label: '苏州', value: 'suzhou', longitude: 120.58, timezoneOffset: 8, keywords: ['江苏'] },
  { label: '南通', value: 'nantong', longitude: 120.89, timezoneOffset: 8, keywords: ['江苏'] },
  { label: '连云港', value: 'lianyungang', longitude: 119.22, timezoneOffset: 8, keywords: ['江苏', 'lyg'] },
  { label: '淮安', value: 'huaian', longitude: 119.02, timezoneOffset: 8, keywords: ['江苏', 'huai an'] },
  { label: '盐城', value: 'yancheng', longitude: 120.16, timezoneOffset: 8, keywords: ['江苏'] },
  { label: '扬州', value: 'yangzhou', longitude: 119.41, timezoneOffset: 8, keywords: ['江苏'] },
  { label: '镇江', value: 'zhenjiang', longitude: 119.45, timezoneOffset: 8, keywords: ['江苏'] },
  { label: '泰州', value: 'taizhou-jiangsu', longitude: 119.92, timezoneOffset: 8, keywords: ['江苏', 'taizhou'] },
  { label: '宿迁', value: 'suqian', longitude: 118.28, timezoneOffset: 8, keywords: ['江苏'] },
  { label: '天津', value: 'tianjin', longitude: 117.2, timezoneOffset: 8, keywords: ['tj'] },
  { label: '石家庄', value: 'shijiazhuang', longitude: 114.51, timezoneOffset: 8, keywords: ['河北', 'sjz'] },
  { label: '太原', value: 'taiyuan', longitude: 112.55, timezoneOffset: 8, keywords: ['山西'] },
  { label: '呼和浩特', value: 'hohhot', longitude: 111.75, timezoneOffset: 8, keywords: ['内蒙古', 'huhehaote'] },
  { label: '成都', value: 'chengdu', longitude: 104.06, timezoneOffset: 8, keywords: ['四川'] },
  { label: '重庆', value: 'chongqing', longitude: 106.55, timezoneOffset: 8, keywords: ['cq'] },
  { label: '西安', value: 'xian', longitude: 108.94, timezoneOffset: 8, keywords: ['陕西', 'xi an'] },
  { label: '武汉', value: 'wuhan', longitude: 114.31, timezoneOffset: 8, keywords: ['湖北'] },
  { label: '长沙', value: 'changsha', longitude: 112.94, timezoneOffset: 8, keywords: ['湖南'] },
  { label: '郑州', value: 'zhengzhou', longitude: 113.62, timezoneOffset: 8, keywords: ['河南'] },
  { label: '济南', value: 'jinan', longitude: 117.12, timezoneOffset: 8, keywords: ['山东', 'ji nan'] },
  { label: '青岛', value: 'qingdao', longitude: 120.38, timezoneOffset: 8, keywords: ['山东'] },
  { label: '烟台', value: 'yantai', longitude: 121.45, timezoneOffset: 8, keywords: ['山东'] },
  { label: '潍坊', value: 'weifang', longitude: 119.16, timezoneOffset: 8, keywords: ['山东'] },
  { label: '临沂', value: 'linyi', longitude: 118.36, timezoneOffset: 8, keywords: ['山东'] },
  { label: '沈阳', value: 'shenyang', longitude: 123.43, timezoneOffset: 8, keywords: ['辽宁'] },
  { label: '大连', value: 'dalian', longitude: 121.61, timezoneOffset: 8, keywords: ['辽宁'] },
  { label: '长春', value: 'changchun', longitude: 125.32, timezoneOffset: 8, keywords: ['吉林'] },
  { label: '哈尔滨', value: 'harbin', longitude: 126.64, timezoneOffset: 8, keywords: ['黑龙江'] },
  { label: '合肥', value: 'hefei', longitude: 117.23, timezoneOffset: 8, keywords: ['安徽'] },
  { label: '芜湖', value: 'wuhu', longitude: 118.38, timezoneOffset: 8, keywords: ['安徽'] },
  { label: '宁波', value: 'ningbo', longitude: 121.55, timezoneOffset: 8, keywords: ['浙江'] },
  { label: '温州', value: 'wenzhou', longitude: 120.7, timezoneOffset: 8, keywords: ['浙江'] },
  { label: '嘉兴', value: 'jiaxing', longitude: 120.76, timezoneOffset: 8, keywords: ['浙江'] },
  { label: '绍兴', value: 'shaoxing', longitude: 120.58, timezoneOffset: 8, keywords: ['浙江'] },
  { label: '金华', value: 'jinhua', longitude: 119.65, timezoneOffset: 8, keywords: ['浙江'] },
  { label: '台州', value: 'taizhou-zhejiang', longitude: 121.42, timezoneOffset: 8, keywords: ['浙江', 'taizhou'] },
  { label: '福州', value: 'fuzhou', longitude: 119.3, timezoneOffset: 8, keywords: ['福建'] },
  { label: '厦门', value: 'xiamen', longitude: 118.09, timezoneOffset: 8, keywords: ['福建'] },
  { label: '泉州', value: 'quanzhou', longitude: 118.68, timezoneOffset: 8, keywords: ['福建'] },
  { label: '南昌', value: 'nanchang', longitude: 115.86, timezoneOffset: 8, keywords: ['江西'] },
  { label: '昆明', value: 'kunming', longitude: 102.83, timezoneOffset: 8, keywords: ['云南'] },
  { label: '贵阳', value: 'guiyang', longitude: 106.63, timezoneOffset: 8, keywords: ['贵州'] },
  { label: '南宁', value: 'nanning', longitude: 108.37, timezoneOffset: 8, keywords: ['广西'] },
  { label: '海口', value: 'haikou', longitude: 110.2, timezoneOffset: 8, keywords: ['海南'] },
  { label: '三亚', value: 'sanya', longitude: 109.51, timezoneOffset: 8, keywords: ['海南'] },
  { label: '兰州', value: 'lanzhou', longitude: 103.84, timezoneOffset: 8, keywords: ['甘肃'] },
  { label: '西宁', value: 'xining', longitude: 101.78, timezoneOffset: 8, keywords: ['青海'] },
  { label: '银川', value: 'yinchuan', longitude: 106.23, timezoneOffset: 8, keywords: ['宁夏'] },
  { label: '拉萨', value: 'lhasa', longitude: 91.13, timezoneOffset: 8, keywords: ['西藏'] },
  { label: '乌鲁木齐', value: 'urumqi', longitude: 87.62, timezoneOffset: 8, keywords: ['新疆', 'wulumuqi'] },
  { label: '香港', value: 'hongkong', longitude: 114.17, timezoneOffset: 8, keywords: ['hong kong', 'hk'] },
  { label: '澳门', value: 'macau', longitude: 113.54, timezoneOffset: 8, keywords: ['aomen', 'macao'] },
  { label: '台北', value: 'taipei', longitude: 121.56, timezoneOffset: 8, keywords: ['台湾'] },
  { label: '新加坡', value: 'singapore', longitude: 103.85, timezoneOffset: 8, keywords: ['sg'] },
  { label: '东京', value: 'tokyo', longitude: 139.69, timezoneOffset: 9, keywords: ['日本'] },
  { label: '首尔', value: 'seoul', longitude: 126.98, timezoneOffset: 9, keywords: ['韩国'] },
  { label: '伦敦', value: 'london', longitude: -0.13, timezoneOffset: 0, keywords: ['英国'] },
  { label: '纽约', value: 'new-york', longitude: -74.01, timezoneOffset: -5, keywords: ['new york', 'newyork'] },
  { label: '洛杉矶', value: 'los-angeles', longitude: -118.24, timezoneOffset: -8, keywords: ['los angeles', 'la'] },
  { label: '悉尼', value: 'sydney', longitude: 151.21, timezoneOffset: 10, keywords: ['澳大利亚'] },
];

const form = reactive<{
  birthday: string;
  birthTime: string;
  gender: GenderValue;
  birthPlaceCode: string;
}>({
  birthday: '',
  birthTime: '',
  gender: 'unknown',
  birthPlaceCode: 'hangzhou',
});

const latestResult = ref<BaziResult | null>(null);
const latestSubmitSaved = ref(false);
const latestRecordId = ref<string | null>(null);
const historyItems = ref<BaziHistoryItem[]>([]);
const { themeVars } = useThemePreference();
const loadingHistory = ref(false);
const submitting = ref(false);
const authToken = ref(getAuthToken());
const activeMode = ref<AnalyzeMode>('lite');
const citySearch = ref('杭州');
const birthPlaceOptions = ref<BirthPlaceOption[]>(
  DEFAULT_BIRTH_PLACE_OPTIONS.slice(0, BIRTH_PLACE_RESULT_LIMIT),
);
const loadingBirthPlaces = ref(false);
let birthPlaceSearchTimer: ReturnType<typeof setTimeout> | null = null;
let birthPlaceSearchSequence = 0;

const isLoggedIn = computed(() => Boolean(authToken.value));
const isProfessionalMode = computed(() => activeMode.value === 'professional');
const loginStatusLabel = computed(() => (isLoggedIn.value ? '当前状态' : '保存历史'));
const loginStatusValue = computed(() => (isLoggedIn.value ? '已登录' : '需登录'));
const latestResultLabel = computed(() => latestResult.value?.title || '等待生成');
const selectedBirthPlace = computed(
  () =>
    birthPlaceOptions.value.find((item) => item.value === form.birthPlaceCode) ??
    DEFAULT_BIRTH_PLACE_OPTIONS.find((item) => item.value === form.birthPlaceCode) ??
    DEFAULT_BIRTH_PLACE_OPTIONS[0],
);
const filteredBirthPlaces = computed(() => {
  const keyword = normalizeCityKeyword(citySearch.value);
  const matches = keyword
    ? birthPlaceOptions.value.filter((option) => matchesBirthPlace(option, keyword))
    : birthPlaceOptions.value;
  const selected = selectedBirthPlace.value;
  const shouldPinSelected = !keyword || matches.some((option) => option.value === selected.value);
  const rankedMatches = shouldPinSelected
    ? [selected, ...matches.filter((option) => option.value !== selected.value)]
    : matches;

  return rankedMatches.slice(0, 6);
});
const heroEyebrow = computed(() => (isProfessionalMode.value ? 'professional bazi chart' : 'lite bazi chart'));
const heroTitle = computed(() => (isProfessionalMode.value ? '八字专业版' : '八字解读'));
const heroSubtitle = computed(() =>
  isProfessionalMode.value
    ? '专业版会使用农历/干支库，纳入节气换月、立春年界与真太阳时校正，并展示十神、藏干、纳音等专业信息。'
    : '轻解读会根据生日、时辰和性别生成一份可读的四柱概要、五行倾向与日常建议。',
);
const modeNotice = computed(() =>
  isProfessionalMode.value
    ? '专业版说明：出生地用于真太阳时校正，会按所选城市和当地时区推算。结果仍仅用于内容体验和自我观察。'
    : '轻解读说明：当前会直接使用公历日期与时辰做快速推演，不包含节气换月与真太阳时校正。',
);
const submitButtonLabel = computed(() => (isProfessionalMode.value ? '生成专业排盘' : '生成轻解读'));
const professionalProfileRows = computed(() => {
  const professional = latestResult.value?.professional;

  if (!professional) {
    return [];
  }

  return [
    {
      label: '校正时间',
      value: `${professional.adjustedBirthday} ${professional.adjustedBirthTime}`,
    },
    {
      label: '真太阳时偏移',
      value: `${professional.trueSolarOffsetMinutes >= 0 ? '+' : ''}${professional.trueSolarOffsetMinutes} 分钟`,
    },
    {
      label: '出生地',
      value: professional.birthPlace || selectedBirthPlace.value.label,
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
  ];
});
const professionalDayMasterSummary = computed(() => {
  const analysis = latestResult.value?.professional?.dayMasterAnalysis;

  if (!analysis) {
    return '';
  }

  return `${analysis.dayStem}${analysis.dayElement}日主 · ${formatStrengthLevel(analysis.strengthLevel)} · 支持 ${analysis.supportScore} / 压力 ${analysis.pressureScore} / 平衡 ${analysis.balanceScore}`;
});
const professionalUsefulElements = computed(
  () => latestResult.value?.professional?.dayMasterAnalysis.usefulElements ?? [],
);
const professionalAvoidElements = computed(
  () => latestResult.value?.professional?.dayMasterAnalysis.avoidElements ?? [],
);
const professionalMajorLuckRows = computed(() => {
  const majorLuck = latestResult.value?.professional?.majorLuck;

  if (!majorLuck?.available) {
    return [];
  }

  return majorLuck.cycles.slice(0, 4).map((item) => ({
    key: `${item.index}-${item.ganZhi}`,
    title: `${item.ganZhi}运 · ${item.tenGod}`,
    meta: `${item.startAge}-${item.endAge}岁 · ${item.startYear}-${item.endYear}`,
  }));
});
const professionalAnnualFortuneRows = computed(() =>
  (latestResult.value?.professional?.annualFortunes ?? []).slice(0, 5).map((item) => ({
    key: `${item.year}-${item.ganZhi}`,
    title: `${item.year} ${item.ganZhi} · ${item.tenGod}`,
    meta: `${item.nominalAge}岁 · ${formatAnnualRelation(item.relation)} · ${item.element}势`,
  })),
);

function selectMode(mode: AnalyzeMode) {
  activeMode.value = mode;

  if (mode === 'professional') {
    void searchBirthPlaces(citySearch.value);
  }
}

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

function handleBirthPlaceSearchInput(event: InputEvent) {
  const keyword = getInputEventValue(event) ?? citySearch.value;

  citySearch.value = keyword;

  const exactMatch = findBirthPlaceOption(keyword, birthPlaceOptions.value);

  if (exactMatch) {
    form.birthPlaceCode = exactMatch.value;
  }

  scheduleBirthPlaceSearch(keyword);
}

function selectBirthPlace(option: BirthPlaceOption) {
  form.birthPlaceCode = option.value;
  citySearch.value = option.label;
  birthPlaceOptions.value = mergeBirthPlaceOptions([option], birthPlaceOptions.value);
}

function hasExactBirthPlaceMatch(option: BirthPlaceOption, keyword: string) {
  const normalizedKeyword = normalizeCityKeyword(keyword);

  return getBirthPlaceSearchTexts(option).some((text) => normalizeCityKeyword(text) === normalizedKeyword);
}

function matchesBirthPlace(option: BirthPlaceOption, keyword: string) {
  return getBirthPlaceSearchTexts(option).some((text) => normalizeCityKeyword(text).includes(keyword));
}

function getBirthPlaceSearchTexts(option: BirthPlaceOption) {
  return [
    option.label,
    option.value,
    option.province ?? '',
    option.country ?? '',
    ...(option.keywords ?? []),
  ].filter(Boolean);
}

function normalizeCityKeyword(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, '');
}

function getInputEventValue(event: InputEvent) {
  const detail = (event as unknown as { detail?: { value?: unknown } }).detail;

  if (detail && typeof detail === 'object' && 'value' in detail) {
    return String(detail.value ?? '');
  }

  const target = (event as unknown as { target?: { value?: unknown } }).target;

  if (target && 'value' in target) {
    return String(target.value ?? '');
  }

  return null;
}

function scheduleBirthPlaceSearch(keyword: string) {
  if (birthPlaceSearchTimer) {
    clearTimeout(birthPlaceSearchTimer);
  }

  birthPlaceSearchTimer = setTimeout(() => {
    void searchBirthPlaces(keyword);
  }, 220);
}

async function searchBirthPlaces(keyword: string) {
  const requestId = ++birthPlaceSearchSequence;
  loadingBirthPlaces.value = true;

  try {
    const response = await searchBaziBirthPlaces(keyword, BIRTH_PLACE_RESULT_LIMIT);

    if (requestId !== birthPlaceSearchSequence) {
      return;
    }

    const places = response.data.items.map(mapBirthPlaceFromApi);
    birthPlaceOptions.value = mergeBirthPlaceOptions(
      selectedBirthPlace.value ? [selectedBirthPlace.value] : [],
      places,
    ).slice(0, BIRTH_PLACE_RESULT_LIMIT);
  } catch (error) {
    console.warn('search bazi birth places failed', error);

    if (requestId !== birthPlaceSearchSequence) {
      return;
    }

    birthPlaceOptions.value = searchDefaultBirthPlaces(keyword);
  } finally {
    if (requestId === birthPlaceSearchSequence) {
      loadingBirthPlaces.value = false;
    }
  }
}

function mapBirthPlaceFromApi(place: BaziBirthPlace): BirthPlaceOption {
  return {
    label: place.label,
    value: place.code,
    province: place.province,
    country: place.country,
    longitude: place.longitude,
    latitude: place.latitude,
    timezoneOffset: place.timezoneOffset,
    keywords: place.keywords,
  };
}

function searchDefaultBirthPlaces(keyword: string) {
  const normalizedKeyword = normalizeCityKeyword(keyword);
  const matches = normalizedKeyword
    ? DEFAULT_BIRTH_PLACE_OPTIONS.filter((option) => matchesBirthPlace(option, normalizedKeyword))
    : DEFAULT_BIRTH_PLACE_OPTIONS;

  return matches.slice(0, BIRTH_PLACE_RESULT_LIMIT);
}

function findBirthPlaceOption(keyword: string, options: BirthPlaceOption[]) {
  return options.find((option) => hasExactBirthPlaceMatch(option, keyword));
}

function mergeBirthPlaceOptions(
  pinnedOptions: BirthPlaceOption[],
  options: BirthPlaceOption[],
) {
  const result: BirthPlaceOption[] = [];
  const seen = new Set<string>();

  for (const option of [...pinnedOptions, ...options]) {
    if (seen.has(option.value)) {
      continue;
    }

    seen.add(option.value);
    result.push(option);
  }

  return result;
}

async function submitAnalyze() {
  if (!form.birthday || !form.birthTime) {
    uni.showToast({
      title: '请先填写生日和时辰',
      icon: 'none',
    });
    return;
  }

  const professionalPayload = isProfessionalMode.value ? await buildProfessionalPayload() : null;

  if (isProfessionalMode.value && !professionalPayload) {
    return;
  }

  try {
    submitting.value = true;
    const payload = {
      birthday: form.birthday,
      birthTime: form.birthTime,
      gender: form.gender,
      ...(professionalPayload ?? {}),
    };
    const response = isProfessionalMode.value
      ? await analyzeProfessionalBazi(payload)
      : await analyzeBazi(payload);
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

async function buildProfessionalPayload() {
  const birthPlace = await resolveBirthPlaceForSubmit();

  if (!birthPlace) {
    return null;
  }

  return {
    birthPlace: birthPlace.label,
    longitude: birthPlace.longitude,
    ...(typeof birthPlace.latitude === 'number' ? { latitude: birthPlace.latitude } : {}),
    timezoneOffset: birthPlace.timezoneOffset,
  };
}

async function resolveBirthPlaceForSubmit() {
  const keyword = normalizeCityKeyword(citySearch.value);
  const selected = selectedBirthPlace.value;

  if (!keyword || matchesBirthPlace(selected, keyword)) {
    return selected;
  }

  let firstMatch = birthPlaceOptions.value.find((option) => matchesBirthPlace(option, keyword));

  if (!firstMatch) {
    await searchBirthPlaces(citySearch.value);
    firstMatch = birthPlaceOptions.value.find((option) => matchesBirthPlace(option, keyword));
  }

  if (firstMatch) {
    selectBirthPlace(firstMatch);
    return firstMatch;
  }

  uni.showToast({
    title: '请从城市列表选择出生地',
    icon: 'none',
  });

  return null;
}

function formatBirthPlaceMeta(option: BirthPlaceOption) {
  const region = option.province || option.country || `UTC${option.timezoneOffset >= 0 ? '+' : ''}${option.timezoneOffset}`;

  if (typeof option.latitude !== 'number') {
    return `${region} · UTC${option.timezoneOffset >= 0 ? '+' : ''}${option.timezoneOffset}`;
  }

  return `${region} · ${formatCoordinate(option.longitude, 'E', 'W')} ${formatCoordinate(option.latitude, 'N', 'S')}`;
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

function formatAnnualRelation(value: 'support' | 'drain' | 'wealth' | 'officer' | 'peer') {
  const labels = {
    support: '生扶',
    drain: '泄秀',
    wealth: '财星',
    officer: '官杀',
    peer: '同类',
  };

  return labels[value];
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

function openProfessionalDetail() {
  if (!latestRecordId.value) {
    uni.showToast({
      title: '请先登录并保存结果',
      icon: 'none',
    });
    return;
  }

  uni.navigateTo({
    url: `/pages/bazi/professional/index?recordId=${encodeURIComponent(latestRecordId.value)}`,
  });
}

function openHistoryItem(item: BaziHistoryItem) {
  if (!item.isProfessional) {
    return;
  }

  uni.navigateTo({
    url: `/pages/bazi/professional/index?recordId=${encodeURIComponent(item.id)}`,
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

function formatPillarMetaRows(meta: PillarMeta) {
  return [
    { label: '年柱', value: formatPillarMetaValue(meta.year) },
    { label: '月柱', value: formatPillarMetaValue(meta.month) },
    { label: '日柱', value: formatPillarMetaValue(meta.day) },
    { label: '时柱', value: formatPillarMetaValue(meta.time) },
  ];
}

function formatPillarMetaValue(value: string | string[]) {
  return Array.isArray(value) ? value.join('、') : value;
}

onLoad((options) => {
  if ((options as { mode?: string } | undefined)?.mode === 'professional') {
    activeMode.value = 'professional';
  }

  applyProfileDefaults();
  void searchBirthPlaces(citySearch.value);
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
    radial-gradient(circle at top right, var(--theme-glow), transparent 26%),
    linear-gradient(180deg, var(--theme-page-top) 0%, var(--theme-page-bottom) 100%);
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

.sheet-header--compact {
  margin-bottom: 12rpx;
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
.primary-button::after,
.secondary-button::after {
  border: none;
}

.mode-switch {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
  margin-bottom: 18rpx;
}

.mode-switch__option {
  display: grid;
  gap: 8rpx;
  min-height: 132rpx;
  padding: 20rpx;
  border: 2rpx solid rgba(208, 190, 156, 0.42);
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.62);
}

.mode-switch__option--active {
  border-color: rgba(143, 107, 61, 0.72);
  background: linear-gradient(180deg, rgba(253, 246, 232, 0.98) 0%, rgba(242, 229, 205, 0.98) 100%);
}

.mode-switch__title {
  font-size: 28rpx;
  font-weight: 700;
  color: #312618;
}

.mode-switch__desc {
  font-size: 22rpx;
  line-height: 1.45;
  color: #7b6746;
}

.field-block__picker,
.field-block__input {
  min-height: 84rpx;
  padding: 0 24rpx;
  display: flex;
  align-items: center;
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.82);
}

.field-block__input {
  box-sizing: border-box;
  width: 100%;
  font-size: 28rpx;
}

.professional-inputs {
  display: grid;
  gap: 14rpx;
  margin-top: 18rpx;
}

.city-result-list {
  display: grid;
  gap: 10rpx;
}

.city-result {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  min-height: 72rpx;
  padding: 0 20rpx;
  border: 1rpx solid rgba(208, 190, 156, 0.46);
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.66);
}

.city-result--active {
  border-color: rgba(143, 107, 61, 0.72);
  background: rgba(244, 230, 201, 0.95);
}

.city-result--empty {
  justify-content: center;
  color: #9e8a62;
}

.city-result__name {
  overflow: hidden;
  min-width: 0;
  font-size: 25rpx;
  font-weight: 600;
  color: #312618;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.city-result__meta {
  flex: 0 0 auto;
  font-size: 22rpx;
  color: #9e8a62;
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

.secondary-button {
  min-height: 84rpx;
  margin: 18rpx 0 12rpx;
  border-radius: 999rpx;
  background: rgba(244, 236, 220, 0.94);
  color: #735b36;
  line-height: 84rpx;
  font-size: 26rpx;
  font-weight: 600;
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

.professional-sheet {
  display: grid;
  gap: 16rpx;
  margin: 0 0 18rpx;
  padding: 22rpx;
  border-radius: 26rpx;
  background: rgba(247, 240, 225, 0.88);
}

.professional-meta,
.professional-grid {
  display: grid;
  gap: 14rpx;
}

.professional-meta {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.professional-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.professional-grid--two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.professional-meta__item,
.professional-group {
  display: grid;
  gap: 8rpx;
  padding: 18rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.68);
}

.professional-meta__label,
.professional-group__row {
  font-size: 22rpx;
  line-height: 1.45;
  color: #8c7959;
}

.professional-meta__value,
.professional-group__title {
  font-size: 25rpx;
  font-weight: 700;
  color: #312618;
}

.fortune-list {
  display: grid;
  gap: 10rpx;
}

.fortune-row {
  display: grid;
  gap: 6rpx;
  padding: 16rpx 18rpx;
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.66);
}

.fortune-row__title {
  font-size: 25rpx;
  font-weight: 700;
  color: #312618;
}

.fortune-row__meta {
  font-size: 22rpx;
  line-height: 1.45;
  color: #8c7959;
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

.history-item--actionable {
  background: rgba(244, 237, 222, 0.96);
}

.history-item__title-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.history-item__badge {
  flex: 0 0 auto;
  padding: 4rpx 10rpx;
  border-radius: 999rpx;
  background: rgba(127, 155, 132, 0.18);
  color: #5c7d64;
  font-size: 20rpx;
  font-weight: 700;
}

@media (max-width: 380px) {
  .mode-switch,
  .professional-meta,
  .professional-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
