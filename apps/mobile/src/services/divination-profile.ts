import { fetchMe } from '../api/auth';
import { fetchPersonalityHistory } from '../api/assessment';
import { fetchRecordOverview } from '../api/records';
import { fetchZodiacToday } from '../api/zodiac';
import type { PersonalityHistoryItem } from '../types/assessment';
import type { UserProfile } from '../types/auth';
import type {
  DivinationInterpretationTone,
  DivinationPersonalizationContext,
  DivinationPersonalizationFlags,
  DivinationPersonalizationKey,
  DivinationPersonalizationSignal,
} from '../types/divination';
import type { MoodJournalItem, RecordOverviewData } from '../types/records';
import type { ZodiacTodayData } from '../types/zodiac';
import {
  getAuthToken,
  getCachedUser,
  setCachedUser,
} from './session';

type ToneScores = Record<DivinationInterpretationTone, number>;

const TONE_COPY: Record<
  DivinationInterpretationTone,
  Pick<
    DivinationPersonalizationContext,
    'toneLabel' | 'toneSummary' | 'opportunityHint' | 'riskHint' | 'actionHint'
  >
> = {
  move: {
    toneLabel: '可推进',
    toneSummary: '画像信号偏向推进，读法会更重视把卦象落成一个可见动作。',
    opportunityHint: '机会在于趁状态有余，把关键一步做出来。',
    riskHint: '风险在于一口气推太多，反而打乱节奏。',
    actionHint: '先选择一个可完成动作，把卦意落到现实反馈里。',
  },
  clarify: {
    toneLabel: '先辨明',
    toneSummary: '画像信号偏向辨明，读法会更重视事实、边界和路径校准。',
    opportunityHint: '机会在于把模糊处说清楚，减少反复猜测。',
    riskHint: '风险在于还没看清就提前下结论。',
    actionHint: '先写下事实、需求和边界，再决定下一步。',
  },
  soften: {
    toneLabel: '先安顿',
    toneSummary: '画像信号偏向收束，读法会更重视身心安顿和低风险调整。',
    opportunityHint: '机会在于先保存精力，让局势慢慢回到可承接状态。',
    riskHint: '风险在于用硬撑替代真正的恢复。',
    actionHint: '先把今天的动作缩小到不会消耗自己的程度。',
  },
};

const MOOD_LABELS: Record<string, string> = {
  calm: '平和',
  low: '低落',
  anxious: '焦虑',
  happy: '明亮',
  tired: '疲惫',
};

const ELEMENT_TONE: Record<string, DivinationInterpretationTone> = {
  木: 'move',
  火: 'move',
  金: 'clarify',
  土: 'soften',
  水: 'soften',
};

const ELEMENT_LABELS: Record<string, string> = {
  wood: '木',
  fire: '火',
  earth: '土',
  metal: '金',
  water: '水',
};

export async function resolveDivinationPersonalizationContext(
  flags: DivinationPersonalizationFlags,
): Promise<DivinationPersonalizationContext> {
  const enabledKeys = resolveEnabledKeys(flags);

  if (!enabledKeys.length) {
    return createDivinationPersonalizationContext(enabledKeys, []);
  }

  const user = await resolveUserProfile();
  const zodiacSign = user?.zodiac || deriveZodiacFromBirthday(user?.birthday);
  const authToken = getAuthToken();
  const [zodiacToday, recordOverview, personalityItems] = await Promise.all([
    flags.useZodiac && zodiacSign
      ? safeResolve(fetchZodiacToday(zodiacSign).then((response) => response.data), 'zodiac')
      : Promise.resolve(null),
    flags.useMood && authToken
      ? safeResolve(fetchRecordOverview().then((response) => response.data), 'mood')
      : Promise.resolve(null),
    flags.usePersonality && authToken
      ? safeResolve(fetchPersonalityHistory().then((response) => response.data.items), 'personality')
      : Promise.resolve(null),
  ]);
  const mood = pickLatestMood(recordOverview?.moodRecords || []);
  const personality = pickLatestPersonality(personalityItems || []);
  const dominantElement = resolveDominantElement(user?.fiveElements);
  const signals = [
    buildBaziSignal(flags, user, dominantElement),
    buildZodiacSignal(flags, zodiacSign, zodiacToday),
    buildMoodSignal(flags, mood, recordOverview),
    buildPersonalitySignal(flags, personality),
  ].filter((item): item is DivinationPersonalizationSignal => Boolean(item));
  const toneScores = buildToneScores({
    dominantElement,
    zodiacToday,
    mood,
    recordOverview,
    personality,
  });
  const tone = pickTone(toneScores);

  return createDivinationPersonalizationContext(enabledKeys, signals, {
    tone,
    moodScore: mood?.moodScore ?? recordOverview?.overview.emotionalStability,
    zodiacScore: zodiacToday?.score.overall,
    scoreAdjustments: buildScoreAdjustments({
      activeCount: signals.length,
      tone,
      moodScore: mood?.moodScore ?? recordOverview?.overview.emotionalStability,
      zodiacScore: zodiacToday?.score.overall,
    }),
  });
}

export function createDivinationPersonalizationContext(
  enabledKeys: DivinationPersonalizationKey[] = [],
  signals: DivinationPersonalizationSignal[] = [],
  options: {
    tone?: DivinationInterpretationTone;
    scoreAdjustments?: DivinationPersonalizationContext['scoreAdjustments'];
    moodScore?: number;
    zodiacScore?: number;
  } = {},
): DivinationPersonalizationContext {
  const tone = options.tone || 'clarify';
  const copy = TONE_COPY[tone];

  return {
    enabledKeys,
    activeKeys: signals.map((item) => item.key),
    signals,
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

async function safeResolve<T>(promise: Promise<T>, label: string) {
  try {
    return await promise;
  } catch (error) {
    console.warn(`resolve divination ${label} signal failed`, error);
    return null;
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

function buildBaziSignal(
  flags: DivinationPersonalizationFlags,
  user: UserProfile | null,
  dominantElement: string,
): DivinationPersonalizationSignal | null {
  if (!flags.useBazi || (!user?.baziSummary && !dominantElement)) {
    return null;
  }

  return {
    key: 'bazi',
    label: '八字五行',
    value: dominantElement ? `${dominantElement}元素主导` : '八字已同步',
    summary:
      user?.baziSummary ||
      `五行以${dominantElement}为主，读卦时会更重视${resolveElementHint(dominantElement)}。`,
  };
}

function buildZodiacSignal(
  flags: DivinationPersonalizationFlags,
  zodiacSign: string,
  zodiacToday: ZodiacTodayData | null,
): DivinationPersonalizationSignal | null {
  if (!flags.useZodiac || !zodiacSign) {
    return null;
  }

  const profile = zodiacToday?.profile;
  const keywordText = unique([
    ...(zodiacToday?.theme.keywords || []),
    ...(profile?.keywords || []),
  ])
    .slice(0, 3)
    .join('、');
  const scoreText = zodiacToday?.score.overall ? ` · ${zodiacToday.score.overall}分` : '';

  return {
    key: 'zodiac',
    label: '星座节奏',
    value: `${zodiacSign}${scoreText}`,
    summary:
      zodiacToday?.theme.summary ||
      zodiacToday?.action.description ||
      `${zodiacSign}${keywordText ? `今日关键词为${keywordText}` : '作为轻量节奏参考'}。`,
  };
}

function buildMoodSignal(
  flags: DivinationPersonalizationFlags,
  mood: MoodJournalItem | null,
  recordOverview: RecordOverviewData | null,
): DivinationPersonalizationSignal | null {
  if (!flags.useMood) {
    return null;
  }

  if (mood) {
    const tagText = mood.emotionTags.slice(0, 3).join('、');
    const label = moodLabel(mood.moodType);

    return {
      key: 'mood',
      label: '近期心情',
      value: `${label} · ${mood.moodScore}分`,
      summary: tagText
        ? `最近一次心情为${label}，标签是${tagText}。`
        : `最近一次心情为${label}，状态分为${mood.moodScore}。`,
    };
  }

  if (recordOverview?.overview) {
    return {
      key: 'mood',
      label: '近期心情',
      value: `${recordOverview.overview.emotionalStability}分`,
      summary: recordOverview.overview.encouragement,
    };
  }

  return null;
}

function buildPersonalitySignal(
  flags: DivinationPersonalizationFlags,
  personality: PersonalityHistoryItem | null,
): DivinationPersonalizationSignal | null {
  if (!flags.usePersonality || !personality) {
    return null;
  }

  return {
    key: 'personality',
    label: '性格倾向',
    value: personality.dominantDimensionLabel || personality.level || personality.title,
    summary: personality.summary || personality.subtitle,
  };
}

function buildToneScores(input: {
  dominantElement: string;
  zodiacToday: ZodiacTodayData | null;
  mood: MoodJournalItem | null;
  recordOverview: RecordOverviewData | null;
  personality: PersonalityHistoryItem | null;
}): ToneScores {
  const scores: ToneScores = {
    move: 0,
    clarify: 1,
    soften: 0,
  };

  const elementTone = ELEMENT_TONE[input.dominantElement];
  if (elementTone) {
    scores[elementTone] += 1;
  }

  const zodiacScore = input.zodiacToday?.score.overall;
  if (typeof zodiacScore === 'number') {
    if (zodiacScore >= 82) {
      scores.move += 1;
    } else if (zodiacScore <= 68) {
      scores.soften += 1;
    } else {
      scores.clarify += 1;
    }
  }

  const moodType = input.mood?.moodType;
  if (moodType === 'happy') {
    scores.move += 2;
  } else if (moodType === 'calm') {
    scores.clarify += 2;
  } else if (moodType === 'anxious') {
    scores.clarify += 1;
    scores.soften += 2;
  } else if (moodType === 'low' || moodType === 'tired') {
    scores.soften += 2;
  } else if (input.recordOverview?.overview.emotionalStability) {
    const stability = input.recordOverview.overview.emotionalStability;
    if (stability >= 80) {
      scores.move += 1;
    } else if (stability < 62) {
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

  if (/行动|外向|果断|开拓|表达|主动/.test(text)) {
    scores.move += 2;
  }

  if (/理性|分析|逻辑|观察|规划|谨慎|秩序|边界/.test(text)) {
    scores.clarify += 2;
  }

  if (/敏感|共情|内向|细腻|焦虑|温和|疗愈|感受/.test(text)) {
    scores.soften += 2;
  }
}

function pickTone(scores: ToneScores): DivinationInterpretationTone {
  return (['clarify', 'move', 'soften'] as DivinationInterpretationTone[]).reduce(
    (best, tone) => (scores[tone] > scores[best] ? tone : best),
    'clarify',
  );
}

function buildScoreAdjustments(input: {
  activeCount: number;
  tone: DivinationInterpretationTone;
  moodScore?: number;
  zodiacScore?: number;
}) {
  const toneAction = input.tone === 'move' ? 3 : input.tone === 'clarify' ? 1 : -2;
  const toneOverall = input.tone === 'move' ? 2 : input.tone === 'soften' ? -1 : 0;
  const zodiacOverall =
    typeof input.zodiacScore === 'number'
      ? clamp(Math.round((input.zodiacScore - 76) / 10), -2, 2)
      : 0;
  const moodEmotion =
    typeof input.moodScore === 'number'
      ? clamp(Math.round((input.moodScore - 70) / 8), -5, 5)
      : 0;

  return {
    overall: clamp(Math.min(input.activeCount, 3) + toneOverall + zodiacOverall, -3, 6),
    emotion: moodEmotion,
    action: toneAction,
  };
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
  return ELEMENT_LABELS[value.toLowerCase()] || value;
}

function resolveElementHint(element: string) {
  const hints: Record<string, string> = {
    木: '生长和启动',
    火: '表达和呈现',
    土: '承载和稳定',
    金: '边界和决断',
    水: '流动和蓄养',
  };

  return hints[element] || '节奏平衡';
}

function moodLabel(type: string) {
  return MOOD_LABELS[type] || '当前状态';
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
