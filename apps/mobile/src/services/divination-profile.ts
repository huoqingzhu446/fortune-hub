import { fetchMe } from '../api/auth';
import { fetchPersonalityHistory } from '../api/assessment';
import { fetchRecordOverview } from '../api/records';
import { fetchZodiacToday } from '../api/zodiac';
import type { PersonalityHistoryItem } from '../types/assessment';
import type { UserProfile } from '../types/auth';
import type {
  DivinationPersonalizationDimensionState,
  DivinationInterpretationTone,
  DivinationPersonalizationContext,
  DivinationPersonalizationFlags,
  DivinationPersonalizationKey,
  DivinationProfileInsight,
  DivinationPersonalizationSignal,
  DivinationTopic,
} from '../types/divination';
import type { MoodJournalItem, RecordOverviewData } from '../types/records';
import type { ZodiacTodayData } from '../types/zodiac';
import {
  getAuthToken,
  getCachedUser,
  setCachedUser,
} from './session';
import { getDivinationProfileMapping } from './divination-content';

type ToneScores = Record<DivinationInterpretationTone, number>;

interface SafeResolveResult<T> {
  value: T | null;
  failed: boolean;
}

export async function resolveDivinationPersonalizationContext(
  flags: DivinationPersonalizationFlags,
): Promise<DivinationPersonalizationContext> {
  const user = await resolveUserProfile();
  const zodiacSign = user?.zodiac || deriveZodiacFromBirthday(user?.birthday);
  const authToken = getAuthToken();
  const [zodiacToday, recordOverview, personalityItems] = await Promise.all([
    flags.useZodiac && zodiacSign
      ? safeResolve(fetchZodiacToday(zodiacSign).then((response) => response.data), 'zodiac')
      : Promise.resolve({ value: null, failed: false }),
    flags.useMood && authToken
      ? safeResolve(fetchRecordOverview().then((response) => response.data), 'mood')
      : Promise.resolve({ value: null, failed: false }),
    flags.usePersonality && authToken
      ? safeResolve(fetchPersonalityHistory().then((response) => response.data.items), 'personality')
      : Promise.resolve({ value: null, failed: false }),
  ]);
  const mood = pickLatestMood(recordOverview.value?.moodRecords || []);
  const personality = pickLatestPersonality(personalityItems.value || []);
  const dominantElement = flags.useBazi ? resolveDominantElement(user?.fiveElements) : '';
  const dimensionStates = buildDimensionStates({
    flags,
    authToken,
    user,
    zodiacSign,
    zodiacToday,
    zodiacFailed: zodiacToday.failed,
    recordOverview: recordOverview.value,
    recordOverviewFailed: recordOverview.failed,
    mood,
    personality,
    personalityFailed: personalityItems.failed,
    dominantElement,
  });
  const isDimensionActive = (key: DivinationPersonalizationKey) =>
    dimensionStates.some((item) => item.key === key && item.state === 'active');
  const activeMoodScore = isDimensionActive('mood')
    ? mood?.moodScore ?? recordOverview.value?.overview.emotionalStability
    : undefined;
  const activeZodiacScore = isDimensionActive('zodiac')
    ? zodiacToday.value?.score.overall
    : undefined;
  const profileInsights = buildProfileInsights({
    user: isDimensionActive('bazi') ? user : null,
    zodiacSign: isDimensionActive('zodiac') ? zodiacSign : '',
    zodiacToday: isDimensionActive('zodiac') ? zodiacToday.value : null,
    mood: isDimensionActive('mood') ? mood : null,
    recordOverview: isDimensionActive('mood') ? recordOverview.value : null,
    personality: isDimensionActive('personality') ? personality : null,
    dominantElement: isDimensionActive('bazi') ? dominantElement : '',
  });
  const signals = dimensionStates
    .filter((item) => item.state === 'active')
    .map((item) => buildSignalFromDimensionState(item))
    .filter((item): item is DivinationPersonalizationSignal => Boolean(item));
  const toneScores = buildToneScores({
    dominantElement,
    zodiacToday: dimensionStates.find((item) => item.key === 'zodiac')?.state === 'active' ? zodiacToday.value : null,
    mood: dimensionStates.find((item) => item.key === 'mood')?.state === 'active' ? mood : null,
    recordOverview:
      dimensionStates.find((item) => item.key === 'mood')?.state === 'active'
        ? recordOverview.value
        : null,
    personality: dimensionStates.find((item) => item.key === 'personality')?.state === 'active' ? personality : null,
  });
  const tone = pickTone(toneScores);
  const enabledKeys = resolveEnabledKeys(flags);

  return createDivinationPersonalizationContext(enabledKeys, signals, {
    tone,
    profileInsights,
    dimensionStates,
    hasPartialMiss: dimensionStates.some((item) => item.enabled && item.state === 'missing'),
    moodScore: activeMoodScore,
    zodiacScore: activeZodiacScore,
    scoreAdjustments: buildScoreAdjustments({
      activeCount: signals.length,
      tone,
      moodScore: activeMoodScore,
      zodiacScore: activeZodiacScore,
    }),
  });
}

export function createDivinationPersonalizationContext(
  enabledKeys: DivinationPersonalizationKey[] = [],
  signals: DivinationPersonalizationSignal[] = [],
  options: {
    tone?: DivinationInterpretationTone;
    scoreAdjustments?: DivinationPersonalizationContext['scoreAdjustments'];
    dimensionStates?: DivinationPersonalizationDimensionState[];
    profileInsights?: DivinationProfileInsight[];
    hasPartialMiss?: boolean;
    moodScore?: number;
    zodiacScore?: number;
  } = {},
): DivinationPersonalizationContext {
  const tone = options.tone || 'clarify';
  const copy = getDivinationProfileMapping().toneCopy[tone];
  const dimensionStates =
    options.dimensionStates ||
    enabledKeys.map((key) => {
      const signal = signals.find((item) => item.key === key);
      return {
        key,
        label: signal?.label || resolveDimensionLabel(key),
        enabled: true,
        state: signal ? 'active' : 'missing',
        statusLabel: signal?.value || '待完善',
        valueLabel: signal?.summary || '暂无资料',
        summary: signal?.summary || '当前没有可用画像信息。',
        source: signal ? 'local' : 'none',
      } satisfies DivinationPersonalizationDimensionState;
    });

  return {
    enabledKeys,
    activeKeys: signals.map((item) => item.key),
    signals,
    profileInsights: options.profileInsights?.length
      ? options.profileInsights
      : buildFallbackProfileInsights(signals),
    dimensionStates,
    hasPartialMiss: options.hasPartialMiss ?? dimensionStates.some((item) => item.enabled && item.state === 'missing'),
    tone,
    ...copy,
    scoreAdjustments: options.scoreAdjustments || {
      overall: 0,
      emotion: 0,
      action: 0,
    },
    moodScore: options.moodScore,
    zodiacScore: options.zodiacScore,
  };
}

async function resolveUserProfile() {
  const cached = getCachedUser();

  if (!getAuthToken()) {
    return cached;
  }

  try {
    const response = await fetchMe();
    if (response.data.user) {
      setCachedUser(response.data.user);
    }
    return response.data.user || cached;
  } catch (error) {
    console.warn('resolve divination user profile failed', error);
    return cached;
  }
}

async function safeResolve<T>(promise: Promise<T>, label: string): Promise<SafeResolveResult<T>> {
  try {
    return {
      value: await promise,
      failed: false,
    };
  } catch (error) {
    console.warn(`resolve divination ${label} signal failed`, error);
    return {
      value: null,
      failed: true,
    };
  }
}

function resolveEnabledKeys(flags: DivinationPersonalizationFlags) {
  return [
    flags.useBazi ? 'bazi' : '',
    flags.useZodiac ? 'zodiac' : '',
    flags.useMood ? 'mood' : '',
    flags.usePersonality ? 'personality' : '',
  ].filter(Boolean) as DivinationPersonalizationKey[];
}

function buildDimensionStates(input: {
  flags: DivinationPersonalizationFlags;
  authToken: string;
  user: UserProfile | null;
  zodiacSign: string;
  zodiacToday: SafeResolveResult<ZodiacTodayData>;
  zodiacFailed: boolean;
  recordOverview: RecordOverviewData | null;
  recordOverviewFailed: boolean;
  mood: MoodJournalItem | null;
  personality: PersonalityHistoryItem | null;
  personalityFailed: boolean;
  dominantElement: string;
}): DivinationPersonalizationDimensionState[] {
  const bazi = buildBaziDimensionState(input.flags, input.user, input.dominantElement);
  const zodiac = buildZodiacDimensionState(
    input.flags,
    input.zodiacSign,
    input.zodiacToday,
    input.zodiacFailed,
  );
  const mood = buildMoodDimensionState(
    input.flags,
    input.authToken,
    input.recordOverview,
    input.recordOverviewFailed,
    input.mood,
  );
  const personality = buildPersonalityDimensionState(
    input.flags,
    input.authToken,
    input.personality,
    input.personalityFailed,
  );

  return [bazi, zodiac, mood, personality];
}

function buildBaziDimensionState(
  flags: DivinationPersonalizationFlags,
  user: UserProfile | null,
  dominantElement: string,
): DivinationPersonalizationDimensionState {
  if (!flags.useBazi) {
    return {
      key: 'bazi',
      label: '八字',
      enabled: false,
      state: 'disabled',
      statusLabel: '已关闭',
      valueLabel: dominantElement ? `${dominantElement}元素主导` : '未参与',
      summary: '关闭后不会参与本次断语旁参。',
      source: 'none',
      reason: 'disabled',
    };
  }

  const hasProfileData = Boolean(user?.birthday || user?.birthTime || user?.birthPlace || user?.baziSummary || dominantElement);

  if (!hasProfileData) {
    return {
      key: 'bazi',
      label: '八字',
      enabled: true,
      state: 'missing',
      statusLabel: '待完善',
      valueLabel: '补齐生日、出生时间和出生地',
      summary: '八字资料不完整，当前只能依赖主题和卦象。',
      source: 'none',
      reason: 'no-data',
    };
  }

  return {
    key: 'bazi',
    label: '八字',
    enabled: true,
    state: 'active',
    statusLabel: '已同步',
    valueLabel: dominantElement ? `${dominantElement}元素主导` : '八字已同步',
    summary:
      user?.baziSummary ||
      (dominantElement ? `五行以${dominantElement}为主，读卦时会更重视${resolveElementHint(dominantElement)}。` : '八字资料已同步。'),
    source: 'local',
  };
}

function buildZodiacDimensionState(
  flags: DivinationPersonalizationFlags,
  zodiacSign: string,
  zodiacToday: SafeResolveResult<ZodiacTodayData>,
  zodiacFailed: boolean,
): DivinationPersonalizationDimensionState {
  if (!flags.useZodiac) {
    return {
      key: 'zodiac',
      label: '星座',
      enabled: false,
      state: 'disabled',
      statusLabel: '已关闭',
      valueLabel: zodiacSign || '未参与',
      summary: '关闭后不会参与本次断语旁参。',
      source: 'none',
      reason: 'disabled',
    };
  }

  if (!zodiacSign) {
    return {
      key: 'zodiac',
      label: '星座',
      enabled: true,
      state: 'missing',
      statusLabel: '待完善',
      valueLabel: '补齐生日后自动生成',
      summary: '当前无法识别星座，先补充生日资料。',
      source: 'none',
      reason: 'no-data',
    };
  }

  if (zodiacFailed || !zodiacToday.value) {
    return {
      key: 'zodiac',
      label: '星座',
      enabled: true,
      state: 'missing',
      statusLabel: zodiacSign,
      valueLabel: zodiacSign,
      summary: `${zodiacSign}已识别，但今日节奏数据未拉取成功，部分画像未命中。`,
      source: 'remote',
      reason: 'api-failed',
    };
  }

  const profile = zodiacToday.value.profile;
  const keywordText = unique([
    ...(zodiacToday.value.theme.keywords || []),
    ...(profile?.keywords || []),
  ])
    .slice(0, 3)
    .join('、');

  return {
    key: 'zodiac',
    label: '星座',
    enabled: true,
    state: 'active',
    statusLabel: zodiacSign,
    valueLabel: zodiacToday.value.theme.title || zodiacToday.value.action.title,
    summary:
      zodiacToday.value.theme.summary ||
      zodiacToday.value.action.description ||
      `${zodiacSign}${keywordText ? ` 今日关键词为${keywordText}` : '作为轻量节奏参考'}。`,
    source: 'remote',
    updatedAt: parseDateValue(zodiacToday.value.date) || Date.now(),
  };
}

function buildMoodDimensionState(
  flags: DivinationPersonalizationFlags,
  authToken: string,
  recordOverview: RecordOverviewData | null,
  recordOverviewFailed: boolean,
  mood: MoodJournalItem | null,
): DivinationPersonalizationDimensionState {
  if (!flags.useMood) {
    return {
      key: 'mood',
      label: '心情',
      enabled: false,
      state: 'disabled',
      statusLabel: '已关闭',
      valueLabel: '未参与',
      summary: '关闭后不会参与本次断语旁参。',
      source: 'none',
      reason: 'disabled',
    };
  }

  if (mood) {
    const tagText = mood.emotionTags.slice(0, 3).join('、');
    const label = moodLabel(mood.moodType);
    return {
      key: 'mood',
      label: '心情',
      enabled: true,
      state: 'active',
      statusLabel: `最近记录 ${formatRelativeDays(mood.updatedAt || mood.recordDate)}`,
      valueLabel: `${label} · ${mood.moodScore}分`,
      summary: tagText
        ? `最近一次心情为${label}，标签是${tagText}。`
        : `最近一次心情为${label}，状态分为${mood.moodScore}。`,
      source: 'remote',
      updatedAt: parseDateValue(mood.updatedAt || mood.recordDate),
    };
  }

  if (recordOverviewFailed) {
    return {
      key: 'mood',
      label: '心情',
      enabled: true,
      state: 'missing',
      statusLabel: '暂无记录',
      valueLabel: '数据未同步',
      summary: '本次没有成功读取到最近心情数据，部分画像未命中。',
      source: authToken ? 'remote' : 'none',
      reason: 'api-failed',
    };
  }

  if (recordOverview?.overview) {
    return {
      key: 'mood',
      label: '心情',
      enabled: true,
      state: 'missing',
      statusLabel: '暂无记录',
      valueLabel: '先记录一条心情',
      summary: recordOverview.overview.encouragement,
      source: 'remote',
      reason: 'no-data',
    };
  }

  return {
    key: 'mood',
    label: '心情',
    enabled: true,
    state: 'missing',
    statusLabel: '暂无记录',
    valueLabel: authToken ? '先记录一条心情' : '登录后可同步',
    summary: '当前没有可用的心情记录。',
    source: authToken ? 'remote' : 'none',
    reason: authToken ? 'no-data' : 'not-logged-in',
  };
}

function buildPersonalityDimensionState(
  flags: DivinationPersonalizationFlags,
  authToken: string,
  personality: PersonalityHistoryItem | null,
  personalityFailed: boolean,
): DivinationPersonalizationDimensionState {
  if (!flags.usePersonality) {
    return {
      key: 'personality',
      label: '性格',
      enabled: false,
      state: 'disabled',
      statusLabel: '已关闭',
      valueLabel: '未参与',
      summary: '关闭后不会参与本次断语旁参。',
      source: 'none',
      reason: 'disabled',
    };
  }

  if (personality) {
    return {
      key: 'personality',
      label: '性格',
      enabled: true,
      state: 'active',
      statusLabel: '最近测评结果',
      valueLabel: personality.dominantDimensionLabel || personality.level || personality.title,
      summary: personality.summary || personality.subtitle,
      source: 'remote',
      updatedAt: parseDateValue(personality.completedAt),
    };
  }

  if (personalityFailed) {
    return {
      key: 'personality',
      label: '性格',
      enabled: true,
      state: 'missing',
      statusLabel: '暂无测评',
      valueLabel: '数据未同步',
      summary: '本次没有成功读取到最近性格测评，部分画像未命中。',
      source: authToken ? 'remote' : 'none',
      reason: 'api-failed',
    };
  }

  return {
    key: 'personality',
    label: '性格',
    enabled: true,
    state: 'missing',
    statusLabel: '暂无测评',
    valueLabel: authToken ? '先做一次性格测评' : '登录后可同步',
    summary: '当前没有可用的性格测评记录。',
    source: authToken ? 'remote' : 'none',
    reason: authToken ? 'no-data' : 'not-logged-in',
  };
}

function buildSignalFromDimensionState(
  state: DivinationPersonalizationDimensionState,
): DivinationPersonalizationSignal | null {
  if (state.state !== 'active') {
    return null;
  }

  return {
    key: state.key,
    label: state.label,
    value: state.valueLabel,
    summary: state.summary,
  };
}

function buildToneScores(input: {
  dominantElement: string;
  zodiacToday: ZodiacTodayData | null;
  mood: MoodJournalItem | null;
  recordOverview: RecordOverviewData | null;
  personality: PersonalityHistoryItem | null;
}): ToneScores {
  const mapping = getDivinationProfileMapping();
  const rules = mapping.scoreRules;
  const scores: ToneScores = { ...rules.baseToneScores };

  const elementTone = mapping.elementTone[input.dominantElement];
  if (elementTone) {
    scores[elementTone] += 1;
  }

  const zodiacScore = input.zodiacToday?.score.overall;
  if (typeof zodiacScore === 'number') {
    if (zodiacScore >= rules.zodiacMoveAt) {
      scores.move += 1;
    } else if (zodiacScore <= rules.zodiacSoftenAt) {
      scores.soften += 1;
    } else {
      scores.clarify += 1;
    }
  }

  const moodType = input.mood?.moodType;
  if (moodType && mapping.moodToneScores[moodType]) {
    applyToneScorePatch(scores, mapping.moodToneScores[moodType]);
  } else if (input.recordOverview?.overview.emotionalStability) {
    const stability = input.recordOverview.overview.emotionalStability;
    if (stability >= rules.emotionalMoveAt) {
      scores.move += 1;
    } else if (stability < rules.emotionalSoftenBelow) {
      scores.soften += 1;
    }
  }

  applyPersonalityTone(scores, [
    input.personality?.dominantDimensionLabel,
    input.personality?.title,
    input.personality?.summary,
  ].filter(Boolean).join(' '));

  return scores;
}

function applyPersonalityTone(scores: ToneScores, text: string) {
  if (!text) {
    return;
  }

  getDivinationProfileMapping().personalityToneRules.forEach((rule) => {
    try {
      if (new RegExp(rule.pattern).test(text)) {
        scores[rule.tone] += rule.weight;
      }
    } catch (error) {
      console.warn('invalid divination personality tone rule', error);
    }
  });
}

function applyToneScorePatch(
  scores: ToneScores,
  patch: Partial<Record<DivinationInterpretationTone, number>>,
) {
  (Object.keys(patch) as DivinationInterpretationTone[]).forEach((tone) => {
    const value = patch[tone];
    if (typeof value === 'number' && Number.isFinite(value)) {
      scores[tone] += value;
    }
  });
}

function pickTone(scores: ToneScores): DivinationInterpretationTone {
  return (['clarify', 'move', 'soften'] as DivinationInterpretationTone[]).reduce(
    (best, tone) => (scores[tone] > scores[best] ? tone : best),
    getDivinationProfileMapping().scoreRules.defaultTone,
  );
}

function buildScoreAdjustments(input: {
  activeCount: number;
  tone: DivinationInterpretationTone;
  moodScore?: number;
  zodiacScore?: number;
}) {
  const rules = getDivinationProfileMapping().scoreRules;
  const toneAction = rules.toneAction[input.tone];
  const toneOverall = rules.toneOverall[input.tone];
  const zodiacOverall =
    typeof input.zodiacScore === 'number'
      ? clamp(Math.round((input.zodiacScore - rules.zodiacScoreBase) / rules.zodiacScoreStep), -2, 2)
      : 0;
  const moodEmotion =
    typeof input.moodScore === 'number'
      ? clamp(Math.round((input.moodScore - rules.moodScoreBase) / rules.moodScoreStep), -5, 5)
      : 0;

  return {
    overall: clamp(Math.min(input.activeCount, rules.activeCountMax) + toneOverall + zodiacOverall, -3, 6),
    emotion: moodEmotion,
    action: toneAction,
  };
}

function buildProfileInsights(input: {
  user: UserProfile | null;
  zodiacSign: string;
  zodiacToday: ZodiacTodayData | null;
  mood: MoodJournalItem | null;
  recordOverview: RecordOverviewData | null;
  personality: PersonalityHistoryItem | null;
  dominantElement: string;
}): DivinationProfileInsight[] {
  const insights: DivinationProfileInsight[] = [];
  const fiveElementSummary = summarizeFiveElements(input.user?.fiveElements);
  const elementTone = input.dominantElement ? getDivinationProfileMapping().elementTone[input.dominantElement] : null;
  const baziEvidence = [
    fiveElementSummary ? `五行倾向：${fiveElementSummary}` : '',
    input.user?.baziSummary || '',
    !input.dominantElement && !input.user?.baziSummary && input.user?.birthday ? '生日已补齐' : '',
    !input.dominantElement && !input.user?.baziSummary && input.user?.birthTime ? '出生时间已补齐' : '',
    !input.dominantElement && !input.user?.baziSummary && input.user?.birthPlace ? '出生地已补齐' : '',
  ].filter(Boolean).join('；');

  if (baziEvidence) {
    insights.push({
      key: 'bazi',
      title: input.user?.baziSummary
        ? '八字摘要'
        : input.dominantElement
          ? '八字五行'
          : '八字资料',
      evidence: baziEvidence,
      judgement:
        elementTone === 'move'
          ? '此局宜先动后定，断卦偏看推进与落地。'
          : elementTone === 'clarify'
            ? '此局宜先辨明边界与条件，断卦偏看规则与事实。'
            : input.dominantElement
              ? '此局宜先守节奏与承接，断卦偏看收束与稳住。'
              : '八字资料已命中但五行主轴未成形，断卦只作轻参，偏看缓急与承接。',
      advice:
        elementTone === 'move'
          ? '先做一个可验证的小动作。'
          : elementTone === 'clarify'
            ? '先把事实、边界和条件写清楚。'
            : input.dominantElement
              ? '先守住当前资源与精力。'
              : '先以卦象为主，八字资料只用于校准行动尺度。',
      risk:
        elementTone === 'move'
          ? '忌起势过猛，容易失控。'
          : elementTone === 'clarify'
            ? '忌过度分析而迟迟不动。'
            : input.dominantElement
              ? '忌把保守拖成停滞。'
              : '忌在命盘细节未完整时过度延伸八字判断。',
      weight: input.dominantElement ? 'strong' : input.user?.baziSummary ? 'medium' : 'light',
      topics: ['general', 'career', 'wealth', 'relationship', 'growth'],
    });
  }

  if (input.zodiacSign) {
    const overall = input.zodiacToday?.score.overall;
    const keywords = unique([
      ...(input.zodiacToday?.theme.keywords || []),
      ...(input.zodiacToday?.profile?.keywords || []),
    ]).slice(0, 4);

    insights.push({
      key: 'zodiac',
      title: `星座 · ${input.zodiacSign}`,
      evidence: input.zodiacToday
        ? [
            input.zodiacToday.theme.title ? `今日主题「${input.zodiacToday.theme.title}」` : '',
            typeof overall === 'number' ? `综合分 ${overall}` : '',
            input.zodiacToday.profile.element ? `元素 ${input.zodiacToday.profile.element}` : '',
            input.zodiacToday.profile.modality ? `属性 ${input.zodiacToday.profile.modality}` : '',
            keywords.length ? `关键词 ${keywords.join('、')}` : '',
          ].filter(Boolean).join('；')
        : `${input.zodiacSign}已识别，但今日节奏未完全拉取成功`,
      judgement:
        typeof overall === 'number'
          ? overall >= 82
            ? '星座节奏偏顺，断卦可偏主动。'
            : overall <= 68
              ? '星座节奏偏收，断卦宜先守后动。'
              : '星座节奏中平，断卦宜先辨明。'
          : '星座只作轻参，不作成卦依据。',
      advice: input.zodiacToday?.action.description || '按今日主题把最顺手的一步先做出来。',
      risk: '忌把星座当绝对结论，它只可借势，不可代卦。',
      weight:
        typeof overall === 'number'
          ? overall >= 82 || overall <= 68
            ? 'medium'
            : 'light'
          : 'light',
      topics: ['general', 'love', 'career', 'wealth', 'relationship'],
    });
  }

  if (input.mood) {
    const moodText = moodLabel(input.mood.moodType);
    const tags = input.mood.emotionTags.slice(0, 3).join('、');
    const moodScore = input.mood.moodScore;
    const emotionalStability = input.recordOverview?.overview.emotionalStability;
    const referenceScore = typeof moodScore === 'number' ? moodScore : emotionalStability;

    insights.push({
      key: 'mood',
      title: '心情状态',
      evidence: [
        `最近一次心情为「${moodText}」`,
        typeof referenceScore === 'number' ? `${referenceScore}分` : '',
        tags ? `标签 ${tags}` : '',
      ].filter(Boolean).join('；'),
      judgement:
        input.mood.moodType === 'anxious' || input.mood.moodType === 'tired' || (typeof referenceScore === 'number' && referenceScore <= 60)
          ? '此时断卦宜偏收束，先看风险与承接。'
          : input.mood.moodType === 'happy' || (typeof referenceScore === 'number' && referenceScore >= 80)
            ? '此时断卦可偏行动，但仍需防轻率。'
            : '此时断卦宜先辨明，再定进退。',
      advice:
        input.mood.moodType === 'anxious' || input.mood.moodType === 'tired' || (typeof referenceScore === 'number' && referenceScore <= 60)
          ? '先把动作缩小，给自己留缓冲。'
          : input.mood.moodType === 'happy' || (typeof referenceScore === 'number' && referenceScore >= 80)
            ? '可以把握当下的推进窗口。'
            : '先核对事实，再谈推进。',
      risk:
        input.mood.moodType === 'anxious' || input.mood.moodType === 'tired' || (typeof referenceScore === 'number' && referenceScore <= 60)
          ? '忌把疲惫当成命运的判断。'
          : '忌把短暂好状态误判成长期顺势。',
      weight:
        input.mood.moodType === 'anxious' ||
        input.mood.moodType === 'tired' ||
        (typeof referenceScore === 'number' && (referenceScore <= 60 || referenceScore >= 80))
          ? 'strong'
          : 'medium',
      topics: ['emotion', 'general', 'growth', 'relationship'],
    });
  } else if (input.recordOverview?.overview) {
    insights.push({
      key: 'mood',
      title: '情绪概况',
      evidence: `情绪稳定度 ${input.recordOverview.overview.emotionalStability}，提示语「${input.recordOverview.overview.encouragement}」`,
      judgement: '这类资料更适合用来定断卦的缓急与行动尺度。',
      advice: input.recordOverview.overview.actionText,
      risk: '忌把概况当成细节，断卦仍需回到具体问题。',
      weight: 'light',
      topics: ['emotion', 'general', 'growth'],
    });
  }

  if (input.personality) {
    const summaryText = `${input.personality.dominantDimensionLabel || ''}${input.personality.title || ''}${input.personality.summary || ''}`;
    const matchTone =
      /行动|外向|果断|开拓|表达|主动/.test(summaryText)
        ? 'move'
        : /理性|分析|逻辑|观察|规划|谨慎|秩序|边界/.test(summaryText)
          ? 'clarify'
          : 'soften';

    insights.push({
      key: 'personality',
      title: '性格倾向',
      evidence: `${input.personality.dominantDimensionLabel || input.personality.title} · ${input.personality.summary || input.personality.subtitle}`,
      judgement:
        matchTone === 'move'
          ? '断卦可偏向推进与外放。'
          : matchTone === 'clarify'
            ? '断卦可偏向辨明与守界。'
            : '断卦更适合用柔和、缓慢、可承接的方式落地。',
      advice:
        input.personality.summary ||
        input.personality.subtitle ||
        '把性格视为断语的用力方向，不要拿它替代卦象判断。',
      risk: '忌让性格标签反客为主，卦象仍是主判。',
      weight: 'medium',
      topics: ['general', 'career', 'relationship', 'growth', 'emotion'],
    });
  }

  if (!insights.length && input.user?.baziSummary) {
    insights.push({
      key: 'bazi',
      title: '八字摘要',
      evidence: input.user.baziSummary,
      judgement: '此类资料适合用来定断卦的缓急，不宜反向改卦。',
      advice: '宜把摘要当作断语背景，不要拿它覆盖卦象本身。',
      risk: '忌把概括性摘要当成完整命盘。',
      weight: 'light',
      topics: ['general'],
    });
  }

  if (!insights.length && input.zodiacSign) {
    insights.push({
      key: 'zodiac',
      title: `星座 · ${input.zodiacSign}`,
      evidence: input.zodiacSign,
      judgement: '星座只作轻参，不作成卦依据。',
      advice: '按今日主题把最顺手的一步先做出来。',
      risk: '忌把星座当绝对结论，它只可借势，不可代卦。',
      weight: 'light',
      topics: ['general'],
    });
  }

  if (!insights.length && input.mood) {
    insights.push({
      key: 'mood',
      title: '心情状态',
      evidence: moodLabel(input.mood.moodType),
      judgement: '此时断卦宜先辨明，再定进退。',
      advice: '先核对事实，再谈推进。',
      risk: '忌把短暂心情误读成长期趋势。',
      weight: 'light',
      topics: ['emotion', 'general'],
    });
  }

  return insights;
}

function buildFallbackProfileInsights(signals: DivinationPersonalizationSignal[]): DivinationProfileInsight[] {
  return signals.map((item) => ({
    key: item.key,
    title: item.label,
    evidence: item.summary,
    judgement: item.summary,
    advice: item.summary,
    risk: '此资料仅作旁参，不可代卦。',
    weight: 'light',
  }));
}

function summarizeFiveElements(fiveElements?: Record<string, number> | null) {
  const entries = Object.entries(fiveElements || {})
    .filter(([, value]) => typeof value === 'number' && Number.isFinite(value))
    .sort((left, right) => right[1] - left[1]);

  if (!entries.length) {
    return '';
  }

  const elements = entries
    .slice(0, 3)
    .map(([key]) => normalizeElementName(key))
    .filter(Boolean);
  const [primary, ...secondary] = elements;

  if (!primary) {
    return '';
  }

  const secondaryText = secondary.length ? `，其次${secondary.join('、')}` : '';
  return `${primary}最强${secondaryText}。${resolveElementMeaning(elements)}`;
}

function pickLatestMood(items: MoodJournalItem[]) {
  return [...items].sort((left, right) => parseDateValue(right.updatedAt || right.recordDate) - parseDateValue(left.updatedAt || left.recordDate))[0] || null;
}

function pickLatestPersonality(items: PersonalityHistoryItem[]) {
  return [...items].sort((left, right) => parseDateValue(right.completedAt) - parseDateValue(left.completedAt))[0] || null;
}

function resolveDominantElement(fiveElements?: Record<string, number> | null) {
  const entries = Object.entries(fiveElements || {})
    .filter(([, value]) => typeof value === 'number' && Number.isFinite(value))
    .sort((left, right) => right[1] - left[1]);

  return normalizeElementName(entries[0]?.[0] || '');
}

function normalizeElementName(value: string) {
  return getDivinationProfileMapping().elementLabels[value.toLowerCase()] || value;
}

function resolveElementHint(element: string) {
  return getDivinationProfileMapping().elementHints[element] || '节奏平衡';
}

function resolveElementMeaning(elements: string[]) {
  const meaningTerms: Record<string, string[]> = {
    木: ['生长启动', '持续推进'],
    火: ['表达呈现', '外在行动'],
    土: ['稳定承接', '现实落地'],
    金: ['边界判断', '事实校准'],
    水: ['感受', '思考'],
  };
  const terms = elements.flatMap((element) => meaningTerms[element] || [resolveElementHint(element)]);

  if (!terms.length) {
    return '表示你当前画像更偏节奏平衡。';
  }

  return `表示你当前画像更偏${formatChineseList(unique(terms).slice(0, 4))}。`;
}

function moodLabel(type: string) {
  return getDivinationProfileMapping().moodLabels[type] || '当前状态';
}

function formatChineseList(items: string[]) {
  if (items.length <= 1) {
    return items[0] || '';
  }

  return `${items.slice(0, -1).join('、')}与${items[items.length - 1]}`;
}

function deriveZodiacFromBirthday(birthday?: string | null) {
  if (!birthday) {
    return '';
  }

  const date = birthday.slice(5, 10);
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

  return rules.find((item) => date >= item[1] && date <= item[2])?.[0] || '';
}

function parseDateValue(value?: string | null) {
  const parsed = value ? Date.parse(value) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function resolveDimensionLabel(key: DivinationPersonalizationKey) {
  return getDivinationProfileMapping().dimensionLabels[key];
}

function formatRelativeDays(timestamp: number | string) {
  const value = typeof timestamp === 'number' ? timestamp : parseDateValue(timestamp);
  if (!value) {
    return '刚刚';
  }

  const diffDays = Math.max(0, Math.floor((Date.now() - value) / (24 * 60 * 60 * 1000)));
  if (diffDays <= 0) {
    return '今天';
  }

  return `${diffDays} 天前`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
