<template>
  <view class="page">
    <view class="panel hero-panel">
      <text class="eyebrow">profile center</text>
      <text class="title">{{ isLoggedIn ? (profile.nickname || '今天也要顺利一点') : '先登录再完善资料' }}</text>
      <text class="summary">
        {{
          isLoggedIn
            ? `当前状态：${profileCompleted ? '资料已完善' : '资料待完善'}，完善后会自动计算星座与简易八字。`
            : '当前是开发环境体验登录，正式接微信授权后会自动获取 openid。'
        }}
      </text>

      <view class="hero-actions">
        <button v-if="!isLoggedIn" class="hero-button hero-button--primary" :loading="submitting" @tap="loginForExperience">
          开发环境快捷登录
        </button>
        <button v-else class="hero-button hero-button--secondary" @tap="logout">
          退出当前会话
        </button>
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
        <view
          v-for="item in fiveElementEntries"
          :key="item.name"
          class="element-card"
        >
          <text class="element-card__name">{{ item.name }}</text>
          <text class="element-card__value">{{ item.value }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';
import { computed, reactive, ref } from 'vue';
import { fetchMe, loginWithCode, updateMyProfile } from '../../api/auth';
import {
  clearSession,
  getAuthToken,
  getCachedUser,
  setAuthToken,
  setCachedUser,
} from '../../services/session';
import type { UserProfile } from '../../types/auth';

type GenderValue = 'male' | 'female' | 'unknown';

const genderOptions: Array<{ label: string; value: GenderValue }> = [
  { label: '男', value: 'male' },
  { label: '女', value: 'female' },
  { label: '保密', value: 'unknown' },
];

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
const authToken = ref(getAuthToken());
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

function syncForm() {
  form.nickname = profile.value.nickname || '';
  form.birthday = profile.value.birthday || '';
  form.birthTime = profile.value.birthTime || '';
  form.gender = (profile.value.gender as GenderValue) || 'unknown';
}

async function loginForExperience() {
  try {
    submitting.value = true;
    const response = await loginWithCode(`dev-${Date.now()}`);
    setAuthToken(response.data.token);
    setCachedUser(response.data.user);
    authToken.value = response.data.token;
    profile.value = response.data.user;
    profileCompleted.value = response.data.isProfileCompleted;
    syncForm();
    uni.showToast({
      title: '登录成功',
      icon: 'success',
    });
  } catch (error) {
    console.warn('login failed', error);
    uni.showToast({
      title: '登录失败',
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
      title: '保存失败',
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
  syncForm();
  uni.showToast({
    title: '已退出',
    icon: 'success',
  });
}

onLoad(() => {
  void hydrateProfile();
});
</script>

<style lang="scss">
.page {
  min-height: 100vh;
  padding: 24rpx;
  background:
    radial-gradient(circle at top left, rgba(134, 209, 182, 0.28), transparent 24%),
    linear-gradient(180deg, #f8fbff 0%, #ecf3f7 100%);
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

.eyebrow {
  font-size: 20rpx;
  text-transform: uppercase;
  letter-spacing: 0.28em;
  color: var(--apple-subtle);
}

.title,
.section-title {
  font-size: 38rpx;
  font-weight: 700;
  color: var(--apple-text);
}

.summary,
.profile-value,
.field__label {
  font-size: 25rpx;
  line-height: 1.6;
  color: var(--apple-muted);
}

.hero-actions {
  display: flex;
}

.hero-button {
  width: 100%;
  min-height: 78rpx;
  border-radius: 999rpx;
  line-height: 78rpx;
  font-size: 26rpx;
  font-weight: 600;
}

.hero-button::after {
  border: none;
}

.hero-button--primary {
  background: linear-gradient(135deg, var(--apple-blue) 0%, #7ba7ff 100%);
  color: #ffffff;
}

.hero-button--secondary {
  background: rgba(255, 255, 255, 0.72);
  color: var(--apple-text);
  border: 1rpx solid rgba(255, 255, 255, 0.78);
}

.profile-row {
  display: grid;
  gap: 8rpx;
}

.profile-label {
  font-size: 22rpx;
  color: var(--apple-subtle);
}

.profile-badge {
  width: fit-content;
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(91, 141, 239, 0.14);
  color: var(--apple-blue);
  font-size: 22rpx;
}

.field {
  display: grid;
  gap: 12rpx;
}

.field__input {
  min-height: 80rpx;
  padding: 0 22rpx;
  border-radius: 24rpx;
  background: rgba(244, 248, 255, 0.92);
  color: var(--apple-text);
  font-size: 26rpx;
}

.gender-grid,
.elements-grid {
  display: grid;
  gap: 12rpx;
}

.gender-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.gender-chip {
  display: grid;
  place-items: center;
  min-height: 72rpx;
  border-radius: 999rpx;
  background: rgba(244, 248, 255, 0.92);
  color: var(--apple-muted);
  font-size: 24rpx;
}

.gender-chip--active {
  background: linear-gradient(135deg, var(--apple-blue) 0%, #7ba7ff 100%);
  color: #ffffff;
  font-weight: 600;
}

.elements-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.element-card {
  display: grid;
  gap: 8rpx;
  padding: 18rpx;
  border-radius: 24rpx;
  background: rgba(244, 248, 255, 0.92);
}

.element-card__name {
  font-size: 22rpx;
  color: var(--apple-subtle);
}

.element-card__value {
  font-size: 30rpx;
  font-weight: 700;
  color: var(--apple-text);
}
</style>
