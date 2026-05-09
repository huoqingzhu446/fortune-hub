<template>
  <view class="page-shell" :style="themeVars">
    <view class="page">
      <view class="ambient ambient--glow"></view>
      <view class="ambient ambient--mist"></view>

      <view class="profile-nav">
        <button class="profile-nav__home" @tap="goHome">
          <view class="nav-home-glyph"></view>
        </button>
        <text class="profile-nav__title">我的</text>
        <view class="profile-nav__right">
          <!-- #ifndef MP-WEIXIN -->
          <view class="profile-nav__capsule">
            <text class="profile-nav__dots">•••</text>
            <view class="profile-nav__divider"></view>
            <view class="profile-nav__target"></view>
          </view>
          <!-- #endif -->
        </view>
      </view>

      <view class="profile-card">
        <view class="profile-card__identity">
          <view class="profile-card__avatar">
            <image
              v-if="profile.avatarUrl"
              :src="profile.avatarUrl"
              mode="aspectFill"
              class="profile-card__avatar-image"
            />
            <text v-else>{{ avatarInitial }}</text>
          </view>

          <view class="profile-card__copy">
            <view class="profile-card__name-row">
              <text class="profile-card__name">{{ profileName }}</text>
              <text class="profile-card__vip">{{ vipLabel }}</text>
            </view>
            <text class="profile-card__signature">{{ signatureText }}</text>
          </view>

          <view class="profile-card__actions">
            <view class="profile-card__quick-action" @tap="goSettings">
              <view class="profile-card__quick-icon">
                <view class="quick-glyph quick-glyph--settings"></view>
              </view>
              <text>设置</text>
            </view>
            <view class="profile-card__quick-action" @tap="goFeedback">
              <view class="profile-card__quick-icon">
                <view class="quick-glyph quick-glyph--mail"></view>
              </view>
              <text>信件</text>
            </view>
          </view>
        </view>

        <view class="profile-card__button-row">
          <button
            class="profile-card__button profile-card__button--primary"
            :loading="submitting"
            @tap="handleLogin"
          >
            <text class="button-glyph button-glyph--crown"></text>
            <text>{{ loginButtonLabel }}</text>
          </button>

          <button
            class="profile-card__button profile-card__button--secondary"
            @tap="handleProfileAction"
          >
            <text class="button-glyph button-glyph--file"></text>
            <text>{{ profileActionLabel }}</text>
          </button>
        </view>

        <text class="profile-card__helper">{{ sessionHint }}</text>
      </view>

      <view
        v-if="isLoggedIn && showProfileEditor"
        id="profile-editor"
        class="section profile-editor-section"
      >
        <view class="section__head">
          <text class="section__title">资料完善</text>
          <text class="section__meta">{{ completionSummary }}</text>
        </view>

        <view class="editor-card">
          <view class="completion-card">
            <view class="completion-card__top">
              <text class="completion-card__title">资料完整度</text>
              <text class="completion-card__value"
                >{{ completionPercent }}%</text
              >
            </view>
            <view class="completion-card__bar">
              <view
                class="completion-card__fill"
                :style="{ width: `${completionPercent}%` }"
              ></view>
            </view>
            <text class="completion-card__text">
              {{
                missingFields.length
                  ? `还缺：${missingFields.join('、')}`
                  : '资料已完整，首页和推荐会更贴近你。'
              }}
            </text>
          </view>

          <view class="field">
            <text class="field__label">昵称</text>
            <input
              v-model="form.nickname"
              class="field__input"
              placeholder="请输入昵称"
            />
          </view>

          <view class="field">
            <text class="field__label">生日</text>
            <picker
              mode="date"
              :value="form.birthday || todayDate"
              :start="birthdayStart"
              :end="todayDate"
              @change="handleBirthdayChange"
            >
              <view
                class="field__picker"
                :class="{ 'field__picker--placeholder': !form.birthday }"
              >
                <text>{{ form.birthday || '请选择生日' }}</text>
                <text>›</text>
              </view>
            </picker>
          </view>

          <view class="field">
            <view class="field__head">
              <text class="field__label">出生时间</text>
              <text
                v-if="form.birthTime"
                class="field__action"
                @tap="clearBirthTime"
                >清空</text
              >
            </view>
            <picker
              mode="time"
              :value="form.birthTime || defaultBirthTime"
              @change="handleBirthTimeChange"
            >
              <view
                class="field__picker"
                :class="{ 'field__picker--placeholder': !form.birthTime }"
              >
                <text>{{ form.birthTime || '请选择出生时间' }}</text>
                <text>›</text>
              </view>
            </picker>
          </view>

          <view class="field">
            <view class="field__head">
              <text class="field__label">出生地</text>
              <text
                v-if="form.birthPlace"
                class="field__action"
                @tap="clearBirthPlace"
                >清空</text
              >
            </view>
            <input
              v-model="form.birthPlace"
              class="field__input"
              placeholder="请输入出生城市，如杭州"
              maxlength="120"
            />
          </view>

          <view class="field">
            <text class="field__label">性别</text>
            <view class="gender-grid">
              <view
                v-for="item in genderOptions"
                :key="item.value"
                class="gender-chip"
                :class="{ 'gender-chip--active': form.gender === item.value }"
                @tap="form.gender = item.value"
              >
                <text>{{ item.label }}</text>
              </view>
            </view>
          </view>

          <view class="preview-grid">
            <view class="preview-card">
              <text class="preview-card__label">当前星座</text>
              <text class="preview-card__value">{{
                profile.zodiac || pendingZodiac
              }}</text>
            </view>
            <view class="preview-card">
              <text class="preview-card__label">出生时间</text>
              <text class="preview-card__value">{{
                form.birthTime || '未填写'
              }}</text>
            </view>
            <view class="preview-card">
              <text class="preview-card__label">出生地</text>
              <text class="preview-card__value">{{
                form.birthPlace || '未填写'
              }}</text>
            </view>
          </view>

          <button class="save-button" :loading="submitting" @tap="saveProfile">
            保存并更新资料
          </button>
        </view>
      </view>

      <view class="vip-card" @tap="goMembership">
        <view class="vip-card__badge">
          <view class="vip-card__crown"></view>
        </view>
        <view class="vip-card__copy">
          <text class="vip-card__title">{{
            profilePage.membershipCard.title
          }}</text>
          <text class="vip-card__summary">{{
            profilePage.membershipCard.summary
          }}</text>
        </view>
        <button class="vip-card__button">
          {{ profilePage.membershipCard.buttonText }}
          <text class="vip-card__arrow">›</text>
        </button>
      </view>

      <view class="section section--data">
        <view class="section__head">
          <text class="section__title">我的数据</text>
          <view class="section__meta section__meta--sync">
            <view class="sync-glyph"></view>
            <text>{{ isLoggedIn ? '持续更新中' : '登录后同步' }}</text>
          </view>
        </view>

        <view class="data-grid">
          <view
            v-for="item in dataCardViewModels"
            :key="item.title"
            class="data-card"
            :class="`data-card--${item.tone}`"
            hover-class="data-card--pressed"
            hover-stay-time="80"
            @tap="openDataCardRoute(item)"
          >
            <view class="data-card__head">
              <view class="data-card__icon">
                <text>{{ item.icon }}</text>
              </view>
              <text class="data-card__title">{{ item.title }}</text>
            </view>
            <text class="data-card__value">{{ item.value }}</text>
            <text class="data-card__meta">{{ item.meta }}</text>
          </view>
        </view>
      </view>

      <view class="section section--tools">
        <view class="section__head">
          <text class="section__title">我的工具</text>
          <text class="section__meta">日常使用更快进入</text>
        </view>

        <view class="tool-grid">
          <view
            v-for="item in quickToolItems"
            :key="item.title"
            class="tool-item"
            :class="`tool-item--${item.tone}`"
            @tap="open(item.route)"
          >
            <view class="tool-item__icon">
              <text>{{ item.icon }}</text>
            </view>
            <text class="tool-item__title">{{ item.title }}</text>
          </view>
        </view>

        <view class="tool-indicator">
          <view class="tool-indicator__dot tool-indicator__dot--active"></view>
          <view class="tool-indicator__dot"></view>
        </view>
      </view>

      <view class="section section--services">
        <view class="section__head">
          <text class="section__title">我的服务</text>
          <text class="section__meta">订单、报告与收藏</text>
        </view>

        <view class="service-list">
          <view
            v-for="item in services"
            :key="item.title"
            class="service-row"
            @tap="open(item.route)"
          >
            <view class="service-row__left">
              <view class="service-row__icon">{{ item.icon }}</view>
              <view>
                <text class="service-row__title">{{ item.title }}</text>
                <text v-if="item.description" class="service-row__text">{{
                  item.description
                }}</text>
              </view>
            </view>
            <text class="service-row__arrow">›</text>
          </view>
        </view>
      </view>

      <view v-if="isLoggedIn" class="section">
        <view class="section__head">
          <text class="section__title">最近记录</text>
          <text class="section__link" @tap="goHistory">查看全部 ›</text>
        </view>

        <view v-if="historyLoading" class="empty-state">
          <text class="empty-state__title">正在同步最近记录...</text>
          <text class="empty-state__text">马上就好。</text>
        </view>

        <view v-else-if="recentHistory.length" class="history-list">
          <view
            v-for="item in recentHistory"
            :key="item.id"
            class="history-row"
            @tap="open(item.route)"
          >
            <view class="history-row__icon">{{
              historyIcon(item.recordType)
            }}</view>
            <view class="history-row__body">
              <view class="history-row__head">
                <text class="history-row__title">{{ item.title }}</text>
                <text class="history-row__tag">{{ item.recordTypeLabel }}</text>
              </view>
              <text class="history-row__text">{{
                item.summary || item.detailHint
              }}</text>
            </view>
            <text class="history-row__score">{{ formatHistoryScore(item) }}</text>
          </view>
        </view>

        <view v-else class="empty-state">
          <text class="empty-state__title">还没有历史记录</text>
          <text class="empty-state__text"
            >做一次情绪、测试或解读后，这里就会出现。</text
          >
        </view>
      </view>

      <view v-if="isLoggedIn" class="bottom-actions">
        <button class="bottom-actions__button" @tap="logout">
          退出当前会话
        </button>
      </view>
    </view>

    <AppTabBar current-tab="mine" />
  </view>
</template>

<script setup lang="ts">
import { onLoad, onShow } from '@dcloudio/uni-app';
import { computed, nextTick, reactive, ref } from 'vue';
import AppTabBar from '../../components/AppTabBar.vue';
import { loginWithCode, updateMyProfile } from '../../api/auth';
import { fetchProfilePage } from '../../api/profile';
import { useThemePreference } from '../../composables/useThemePreference';
import { getErrorMessage, handleAuthExpired } from '../../services/errors';
import {
  clearSession,
  getAuthSessionMeta,
  getAuthToken,
  getCachedUser,
  setAuthSessionMeta,
  setAuthToken,
  setCachedUser,
} from '../../services/session';
import { usePageStateStore } from '../../stores/page-state';
import type { UserProfile } from '../../types/auth';
import type { ProfilePageData } from '../../types/profile';
import type { UnifiedRecordItem } from '../../types/records';

type GenderValue = 'male' | 'female' | 'unknown';
type DataTone = 'mist' | 'blush' | 'mint' | 'gold';
type ToolTone = 'violet' | 'mint' | 'sky' | 'gold';
type DataCard = ProfilePageData['dataCards'][number];

type DataCardViewModel = DataCard & {
  icon: string;
};

function buildLocalDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const genderOptions: Array<{ label: string; value: GenderValue }> = [
  { label: '男', value: 'male' },
  { label: '女', value: 'female' },
  { label: '保密', value: 'unknown' },
];

const currentPlatform = String(
  (uni.getSystemInfoSync() as { uniPlatform?: string }).uniPlatform ?? '',
).toLowerCase();
const isMpWeixin = currentPlatform === 'mp-weixin';
const birthdayStart = '1950-01-01';
const todayDate = buildLocalDateString();
const defaultBirthTime = '12:00';

const emptyProfile: UserProfile = {
  id: '',
  openid: '',
  nickname: null,
  avatarUrl: null,
  birthday: null,
  birthTime: null,
  birthPlace: null,
  gender: 'unknown',
  zodiac: null,
  baziSummary: null,
  fiveElements: null,
  vipStatus: 'inactive',
  vipExpiredAt: null,
};

const profile = ref<UserProfile>(getCachedUser() || emptyProfile);
const profileCompleted = ref(
  Boolean(
    profile.value.birthday &&
    profile.value.birthTime &&
    profile.value.birthPlace &&
    profile.value.zodiac &&
    profile.value.gender !== 'unknown',
  ),
);
const submitting = ref(false);
const historyLoading = ref(false);
const authToken = ref(getAuthToken());
const authMeta = ref(getAuthSessionMeta());
const loginErrorMessage = ref('');
const recentHistory = ref<UnifiedRecordItem[]>([]);
const showProfileEditor = ref(false);
const { themeVars } = useThemePreference();
const pageStateStore = usePageStateStore();
let lastProfileVersion = pageStateStore.versionOf('profile');
const fallbackProfilePage: ProfilePageData = {
  isLoggedIn: false,
  user: null,
  isProfileCompleted: false,
  hero: {
    displayName: '清浅',
    vipLabel: '普通用户',
    signature: '愿你成为自己的光，温柔而有力量。',
    sessionHint: '登录后会把记录、会员状态和主题偏好绑定到当前账号。',
  },
  membershipCard: {
    title: '开通会员 · 解锁全部权益',
    summary: '享受专属报告、好运加持等 12 项特权。',
    buttonText: '立即开通',
    route: '/pages/membership/index',
  },
  dataCards: [
    {
      key: 'fortune_index',
      title: '综合气运指数',
      value: '--',
      meta: '登录后同步',
      tone: 'mist',
      route: '/pages/profile/data/fortune-index/index',
    },
    {
      key: 'mood_days',
      title: '心情记录天数',
      value: '--',
      meta: '登录后同步',
      tone: 'blush',
      route: '/pages/profile/data/mood-days/index',
    },
    {
      key: 'explore_reports',
      title: '探索报告',
      value: '--',
      meta: '登录后同步',
      tone: 'mint',
      route: '/pages/profile/data/explore-reports/index',
    },
    {
      key: 'lucky_energy',
      title: '好运能量值',
      value: '--',
      meta: '登录后同步',
      tone: 'gold',
      route: '/pages/profile/data/lucky-energy/index',
    },
  ],
  tools: [],
  services: [],
  recentHistory: [],
};
const profilePage = ref<ProfilePageData>(fallbackProfilePage);

const form = reactive({
  nickname: profile.value.nickname || '',
  birthday: profile.value.birthday || '',
  birthTime: profile.value.birthTime || '',
  birthPlace: profile.value.birthPlace || '',
  gender: (profile.value.gender as GenderValue) || 'unknown',
});

const isLoggedIn = computed(() => Boolean(authToken.value));
const pageIsLoggedIn = computed(() => profilePage.value.isLoggedIn);

const profileName = computed(() => {
  return profilePage.value.hero.displayName || profile.value.nickname || '清浅';
});

const avatarInitial = computed(() => profileName.value.slice(0, 1));

const vipLabel = computed(() => profilePage.value.hero.vipLabel);
const signatureText = computed(() => profilePage.value.hero.signature);

const loginButtonLabel = computed(() => {
  if (isLoggedIn.value) {
    return isMpWeixin ? '刷新登录态' : '刷新体验登录';
  }

  return isMpWeixin ? '微信一键登录' : '开发环境快捷登录';
});
const profileActionLabel = computed(() =>
  showProfileEditor.value ? '收起资料' : '完善资料',
);

const sessionHint = computed(() => profilePage.value.hero.sessionHint);
const dataCards = computed(() => profilePage.value.dataCards);
const services = computed(() => profilePage.value.services);
const dataIconByTone: Record<DataTone, string> = {
  mist: '↗',
  blush: '♡',
  mint: '◌',
  gold: '★',
};
const dataCardViewModels = computed(() =>
  dataCards.value.map((item) => ({
    ...item,
    icon: dataIconByTone[item.tone],
  })),
);
const quickToolItems = computed<
  Array<{
    title: string;
    icon: string;
    route: string;
    tone: ToolTone;
  }>
>(() => [
  {
    title: '心情日记',
    icon: '记',
    route: '/pages/journal/index',
    tone: 'violet',
  },
  {
    title: '灵感报告',
    icon: '报',
    route: '/pages/records/index',
    tone: 'mint',
  },
  {
    title: '睡眠助手',
    icon: '眠',
    route: '/pages/meditation/index',
    tone: 'sky',
  },
  {
    title: '能量展示',
    icon: '能',
    route: '/pages/lucky/index',
    tone: 'gold',
  },
]);
const missingFields = computed(() => {
  const result: string[] = [];

  if (!form.nickname.trim()) {
    result.push('昵称');
  }
  if (!form.birthday) {
    result.push('生日');
  }
  if (!form.birthTime) {
    result.push('出生时间');
  }
  if (!form.birthPlace.trim()) {
    result.push('出生地');
  }
  if (!form.gender || form.gender === 'unknown') {
    result.push('性别');
  }

  return result;
});
const completionPercent = computed(() => {
  const total = 5;
  return Math.round(((total - missingFields.value.length) / total) * 100);
});
const completionSummary = computed(() =>
  profileCompleted.value
    ? '已完善'
    : `待完善 · ${missingFields.value.length} 项`,
);
const pendingZodiac = computed(() => {
  if (!form.birthday) {
    return '补生日后自动生成';
  }

  const date = form.birthday.slice(5, 10);
  const rules = [
    ['摩羯座', '01-01', '01-19'],
    ['水瓶座', '01-20', '02-18'],
    ['双鱼座', '02-19', '03-20'],
    ['白羊座', '03-21', '04-19'],
    ['金牛座', '04-20', '05-20'],
    ['双子座', '05-21', '06-21'],
    ['巨蟹座', '06-22', '07-22'],
    ['狮子座', '07-23', '08-22'],
    ['处女座', '08-23', '09-22'],
    ['天秤座', '09-23', '10-23'],
    ['天蝎座', '10-24', '11-22'],
    ['射手座', '11-23', '12-21'],
    ['摩羯座', '12-22', '12-31'],
  ] as const;

  return (
    rules.find((item) => date >= item[1] && date <= item[2])?.[0] || '摩羯座'
  );
});

function applyLoginResult(data: {
  token: string;
  expiresIn: number;
  authMode: 'wechat' | 'mock';
  authProviderLabel: string;
  user: UserProfile;
  isProfileCompleted: boolean;
}) {
  const loggedInAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + data.expiresIn * 1000).toISOString();

  setAuthToken(data.token);
  setCachedUser(data.user);
  setAuthSessionMeta({
    authMode: data.authMode,
    authProviderLabel: data.authProviderLabel,
    loggedInAt,
    expiresIn: data.expiresIn,
    expiresAt,
  });

  authToken.value = data.token;
  authMeta.value = getAuthSessionMeta();
  profile.value = data.user;
  profileCompleted.value = data.isProfileCompleted;
  loginErrorMessage.value = '';
  pageStateStore.markCoreDirty();
  showProfileEditor.value = !data.isProfileCompleted;
  syncForm();
}

async function hydrateProfile() {
  try {
    const response = await fetchProfilePage();
    profilePage.value = response.data;
    recentHistory.value = response.data.recentHistory;
    historyLoading.value = false;
    lastProfileVersion = pageStateStore.versionOf('profile');

    if (response.data.user) {
      profile.value = response.data.user;
      profileCompleted.value = response.data.isProfileCompleted;
      setCachedUser(response.data.user);
      showProfileEditor.value = !response.data.isProfileCompleted;
      syncForm();
    }

    if (!response.data.isLoggedIn && authToken.value) {
      clearSession();
      authToken.value = '';
      authMeta.value = null;
    }
  } catch (error) {
    console.warn('load profile failed', error);
    if (handleAuthExpired(error)) {
      resetSessionState();
      loginErrorMessage.value = getErrorMessage(
        error,
        '登录状态已失效，请重新登录',
      );
    }
  }
}

function syncForm() {
  form.nickname = profile.value.nickname || '';
  form.birthday = profile.value.birthday || '';
  form.birthTime = profile.value.birthTime || '';
  form.birthPlace = profile.value.birthPlace || '';
  form.gender = (profile.value.gender as GenderValue) || 'unknown';
}

function resetSessionState() {
  authToken.value = '';
  authMeta.value = null;
  profile.value = emptyProfile;
  profileCompleted.value = false;
  recentHistory.value = [];
  profilePage.value = fallbackProfilePage;
  showProfileEditor.value = false;
  syncForm();
}

function handleBirthdayChange(event: { detail: { value: string } }) {
  form.birthday = event.detail.value;
}

function handleBirthTimeChange(event: { detail: { value: string } }) {
  form.birthTime = event.detail.value;
}

function clearBirthTime() {
  form.birthTime = '';
}

function clearBirthPlace() {
  form.birthPlace = '';
}

async function loginForExperience() {
  const response = await loginWithCode(`dev-${Date.now()}`);
  applyLoginResult(response.data);
}

function requestWechatProfile() {
  return new Promise<{ nickname?: string; avatarUrl?: string }>((resolve) => {
    const uniWithProfile = uni as typeof uni & {
      getUserProfile?: (options: {
        desc: string;
        success?: (result: {
          userInfo?: { nickName?: string; avatarUrl?: string };
        }) => void;
        fail?: () => void;
      }) => void;
    };

    if (!uniWithProfile.getUserProfile) {
      resolve({});
      return;
    }

    uniWithProfile.getUserProfile({
      desc: '用于补充头像和昵称，优化资料页展示',
      success: (result) => {
        resolve({
          nickname: result.userInfo?.nickName,
          avatarUrl: result.userInfo?.avatarUrl,
        });
      },
      fail: () => {
        resolve({});
      },
    });
  });
}

function requestWechatCode() {
  return new Promise<string>((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: (result: { code?: string }) => {
        if (result.code) {
          resolve(result.code);
          return;
        }

        reject(new Error('未获取到微信登录 code'));
      },
      fail: reject,
    } as never);
  });
}

async function loginWithWechatOfficial() {
  const code = await requestWechatCode();
  const profileExtras = await requestWechatProfile();
  const response = await loginWithCode(code, profileExtras);
  applyLoginResult(response.data);
}

async function handleLogin() {
  try {
    submitting.value = true;
    if (isMpWeixin) {
      await loginWithWechatOfficial();
    } else {
      await loginForExperience();
    }

    await hydrateProfile();
    uni.showToast({
      title: '登录成功',
      icon: 'success',
    });
  } catch (error) {
    console.warn('login failed', error);
    loginErrorMessage.value = getErrorMessage(error, '登录失败，请稍后重试');
    uni.showToast({
      title: loginErrorMessage.value,
      icon: 'none',
    });
  } finally {
    submitting.value = false;
  }
}

async function saveProfile() {
  if (!form.birthday) {
    uni.showToast({
      title: '请先填写生日',
      icon: 'none',
    });
    return;
  }
  if (!form.birthPlace.trim()) {
    uni.showToast({
      title: '请先填写出生地',
      icon: 'none',
    });
    return;
  }

  try {
    submitting.value = true;
    const response = await updateMyProfile({
      nickname: form.nickname || undefined,
      birthday: form.birthday,
      birthTime: form.birthTime || undefined,
      birthPlace: form.birthPlace.trim(),
      gender: form.gender,
    });
    profile.value = response.data.user;
    profileCompleted.value = response.data.isProfileCompleted;
    setCachedUser(response.data.user);
    showProfileEditor.value = false;
    pageStateStore.markCoreDirty();
    await hydrateProfile();
    uni.showToast({
      title: '资料已更新',
      icon: 'success',
    });
  } catch (error) {
    console.warn('save profile failed', error);
    if (handleAuthExpired(error, true)) {
      resetSessionState();
      loginErrorMessage.value = getErrorMessage(
        error,
        '登录状态已失效，请重新登录',
      );
      return;
    }
    uni.showToast({
      title: getErrorMessage(error, '保存失败'),
      icon: 'none',
    });
  } finally {
    submitting.value = false;
  }
}

function logout() {
  clearSession();
  pageStateStore.markCoreDirty();
  resetSessionState();
  loginErrorMessage.value = '';
  uni.showToast({
    title: '已退出',
    icon: 'success',
  });
}

function scrollToProfileEditor() {
  nextTick(() => {
    setTimeout(() => {
      uni.pageScrollTo({
        selector: '#profile-editor',
        duration: 260,
      });
    }, 0);
  });
}

function toggleProfileEditor() {
  showProfileEditor.value = !showProfileEditor.value;
  if (showProfileEditor.value) {
    scrollToProfileEditor();
  }
}

function handleProfileAction() {
  if (!isLoggedIn.value) {
    uni.showToast({
      title: '请先登录',
      icon: 'none',
    });
    return;
  }

  toggleProfileEditor();
}

function openDataCardRoute(item: DataCardViewModel) {
  if (!isLoggedIn.value) {
    void handleLogin();
    return;
  }

  open(item.route);
}

function open(route: string) {
  uni.navigateTo({
    url: route,
  });
}

function goHome() {
  uni.redirectTo({
    url: '/pages/index/index',
  });
}

function goHistory() {
  open('/pages/records/index');
}

function goMembership() {
  open(profilePage.value.membershipCard.route || '/pages/membership/index');
}

function goSettings() {
  open('/pages/settings/index');
}

function goFeedback() {
  open('/pages/settings/feedback/index');
}

function formatHistoryScore(item: UnifiedRecordItem) {
  if (item.recordType === 'bazi') {
    return item.level ? `${item.level}主轴` : '已排盘';
  }

  return item.score !== null ? `${item.score}` : '--';
}

function historyIcon(recordType: string) {
  if (recordType === 'emotion') {
    return '情';
  }
  if (recordType === 'bazi') {
    return '卦';
  }
  if (recordType === 'zodiac') {
    return '星';
  }
  return '测';
}

onLoad(() => {
  historyLoading.value = true;
  void hydrateProfile();
});

onShow(() => {
  const latestToken = getAuthToken();
  if (latestToken !== authToken.value) {
    authToken.value = latestToken;
    pageStateStore.markDirty('profile');
  }
  authMeta.value = getAuthSessionMeta();
  if (pageStateStore.versionOf('profile') !== lastProfileVersion) {
    historyLoading.value = true;
    void hydrateProfile();
  }
});
</script>

<style lang="scss">
.page-shell {
  position: relative;
  min-height: 100vh;
  padding-bottom: 154rpx;
  overflow: hidden;
  background:
    radial-gradient(circle at 16% 3%, rgba(var(--theme-accent-rgb), 0.2), transparent 28%),
    radial-gradient(circle at 100% 32%, rgba(var(--theme-primary-rgb), 0.12), transparent 30%),
    linear-gradient(180deg, var(--theme-page-top) 0%, var(--theme-page-bottom) 100%);
}

.page {
  position: relative;
  min-height: 100vh;
  padding: calc(var(--status-bar-height) + 14rpx) 26rpx 30rpx;
  box-sizing: border-box;
}

.ambient {
  position: absolute;
  z-index: 0;
  border-radius: 999rpx;
  pointer-events: none;
  filter: blur(32rpx);
}

.ambient--glow {
  top: 104rpx;
  right: -106rpx;
  width: 340rpx;
  height: 340rpx;
  background: var(--theme-glow);
}

.ambient--mist {
  top: 412rpx;
  left: -92rpx;
  width: 260rpx;
  height: 260rpx;
  background: rgba(255, 255, 255, 0.68);
}

.profile-nav,
.profile-card,
.vip-card,
.section,
.editor-card,
.empty-state,
.history-row {
  position: relative;
  z-index: 1;
}

.profile-nav {
  display: grid;
  grid-template-columns: 88rpx minmax(0, 1fr) 188rpx;
  align-items: center;
  min-height: 86rpx;
  margin-bottom: 24rpx;
}

.profile-nav__home,
.profile-card__button,
.vip-card__button,
.save-button,
.bottom-actions__button {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  border: 0;
  line-height: 1;
}

.profile-nav__home::after,
.profile-card__button::after,
.vip-card__button::after,
.save-button::after,
.bottom-actions__button::after {
  border: none;
}

.profile-nav__home {
  width: 62rpx;
  height: 62rpx;
  border-radius: 50%;
  color: var(--theme-text-primary);
  background: rgba(var(--theme-text-secondary-rgb), 0.1);
}

.nav-home-glyph {
  position: relative;
  width: 34rpx;
  height: 34rpx;
}

.nav-home-glyph::before,
.nav-home-glyph::after {
  content: '';
  position: absolute;
  border: 4rpx solid currentColor;
}

.nav-home-glyph::before {
  left: 3rpx;
  top: 9rpx;
  width: 24rpx;
  height: 22rpx;
  border-top: 0;
  border-radius: 4rpx;
}

.nav-home-glyph::after {
  left: 6rpx;
  top: 1rpx;
  width: 20rpx;
  height: 20rpx;
  border-right: 0;
  border-bottom: 0;
  transform: rotate(45deg);
  border-radius: 4rpx 0 0;
}

.profile-nav__title {
  justify-self: center;
  font-size: 34rpx;
  font-weight: 700;
  color: var(--theme-text-primary);
}

.profile-nav__right {
  display: flex;
  justify-content: flex-end;
}

.profile-nav__capsule {
  display: flex;
  align-items: center;
  justify-content: space-around;
  width: 170rpx;
  height: 62rpx;
  border: 1rpx solid rgba(var(--theme-text-secondary-rgb), 0.18);
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.7);
  box-shadow: 0 8rpx 22rpx rgba(var(--theme-text-primary-rgb), 0.06);
}

.profile-nav__dots {
  font-size: 34rpx;
  letter-spacing: 2rpx;
  color: var(--theme-text-primary);
  transform: translateY(-4rpx);
}

.profile-nav__divider {
  width: 1rpx;
  height: 36rpx;
  background: rgba(var(--theme-text-secondary-rgb), 0.14);
}

.profile-nav__target {
  position: relative;
  width: 34rpx;
  height: 34rpx;
  border: 5rpx solid currentColor;
  border-radius: 50%;
  color: var(--theme-text-primary);
}

.profile-nav__target::after {
  content: '';
  position: absolute;
  inset: 7rpx;
  border-radius: 50%;
  background: currentColor;
}

.profile-card,
.vip-card,
.section,
.editor-card,
.empty-state,
.history-row,
.data-card,
.service-row {
  border: 1rpx solid var(--theme-border);
  background: var(--theme-surface-strong);
  box-shadow:
    var(--theme-shadow-soft),
    0 0 0 1rpx rgba(255, 255, 255, 0.4) inset;
  backdrop-filter: blur(26rpx);
}

.profile-card,
.vip-card,
.section {
  margin-bottom: 22rpx;
  border-radius: 32rpx;
}

.profile-card {
  padding: 30rpx 28rpx 26rpx;
  background:
    radial-gradient(circle at 11% 20%, rgba(var(--theme-accent-rgb), 0.18), transparent 24%),
    radial-gradient(circle at 92% 12%, rgba(var(--theme-primary-rgb), 0.1), transparent 26%),
    var(--theme-surface-strong);
}

.profile-card__identity {
  display: grid;
  grid-template-columns: 120rpx minmax(0, 1fr) 142rpx;
  align-items: center;
  gap: 18rpx;
}

.profile-card__avatar {
  display: grid;
  place-items: center;
  width: 118rpx;
  height: 118rpx;
  overflow: hidden;
  border-radius: 50%;
  color: var(--theme-primary);
  font-family: 'Iowan Old Style', 'Times New Roman', 'Noto Serif SC', serif;
  font-size: 50rpx;
  font-weight: 700;
  background:
    radial-gradient(circle at 32% 24%, rgba(255, 255, 255, 0.92), transparent 42%),
    linear-gradient(145deg, rgba(var(--theme-accent-rgb), 0.34), rgba(var(--theme-primary-rgb), 0.08));
}

.profile-card__avatar-image {
  width: 100%;
  height: 100%;
}

.profile-card__copy {
  display: grid;
  min-width: 0;
  gap: 10rpx;
}

.profile-card__name-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  min-width: 0;
}

.profile-card__name {
  max-width: 230rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 46rpx;
  font-weight: 700;
  color: var(--theme-text-primary);
}

.profile-card__vip,
.history-row__tag {
  flex: 0 0 auto;
  padding: 7rpx 16rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  font-weight: 700;
  color: var(--theme-primary);
  background: rgba(var(--theme-primary-rgb), 0.12);
}

.profile-card__signature,
.profile-card__helper,
.section__meta,
.data-card__meta,
.service-row__text,
.history-row__text,
.empty-state__text,
.field__label,
.completion-card__text {
  font-size: 24rpx;
  line-height: 1.65;
  color: var(--theme-text-secondary);
}

.profile-card__signature {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 22rpx;
}

.profile-card__actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10rpx;
  align-self: stretch;
}

.profile-card__quick-action {
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 8rpx;
  min-width: 0;
  color: var(--theme-text-primary);
  font-size: 23rpx;
}

.profile-card__quick-icon {
  display: grid;
  place-items: center;
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  color: var(--theme-primary);
  background: rgba(var(--theme-primary-rgb), 0.1);
}

.quick-glyph {
  position: relative;
  width: 34rpx;
  height: 34rpx;
  color: inherit;
}

.quick-glyph::before,
.quick-glyph::after {
  content: '';
  position: absolute;
}

.quick-glyph--settings {
  border: 4rpx solid currentColor;
  border-radius: 50%;
}

.quick-glyph--settings::before {
  inset: 8rpx;
  border-radius: 50%;
  background: currentColor;
}

.quick-glyph--settings::after {
  left: 13rpx;
  top: -8rpx;
  width: 8rpx;
  height: 50rpx;
  border-radius: 999rpx;
  border-top: 7rpx solid currentColor;
  border-bottom: 7rpx solid currentColor;
}

.quick-glyph--mail {
  border: 4rpx solid currentColor;
  border-radius: 4rpx;
}

.quick-glyph--mail::before {
  left: 3rpx;
  right: 3rpx;
  top: 6rpx;
  height: 16rpx;
  border-left: 4rpx solid currentColor;
  border-bottom: 4rpx solid currentColor;
  transform: rotate(-45deg);
}

.profile-card__button-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24rpx;
  margin-top: 24rpx;
}

.profile-card__button,
.save-button,
.bottom-actions__button {
  min-height: 78rpx;
  border-radius: 999rpx;
  gap: 12rpx;
  font-size: 28rpx;
  font-weight: 700;
}

.profile-card__button--primary,
.save-button {
  color: rgba(255, 255, 255, 0.96);
  background:
    linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-accent) 100%);
  box-shadow: 0 18rpx 34rpx rgba(var(--theme-primary-rgb), 0.24);
}

.profile-card__button--secondary,
.bottom-actions__button {
  color: var(--theme-text-primary);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.86), rgba(255, 255, 255, 0.52)),
    rgba(var(--theme-primary-rgb), 0.05);
  box-shadow: 0 12rpx 26rpx rgba(var(--theme-text-primary-rgb), 0.05);
}

.button-glyph {
  position: relative;
  width: 30rpx;
  height: 30rpx;
  color: currentColor;
}

.button-glyph::before,
.button-glyph::after {
  content: '';
  position: absolute;
}

.button-glyph--crown::before {
  left: 2rpx;
  bottom: 5rpx;
  width: 26rpx;
  height: 18rpx;
  background: currentColor;
  clip-path: polygon(0 38%, 24% 62%, 50% 6%, 76% 62%, 100% 38%, 86% 100%, 14% 100%);
}

.button-glyph--crown::after {
  left: 5rpx;
  bottom: 1rpx;
  width: 20rpx;
  height: 4rpx;
  border-radius: 999rpx;
  background: currentColor;
}

.button-glyph--file {
  border: 4rpx solid currentColor;
  border-radius: 6rpx;
}

.button-glyph--file::before,
.button-glyph--file::after {
  left: 7rpx;
  right: 6rpx;
  height: 4rpx;
  border-radius: 999rpx;
  background: currentColor;
}

.button-glyph--file::before {
  top: 8rpx;
}

.button-glyph--file::after {
  top: 17rpx;
}

.profile-card__helper {
  display: block;
  margin-top: 12rpx;
  text-align: center;
}

.vip-card {
  display: grid;
  grid-template-columns: 82rpx minmax(0, 1fr) 158rpx;
  gap: 16rpx;
  align-items: center;
  padding: 24rpx 28rpx;
  background:
    radial-gradient(circle at 84% 12%, rgba(255, 255, 255, 0.78), transparent 26%),
    linear-gradient(135deg, rgba(var(--theme-accent-rgb), 0.18), rgba(var(--theme-primary-rgb), 0.07)),
    var(--theme-surface-strong);
}

.vip-card__badge {
  display: grid;
  place-items: center;
  width: 72rpx;
  height: 72rpx;
  color: rgba(255, 255, 255, 0.96);
  background: linear-gradient(145deg, var(--theme-primary), var(--theme-accent));
  clip-path: polygon(50% 0, 94% 24%, 94% 76%, 50% 100%, 6% 76%, 6% 24%);
  box-shadow: 0 14rpx 28rpx rgba(var(--theme-primary-rgb), 0.22);
}

.vip-card__crown {
  position: relative;
  width: 42rpx;
  height: 30rpx;
}

.vip-card__crown::before {
  content: '';
  position: absolute;
  inset: 0;
  background: currentColor;
  clip-path: polygon(0 32%, 25% 60%, 50% 0, 75% 60%, 100% 32%, 86% 100%, 14% 100%);
}

.vip-card__copy {
  display: grid;
  min-width: 0;
  gap: 8rpx;
}

.vip-card__title,
.section__title,
.history-row__title,
.empty-state__title {
  color: var(--theme-text-primary);
  font-weight: 700;
}

.vip-card__title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 30rpx;
}

.vip-card__summary {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 24rpx;
  color: var(--theme-text-secondary);
}

.vip-card__button {
  min-height: 64rpx;
  border-radius: 24rpx;
  gap: 8rpx;
  color: rgba(255, 255, 255, 0.96);
  font-size: 23rpx;
  font-weight: 700;
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-accent));
  box-shadow: 0 16rpx 30rpx rgba(var(--theme-primary-rgb), 0.2);
}

.vip-card__arrow {
  font-size: 34rpx;
  line-height: 1;
}

.section {
  padding: 24rpx 28rpx;
}

.section__head,
.field__head,
.history-row__head,
.service-row {
  display: flex;
}

.section__head,
.service-row {
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
}

.section__title {
  font-size: 34rpx;
}

.section__meta,
.section__link {
  flex: 0 0 auto;
  font-size: 24rpx;
}

.section__meta--sync {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.sync-glyph {
  position: relative;
  width: 28rpx;
  height: 28rpx;
  border: 4rpx solid rgba(var(--theme-text-secondary-rgb), 0.72);
  border-left-color: transparent;
  border-radius: 50%;
  box-sizing: border-box;
}

.sync-glyph::after {
  content: '';
  position: absolute;
  right: -2rpx;
  top: 0;
  width: 9rpx;
  height: 9rpx;
  border-top: 4rpx solid rgba(var(--theme-text-secondary-rgb), 0.72);
  border-right: 4rpx solid rgba(var(--theme-text-secondary-rgb), 0.72);
  transform: rotate(42deg);
}

.data-grid,
.tool-grid,
.service-list,
.history-list,
.gender-grid {
  display: grid;
  gap: 18rpx;
}

.data-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 20rpx;
  gap: 14rpx;
}

.data-card {
  --metric-rgb: var(--theme-primary-rgb);
  display: grid;
  align-content: start;
  min-height: 150rpx;
  padding: 20rpx 24rpx 18rpx;
  border-radius: 26rpx;
  background:
    radial-gradient(circle at 18% 18%, rgba(var(--metric-rgb), 0.18), transparent 34%),
    linear-gradient(135deg, rgba(var(--metric-rgb), 0.1), rgba(255, 255, 255, 0.72));
  box-shadow: 0 12rpx 30rpx rgba(var(--metric-rgb), 0.08);
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease;
}

.data-card--pressed {
  transform: scale(0.985);
  box-shadow: 0 8rpx 22rpx rgba(var(--metric-rgb), 0.07);
}

.data-card--blush {
  --metric-rgb: var(--theme-accent-rgb);
}

.data-card--mint {
  --metric-rgb: var(--theme-primary-rgb);
}

.data-card--gold {
  --metric-rgb: var(--theme-accent-rgb);
}

.data-card__head {
  display: grid;
  grid-template-columns: 52rpx minmax(0, 1fr);
  align-items: center;
  gap: 14rpx;
}

.data-card__icon,
.tool-item__icon,
.service-row__icon,
.history-row__icon {
  display: grid;
  place-items: center;
  color: var(--theme-primary);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0.36)),
    rgba(var(--theme-primary-rgb), 0.12);
}

.data-card__icon {
  width: 46rpx;
  height: 46rpx;
  border-radius: 50%;
  color: rgb(var(--metric-rgb));
  font-size: 28rpx;
  font-weight: 700;
}

.data-card__title,
.tool-item__title,
.service-row__title,
.history-row__score,
.field__action {
  color: var(--theme-text-primary);
}

.data-card__title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 26rpx;
  font-weight: 600;
}

.data-card__value {
  display: block;
  margin-top: 16rpx;
  font-size: 54rpx;
  line-height: 0.95;
  font-weight: 500;
  color: var(--theme-text-primary);
  font-family: 'Iowan Old Style', 'Times New Roman', 'Noto Serif SC', serif;
}

.data-card__meta {
  display: block;
  margin-top: 8rpx;
}

.tool-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-top: 18rpx;
}

.tool-item {
  --tool-rgb: var(--theme-primary-rgb);
  display: grid;
  justify-items: center;
  gap: 8rpx;
  min-width: 0;
  padding: 4rpx 0 0;
  text-align: center;
}

.tool-item--violet,
.tool-item--sky {
  --tool-rgb: var(--theme-accent-rgb);
}

.tool-item--mint,
.tool-item--gold {
  --tool-rgb: var(--theme-primary-rgb);
}

.tool-item__icon {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  color: rgb(var(--tool-rgb));
  font-size: 27rpx;
  font-weight: 700;
  background:
    radial-gradient(circle at 34% 24%, rgba(255, 255, 255, 0.88), transparent 44%),
    rgba(var(--tool-rgb), 0.15);
}

.tool-item__title {
  max-width: 132rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 22rpx;
}

.tool-indicator {
  display: flex;
  justify-content: center;
  gap: 14rpx;
  margin-top: 16rpx;
}

.tool-indicator__dot {
  width: 22rpx;
  height: 8rpx;
  border-radius: 999rpx;
  background: rgba(var(--theme-text-secondary-rgb), 0.16);
}

.tool-indicator__dot--active {
  width: 28rpx;
  background: var(--theme-primary);
}

.section--services,
.section--records,
.bottom-actions {
  margin-top: 2rpx;
}

.service-list,
.history-list {
  margin-top: 22rpx;
}

.service-row {
  padding: 20rpx;
  border-radius: 24rpx;
}

.service-row__left {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 16rpx;
}

.service-row__icon,
.history-row__icon {
  flex: 0 0 auto;
  width: 64rpx;
  height: 64rpx;
  border-radius: 22rpx;
  font-size: 26rpx;
  font-weight: 700;
}

.service-row__title {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
}

.service-row__text {
  display: block;
  max-width: 470rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.service-row__arrow {
  flex: 0 0 auto;
  font-size: 34rpx;
  color: var(--theme-text-tertiary);
}

.history-row {
  display: grid;
  grid-template-columns: 64rpx minmax(0, 1fr) auto;
  gap: 16rpx;
  align-items: center;
  padding: 20rpx;
  border-radius: 24rpx;
}

.history-row__body {
  display: grid;
  min-width: 0;
  gap: 8rpx;
}

.history-row__head {
  align-items: center;
  gap: 10rpx;
  min-width: 0;
}

.history-row__title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 28rpx;
}

.history-row__text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-row__score {
  min-width: 76rpx;
  text-align: right;
  font-size: 30rpx;
  font-weight: 700;
}

.section__link {
  color: var(--theme-primary);
}

.profile-editor-section {
  scroll-margin-top: 120rpx;
}

.editor-card {
  display: grid;
  gap: 18rpx;
  margin-top: 18rpx;
  padding: 24rpx;
  border-radius: 28rpx;
}

.completion-card,
.preview-card {
  display: grid;
  gap: 10rpx;
  padding: 22rpx;
  border-radius: 24rpx;
  background: var(--theme-surface-muted);
}

.completion-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.completion-card__title,
.preview-card__label {
  font-size: 22rpx;
  color: var(--theme-text-secondary);
}

.completion-card__value,
.preview-card__value {
  font-size: 28rpx;
  font-weight: 700;
  color: var(--theme-text-primary);
}

.completion-card__bar {
  height: 12rpx;
  overflow: hidden;
  border-radius: 999rpx;
  background: rgba(var(--theme-text-secondary-rgb), 0.14);
}

.completion-card__fill {
  height: 100%;
  border-radius: 999rpx;
  background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-accent) 100%);
}

.field {
  display: grid;
  gap: 10rpx;
}

.field__head {
  align-items: center;
  justify-content: space-between;
}

.field__input,
.field__picker {
  min-height: 78rpx;
  padding: 0 22rpx;
  border-radius: 20rpx;
  background: var(--theme-surface-muted);
  font-size: 26rpx;
  color: var(--theme-text-primary);
}

.field__picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.field__picker--placeholder {
  color: var(--theme-text-tertiary);
}

.gender-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
}

.gender-chip {
  display: grid;
  place-items: center;
  min-height: 72rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  color: var(--theme-text-secondary);
  background: var(--theme-surface-muted);
}

.gender-chip--active {
  color: rgba(255, 255, 255, 0.96);
  background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-accent) 100%);
}

.empty-state {
  display: grid;
  gap: 12rpx;
  margin-top: 18rpx;
  padding: 24rpx;
  border-radius: 24rpx;
}

.empty-state__title {
  font-size: 28rpx;
}

.bottom-actions {
  position: relative;
  z-index: 1;
  padding-bottom: 10rpx;
}

.bottom-actions__button {
  width: 100%;
}
</style>
