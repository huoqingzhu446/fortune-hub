<template>
  <view class="page-shell" :style="themeVars">
    <view class="page">
      <view class="panel hero-panel">
        <text class="eyebrow">profile center</text>
        <text class="title">{{ loginEntryTitle }}</text>
        <text class="summary">{{ heroSummary }}</text>

        <view class="status-strip">
          <view class="status-chip">
            <text class="status-chip__label">登录渠道</text>
            <text class="status-chip__value">{{ sessionProviderLabel }}</text>
          </view>
          <view class="status-chip">
            <text class="status-chip__label">资料状态</text>
            <text class="status-chip__value">{{ profileCompleted ? '已完善' : '待完善' }}</text>
          </view>
        </view>

        <view class="hero-actions" :class="{ 'hero-actions--double': isLoggedIn }">
          <button
            class="hero-button hero-button--primary"
            :loading="submitting"
            @tap="handleLogin"
          >
            {{ loginButtonLabel }}
          </button>
          <button
            v-if="isLoggedIn"
            class="hero-button hero-button--secondary"
            @tap="logout"
          >
            退出当前会话
          </button>
        </view>

        <text class="helper-text">{{ sessionHint }}</text>
        <text v-if="isMpWeixin && !isLoggedIn" class="helper-text">
          登录时会尝试同步头像和昵称；如果你暂时不授权，也不会阻塞登录。
        </text>
      </view>

      <view class="panel profile-panel">
        <view class="section-head">
          <text class="section-title">登录状态</text>
          <text class="section-link">{{ isLoggedIn ? '已接通' : '待登录' }}</text>
        </view>

        <view class="profile-row">
          <text class="profile-label">当前账号</text>
          <text class="profile-value">{{ isLoggedIn ? (profile.nickname || '未设置昵称') : '尚未登录' }}</text>
        </view>
        <view class="profile-row">
          <text class="profile-label">会话模式</text>
          <text class="profile-value">{{ sessionProviderLabel }}</text>
        </view>
        <view class="profile-row">
          <text class="profile-label">登录时间</text>
          <text class="profile-value">{{ formatDateTime(authMeta?.loggedInAt) }}</text>
        </view>
        <view class="profile-row">
          <text class="profile-label">会话到期</text>
          <text class="profile-value">{{ formatDateTime(authMeta?.expiresAt) }}</text>
        </view>
        <view v-if="loginErrorMessage" class="hint-card">
          <text class="hint-card__title">最近一次登录提示</text>
          <text class="hint-card__text">{{ loginErrorMessage }}</text>
        </view>
      </view>

      <view v-if="isLoggedIn" class="panel profile-panel">
      <view class="profile-row">
        <text class="profile-label">OpenID</text>
        <text class="profile-value">{{ profile.openid }}</text>
      </view>
      <view class="profile-row">
        <text class="profile-label">VIP 状态</text>
        <text class="profile-badge">{{ profile.vipStatus === 'inactive' ? '普通用户' : profile.vipStatus }}</text>
      </view>
      <view class="profile-row">
        <text class="profile-label">星座</text>
        <text class="profile-value">{{ profile.zodiac || '未生成' }}</text>
      </view>
      <view class="profile-row">
        <text class="profile-label">简易八字摘要</text>
        <text class="profile-value">{{ profile.baziSummary || '填写生日信息后自动生成' }}</text>
      </view>
    </view>

    <view v-if="isLoggedIn" class="panel">
      <text class="section-title">快捷入口</text>
      <view class="shortcut-grid">
        <view class="shortcut-card" @tap="goHistory">
          <text class="shortcut-card__title">统一历史记录</text>
          <text class="shortcut-card__text">汇总八字、性格与情绪结果</text>
        </view>
        <view class="shortcut-card" @tap="goLucky">
          <text class="shortcut-card__title">幸运物推荐</text>
          <text class="shortcut-card__text">看看今天更适合你的幸运物</text>
        </view>
        <view class="shortcut-card" @tap="goMembership">
          <text class="shortcut-card__title">会员中心</text>
          <text class="shortcut-card__text">查看权益、到期时间和会员订单</text>
        </view>
        <view class="shortcut-card" @tap="goSettings">
          <text class="shortcut-card__title">设置中心</text>
          <text class="shortcut-card__text">提醒、隐私、反馈和关于我们</text>
        </view>
        <view class="shortcut-card" @tap="goFeedback">
          <text class="shortcut-card__title">意见反馈</text>
          <text class="shortcut-card__text">把 bug 和想法直接记下来</text>
        </view>
      </view>
    </view>

    <view v-if="isLoggedIn" class="panel">
      <view class="section-head">
        <text class="section-title">最近历史</text>
        <text class="section-link" @tap="goHistory">查看全部</text>
      </view>

      <view v-if="historyLoading" class="empty-card">
        <text class="empty-card__title">正在同步最近记录...</text>
        <text class="empty-card__text">马上就好。</text>
      </view>

      <view v-else-if="recentHistory.length" class="history-list">
        <view v-for="item in recentHistory" :key="item.id" class="history-card" @tap="openHistoryItem(item.route)">
          <view class="history-card__top">
            <view>
              <text class="history-card__tag">{{ item.recordTypeLabel }}</text>
              <text class="history-card__title">{{ item.title }}</text>
            </view>
            <text class="history-card__score">{{ item.score !== null ? item.score : '--' }}</text>
          </view>
          <text class="history-card__summary">{{ item.summary || item.detailHint || '点击查看详情' }}</text>
        </view>
      </view>

      <view v-else class="empty-card">
        <text class="empty-card__title">还没有历史记录</text>
        <text class="empty-card__text">做一次八字、性格或情绪结果后，这里就会出现。</text>
      </view>
    </view>

    <view v-if="isLoggedIn" class="panel form-panel">
      <text class="section-title">资料完善</text>

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
            <text class="field__picker-text">{{ form.birthday || '请选择生日' }}</text>
            <text class="field__picker-icon">›</text>
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
            <text class="field__picker-text">{{ form.birthTime || '请选择出生时间' }}</text>
            <text class="field__picker-icon">›</text>
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

      <button class="hero-button hero-button--primary" :loading="submitting" @tap="saveProfile">
        保存并生成资料
      </button>
    </view>

    <view v-if="isLoggedIn && profile.fiveElements" class="panel profile-panel">
      <text class="section-title">五行分布</text>
      <view class="elements-grid">
        <view v-for="item in fiveElementEntries" :key="item.name" class="element-card">
          <text class="element-card__name">{{ item.name }}</text>
          <text class="element-card__value">{{ item.value }}</text>
        </view>
      </view>
      </view>
    </view>
    <AppTabBar current-tab="mine" />
  </view>
</template>

<script setup lang="ts">
import { onLoad, onShow } from '@dcloudio/uni-app';
import { computed, reactive, ref } from 'vue';
import AppTabBar from '../../components/AppTabBar.vue';
import { fetchMe, loginWithCode, updateMyProfile } from '../../api/auth';
import { fetchUnifiedHistory } from '../../api/records';
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
import type { UserProfile } from '../../types/auth';
import type { UnifiedRecordItem } from '../../types/records';

type GenderValue = 'male' | 'female' | 'unknown';

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
const { themeVars } = useThemePreference();
const form = reactive({
  nickname: profile.value.nickname || '',
  birthday: profile.value.birthday || '',
  birthTime: profile.value.birthTime || '',
  gender: (profile.value.gender as GenderValue) || 'unknown',
});

const isLoggedIn = computed(() => Boolean(authToken.value));
const fiveElementEntries = computed(() =>
  Object.entries(profile.value.fiveElements || {}).map(([name, value]) => ({
    name,
    value,
  })),
);
const sessionProviderLabel = computed(() => {
  if (authMeta.value?.authProviderLabel) {
    return authMeta.value.authProviderLabel;
  }

  return isMpWeixin ? '正式微信授权待发起' : '开发环境体验登录';
});
const loginButtonLabel = computed(() => {
  if (isLoggedIn.value) {
    return isMpWeixin ? '重新获取微信登录态' : '刷新体验登录';
  }

  if (loginErrorMessage.value) {
    return isMpWeixin ? '重新发起微信登录' : '重新体验登录';
  }

  return isMpWeixin ? '微信一键登录' : '开发环境快捷登录';
});
const loginEntryTitle = computed(() => {
  if (isLoggedIn.value) {
    return profile.value.nickname || '今天也要顺利一点';
  }

  if (loginErrorMessage.value) {
    return '登录没完成，再试一次就好';
  }

  return isMpWeixin ? '先用微信登录，再完善资料' : '先登录再完善资料';
});
const heroSummary = computed(() => {
  if (loginErrorMessage.value && !isLoggedIn.value) {
    return `${loginErrorMessage.value}。你可以直接重新发起登录，或者先检查小程序登录配置。`;
  }

  if (isLoggedIn.value) {
    return `当前状态：${profileCompleted.value ? '资料已完善' : '资料待完善'}，当前会话来源：${sessionProviderLabel.value}。`;
  }

  return isMpWeixin
    ? '当前会优先走真实微信授权登录；如果服务端未配置 `WECHAT_APP_ID / WECHAT_APP_SECRET`，会明确提示，不再静默走 mock。'
    : '当前是 H5 / 开发环境体验登录，正式小程序里会走微信登录换取真实 openid。';
});
const sessionHint = computed(() => {
  if (!isLoggedIn.value) {
    return '登录后会把历史记录、幸运推荐和会员状态都绑定到当前账号。';
  }

  return profileCompleted.value
    ? '资料已经就绪，首页、幸运物和结果页都会优先参考你的资料。'
    : '生日和出生时间补齐后，会自动计算星座、简易八字和五行分布。';
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
  syncForm();
}

async function hydrateProfile() {
  if (!isLoggedIn.value) {
    return;
  }

  try {
    const response = await fetchMe();
    profile.value = response.data.user;
    profileCompleted.value = response.data.isProfileCompleted;
    setCachedUser(response.data.user);
    syncForm();
  } catch (error) {
    console.warn('load profile failed', error);
    if (handleAuthExpired(error)) {
      authToken.value = '';
      authMeta.value = null;
      profile.value = emptyProfile;
      profileCompleted.value = false;
      recentHistory.value = [];
      loginErrorMessage.value = getErrorMessage(error, '登录状态已失效，请重新登录');
    }
  }
}

async function loadHistoryPreview() {
  if (!isLoggedIn.value) {
    recentHistory.value = [];
    return;
  }

  try {
    historyLoading.value = true;
    const response = await fetchUnifiedHistory(3);
    recentHistory.value = response.data.items;
  } catch (error) {
    console.warn('load history preview failed', error);
    recentHistory.value = [];
    if (handleAuthExpired(error)) {
      authToken.value = '';
      authMeta.value = null;
      profile.value = emptyProfile;
      profileCompleted.value = false;
      loginErrorMessage.value = getErrorMessage(error, '登录状态已失效，请重新登录');
    }
  } finally {
    historyLoading.value = false;
  }
}

function syncForm() {
  form.nickname = profile.value.nickname || '';
  form.birthday = profile.value.birthday || '';
  form.birthTime = profile.value.birthTime || '';
  form.gender = (profile.value.gender as GenderValue) || 'unknown';
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

    await loadHistoryPreview();
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
    uni.showToast({
      title: '资料已更新',
      icon: 'success',
    });
  } catch (error) {
    console.warn('save profile failed', error);
    if (handleAuthExpired(error, true)) {
      authToken.value = '';
      authMeta.value = null;
      profile.value = emptyProfile;
      profileCompleted.value = false;
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
  authToken.value = '';
  authMeta.value = null;
  profile.value = emptyProfile;
  profileCompleted.value = false;
  recentHistory.value = [];
  loginErrorMessage.value = '';
  syncForm();
  uni.showToast({
    title: '已退出',
    icon: 'success',
  });
}

function goHistory() {
  uni.navigateTo({
    url: '/pages/records/index',
  });
}

function goLucky() {
  uni.navigateTo({
    url: '/pages/lucky/index',
  });
}

function goMembership() {
  uni.navigateTo({
    url: '/pages/membership/index',
  });
}

function goSettings() {
  uni.navigateTo({
    url: '/pages/settings/index',
  });
}

function goFeedback() {
  uni.navigateTo({
    url: '/pages/settings/feedback/index',
  });
}

function openHistoryItem(route: string) {
  uni.navigateTo({
    url: route,
  });
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return '暂未记录';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hour = `${date.getHours()}`.padStart(2, '0');
  const minute = `${date.getMinutes()}`.padStart(2, '0');
  return `${month}-${day} ${hour}:${minute}`;
}

onLoad(() => {
  void hydrateProfile();
  void loadHistoryPreview();
});

onShow(() => {
  const latestToken = getAuthToken();
  if (latestToken !== authToken.value) {
    authToken.value = latestToken;
  }
  authMeta.value = getAuthSessionMeta();
  void hydrateProfile();
  void loadHistoryPreview();
});
</script>

<style lang="scss">
.page-shell {
  min-height: 100vh;
  padding-bottom: 138rpx;
  overflow-x: hidden;
}

.page {
  min-height: 100vh;
  padding: 24rpx 24rpx 24rpx;
  background:
    radial-gradient(circle at top left, rgba(134, 209, 182, 0.28), transparent 24%),
    linear-gradient(180deg, #f8fbff 0%, #ecf3f7 100%);
  overflow-x: hidden;
}

.panel {
  display: grid;
  gap: 18rpx;
  margin-bottom: 20rpx;
  padding: 26rpx;
  border-radius: 32rpx;
  background: rgba(255, 255, 255, 0.88);
  border: 1rpx solid rgba(255, 255, 255, 0.8);
  box-shadow: var(--apple-shadow);
}

.eyebrow,
.history-card__tag {
  font-size: 20rpx;
  text-transform: uppercase;
  letter-spacing: 0.28em;
  color: var(--apple-subtle);
}

.title,
.section-title {
  font-size: 40rpx;
  font-weight: 700;
  color: var(--apple-text);
}

.summary,
.helper-text,
.history-card__summary,
.empty-card__text {
  font-size: 26rpx;
  line-height: 1.7;
  color: var(--apple-muted);
}

.hero-actions,
.status-strip,
.shortcut-grid,
.history-list {
  display: grid;
  gap: 16rpx;
}

.status-strip,
.hero-actions--double {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.hero-button {
  min-height: 82rpx;
  border-radius: 999rpx;
  line-height: 82rpx;
  font-size: 28rpx;
}

.hero-button::after {
  border: none;
}

.hero-button--primary {
  color: #ffffff;
  background: linear-gradient(135deg, var(--apple-blue) 0%, #7ba7ff 100%);
}

.hero-button--secondary {
  color: var(--apple-text);
  background: rgba(244, 247, 250, 0.92);
}

.profile-row,
.section-head,
.history-card__top,
.field__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.profile-label,
.section-link,
.field__label,
.empty-card__title {
  font-size: 24rpx;
  color: var(--apple-subtle);
}

.profile-value,
.profile-badge,
.field__input,
.field__picker,
.history-card__title,
.history-card__score,
.shortcut-card__title,
.status-chip__value,
.hint-card__title {
  font-size: 28rpx;
  color: var(--apple-text);
}

.status-chip,
.hint-card {
  display: grid;
  gap: 10rpx;
  padding: 20rpx 22rpx;
  border-radius: 24rpx;
  background: rgba(246, 249, 252, 0.92);
}

.status-chip__label,
.hint-card__text {
  font-size: 24rpx;
  line-height: 1.6;
  color: var(--apple-muted);
}

.profile-value {
  flex: 1;
  text-align: right;
}

.profile-badge {
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(221, 243, 234, 0.9);
}

.shortcut-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.shortcut-card,
.history-card,
.empty-card,
.element-card {
  padding: 22rpx;
  border-radius: 24rpx;
  background: rgba(246, 249, 252, 0.92);
}

.shortcut-card__title,
.history-card__title {
  display: block;
  font-weight: 700;
}

.shortcut-card__text {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  line-height: 1.6;
  color: var(--apple-muted);
}

.field {
  display: grid;
  gap: 12rpx;
}

.field__input,
.field__picker {
  min-height: 84rpx;
  padding: 0 22rpx;
  border-radius: 22rpx;
  background: rgba(246, 249, 252, 0.92);
}

.field__picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 500;
}

.field__picker-text {
  flex: 1;
}

.field__picker-icon {
  margin-left: 16rpx;
  font-size: 34rpx;
  line-height: 1;
  color: #9fb1cb;
}

.field__picker--placeholder {
  color: var(--apple-muted);
}

.field__action {
  font-size: 24rpx;
  color: var(--apple-blue);
}

.gender-grid,
.elements-grid {
  display: grid;
  gap: 14rpx;
}

.gender-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.gender-chip {
  min-height: 76rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20rpx;
  background: rgba(246, 249, 252, 0.92);
  color: var(--apple-muted);
  font-size: 26rpx;
}

.gender-chip--active {
  background: linear-gradient(135deg, rgba(116, 152, 255, 0.16), rgba(113, 209, 171, 0.16));
  color: var(--apple-text);
}

.elements-grid {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.element-card {
  display: grid;
  gap: 8rpx;
  text-align: center;
}

.element-card__name {
  font-size: 24rpx;
  color: var(--apple-subtle);
}

.element-card__value {
  font-size: 34rpx;
  font-weight: 700;
  color: var(--apple-text);
}
</style>
