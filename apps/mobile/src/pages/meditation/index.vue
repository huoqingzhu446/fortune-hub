<template>
  <view class="page-shell" :style="themeVars">
    <view class="page">
      <view class="page-header">
        <text class="page-header__title">冥想记录</text>
        <text class="page-header__subtitle">把一次放松练习安静地留在今天的记录里</text>
      </view>

      <view v-if="loadingDetail" class="card">
        <text class="field__label">正在同步这次练习</text>
        <text class="duration-text">马上把之前的来源和完成状态带回来。</text>
      </view>

      <view v-else-if="isEditMode" class="card">
        <text class="field__label">回看与编辑</text>
        <text class="duration-text">{{ form.recordDate }} 的练习已加载，可以继续补充。</text>
      </view>

      <view class="card">
        <text class="field__label">记录日期</text>
        <picker mode="date" :value="form.recordDate" :end="todayDate" @change="handleDateChange">
          <view class="picker">{{ form.recordDate }}</view>
        </picker>
      </view>

      <view class="card">
        <text class="field__label">内容来源</text>
        <view class="tag-grid">
          <view
            v-for="item in sourceOptions"
            :key="item.value"
            class="tag-chip"
            :class="{ 'tag-chip--active': form.sourceType === item.value }"
            @tap="form.sourceType = item.value"
          >
            <text>{{ item.label }}</text>
          </view>
        </view>
        <input
          v-model="form.sourceTitle"
          class="picker"
          placeholder="例如：睡前呼吸、探索页推荐、自己常用音频"
        />
      </view>

      <view class="card">
        <text class="field__label">冥想音乐</text>
        <view class="music-list">
          <view
            v-for="item in musicOptions"
            :key="item.id"
            class="music-card"
            :class="{ 'music-card--active': selectedMusicId === item.id }"
            @tap="selectMusic(item.id)"
          >
            <view>
              <text class="music-card__title">{{ item.title }}</text>
              <text class="music-card__text">{{ item.subtitle }}</text>
            </view>
            <view class="music-card__footer">
              <text class="music-card__meta">{{ item.durationMinutes }} 分钟 · {{ item.atmosphere }}</text>
              <button class="music-card__button" @tap.stop="togglePreview(item.id)">
                {{ playingMusicId === item.id ? '暂停' : '试听' }}
              </button>
            </view>
          </view>
        </view>
      </view>

      <view class="card">
        <text class="field__label">练习标题</text>
        <input v-model="form.title" class="picker" placeholder="例如：睡前呼吸练习" />
      </view>

      <view class="card">
        <text class="field__label">分类</text>
        <view class="tag-grid">
          <view
            v-for="item in categories"
            :key="item"
            class="tag-chip"
            :class="{ 'tag-chip--active': form.category === item }"
            @tap="form.category = item"
          >
            <text>{{ item }}</text>
          </view>
        </view>
      </view>

      <view class="card">
        <text class="field__label">练习时长</text>
        <slider
          :value="form.durationMinutes"
          :min="1"
          :max="60"
          activeColor="var(--theme-primary)"
          backgroundColor="rgba(174,180,189,0.24)"
          @change="handleDurationChange"
        />
        <text class="duration-text">{{ form.durationMinutes }} 分钟</text>
      </view>

      <view class="card">
        <text class="field__label">完成状态</text>
        <view class="tag-grid">
          <view
            v-for="item in completionOptions"
            :key="item.value"
            class="tag-chip"
            :class="{ 'tag-chip--active': form.completionStatus === item.value }"
            @tap="form.completionStatus = item.value"
          >
            <text>{{ item.label }}</text>
          </view>
        </view>
      </view>

      <view class="card">
        <text class="field__label">一句备注</text>
        <textarea
          v-model="form.summary"
          class="textarea"
          maxlength="200"
          placeholder="例如：今晚比昨天更容易放松下来。"
        />
      </view>

      <button class="save-button" :loading="saving" @tap="submit">
        {{ isEditMode ? '更新这次练习' : '保存这次练习' }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onHide, onLoad, onUnload } from '@dcloudio/uni-app';
import { computed, reactive, ref } from 'vue';
import {
  fetchMeditationMusicLibrary,
  fetchMeditationRecordDetail,
  saveMeditationRecord,
} from '../../api/records';
import { appEnv } from '../../config/env';
import { useThemePreference } from '../../composables/useThemePreference';
import { getErrorMessage } from '../../services/errors';
import { defaultMeditationMusicLibrary } from '../../services/meditation-music';
import { usePageStateStore } from '../../stores/page-state';
import type { MeditationMusicItem } from '../../types/lucky';
import type { MeditationLogItem } from '../../types/records';

function buildLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const { themeVars } = useThemePreference();
const todayDate = buildLocalDateString();
const saving = ref(false);
const loadingDetail = ref(false);
const categories = ['meditation', 'sleep', 'breath', 'focus'];
const musicOptions = ref<MeditationMusicItem[]>(defaultMeditationMusicLibrary);
const selectedMusicId = ref('');
const playingMusicId = ref('');
const audioContext = uni.createInnerAudioContext();
const completionOptions = [
  { label: '完整完成', value: 'completed' },
  { label: '完成一半', value: 'partial' },
  { label: '今天跳过', value: 'skipped' },
] as const;
const pageStateStore = usePageStateStore();
const sourceOptions = [
  { label: '探索推荐', value: 'explore' },
  { label: '情绪疗愈', value: 'emotion' },
  { label: '睡眠放松', value: 'sleep' },
  { label: '自定义练习', value: 'custom' },
] as const;

const form = reactive({
  recordId: '',
  recordDate: todayDate,
  title: '呼吸放松练习',
  category: 'meditation',
  sourceType: 'custom',
  sourceTitle: '',
  durationMinutes: 8,
  completionStatus: 'completed' as 'completed' | 'partial' | 'skipped',
  summary: '',
});

const isEditMode = computed(() => Boolean(form.recordId));
const completedValue = computed(() => form.completionStatus === 'completed');

function handleDateChange(event: { detail: { value: string } }) {
  form.recordDate = event.detail.value;
}

function handleDurationChange(event: { detail: { value: number } }) {
  form.durationMinutes = Number(event.detail.value);
}

async function submit() {
  try {
    saving.value = true;
    const selectedMusic = findMeditationMusic(selectedMusicId.value);
    await saveMeditationRecord({
      recordId: form.recordId || undefined,
      recordDate: form.recordDate,
      title: form.title,
      category: form.category,
      sourceType: form.sourceType,
      sourceTitle:
        form.sourceTitle || (selectedMusic ? `${selectedMusic.title} · ${selectedMusic.atmosphere}` : ''),
      durationMinutes: form.durationMinutes,
      completed: completedValue.value,
      completionStatus: form.completionStatus,
      summary: form.summary,
    });
    pageStateStore.markDirty(['records', 'profile', 'home']);
    uni.showToast({
      title: '练习已记录',
      icon: 'success',
    });
    setTimeout(() => {
      uni.navigateBack({
        delta: 1,
      });
    }, 300);
  } catch (error) {
    console.warn('save meditation record failed', error);
    uni.showToast({
      title: getErrorMessage(error, '保存失败'),
      icon: 'none',
    });
  } finally {
    saving.value = false;
  }
}

function applyRecord(item: MeditationLogItem) {
  form.recordId = item.id;
  form.recordDate = item.recordDate;
  form.title = item.title;
  form.category = item.category;
  form.sourceType = item.sourceType || 'custom';
  form.sourceTitle = item.sourceTitle || '';
  form.durationMinutes = item.durationMinutes;
  form.completionStatus = item.completionStatus || (item.completed ? 'completed' : 'partial');
  form.summary = item.summary;
  selectedMusicId.value =
    musicOptions.value.find((music) => music.title === item.title || item.sourceTitle.includes(music.title))?.id ||
    '';
}

function selectMusic(id: string) {
  selectedMusicId.value = id;
  const selectedMusic = findMeditationMusic(id);

  if (!selectedMusic) {
    return;
  }

  form.title = selectedMusic.title;
  form.category = selectedMusic.category;
  form.durationMinutes = selectedMusic.durationMinutes;
  form.sourceTitle = `${selectedMusic.title} · ${selectedMusic.atmosphere}`;
}

function togglePreview(id: string) {
  const selectedMusic = findMeditationMusic(id);

  if (!selectedMusic) {
    return;
  }

  if (!selectedMusic.previewUrl) {
    uni.showToast({
      title: '这首音乐还没有上传试听文件',
      icon: 'none',
    });
    return;
  }

  if (playingMusicId.value === id) {
    audioContext.pause();
    playingMusicId.value = '';
    return;
  }

  audioContext.stop();
  audioContext.src = resolveMeditationPreviewUrl(selectedMusic.previewUrl);
  audioContext.play();
  playingMusicId.value = id;
}

function resolveMeditationPreviewUrl(url: string) {
  const trimmed = url.trim();

  if (!trimmed) {
    return '';
  }

  const fileIdMatch = trimmed.match(
    /(?:^|\/)(?:api(?:\/v1)?\/)?files\/([^/?#]+)\/content(?:$|[/?#])/i,
  );

  if (
    fileIdMatch?.[1] &&
    (/^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|host\.docker\.internal)(?::\d+)?\//i.test(trimmed) ||
      trimmed.startsWith('/api/files/'))
  ) {
    return buildApiFilePreviewUrl(fileIdMatch[1]);
  }

  if (trimmed.startsWith('/')) {
    if (/^https?:\/\//i.test(appEnv.apiBaseUrl)) {
      return new URL(trimmed, appEnv.apiBaseUrl).toString();
    }

    return trimmed;
  }

  return trimmed;
}

function buildApiFilePreviewUrl(fileId: string) {
  const path = `/api/v1/files/${encodeURIComponent(fileId)}/content`;

  if (/^https?:\/\//i.test(appEnv.apiBaseUrl)) {
    return new URL(path, appEnv.apiBaseUrl).toString();
  }

  return path;
}

function findMeditationMusic(id?: string) {
  if (!id) {
    return null;
  }

  return musicOptions.value.find((item) => item.id === id) ?? null;
}

async function loadMusicLibrary() {
  try {
    const response = await fetchMeditationMusicLibrary();
    musicOptions.value = response.data.items.length
      ? response.data.items
      : defaultMeditationMusicLibrary;
  } catch (error) {
    console.warn('load meditation music failed', error);
    musicOptions.value = defaultMeditationMusicLibrary;
  }
}

audioContext.onEnded(() => {
  playingMusicId.value = '';
});

onHide(() => {
  audioContext.pause();
  playingMusicId.value = '';
});

onUnload(() => {
  audioContext.destroy();
});

async function loadDetail(recordId: string) {
  if (!recordId) {
    return;
  }

  try {
    loadingDetail.value = true;
    const response = await fetchMeditationRecordDetail(recordId);
    if (response.data.item) {
      applyRecord(response.data.item);
    }
  } catch (error) {
    console.warn('load meditation detail failed', error);
    uni.showToast({
      title: getErrorMessage(error, '记录读取失败'),
      icon: 'none',
    });
  } finally {
    loadingDetail.value = false;
  }
}

onLoad((options) => {
  void loadMusicLibrary();
  if (typeof options?.recordId === 'string' && options.recordId) {
    form.recordId = decodeURIComponent(options.recordId);
    void loadDetail(form.recordId);
  }
  if (typeof options?.recordDate === 'string' && options.recordDate) {
    form.recordDate = decodeURIComponent(options.recordDate);
  }
});
</script>

<style lang="scss">
.page-shell {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, var(--theme-glow), transparent 34%),
    linear-gradient(180deg, var(--theme-page-top) 0%, var(--theme-page-bottom) 100%);
}

.page {
  min-height: 100vh;
  padding: 28rpx 24rpx 40rpx;
}

.page-header,
.card {
  margin-bottom: 20rpx;
}

.page-header__title {
  display: block;
  font-size: 60rpx;
  color: var(--theme-text-primary);
}

.page-header__subtitle,
.field__label,
.duration-text {
  font-size: 24rpx;
  line-height: 1.7;
  color: var(--theme-text-secondary);
}

.card {
  display: grid;
  gap: 16rpx;
  padding: 24rpx;
  border-radius: 28rpx;
  border: 1rpx solid var(--theme-border);
  background: var(--theme-surface);
  box-shadow: var(--theme-shadow-soft);
}

.picker,
.textarea {
  padding: 18rpx 20rpx;
  border-radius: 20rpx;
  background: var(--theme-surface-muted);
  font-size: 26rpx;
  color: var(--theme-text-primary);
}

.tag-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.music-list {
  display: grid;
  gap: 12rpx;
}

.music-card {
  display: grid;
  gap: 8rpx;
  padding: 20rpx;
  border-radius: 22rpx;
  background: var(--theme-surface-muted);
  border: 1rpx solid transparent;
}

.music-card--active {
  border-color: rgba(var(--theme-primary-rgb), 0.2);
  background: rgba(var(--theme-primary-rgb), 0.08);
}

.music-card__title {
  font-size: 26rpx;
  font-weight: 600;
  color: var(--theme-text-primary);
}

.music-card__text,
.music-card__meta {
  font-size: 22rpx;
  line-height: 1.6;
  color: var(--theme-text-secondary);
}

.music-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.music-card__button {
  min-height: 54rpx;
  padding: 0 18rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  color: var(--theme-primary);
  background: var(--theme-tag-bg);
}

.tag-chip {
  padding: 14rpx 20rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  color: var(--theme-text-secondary);
  background: var(--theme-surface-muted);
}

.tag-chip--active {
  color: #ffffff;
  background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-accent) 100%);
}

.textarea {
  min-height: 180rpx;
  width: 100%;
  box-sizing: border-box;
}

.save-button {
  min-height: 82rpx;
  border-radius: 999rpx;
  font-size: 28rpx;
  color: #ffffff;
  background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-accent) 100%);
}

.save-button::after {
  border: none;
}
</style>
