<template>
  <view class="page-shell">
    <view class="page">
    <view class="panel hero-panel">
      <text class="eyebrow">profile center</text>
      <text class="title">{{ isLoggedIn ? (profile.nickname || '今天也要顺利一点') : loginEntryTitle }}</text>
      <text class="summary">{{ heroSummary }}</text>

      <view class="hero-actions">
        <button
          v-if="!isLoggedIn"
          class="hero-button hero-button--primary"
          :loading="submitting"
          @tap="handleLogin"
        >
          {{ loginButtonLabel }}
        </button>
        <button
          v-else
          class="hero-button hero-button--secondary"
          @tap="logout"
        >
          退出当前会话
        </button>
      </view>

      <text v-if="isMpWeixin && !isLoggedIn" class="helper-text">
        当前会尝试走真实微信 `uni.login`，服务端已配置 `WECHAT_APP_ID / WECHAT_APP_SECRET` 时会直接换取真实 `openid`。
      </text>
      <text v-if="isMpWeixin && !isLoggedIn" class="helper-text">
        登录时会尝试同步头像和昵称；如果你暂时不授权，也不会阻塞登录。
      </text>
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
        <input v-model="form.birthday" class="field__input" placeholder="例如 1998-08-08" />
      </view>

      <view class="field">
        <text class="field__label">出生时间</text>
        <input v-model="form.birthTime" class="field__input" placeholder="例如 08:30" />
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
    <AppTabBar current-tab="profile" />
  </view>
</template>

<script setup lang="ts">
import { onLoad, onShow } from '@dcloudio/uni-app';
import { computed, reactive, ref } from 'vue';
import AppTabBar from '../../components/AppTabBar.vue';
import { fetchMe, loginWithCode, updateMyProfile } from '../../api/auth';
import { fetchUnifiedHistory } from '../../api/records';
import {
  clearSession,
  getAuthToken,
  getCachedUser,
  setAuthToken,
  setCachedUser,
} from '../../services/session';
import type { UserProfile } from '../../types/auth';
import type { UnifiedRecordItem } from '../../types/records';

type GenderValue = 'male' | 'female' | 'unknown';

const genderOptions: Array<{ label: string; value: GenderValue }> = [
  { label: '男', value: 'male' },
  { label: '女', value: 'female' },
  { label: '保密', value: 'unknown' },
];

const currentPlatform = String(
  (uni.getSystemInfoSync() as { uniPlatform?: string }).uniPlatform ?? '',
).toLowerCase();
const isMpWeixin = currentPlatform === 'mp-weixin';

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
const recentHistory = ref<UnifiedRecordItem[]>([]);
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
const loginButtonLabel = computed(() => (isMpWeixin ? '微信一键登录' : '开发环境快捷登录'));
const loginEntryTitle = computed(() => (isMpWeixin ? '先用微信登录，再完善资料' : '先登录再完善资料'));
const heroSummary = computed(() => {
  if (isLoggedIn.value) {
    return `当前状态：${profileCompleted.value ? '资料已完善' : '资料待完善'}，完善后会自动计算星座与简易八字。`;
  }

  return isMpWeixin
    ? '当前会优先走真实微信授权登录，登录成功后可继续完善生日信息与五行资料。'
    : '当前是 H5 / 开发环境体验登录，正式小程序里会走微信登录换取真实 openid。';
});

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

async function loginForExperience() {
  const response = await loginWithCode(`dev-${Date.now()}`);
  setAuthToken(response.data.token);
  setCachedUser(response.data.user);
  authToken.value = response.data.token;
  profile.value = response.data.user;
  profileCompleted.value = response.data.isProfileCompleted;
  syncForm();
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
  setAuthToken(response.data.token);
  setCachedUser(response.data.user);
  authToken.value = response.data.token;
  profile.value = response.data.user;
  profileCompleted.value = response.data.isProfileCompleted;
  syncForm();
}

function extractErrorMessage(error: unknown) {
  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object') {
    const maybeMessage = (error as { message?: unknown; errmsg?: unknown; errMsg?: unknown }).message;
    if (typeof maybeMessage === 'string' && maybeMessage.trim()) {
      return maybeMessage;
    }

    const maybeErrmsg = (error as { errmsg?: unknown }).errmsg;
    if (typeof maybeErrmsg === 'string' && maybeErrmsg.trim()) {
      return maybeErrmsg;
    }

    const maybeErrMsg = (error as { errMsg?: unknown }).errMsg;
    if (typeof maybeErrMsg === 'string' && maybeErrMsg.trim()) {
      return maybeErrMsg;
    }
  }

  return '';
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
    uni.showToast({
      title: extractErrorMessage(error) || '登录失败，请稍后重试',
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
    uni.showToast({
      title: extractErrorMessage(error) || '保存失败',
      icon: 'none',
    });
  } finally {
    submitting.value = false;
  }
}

function logout() {
  clearSession();
  authToken.value = '';
  profile.value = emptyProfile;
  profileCompleted.value = false;
  recentHistory.value = [];
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

onLoad(() => {
  void hydrateProfile();
  void loadHistoryPreview();
});

onShow(() => {
  const latestToken = getAuthToken();
  if (latestToken !== authToken.value) {
    authToken.value = latestToken;
  }
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
.shortcut-grid,
.history-list {
  display: grid;
  gap: 16rpx;
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
.history-card__top {
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
.history-card__title,
.history-card__score,
.shortcut-card__title {
  font-size: 28rpx;
  color: var(--apple-text);
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

.field__input {
  min-height: 84rpx;
  padding: 0 22rpx;
  border-radius: 22rpx;
  background: rgba(246, 249, 252, 0.92);
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
