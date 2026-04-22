<template>
  <view class="page">
    <view class="hero-card">
      <text class="hero-card__eyebrow">vip center</text>
      <text class="hero-card__title">
        {{ membership?.isVipActive ? 'VIP 已生效' : '会员中心' }}
      </text>
      <text class="hero-card__subtitle">
        {{
          membership?.isVipActive
            ? `当前可查看全部完整版解读，会员到期时间：${formatDateTime(membership.vipExpiredAt)}`
            : '这里可以查看权益说明、创建会员订单，并完成开发环境下的支付流转。'
        }}
      </text>
    </view>

    <view v-if="!isLoggedIn" class="section-card empty-card">
      <text class="empty-card__title">先登录再查看会员状态</text>
      <text class="empty-card__text">会员状态、订单和权益都绑定在当前账号下。</text>
      <button class="hero-button hero-button--primary" @tap="goProfile">去个人中心</button>
    </view>

    <template v-else>
      <view v-if="loading" class="section-card empty-card">
        <text class="empty-card__title">正在同步会员状态...</text>
        <text class="empty-card__text">马上把当前权益和套餐都准备好。</text>
      </view>

      <template v-else-if="membership">
        <view class="section-card">
          <text class="section-title">当前权益</text>
          <view class="right-list">
            <text v-for="item in membership.rights" :key="item" class="right-item">{{ item }}</text>
          </view>
        </view>

        <view class="section-card section-card--soft">
          <text class="section-title">会员套餐</text>
          <view class="product-list">
            <view v-for="item in membership.products" :key="item.code" class="product-card">
              <view class="product-card__top">
                <view>
                  <text class="product-card__title">{{ item.title }}</text>
                  <text class="product-card__subtitle">{{ item.subtitle || '完整报告与海报权益' }}</text>
                </view>
                <text class="product-card__price">{{ item.priceLabel }}</text>
              </view>

              <text class="product-card__text">{{ item.description || `${item.durationDays} 天完整解锁权益。` }}</text>
              <view class="right-list">
                <text v-for="benefit in item.benefits" :key="benefit" class="right-item">{{ benefit }}</text>
              </view>

              <button
                class="hero-button hero-button--primary"
                :loading="creatingOrder && pendingProductCode === item.code"
                @tap="createOrder(item.code)"
              >
                创建订单
              </button>
            </view>
          </view>
        </view>

        <view v-if="currentOrder" class="section-card">
          <text class="section-title">当前订单</text>
          <view class="order-card">
            <text class="order-card__line">订单号：{{ currentOrder.orderNo }}</text>
            <text class="order-card__line">商品：{{ currentOrder.productTitle }}</text>
            <text class="order-card__line">金额：{{ currentOrder.amountLabel }}</text>
            <text class="order-card__line">状态：{{ currentOrder.status }}</text>
            <text class="order-card__line">创建时间：{{ formatDateTime(currentOrder.createdAt) }}</text>
          </view>

          <button
            v-if="currentOrder.status === 'pending'"
            class="hero-button hero-button--secondary"
            :loading="paying"
            @tap="completeOrder"
          >
            模拟支付完成
          </button>
        </view>
      </template>
    </template>
  </view>
</template>

<script setup lang="ts">
import { onLoad, onShow } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import { fetchMembershipStatus } from '../../api/membership';
import { createMembershipOrder, simulateMembershipPay } from '../../api/orders';
import { getAuthToken } from '../../services/session';
import type { MembershipStatusData } from '../../types/membership';
import type { MembershipOrder } from '../../types/order';

const authToken = ref(getAuthToken());
const loading = ref(false);
const creatingOrder = ref(false);
const paying = ref(false);
const pendingProductCode = ref('');
const membership = ref<MembershipStatusData | null>(null);
const currentOrder = ref<MembershipOrder | null>(null);

const isLoggedIn = computed(() => Boolean(authToken.value));

async function loadMembership() {
  if (!isLoggedIn.value) {
    membership.value = null;
    return;
  }

  try {
    loading.value = true;
    const response = await fetchMembershipStatus();
    membership.value = response.data;
  } catch (error) {
    console.warn('load membership failed', error);
    membership.value = null;
    uni.showToast({
      title: '会员状态读取失败',
      icon: 'none',
    });
  } finally {
    loading.value = false;
  }
}

async function createOrder(productCode: string) {
  try {
    creatingOrder.value = true;
    pendingProductCode.value = productCode;
    const response = await createMembershipOrder(productCode);
    currentOrder.value = response.data.order;
    uni.showToast({
      title: '订单已创建',
      icon: 'success',
    });
  } catch (error) {
    console.warn('create membership order failed', error);
    uni.showToast({
      title: '订单创建失败',
      icon: 'none',
    });
  } finally {
    creatingOrder.value = false;
    pendingProductCode.value = '';
  }
}

async function completeOrder() {
  if (!currentOrder.value) {
    return;
  }

  try {
    paying.value = true;
    const response = await simulateMembershipPay(currentOrder.value.orderNo);
    currentOrder.value = response.data.order;
    await loadMembership();
    uni.showToast({
      title: '会员已开通',
      icon: 'success',
    });
  } catch (error) {
    console.warn('complete membership order failed', error);
    uni.showToast({
      title: '支付流转失败',
      icon: 'none',
    });
  } finally {
    paying.value = false;
  }
}

function goProfile() {
  uni.navigateTo({
    url: '/pages/profile/index',
  });
}

function formatDateTime(value: string | null) {
  if (!value) {
    return '暂未生效';
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
  void loadMembership();
});

onShow(() => {
  authToken.value = getAuthToken();
  void loadMembership();
});
</script>

<style lang="scss">
.page {
  min-height: 100vh;
  padding: 24rpx;
  background:
    radial-gradient(circle at top right, rgba(245, 202, 118, 0.22), transparent 24%),
    linear-gradient(180deg, #fffaf4 0%, #f5f3ee 100%);
}

.hero-card,
.section-card {
  display: grid;
  gap: 18rpx;
  margin-bottom: 20rpx;
  padding: 28rpx;
  border-radius: 32rpx;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: var(--apple-shadow);
}

.section-card--soft {
  background: rgba(248, 245, 239, 0.94);
}

.hero-card__eyebrow,
.right-item {
  font-size: 20rpx;
  letter-spacing: 0.24em;
  color: var(--apple-subtle);
}

.hero-card__title,
.section-title,
.product-card__title,
.empty-card__title {
  font-size: 38rpx;
  font-weight: 700;
  color: var(--apple-text);
}

.hero-card__subtitle,
.product-card__subtitle,
.product-card__text,
.empty-card__text,
.order-card__line {
  font-size: 26rpx;
  line-height: 1.7;
  color: var(--apple-muted);
}

.product-list,
.right-list {
  display: grid;
  gap: 14rpx;
}

.product-card,
.order-card,
.right-item {
  display: grid;
  gap: 12rpx;
  padding: 22rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.74);
}

.product-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.product-card__price {
  font-size: 32rpx;
  color: #9d6c16;
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
  background: linear-gradient(135deg, #d7a240 0%, #f0c166 100%);
}

.hero-button--secondary {
  color: var(--apple-text);
  background: rgba(244, 247, 250, 0.92);
}
</style>
