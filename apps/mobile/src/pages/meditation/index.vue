<template>
  <view class="page-shell" :style="themeVars">
    <view class="page">
      <view class="page-header">
        <text class="page-header__eyebrow">冥想记录</text>
        <text class="page-header__title">把练习变成可回看的调整方法</text>
        <text class="page-header__subtitle">
          记录练习前后的状态、身体信号和下一步行动，下次就知道什么方法真的帮到你。
        </text>

        <view class="practice-strip">
          <view class="practice-strip__item">
            <text class="practice-strip__label">分类</text>
            <text class="practice-strip__value">{{ selectedCategory.label }}</text>
          </view>
          <view class="practice-strip__item">
            <text class="practice-strip__label">时长</text>
            <text class="practice-strip__value">{{ form.durationMinutes }} 分钟</text>
          </view>
          <view class="practice-strip__item">
            <text class="practice-strip__label">专注</text>
            <text class="practice-strip__value">{{ focusScoreText }}</text>
          </view>
        </view>
      </view>

      <view v-if="loadingDetail" class="notice-panel">
        <text class="notice-panel__title">正在同步这次练习</text>
        <text class="notice-panel__text">马上把之前的来源、完成状态和复盘内容带回来。</text>
      </view>

      <view v-else-if="isEditMode && !showReviewMode" class="notice-panel">
        <text class="notice-panel__title">回看与编辑</text>
        <text class="notice-panel__text">{{ form.recordDate }} 的练习已加载，可以继续补充细节。</text>
      </view>

      <view v-if="showReviewMode" class="review-mode">
        <view class="review-hero">
          <text class="review-hero__eyebrow">{{ reviewRecord?.recordDate }} · {{ reviewCategoryLabel }}</text>
          <text class="review-hero__title">{{ reviewRecord?.title }}</text>
          <text class="review-hero__text">{{ reviewOutcomeText }}</text>

          <view class="review-hero__stats">
            <view
              v-for="stat in reviewStats"
              :key="stat.label"
              class="review-hero__stat"
            >
              <text class="review-hero__stat-value">{{ stat.value }}</text>
              <text class="review-hero__stat-label">{{ stat.label }}</text>
            </view>
          </view>
        </view>

        <view class="review-section">
          <view class="section__head">
            <text class="section__title">练习结果</text>
            <text class="section__meta">{{ reviewRecord?.categorySummary || selectedCategory.description }}</text>
          </view>

          <view class="review-list">
            <view
              v-for="item in reviewResultRows"
              :key="item.label"
              class="review-row"
            >
              <text class="review-row__label">{{ item.label }}</text>
              <text class="review-row__value">{{ item.value }}</text>
            </view>
          </view>
        </view>

        <view class="review-section">
          <view class="section__head">
            <text class="section__title">有效线索</text>
            <text class="section__meta">下次可以优先复用这些方法。</text>
          </view>

          <view class="review-note">
            <text class="review-note__title">{{ reviewRecord?.insight || reviewRecord?.summary || '这次还没有记录有效点' }}</text>
            <text class="review-note__text">{{ reviewRecord?.bodySignal || '补充身体信号后，会更容易看见哪类练习真的有效。' }}</text>
          </view>
        </view>

        <view class="review-actions">
          <button class="review-actions__button review-actions__button--ghost" @tap="duplicateReviewAsNew">
            再记一次
          </button>
          <button class="review-actions__button" @tap="startEditingRecord">
            编辑记录
          </button>
        </view>
      </view>

      <view v-else-if="!loadingDetail" class="form-flow">
        <view class="section">
        <view class="section__head">
          <text class="section__title">选择练习方向</text>
          <text class="section__meta">分类会保存中文展示，后台仍保留稳定代码。</text>
        </view>

        <view class="category-list">
          <view
            v-for="item in categoryOptions"
            :key="item.value"
            class="category-option"
            :class="{ 'category-option--active': form.category === item.value }"
            @tap="selectCategory(item.value)"
          >
            <view>
              <text class="category-option__title">{{ item.label }}</text>
              <text class="category-option__text">{{ item.description }}</text>
            </view>
            <text class="category-option__time">{{ item.defaultDuration }} 分钟</text>
          </view>
        </view>
      </view>

      <view class="section">
        <view class="section__head">
          <text class="section__title">本次练习结构</text>
          <text class="section__meta">{{ selectedCategory.description }}</text>
        </view>

        <view class="guide-panel">
          <view
            v-for="(step, index) in selectedCategory.guide"
            :key="step"
            class="guide-step"
          >
            <text class="guide-step__num">{{ index + 1 }}</text>
            <text class="guide-step__text">{{ step }}</text>
          </view>
        </view>
      </view>

      <view class="section">
        <view class="section__head">
          <text class="section__title">练习来源</text>
          <text class="section__meta">记录你是从哪里开始这次练习的。</text>
        </view>

        <view class="form-panel">
          <view class="field">
            <text class="field__label">记录日期</text>
            <picker mode="date" :value="form.recordDate" :end="todayDate" @change="handleDateChange">
              <view class="picker">{{ form.recordDate }}</view>
            </picker>
          </view>

          <view class="field">
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
              placeholder="例如：探索页推荐、睡前音频、自己的呼吸练习"
            />
          </view>
        </view>
      </view>

      <view class="section">
        <view class="section__head">
          <text class="section__title">可选音频</text>
          <text class="section__meta">选择后会自动带入标题、分类和时长。</text>
        </view>

        <view class="music-list">
          <view
            v-for="item in musicOptions"
            :key="item.id"
            class="music-card"
            :class="{ 'music-card--active': selectedMusicId === item.id }"
            @tap="selectMusic(item.id)"
          >
            <view class="music-card__head">
              <view>
                <text class="music-card__title">{{ item.title }}</text>
                <text class="music-card__text">{{ item.subtitle }}</text>
              </view>
              <text class="music-card__badge">{{ categoryLabel(item.category, item.categoryLabel) }}</text>
            </view>

            <text class="music-card__scene">{{ item.scene || selectedCategory.description }}</text>

            <view v-if="musicGuide(item).length" class="mini-steps">
              <text
                v-for="step in musicGuide(item)"
                :key="step"
                class="mini-steps__item"
              >
                {{ step }}
              </text>
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

      <view class="section">
        <view class="section__head">
          <text class="section__title">练习参数</text>
          <text class="section__meta">让记录足够具体，方便之后复盘。</text>
        </view>

        <view class="form-panel">
          <view class="field">
            <text class="field__label">练习标题</text>
            <input v-model="form.title" class="picker" placeholder="例如：四拍呼吸复位" />
          </view>

          <view class="field">
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

          <view class="field">
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
        </view>
      </view>

      <view class="section">
        <view class="section__head">
          <text class="section__title">练习前</text>
          <text class="section__meta">先记录为什么开始，这会让练习更有方向。</text>
        </view>

        <view class="form-panel">
          <view class="field">
            <text class="field__label">本次目标</text>
            <view class="tag-grid">
              <view
                v-for="item in selectedCategory.intentions"
                :key="item"
                class="tag-chip"
                :class="{ 'tag-chip--active': form.intention === item }"
                @tap="form.intention = item"
              >
                <text>{{ item }}</text>
              </view>
            </view>
            <input v-model="form.intention" class="picker" placeholder="也可以写下自己的目标" />
          </view>

          <view class="field">
            <text class="field__label">练习前状态</text>
            <view class="tag-grid">
              <view
                v-for="item in beforeMoodOptions"
                :key="item.value"
                class="tag-chip"
                :class="{ 'tag-chip--active': form.moodBefore === item.value }"
                @tap="form.moodBefore = item.value"
              >
                <text>{{ item.label }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view class="section">
        <view class="section__head">
          <text class="section__title">练习后复盘</text>
          <text class="section__meta">记录变化，比只记“做了”更有价值。</text>
        </view>

        <view class="form-panel">
          <view class="field">
            <text class="field__label">练习后状态</text>
            <view class="tag-grid">
              <view
                v-for="item in afterMoodOptions"
                :key="item.value"
                class="tag-chip"
                :class="{ 'tag-chip--active': form.moodAfter === item.value }"
                @tap="form.moodAfter = item.value"
              >
                <text>{{ item.label }}</text>
              </view>
            </view>
          </view>

          <view class="field">
            <view class="field__head">
              <text class="field__label">专注程度</text>
              <text class="field__hint">{{ focusScoreText }}</text>
            </view>
            <slider
              :value="form.focusScore"
              :min="1"
              :max="5"
              activeColor="var(--theme-primary)"
              backgroundColor="rgba(174,180,189,0.24)"
              @change="handleFocusScoreChange"
            />
          </view>

          <view class="field">
            <text class="field__label">身体信号</text>
            <input
              v-model="form.bodySignal"
              class="picker"
              placeholder="例如：肩膀松了一点、胸口没那么堵、呼吸变慢"
            />
          </view>

          <view class="field">
            <text class="field__label">这次有效的点</text>
            <textarea
              v-model="form.insight"
              class="textarea"
              maxlength="255"
              placeholder="例如：先数呼吸再放松肩颈，比直接听音乐更容易进入状态。"
            />
          </view>

          <view class="field">
            <text class="field__label">下一步行动</text>
            <view class="tag-grid">
              <view
                v-for="item in selectedCategory.nextActions"
                :key="item"
                class="tag-chip"
                :class="{ 'tag-chip--active': form.nextAction === item }"
                @tap="form.nextAction = item"
              >
                <text>{{ item }}</text>
              </view>
            </view>
            <input v-model="form.nextAction" class="picker" placeholder="例如：睡前 30 分钟不再刷短视频" />
          </view>

          <view class="field">
            <text class="field__label">给自己的备注</text>
            <textarea
              v-model="form.summary"
              class="textarea textarea--short"
              maxlength="200"
              placeholder="例如：今天只做了 5 分钟，但身体确实慢下来了。"
            />
          </view>
        </view>
      </view>

      <button class="save-button" :loading="saving" @tap="submit">
        {{ isEditMode ? '更新这次练习' : '保存这次练习' }}
      </button>
      </view>
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

type CompletionStatus = 'completed' | 'partial' | 'skipped';

type CategoryOption = {
  value: string;
  label: string;
  description: string;
  defaultTitle: string;
  defaultDuration: number;
  guide: string[];
  intentions: string[];
  nextActions: string[];
};

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
const musicOptions = ref<MeditationMusicItem[]>(defaultMeditationMusicLibrary);
const selectedMusicId = ref('');
const playingMusicId = ref('');
const reviewItem = ref<MeditationLogItem | null>(null);
const editingRecord = ref(false);
const audioContext = uni.createInnerAudioContext();
const pageStateStore = usePageStateStore();

const categoryOptions: CategoryOption[] = [
  {
    value: 'meditation',
    label: '基础静心',
    description: '适合晨间、午休或任何想重新安定下来的时刻。',
    defaultTitle: '基础静心练习',
    defaultDuration: 7,
    guide: ['坐稳，确认双脚或坐骨的支撑', '观察 10 次自然呼吸，不需要控制', '用一句话确认此刻最需要照顾的事'],
    intentions: ['先稳定下来', '给一天定个节奏', '从杂念里回来'],
    nextActions: ['先做一件最小的事', '喝水后再继续', '给自己 10 分钟缓冲'],
  },
  {
    value: 'sleep',
    label: '睡前安睡',
    description: '适合入睡前关掉白天的紧绷，给身体一个下线信号。',
    defaultTitle: '睡前安睡练习',
    defaultDuration: 12,
    guide: ['调暗灯光，把屏幕放远一点', '从脚趾到头顶逐段放松', '结束后只保留低刺激活动'],
    intentions: ['让身体准备入睡', '停止反复复盘', '放下今天的紧绷'],
    nextActions: ['睡前 30 分钟不刷屏', '把明天事项写到纸上', '保持卧室光线更暗'],
  },
  {
    value: 'breath',
    label: '呼吸减压',
    description: '适合焦虑、烦躁或节奏过快时，用呼吸把注意力带回当下。',
    defaultTitle: '呼吸减压练习',
    defaultDuration: 5,
    guide: ['吸气时数 4 拍', '停顿 2 到 4 拍', '呼气更慢一点，把肩膀放下来'],
    intentions: ['把焦虑降下来', '先缓一口气', '不要被情绪推着走'],
    nextActions: ['先暂停 5 分钟再回复', '走到窗边呼吸一下', '把任务拆到第一步'],
  },
  {
    value: 'focus',
    label: '专注启动',
    description: '适合开始工作或学习前，先确认优先级并降低分心。',
    defaultTitle: '专注启动练习',
    defaultDuration: 10,
    guide: ['写下接下来只做的一件事', '用呼吸稳定注意力', '结束后立刻开始第一步，不再切换任务'],
    intentions: ['进入工作状态', '减少分心', '先完成第一步'],
    nextActions: ['开启 25 分钟专注', '关闭无关提醒', '只打开当前任务页面'],
  },
  {
    value: 'healing',
    label: '情绪修复',
    description: '适合情绪起伏后，允许感受存在，同时重新稳定身体。',
    defaultTitle: '情绪修复练习',
    defaultDuration: 8,
    guide: ['给情绪命名，不急着解释', '把注意力放到胸口、腹部或手心', '用一句温柔的话收束这次练习'],
    intentions: ['安放情绪', '不急着评判自己', '从委屈或烦躁里出来'],
    nextActions: ['先写 3 行情绪日记', '找一个可信的人说说', '今天降低一点要求'],
  },
  {
    value: 'body',
    label: '身体扫描',
    description: '适合久坐、疲惫或身体紧绷时，逐段观察并松开压力。',
    defaultTitle: '身体扫描练习',
    defaultDuration: 9,
    guide: ['从肩颈、下颌和眼周开始觉察', '找到最紧的一个部位，呼气时放松一点', '结束后做一次轻柔伸展'],
    intentions: ['松开肩颈', '听见身体信号', '让疲惫被看见'],
    nextActions: ['站起来活动 3 分钟', '调整坐姿和屏幕高度', '今晚早点休息'],
  },
];

const sourceOptions = [
  { label: '探索推荐', value: 'explore' },
  { label: '冥想音乐', value: 'music' },
  { label: '情绪疗愈', value: 'emotion' },
  { label: '睡眠放松', value: 'sleep' },
  { label: '自定义练习', value: 'custom' },
] as const;

const completionOptions = [
  { label: '完整完成', value: 'completed' },
  { label: '完成一半', value: 'partial' },
  { label: '今天跳过', value: 'skipped' },
] as const;

const beforeMoodOptions = [
  { label: '紧绷', value: 'tense' },
  { label: '疲惫', value: 'tired' },
  { label: '焦虑', value: 'anxious' },
  { label: '分心', value: 'scattered' },
  { label: '平稳', value: 'calm' },
] as const;

const afterMoodOptions = [
  { label: '更平静', value: 'settled' },
  { label: '更清晰', value: 'clear' },
  { label: '放松了', value: 'relaxed' },
  { label: '有点困', value: 'sleepy' },
  { label: '变化不大', value: 'unchanged' },
] as const;

const focusScoreLabels: Record<number, string> = {
  1: '很分散',
  2: '偶尔回来',
  3: '基本跟上',
  4: '比较稳定',
  5: '很专注',
};

const form = reactive({
  recordId: '',
  recordDate: todayDate,
  title: '基础静心练习',
  category: 'meditation',
  sourceType: 'custom',
  sourceTitle: '',
  durationMinutes: 7,
  completionStatus: 'completed' as CompletionStatus,
  summary: '',
  intention: '先稳定下来',
  moodBefore: 'scattered',
  moodAfter: 'settled',
  focusScore: 3,
  bodySignal: '',
  insight: '',
  nextAction: '先做一件最小的事',
});

const isEditMode = computed(() => Boolean(form.recordId));
const completedValue = computed(() => form.completionStatus === 'completed');
const selectedCategory = computed(
  () => categoryOptions.find((item) => item.value === form.category) ?? categoryOptions[0],
);
const focusScoreText = computed(() => focusScoreLabels[form.focusScore] ?? `${form.focusScore} 分`);
const showReviewMode = computed(() => Boolean(reviewItem.value) && !editingRecord.value);
const reviewRecord = computed(() => reviewItem.value);
const reviewCategoryLabel = computed(() =>
  reviewRecord.value
    ? categoryLabel(reviewRecord.value.category, reviewRecord.value.categoryLabel)
    : selectedCategory.value.label,
);
const reviewStats = computed(() => [
  {
    label: '练习时长',
    value: `${reviewRecord.value?.durationMinutes ?? form.durationMinutes}分钟`,
  },
  {
    label: '完成状态',
    value: completionLabel(reviewRecord.value?.completionStatus ?? form.completionStatus),
  },
  {
    label: '专注程度',
    value: reviewRecord.value?.focusScore
      ? `${reviewRecord.value.focusScore}/5`
      : focusScoreText.value,
  },
]);
const reviewOutcomeText = computed(() => {
  const record = reviewRecord.value;

  if (!record) {
    return '';
  }

  const afterMood = record.moodAfter ? meditationMoodLabel(record.moodAfter) : '';
  const beforeMood = record.moodBefore ? meditationMoodLabel(record.moodBefore) : '';

  if (beforeMood && afterMood) {
    return `从${beforeMood}到${afterMood}，这次练习已经留下了可复用的线索。`;
  }

  return record.insight || record.summary || '这次练习已记录，可以继续补充复盘细节。';
});
const reviewResultRows = computed(() => {
  const record = reviewRecord.value;

  if (!record) {
    return [];
  }

  return [
    { label: '本次目标', value: record.intention || '未填写' },
    { label: '练习前', value: meditationMoodLabel(record.moodBefore) },
    { label: '练习后', value: meditationMoodLabel(record.moodAfter) },
    { label: '下一步', value: record.nextAction || '未填写' },
  ];
});

function handleDateChange(event: { detail: { value: string } }) {
  form.recordDate = event.detail.value;
}

function handleDurationChange(event: { detail: { value: number } }) {
  form.durationMinutes = Number(event.detail.value);
}

function handleFocusScoreChange(event: { detail: { value: number } }) {
  form.focusScore = Number(event.detail.value);
}

function startEditingRecord() {
  editingRecord.value = true;
}

function duplicateReviewAsNew() {
  const record = reviewItem.value;

  form.recordId = '';
  form.recordDate = todayDate;
  form.completionStatus = 'completed';
  form.summary = '';
  form.moodAfter = 'settled';
  form.focusScore = 3;
  form.bodySignal = '';
  form.insight = '';

  if (record) {
    form.title = record.title;
    form.category = normalizeCategoryValue(record.category);
    form.sourceType = record.sourceType || 'custom';
    form.sourceTitle = record.sourceTitle || '';
    form.durationMinutes = record.durationMinutes;
    form.intention = record.intention || selectedCategory.value.intentions[0];
    form.moodBefore = record.moodAfter || 'calm';
    form.nextAction = record.nextAction || selectedCategory.value.nextActions[0];
  }

  reviewItem.value = null;
  editingRecord.value = false;
  uni.pageScrollTo({
    scrollTop: 0,
    duration: 180,
  });
}

function selectCategory(value: string) {
  const option = categoryOptions.find((item) => item.value === value) ?? categoryOptions[0];
  const currentTitleIsDefault = categoryOptions.some((item) => item.defaultTitle === form.title);

  form.category = option.value;
  form.durationMinutes = option.defaultDuration;

  if (!form.title || currentTitleIsDefault) {
    form.title = option.defaultTitle;
  }

  if (!form.intention) {
    form.intention = option.intentions[0];
  }

  if (!form.nextAction) {
    form.nextAction = option.nextActions[0];
  }
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
      intention: form.intention,
      moodBefore: form.moodBefore,
      moodAfter: form.moodAfter,
      focusScore: form.focusScore,
      bodySignal: form.bodySignal,
      insight: form.insight,
      nextAction: form.nextAction,
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
  reviewItem.value = item;
  editingRecord.value = false;
  form.recordId = item.id;
  form.recordDate = item.recordDate;
  form.title = item.title;
  form.category = normalizeCategoryValue(item.category);
  form.sourceType = item.sourceType || 'custom';
  form.sourceTitle = item.sourceTitle || '';
  form.durationMinutes = item.durationMinutes;
  form.completionStatus = item.completionStatus || (item.completed ? 'completed' : 'partial');
  form.summary = item.summary || '';
  form.intention = item.intention || selectedCategory.value.intentions[0];
  form.moodBefore = item.moodBefore || 'scattered';
  form.moodAfter = item.moodAfter || 'settled';
  form.focusScore = item.focusScore ?? 3;
  form.bodySignal = item.bodySignal || '';
  form.insight = item.insight || '';
  form.nextAction = item.nextAction || selectedCategory.value.nextActions[0];
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
  form.category = normalizeCategoryValue(selectedMusic.category);
  form.durationMinutes = selectedMusic.durationMinutes;
  form.sourceType = 'music';
  form.sourceTitle = `${selectedMusic.title} · ${selectedMusic.atmosphere}`;

  const category = categoryOptions.find((item) => item.value === form.category);
  if (category && !form.intention) {
    form.intention = category.intentions[0];
  }
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

function categoryLabel(category: string, fallback?: string) {
  return fallback || categoryOptions.find((item) => item.value === normalizeCategoryValue(category))?.label || '冥想练习';
}

function completionLabel(status: string) {
  const mapping: Record<string, string> = {
    completed: '完整完成',
    partial: '完成一半',
    skipped: '已跳过',
  };

  return mapping[status] || '已记录';
}

function meditationMoodLabel(value?: string) {
  const mapping: Record<string, string> = {
    tense: '紧绷',
    tired: '疲惫',
    anxious: '焦虑',
    scattered: '分心',
    calm: '平稳',
    settled: '更平静',
    clear: '更清晰',
    relaxed: '放松了',
    sleepy: '有点困',
    unchanged: '变化不大',
  };

  return value ? mapping[value] || value : '未填写';
}

function normalizeCategoryValue(value?: string) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return 'meditation';
  }

  const matched = categoryOptions.find((item) => item.value === trimmed || item.label === trimmed);
  return matched?.value ?? trimmed;
}

function musicGuide(item: MeditationMusicItem) {
  return item.guide?.slice(0, 3) ?? [];
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
  padding: 30rpx 24rpx 42rpx;
}

.page-header {
  display: grid;
  gap: 14rpx;
  margin-bottom: 28rpx;
}

.page-header__eyebrow {
  font-size: 24rpx;
  color: var(--theme-primary);
}

.page-header__title {
  display: block;
  max-width: 680rpx;
  font-size: 48rpx;
  line-height: 1.22;
  font-weight: 600;
  color: var(--theme-text-primary);
}

.page-header__subtitle,
.section__meta,
.notice-panel__text,
.field__label,
.field__hint,
.duration-text {
  font-size: 24rpx;
  line-height: 1.7;
  color: var(--theme-text-secondary);
}

.practice-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
  margin-top: 10rpx;
}

.practice-strip__item {
  display: grid;
  gap: 4rpx;
  min-height: 92rpx;
  padding: 16rpx;
  border: 1rpx solid var(--theme-border);
  border-radius: 18rpx;
  background: var(--theme-surface);
}

.practice-strip__label {
  font-size: 20rpx;
  color: var(--theme-text-secondary);
}

.practice-strip__value {
  font-size: 26rpx;
  font-weight: 600;
  color: var(--theme-text-primary);
}

.notice-panel,
.section {
  margin-bottom: 24rpx;
}

.notice-panel {
  display: grid;
  gap: 8rpx;
  padding: 24rpx;
  border-radius: 20rpx;
  border: 1rpx solid rgba(var(--theme-primary-rgb), 0.18);
  background: rgba(var(--theme-primary-rgb), 0.08);
}

.notice-panel__title,
.section__title {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--theme-text-primary);
}

.review-mode,
.form-flow {
  display: grid;
}

.review-mode {
  gap: 24rpx;
}

.review-hero {
  display: grid;
  gap: 14rpx;
  padding: 30rpx;
  border-radius: 26rpx;
  border: 1rpx solid rgba(var(--theme-primary-rgb), 0.18);
  background:
    radial-gradient(circle at 88% 18%, rgba(255, 255, 255, 0.84), transparent 28%),
    linear-gradient(135deg, rgba(var(--theme-primary-rgb), 0.1) 0%, var(--theme-surface) 78%);
  box-shadow: var(--theme-shadow-soft);
}

.review-hero__eyebrow {
  font-size: 23rpx;
  color: var(--theme-primary);
}

.review-hero__title {
  font-size: 42rpx;
  line-height: 1.25;
  font-weight: 600;
  color: var(--theme-text-primary);
}

.review-hero__text {
  font-size: 25rpx;
  line-height: 1.7;
  color: var(--theme-text-secondary);
}

.review-hero__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
  margin-top: 8rpx;
}

.review-hero__stat {
  display: grid;
  gap: 4rpx;
  min-height: 88rpx;
  padding: 14rpx;
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.58);
}

.review-hero__stat-value {
  font-size: 27rpx;
  font-weight: 600;
  color: var(--theme-text-primary);
}

.review-hero__stat-label,
.review-row__label,
.review-note__text {
  font-size: 22rpx;
  line-height: 1.6;
  color: var(--theme-text-secondary);
}

.review-section {
  display: grid;
  gap: 14rpx;
}

.review-list,
.review-note {
  display: grid;
  gap: 12rpx;
  padding: 24rpx;
  border-radius: 20rpx;
  border: 1rpx solid var(--theme-border);
  background: var(--theme-surface);
  box-shadow: var(--theme-shadow-soft);
}

.review-row {
  display: grid;
  grid-template-columns: 128rpx minmax(0, 1fr);
  gap: 16rpx;
  align-items: start;
}

.review-row__value,
.review-note__title {
  font-size: 27rpx;
  line-height: 1.55;
  color: var(--theme-text-primary);
}

.review-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
}

.review-actions__button {
  min-height: 78rpx;
  border-radius: 999rpx;
  font-size: 27rpx;
  color: #ffffff;
  background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-accent) 100%);
}

.review-actions__button--ghost {
  color: var(--theme-primary);
  background: var(--theme-tag-bg);
}

.review-actions__button::after {
  border: none;
}

.section {
  display: grid;
  gap: 16rpx;
}

.section__head {
  display: grid;
  gap: 4rpx;
}

.category-list {
  display: grid;
  gap: 12rpx;
}

.category-option {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 20rpx;
  align-items: center;
  padding: 22rpx;
  border-radius: 20rpx;
  border: 1rpx solid var(--theme-border);
  background: var(--theme-surface);
}

.category-option--active {
  border-color: rgba(var(--theme-primary-rgb), 0.3);
  background: rgba(var(--theme-primary-rgb), 0.08);
}

.category-option__title,
.music-card__title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: var(--theme-text-primary);
}

.category-option__text,
.music-card__text,
.music-card__scene,
.music-card__meta,
.mini-steps__item {
  font-size: 23rpx;
  line-height: 1.6;
  color: var(--theme-text-secondary);
}

.category-option__time,
.music-card__badge {
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  color: var(--theme-primary);
  background: var(--theme-tag-bg);
}

.guide-panel,
.form-panel,
.music-card {
  display: grid;
  gap: 16rpx;
  padding: 24rpx;
  border-radius: 20rpx;
  border: 1rpx solid var(--theme-border);
  background: var(--theme-surface);
  box-shadow: var(--theme-shadow-soft);
}

.guide-step {
  display: grid;
  grid-template-columns: 42rpx minmax(0, 1fr);
  gap: 14rpx;
  align-items: start;
}

.guide-step__num {
  display: grid;
  place-items: center;
  width: 42rpx;
  height: 42rpx;
  border-radius: 50%;
  font-size: 22rpx;
  color: #ffffff;
  background: var(--theme-primary);
}

.guide-step__text {
  font-size: 26rpx;
  line-height: 1.6;
  color: var(--theme-text-primary);
}

.field {
  display: grid;
  gap: 12rpx;
}

.field__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.picker,
.textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 18rpx 20rpx;
  border-radius: 16rpx;
  background: var(--theme-surface-muted);
  font-size: 26rpx;
  color: var(--theme-text-primary);
}

.textarea {
  min-height: 180rpx;
}

.textarea--short {
  min-height: 132rpx;
}

.tag-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.tag-chip {
  padding: 14rpx 18rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  color: var(--theme-text-secondary);
  background: var(--theme-surface-muted);
}

.tag-chip--active {
  color: #ffffff;
  background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-accent) 100%);
}

.music-list {
  display: grid;
  gap: 14rpx;
}

.music-card--active {
  border-color: rgba(var(--theme-primary-rgb), 0.3);
  background: rgba(var(--theme-primary-rgb), 0.08);
}

.music-card__head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 14rpx;
  align-items: start;
}

.mini-steps {
  display: grid;
  gap: 8rpx;
  padding: 14rpx 16rpx;
  border-radius: 16rpx;
  background: var(--theme-surface-muted);
}

.mini-steps__item {
  display: block;
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

.music-card__button::after {
  border: none;
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
