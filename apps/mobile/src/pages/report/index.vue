<template>
  <view class="page">
    <view class="hero-card">
      <text class="hero-card__eyebrow">full report</text>
      <text class="hero-card__title">{{ report?.title || '完整版报告' }}</text>
      <text class="hero-card__subtitle">
        {{
          report
            ? report.summary || '这里会展示基础版结果、完整版解读和海报能力。'
            : '登录后可以查看基础版结果、广告解锁入口、VIP 权益和分享海报。'
        }}
      </text>

      <view v-if="report" class="status-row">
        <view class="status-pill">
          <text class="status-pill__label">报告类型</text>
          <text class="status-pill__value">{{ reportTypeLabel }}</text>
        </view>
        <view class="status-pill">
          <text class="status-pill__label">当前状态</text>
          <text class="status-pill__value">
            {{ report.access.isFullReportUnlocked ? '完整版已解锁' : '基础版' }}
          </text>
        </view>
      </view>
    </view>

    <view v-if="loading" class="section-card empty-card">
      <text class="empty-card__title">正在同步报告...</text>
      <text class="empty-card__text">马上把结果和权益状态都整理好。</text>
    </view>

    <view v-else-if="!isLoggedIn" class="section-card empty-card">
      <text class="empty-card__title">先登录再查看完整报告</text>
      <text class="empty-card__text">历史记录、广告解锁、会员状态和海报生成都需要登录后使用。</text>
      <button class="hero-button hero-button--primary" @tap="goProfile">去个人中心</button>
    </view>

    <template v-else-if="report">
      <view class="section-card">
        <text class="section-title">基础版结果</text>
        <view v-for="item in report.baseSections" :key="item.title" class="section-block">
          <text class="section-block__title">{{ item.title }}</text>
          <text class="section-block__summary">{{ item.summary }}</text>
          <view class="bullet-list">
            <text v-for="bullet in item.bullets" :key="bullet" class="bullet-item">{{ bullet }}</text>
          </view>
        </view>
      </view>

      <view v-if="!report.access.isFullReportUnlocked" class="section-card unlock-card">
        <text class="section-title">完整版解读</text>
        <text class="section-block__summary">
          当前还是基础版。解锁后可以查看更细的结构拆解、行动建议和完整分享海报能力。
        </text>

        <view class="preview-list">
          <view
            v-for="item in report.lockedPreviewSections"
            :key="item.title"
            class="preview-card"
          >
            <text class="preview-card__title">{{ item.title }}</text>
            <text class="preview-card__summary">{{ item.summary }}</text>
          </view>
        </view>

        <view class="action-row">
          <button
            v-if="report.access.canUnlockByAd && report.offers.adSlotCode"
            class="hero-button hero-button--primary"
            :loading="unlocking"
            @tap="unlockByAd"
          >
            观看激励视频解锁
          </button>
          <button class="hero-button hero-button--secondary" @tap="goMembership">
            开通 VIP
          </button>
        </view>
      </view>

      <view v-else class="section-card">
        <text class="section-title">完整版解读</text>
        <view v-for="item in report.fullSections" :key="item.title" class="section-block">
          <text class="section-block__title">{{ item.title }}</text>
          <text class="section-block__summary">{{ item.summary }}</text>
          <view class="bullet-list">
            <text v-for="bullet in item.bullets" :key="bullet" class="bullet-item">{{ bullet }}</text>
          </view>
        </view>
      </view>

      <view class="section-card">
        <view class="section-head">
          <text class="section-title">分享海报</text>
          <text class="section-head__meta">{{ report.sharePoster.themeName }}</text>
        </view>

        <view class="poster-shell">
          <text class="poster-shell__title">{{ report.sharePoster.title }}</text>
          <text class="poster-shell__subtitle">{{ report.sharePoster.subtitle }}</text>
          <text class="poster-shell__accent">{{ report.sharePoster.accentText }}</text>
          <text class="poster-shell__footer">{{ report.sharePoster.footerText }}</text>
        </view>

        <view class="action-row">
          <button
            class="hero-button hero-button--primary"
            :loading="posterLoading"
            @tap="generatePoster"
          >
            生成分享海报
          </button>
          <button class="hero-button hero-button--secondary" @tap="goMembership">
            查看会员权益
          </button>
        </view>

        <view v-if="poster" class="poster-result">
          <image class="poster-image" :src="poster.imageDataUrl" mode="widthFix" />

          <view class="action-row">
            <button class="hero-button hero-button--secondary" @tap="previewPoster">
              全屏预览
            </button>
            <button class="hero-button hero-button--primary" @tap="downloadPoster">
              保存到手机
            </button>
          </view>

          <view v-if="isMpWeixin" class="action-row">
            <button class="hero-button hero-button--ghost" @tap="sharePosterToWechat">
              微信发好友
            </button>
          </view>
        </view>
      </view>

      <view v-if="report.offers.vipProducts.length" class="section-card section-card--soft">
        <text class="section-title">VIP 权益预览</text>
        <view class="product-list">
          <view v-for="item in report.offers.vipProducts" :key="item.code" class="product-card">
            <view class="product-card__top">
              <view>
                <text class="product-card__title">{{ item.title }}</text>
                <text class="product-card__subtitle">{{ item.subtitle || '完整内容与海报权益' }}</text>
              </view>
              <text class="product-card__price">{{ item.priceLabel }}</text>
            </view>

            <text v-for="benefit in item.benefits" :key="benefit" class="bullet-item">{{ benefit }}</text>
          </view>
        </view>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { onLoad, onShow } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import { verifyRewardUnlock } from '../../api/ads';
import { generateReportPoster } from '../../api/posters';
import { fetchReport } from '../../api/reports';
import { getErrorMessage } from '../../services/errors';
import {
  handlePosterImageError,
  previewPosterImage,
  savePosterImage,
  sharePosterImageToWechat,
} from '../../services/poster-image';
import { getAuthToken } from '../../services/session';
import type { GeneratedPoster } from '../../types/poster';
import type { UnifiedReport } from '../../types/report';

const authToken = ref(getAuthToken());
const recordId = ref('');
const loading = ref(false);
const unlocking = ref(false);
const posterLoading = ref(false);
const report = ref<UnifiedReport | null>(null);
const poster = ref<GeneratedPoster | null>(null);
const isMpWeixin = String(
  (uni.getSystemInfoSync() as { uniPlatform?: string }).uniPlatform ?? '',
).toLowerCase() === 'mp-weixin';

const isLoggedIn = computed(() => Boolean(authToken.value));
const reportTypeLabel = computed(() => {
  const mapping: Record<string, string> = {
    personality: '性格测评',
    emotion: '情绪自检',
    bazi: '八字解读',
  };

  return mapping[report.value?.recordType || ''] || '结果报告';
});

async function loadReport() {
  if (!recordId.value || !isLoggedIn.value) {
    report.value = null;
    return;
  }

  try {
    loading.value = true;
    const response = await fetchReport(recordId.value);
    report.value = response.data.report;
  } catch (error) {
    console.warn('load report failed', error);
    report.value = null;
    uni.showToast({
      title: '报告读取失败',
      icon: 'none',
    });
  } finally {
    loading.value = false;
  }
}

async function unlockByAd() {
  if (!report.value?.offers.adSlotCode) {
    return;
  }

  try {
    unlocking.value = true;
    const response = await verifyRewardUnlock(recordId.value, report.value.offers.adSlotCode);
    report.value = response.data.report;
    uni.showToast({
      title: '完整版已解锁',
      icon: 'success',
    });
  } catch (error) {
    console.warn('unlock by ad failed', error);
    uni.showToast({
      title: '解锁失败，请稍后再试',
      icon: 'none',
    });
  } finally {
    unlocking.value = false;
  }
}

async function generatePoster() {
  if (!recordId.value) {
    return;
  }

  try {
    posterLoading.value = true;
    const response = await generateReportPoster(recordId.value);
    poster.value = response.data.poster;
    uni.showToast({
      title: '海报已生成',
      icon: 'success',
    });
  } catch (error) {
    console.warn('generate report poster failed', error);
    uni.showToast({
      title: getErrorMessage(error, '海报生成失败'),
      icon: 'none',
    });
  } finally {
    posterLoading.value = false;
  }
}

async function previewPoster() {
  if (!poster.value) {
    return;
  }

  try {
    await previewPosterImage(poster.value.imageDataUrl, poster.value.downloadFileName);
  } catch (error) {
    uni.showToast({
      title: handlePosterImageError(error, '预览失败，请稍后再试'),
      icon: 'none',
    });
  }
}

async function downloadPoster() {
  if (!poster.value) {
    return;
  }

  try {
    await savePosterImage(poster.value.imageDataUrl, poster.value.downloadFileName);
    uni.showToast({
      title: typeof window !== 'undefined' ? '已开始下载' : '已保存到相册',
      icon: 'success',
    });
  } catch (error) {
    uni.showToast({
      title: handlePosterImageError(error, '保存失败，请稍后再试'),
      icon: 'none',
    });
  }
}

async function sharePosterToWechat() {
  if (!poster.value) {
    return;
  }

  try {
    await sharePosterImageToWechat(
      poster.value.imageDataUrl,
      poster.value.downloadFileName,
    );
  } catch (error) {
    uni.showToast({
      title: handlePosterImageError(error, '当前微信版本暂不支持直接发图，请先保存到相册'),
      icon: 'none',
    });
  }
}

function goMembership() {
  uni.navigateTo({
    url: '/pages/membership/index',
  });
}

function goProfile() {
  uni.navigateTo({
    url: '/pages/profile/index',
  });
}

onLoad((options) => {
  recordId.value =
    typeof options?.recordId === 'string' && options.recordId
      ? decodeURIComponent(options.recordId)
      : '';
  void loadReport();
});

onShow(() => {
  authToken.value = getAuthToken();
  if (recordId.value) {
    void loadReport();
  }
});
</script>

<style lang="scss">
.page {
  min-height: 100vh;
  padding: 24rpx;
  background:
    radial-gradient(circle at top left, rgba(125, 196, 255, 0.18), transparent 24%),
    linear-gradient(180deg, #f8fbff 0%, #eef3f8 100%);
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
  background: rgba(246, 249, 252, 0.94);
}

.hero-card__eyebrow,
.status-pill__label {
  font-size: 20rpx;
  text-transform: uppercase;
  letter-spacing: 0.28em;
  color: var(--apple-subtle);
}

.hero-card__title,
.section-title,
.section-block__title,
.preview-card__title,
.product-card__title {
  font-size: 38rpx;
  font-weight: 700;
  color: var(--apple-text);
}

.hero-card__subtitle,
.section-block__summary,
.empty-card__text,
.preview-card__summary,
.product-card__subtitle,
.poster-shell__subtitle,
.poster-shell__footer {
  font-size: 26rpx;
  line-height: 1.7;
  color: var(--apple-muted);
}

.status-row,
.action-row,
.bullet-list,
.product-list {
  display: grid;
  gap: 14rpx;
}

.status-row,
.action-row {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.status-pill,
.preview-card,
.product-card {
  display: grid;
  gap: 10rpx;
  padding: 22rpx;
  border-radius: 24rpx;
  background: rgba(246, 249, 252, 0.92);
}

.status-pill__value,
.product-card__price,
.empty-card__title {
  font-size: 30rpx;
  color: var(--apple-text);
}

.section-block,
.poster-result {
  display: grid;
  gap: 14rpx;
}

.bullet-item {
  padding: 18rpx 20rpx;
  border-radius: 20rpx;
  background: rgba(246, 249, 252, 0.92);
  font-size: 24rpx;
  line-height: 1.7;
  color: var(--apple-text);
}

.poster-shell {
  display: grid;
  gap: 14rpx;
  padding: 28rpx;
  border-radius: 28rpx;
  background: linear-gradient(135deg, rgba(125, 196, 255, 0.18) 0%, rgba(143, 224, 198, 0.2) 100%);
}

.poster-shell__title {
  font-size: 40rpx;
  font-weight: 700;
  color: var(--apple-text);
}

.poster-shell__accent {
  font-size: 26rpx;
  color: #457d6a;
}

.poster-image {
  width: 100%;
  border-radius: 28rpx;
  overflow: hidden;
}

.section-head,
.product-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.section-head__meta {
  font-size: 22rpx;
  color: var(--apple-subtle);
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
</style>
