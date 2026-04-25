<template>
  <view class="page-shell" :style="themeVars">
    <view class="page">
      <view class="ambient ambient--glow"></view>
      <view class="ambient ambient--mist"></view>

      <view class="profile-hero">
        <view class="profile-hero__top">
          <view class="profile-hero__identity">
            <view class="profile-hero__avatar">
              <image
                v-if="profile.avatarUrl"
                :src="profile.avatarUrl"
                mode="aspectFill"
                class="profile-hero__avatar-image"
              />
              <text v-else>{{ avatarInitial }}</text>
            </view>

            <view class="profile-hero__copy">
              <view class="profile-hero__name-row">
                <text class="profile-hero__name">{{ profileName }}</text>
                <text class="profile-hero__vip">{{ vipLabel }}</text>
              </view>
              <text class="profile-hero__signature">{{ signatureText }}</text>
            </view>
          </view>

          <view class="profile-hero__actions">
            <view class="profile-hero__icon" @tap="goSettings">设</view>
            <view class="profile-hero__icon" @tap="goFeedback">信</view>
          </view>
        </view>

        <view class="hero-login-row">
          <button
            class="hero-login-row__button hero-login-row__button--primary"
            :loading="submitting"
            @tap="handleLogin"
          >
            {{ loginButtonLabel }}
          </button>

          <button
            v-if="isLoggedIn"
            class="hero-login-row__button hero-login-row__button--secondary"
            @tap="toggleProfileEditor"
          >
            {{ showProfileEditor ? '收起资料' : '完善资料' }}
          </button>
        </view>

        <text class="profile-hero__helper">{{ sessionHint }}</text>
      </view>

      <view v-if="isLoggedIn && showProfileEditor" id="profile-editor" class="section profile-editor-section">
        <view class="section__head">
          <text class="section__title">资料完善</text>
          <text class="section__meta">{{ completionSummary }}</text>
        </view>

        <view class="editor-card">
          <view class="completion-card">
            <view class="completion-card__top">
              <text class="completion-card__title">资料完整度</text>
              <text class="completion-card__value">{{ completionPercent }}%</text>
            </view>
            <view class="completion-card__bar">
              <view class="completion-card__fill" :style="{ width: `${completionPercent}%` }"></view>
            </view>
            <text class="completion-card__text">
              {{ missingFields.length ? `还缺：${missingFields.join('、')}` : '资料已完整，首页和推荐会更贴近你。' }}
            </text>
          </view>

          <view class="field">
            <text class="field__label">昵称</text>
            <input v-model="form.nickname" class="field__input" placeholder="请输入昵称" />
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
              <view class="field__picker" :class="{ 'field__picker--placeholder': !form.birthday }">
                <text>{{ form.birthday || '请选择生日' }}</text>
                <text>›</text>
              </view>
            </picker>
          </view>

          <view class="field">
            <view class="field__head">
              <text class="field__label">出生时间</text>
              <text v-if="form.birthTime" class="field__action" @tap="clearBirthTime">清空</text>
            </view>
            <picker
              mode="time"
              :value="form.birthTime || defaultBirthTime"
              @change="handleBirthTimeChange"
            >
              <view class="field__picker" :class="{ 'field__picker--placeholder': !form.birthTime }">
                <text>{{ form.birthTime || '请选择出生时间' }}</text>
                <text>›</text>
              </view>
            </picker>
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
              <text class="preview-card__value">{{ profile.zodiac || pendingZodiac }}</text>
            </view>
            <view class="preview-card">
              <text class="preview-card__label">出生时间</text>
              <text class="preview-card__value">{{ form.birthTime || '未填写' }}</text>
            </view>
          </view>

          <button class="save-button" :loading="submitting" @tap="saveProfile">
            保存并更新资料
          </button>
        </view>
      </view>

      <view class="vip-card" @tap="goMembership">
        <view class="vip-card__copy">
          <text class="vip-card__title">{{ profilePage.membershipCard.title }}</text>
          <text class="vip-card__summary">{{ profilePage.membershipCard.summary }}</text>
        </view>
        <button class="vip-card__button">{{ profilePage.membershipCard.buttonText }}</button>
      </view>

      <view class="section">
        <view class="section__head">
          <text class="section__title">我的数据</text>
          <text class="section__meta">{{ isLoggedIn ? '持续更新中' : '登录后同步' }}</text>
        </view>

        <view class="data-grid">
          <view
            v-for="item in dataCards"
            :key="item.title"
            class="data-card"
            :class="`data-card--${item.tone}`"
          >
            <text class="data-card__title">{{ item.title }}</text>
            <text class="data-card__value">{{ item.value }}</text>
            <text class="data-card__meta">{{ item.meta }}</text>
          </view>
        </view>
      </view>

      <view class="section">
        <view class="section__head">
          <text class="section__title">我的工具</text>
          <text class="section__meta">日常使用更快进入</text>
        </view>

        <view class="tool-grid">
          <view
            v-for="item in tools"
            :key="item.title"
            class="tool-item"
            @tap="open(item.route)"
          >
            <view class="tool-item__icon">{{ item.icon }}</view>
            <text class="tool-item__title">{{ item.title }}</text>
            <text class="tool-item__text">{{ item.description }}</text>
          </view>
        </view>
      </view>

      <view class="section">
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
                <text v-if="item.description" class="service-row__text">{{ item.description }}</text>
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
            <view class="history-row__icon">{{ historyIcon(item.recordType) }}</view>
            <view class="history-row__body">
              <view class="history-row__head">
                <text class="history-row__title">{{ item.title }}</text>
                <text class="history-row__tag">{{ item.recordTypeLabel }}</text>
              </view>
              <text class="history-row__text">{{ item.summary || item.detailHint }}</text>
            </view>
            <text class="history-row__score">{{ item.score !== null ? item.score : '--' }}</text>
          </view>
        </view>

        <view v-else class="empty-state">
          <text class="empty-state__title">还没有历史记录</text>
          <text class="empty-state__text">做一次情绪、测试或解读后，这里就会出现。</text>
        </view>
      </view>

      <view v-if="isLoggedIn" class="bottom-actions">
        <button class="bottom-actions__button" @tap="logout">退出当前会话</button>
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
  gender: 'unknown',
  zodiac: null,
  baziSummary: null,
  fiveElements: null,
  vipStatus: 'inactive',
  vipExpiredAt: null,
};

const profile = ref<UserProfile>(getCachedUser() || emptyProfile);
const profileCompleted = ref(Boolean(profile.value.birthday && profile.value.zodiac));
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
    { title: '综合气运指数', value: '--', meta: '登录后同步', tone: 'mist' },
    { title: '心情记录天数', value: '--', meta: '登录后同步', tone: 'blush' },
    { title: '探索报告', value: '--', meta: '登录后同步', tone: 'mint' },
    { title: '好运能量值', value: '--', meta: '登录后同步', tone: 'gold' },
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

const sessionHint = computed(() => profilePage.value.hero.sessionHint);
const dataCards = computed(() => profilePage.value.dataCards);
const tools = computed(() => profilePage.value.tools);
const services = computed(() => profilePage.value.services);
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
  if (!form.gender || form.gender === 'unknown') {
    result.push('性别');
  }

  return result;
});
const completionPercent = computed(() => {
  const total = 4;
  return Math.round(((total - missingFields.value.length) / total) * 100);
});
const completionSummary = computed(() =>
  profileCompleted.value ? '已完善' : `待完善 · ${missingFields.value.length} 项`,
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

  return rules.find((item) => date >= item[1] && date <= item[2])?.[0] || '摩羯座';
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
      loginErrorMessage.value = getErrorMessage(error, '登录状态已失效，请重新登录');
    }
  }
}

function syncForm() {
  form.nickname = profile.value.nickname || '';
  form.birthday = profile.value.birthday || '';
  form.birthTime = profile.value.birthTime || '';
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

async function loginForExperience() {
  const response = await loginWithCode(`dev-${Date.now()}`);
  applyLoginResult(response.data);
}

function requestWechatProfile() {
  return new Promise<{ nickname?: string; avatarUrl?: string }>((resolve) => {
    const uniWithProfile = uni as typeof uni & {
      getUserProfile?: (options: {
        desc: string;
        success?: (result: { userInfo?: { nickName?: string; avatarUrl?: string } }) => void;
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

  try {
    submitting.value = true;
    const response = await updateMyProfile({
      nickname: form.nickname || undefined,
      birthday: form.birthday,
      birthTime: form.birthTime || undefined,
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
      loginErrorMessage.value = getErrorMessage(error, '登录状态已失效，请重新登录');
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

function open(route: string) {
  uni.navigateTo({
    url: route,
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
  padding-bottom: 138rpx;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, var(--theme-glow), transparent 34%),
    linear-gradient(180deg, var(--theme-page-top) 0%, var(--theme-page-bottom) 100%);
}

.page {
  position: relative;
  min-height: 100vh;
  padding: 24rpx 24rpx 24rpx;
}

.ambient {
  position: absolute;
  border-radius: 999rpx;
  pointer-events: none;
  filter: blur(28rpx);
}

.ambient--glow {
  top: 46rpx;
  right: -82rpx;
  width: 300rpx;
  height: 300rpx;
  background: var(--theme-glow);
}

.ambient--mist {
  top: 360rpx;
  left: -74rpx;
  width: 230rpx;
  height: 230rpx;
  background: rgba(255, 255, 255, 0.74);
}

.profile-hero,
.vip-card,
.section,
.editor-card,
.empty-state,
.history-row {
  position: relative;
  z-index: 1;
}

.profile-hero,
.vip-card,
.section,
.history-row,
.editor-card,
.empty-state,
.data-card,
.tool-item,
.service-row {
  border: 1rpx solid var(--theme-border);
  background: var(--theme-surface);
  box-shadow: var(--theme-shadow-soft);
}

.profile-hero,
.vip-card,
.section {
  margin-bottom: 22rpx;
  border-radius: 34rpx;
}

.profile-hero {
  padding: 28rpx;
}

.profile-hero__top,
.profile-hero__identity,
.profile-hero__name-row,
.section__head,
.service-row,
.history-row__head,
.field__head {
  display: flex;
}

.profile-hero__top,
.section__head,
.service-row {
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.profile-hero__identity {
  gap: 18rpx;
}

.profile-hero__avatar {
  display: grid;
  place-items: center;
  width: 116rpx;
  height: 116rpx;
  overflow: hidden;
  border-radius: 50%;
  font-size: 42rpx;
  color: var(--theme-primary);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, var(--theme-soft) 100%);
}

.profile-hero__avatar-image {
  width: 100%;
  height: 100%;
}

.profile-hero__copy {
  display: grid;
  gap: 10rpx;
  padding-top: 6rpx;
}

.profile-hero__name-row {
  align-items: center;
  gap: 12rpx;
}

.profile-hero__name {
  font-size: 52rpx;
  font-weight: 500;
  color: var(--theme-text-primary);
  font-family:
    'Iowan Old Style',
    'Times New Roman',
    'Noto Serif SC',
    serif;
}

.profile-hero__vip,
.history-row__tag {
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  color: var(--theme-primary);
  background: var(--theme-tag-bg);
}

.profile-hero__signature,
.profile-hero__helper,
.section__meta,
.data-card__meta,
.tool-item__text,
.service-row__text,
.history-row__text,
.empty-state__text,
.field__label {
  font-size: 24rpx;
  line-height: 1.7;
  color: var(--theme-text-secondary);
}

.profile-hero__actions {
  display: flex;
  gap: 10rpx;
}

.profile-hero__icon {
  display: grid;
  place-items: center;
  width: 70rpx;
  height: 70rpx;
  border-radius: 24rpx;
  color: var(--theme-primary);
  background: var(--theme-tag-bg);
}

.hero-login-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
  margin-top: 22rpx;
}

.hero-login-row__button,
.vip-card__button,
.save-button,
.bottom-actions__button {
  min-height: 78rpx;
  border-radius: 999rpx;
  font-size: 26rpx;
}

.hero-login-row__button::after,
.vip-card__button::after,
.save-button::after,
.bottom-actions__button::after {
  border: none;
}

.hero-login-row__button--primary,
.save-button {
  color: #ffffff;
  background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-accent) 100%);
}

.hero-login-row__button--secondary,
.bottom-actions__button {
  color: var(--theme-primary);
  background: var(--theme-tag-bg);
}

.profile-hero__helper {
  margin-top: 12rpx;
}

.vip-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 188rpx;
  gap: 18rpx;
  align-items: center;
  padding: 26rpx;
  background:
    radial-gradient(circle at 88% 30%, rgba(255, 255, 255, 0.8), transparent 24%),
    linear-gradient(135deg, rgba(255, 247, 232, 0.9) 0%, rgba(255, 243, 223, 0.82) 100%);
}

.vip-card__copy {
  display: grid;
  gap: 8rpx;
}

.vip-card__title,
.section__title,
.history-row__title,
.empty-state__title {
  font-size: 34rpx;
  font-weight: 500;
  color: var(--theme-text-primary);
}

.vip-card__summary {
  font-size: 24rpx;
  line-height: 1.7;
  color: var(--theme-text-secondary);
}

.vip-card__button {
  color: var(--theme-text-primary);
  background: rgba(255, 235, 199, 0.92);
}

.section {
  padding: 26rpx;
}

.section__title {
  font-size: 38rpx;
}

.data-grid,
.tool-grid,
.service-list,
.history-list,
.gender-grid {
  display: grid;
  gap: 16rpx;
}

.data-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 18rpx;
}

.data-card {
  display: grid;
  gap: 10rpx;
  min-height: 196rpx;
  padding: 24rpx;
  border-radius: 28rpx;
}

.data-card--mist {
  background: linear-gradient(180deg, rgba(238, 245, 250, 0.96) 0%, rgba(255, 255, 255, 0.86) 100%);
}

.data-card--blush {
  background: linear-gradient(180deg, rgba(255, 240, 242, 0.96) 0%, rgba(255, 255, 255, 0.86) 100%);
}

.data-card--mint {
  background: linear-gradient(180deg, rgba(236, 250, 247, 0.96) 0%, rgba(255, 255, 255, 0.86) 100%);
}

.data-card--gold {
  background: linear-gradient(180deg, rgba(255, 245, 226, 0.96) 0%, rgba(255, 255, 255, 0.86) 100%);
}

.data-card__title,
.tool-item__title,
.service-row__title,
.history-row__score,
.field__action {
  font-size: 26rpx;
  color: var(--theme-text-primary);
}

.data-card__value {
  font-size: 64rpx;
  line-height: 1;
  color: var(--theme-text-primary);
  font-family:
    'Iowan Old Style',
    'Times New Roman',
    'Noto Serif SC',
    serif;
}

.tool-grid {
  grid-template-columns: repeat(5, minmax(0, 1fr));
  margin-top: 18rpx;
}

.tool-item {
  display: grid;
  justify-items: center;
  gap: 10rpx;
  min-width: 0;
  padding: 18rpx 8rpx;
  border-radius: 24rpx;
  text-align: center;
}

.tool-item__icon,
.service-row__icon,
.history-row__icon {
  display: grid;
  place-items: center;
  color: var(--theme-primary);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, var(--theme-soft) 100%);
}

.tool-item__icon {
  width: 64rpx;
  height: 64rpx;
  border-radius: 22rpx;
}

.tool-item__title {
  font-size: 22rpx;
}

.tool-item__text {
  font-size: 20rpx;
  line-height: 1.5;
}

.service-list,
.history-list {
  margin-top: 18rpx;
}

.service-row {
  align-items: center;
  padding: 22rpx;
  border-radius: 24rpx;
}

.service-row__left {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.service-row__icon,
.history-row__icon {
  width: 68rpx;
  height: 68rpx;
  border-radius: 22rpx;
}

.service-row__arrow {
  font-size: 28rpx;
  color: var(--theme-text-tertiary);
}

.history-row {
  display: grid;
  grid-template-columns: 68rpx minmax(0, 1fr) auto;
  gap: 14rpx;
  align-items: center;
  padding: 18rpx;
  border-radius: 24rpx;
}

.history-row__body {
  display: grid;
  gap: 8rpx;
}

.history-row__head {
  align-items: center;
  gap: 10rpx;
}

.history-row__title {
  font-size: 28rpx;
}

.history-row__score {
  font-size: 30rpx;
}

.section__link {
  color: var(--theme-primary);
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
  font-weight: 600;
  color: var(--theme-text-primary);
}

.completion-card__bar {
  height: 12rpx;
  border-radius: 999rpx;
  background: rgba(var(--theme-text-secondary-rgb), 0.14);
  overflow: hidden;
}

.completion-card__fill {
  height: 100%;
  border-radius: 999rpx;
  background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-accent) 100%);
}

.completion-card__text {
  font-size: 22rpx;
  line-height: 1.6;
  color: var(--theme-text-secondary);
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
  color: #ffffff;
  background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-accent) 100%);
}

.empty-state {
  display: grid;
  gap: 12rpx;
  margin-top: 18rpx;
  padding: 24rpx;
  border-radius: 24rpx;
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
