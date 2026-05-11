import type {
  DivinationHistoryTrendPoint,
  DivinationFlow,
  DivinationMethod,
  DivinationPersonalizationFlags,
  DivinationPersonalizationContext,
  DivinationPersonalizationSnapshot,
  DivinationPersonalizationKey,
  DivinationProfileInsight,
  DivinationRequest,
  DivinationReviewEntry,
  DivinationReviewRemoteItem,
  DivinationReview,
  DivinationReviewSyncPayload,
  DivinationLineReading,
  DivinationResult,
  DivinationTopic,
  DivinationTopicOption,
} from '../types/divination';
import {
  fetchDivinationReviews,
  syncDivinationReview,
} from '../api/divination';
import { buildDivinationCasting } from './divination-casting';
import {
  buildTopicReading,
  getDivinationLuckyConfig,
  getDivinationProfileMapping,
  getDivinationTopicOptions,
  getDivinationTopicStrategy,
} from './divination-content';
import { DEFAULT_DIVINATION_RUNTIME_CONFIG } from './divination-runtime-config';
import { getAuthToken } from './session';

const HISTORY_STORAGE_KEY = 'fortune-hub:divination-history';
const PENDING_REQUEST_STORAGE_KEY = 'fortune-hub:divination-pending-request';
const REVIEW_STORAGE_KEY = 'fortune-hub:divination-reviews';
const DEFAULT_USER_ID = 'local-user';
const MAX_HISTORY_COUNT = 30;

export const DIVINATION_TOPICS: DivinationTopicOption[] = DEFAULT_DIVINATION_RUNTIME_CONFIG.topicOptions;

export function getTopicOption(topic: DivinationTopic) {
  const topicOptions = getDivinationTopicOptions();
  return topicOptions.find((item) => item.value === topic) || topicOptions[0];
}

export function getTopicLabel(topic: DivinationTopic) {
  return getDivinationTopicStrategy(topic).label || getTopicOption(topic).label;
}

export function getDefaultPersonalizationFlags(): DivinationPersonalizationFlags {
  return {
    useBazi: true,
    useZodiac: true,
    useMood: true,
    usePersonality: true,
  };
}

export function createTodayDivinationRequest(
  topic: DivinationTopic = 'general',
  method: DivinationMethod = 'split-stalk',
  flow: DivinationFlow = 'yang',
): DivinationRequest {
  return {
    userId: DEFAULT_USER_ID,
    topic,
    timestamp: Date.now(),
    method,
    flow,
    ...getDefaultPersonalizationFlags(),
  };
}

export function setPendingDivinationRequest(request: DivinationRequest) {
  try {
    uni.setStorageSync(PENDING_REQUEST_STORAGE_KEY, request);
  } catch (error) {
    console.warn('save pending divination request failed', error);
  }
}

export function getPendingDivinationRequest() {
  try {
    return uni.getStorageSync(PENDING_REQUEST_STORAGE_KEY) as DivinationRequest | '';
  } catch (error) {
    console.warn('read pending divination request failed', error);
    return '';
  }
}

export function clearPendingDivinationRequest() {
  try {
    uni.removeStorageSync(PENDING_REQUEST_STORAGE_KEY);
  } catch (error) {
    console.warn('clear pending divination request failed', error);
  }
}

export function listDivinationReviews() {
  try {
    const raw = uni.getStorageSync(REVIEW_STORAGE_KEY) as Record<string, DivinationReview> | '';
    const reviews = raw && typeof raw === 'object' ? raw : {};
    return backfillReviewsFromHistory(reviews);
  } catch (error) {
    console.warn('read divination reviews failed', error);
    return {};
  }
}

export async function syncDivinationReviewsFromServer() {
  if (!getAuthToken()) {
    return listDivinationReviews();
  }

  try {
    const response = await fetchDivinationReviews();
    const currentReviews = listDivinationReviews();
    const nextReviews = { ...currentReviews };
    const staleLocalReviews: DivinationReview[] = [];
    const remoteResultIds = new Set<string>();

    for (const item of response.data.items) {
      const remoteReview = normalizeRemoteReview(item);
      const localReview = nextReviews[remoteReview.resultId];
      remoteResultIds.add(remoteReview.resultId);

      if (!localReview || remoteReview.updatedAt >= localReview.updatedAt) {
        nextReviews[remoteReview.resultId] = remoteReview;
      } else {
        staleLocalReviews.push(localReview);
      }

      mergeRemoteResultSnapshot(item, nextReviews[remoteReview.resultId] || remoteReview);
    }

    Object.values(currentReviews).forEach((item) => {
      if (!remoteResultIds.has(item.resultId)) {
        staleLocalReviews.push(item);
      }
    });

    writeDivinationReviews(nextReviews);

    staleLocalReviews.forEach((item) => {
      void syncDivinationReviewToServer(item.resultId, item);
    });

    return nextReviews;
  } catch (error) {
    console.warn('sync divination reviews failed', error);
    return listDivinationReviews();
  }
}

export function getDivinationReview(resultId?: string) {
  if (!resultId) {
    return undefined;
  }

  return listDivinationReviews()[resultId];
}

export function saveDivinationReview(
  resultId: string,
  patch: Partial<
    Pick<
      DivinationReview,
      | 'favorite'
      | 'outcome'
      | 'note'
      | 'preMood'
      | 'preMoodIntensity'
      | 'postMood'
      | 'postMoodIntensity'
      | 'expectation'
    >
  >,
) {
  const reviews = listDivinationReviews();
  const current = reviews[resultId] || createEmptyReview(resultId);
  const next: DivinationReview = {
    ...current,
    ...patch,
    note: typeof patch.note === 'string' ? patch.note.slice(0, 500) : current.note,
    expectation:
      typeof patch.expectation === 'string'
        ? patch.expectation.slice(0, 32)
        : current.expectation,
    updatedAt: Date.now(),
  };

  try {
    writeDivinationReviews({
      ...reviews,
      [resultId]: next,
    });
    void syncDivinationReviewToServer(resultId, next);
  } catch (error) {
    console.warn('save divination review failed', error);
  }

  return next;
}

export function listDivinationReviewEntries(): DivinationReviewEntry[] {
  return listDivinationHistory()
    .map((result) => ({
      result,
      review: getDivinationReview(result.id) || result.review || createEmptyReview(result.id),
    }))
    .sort((left, right) => right.result.createdAt - left.result.createdAt);
}

export function generateDivinationResult(
  request: DivinationRequest,
  personalizationContext?: DivinationPersonalizationContext | null,
): DivinationResult {
  const normalizedQuestion = (request.question || '').trim();
  const method = request.method || 'split-stalk';
  const flow = request.flow || 'yang';
  const casting = buildDivinationCasting({
    ...request,
    userId: request.userId || DEFAULT_USER_ID,
    question: normalizedQuestion,
    method,
    flow,
  });
  const seed = casting.seed;
  const topicCopy = getDivinationTopicStrategy(request.topic);
  const luckyConfig = getDivinationLuckyConfig();
  const scoreAdjustments = personalizationContext?.scoreAdjustments || {
    overall: personalizedBonus(request),
    emotion: 0,
    action: 0,
  };
  const baseScore = clamp(66 + (seed % 23) + scoreAdjustments.overall, 56, 96);
  const emotionScore = clamp(baseScore - 8 + ((seed >> 3) % 14) + scoreAdjustments.emotion, 52, 95);
  const actionScore = clamp(baseScore - 3 + ((seed >> 5) % 16) + scoreAdjustments.action, 55, 98);
  const level = resolveScoreLevel(baseScore);
  const hexagram = {
    ...casting.hexagram,
    level,
  };
  const changed = casting.changedHexagram;
  const keywords = unique([
    ...casting.keywords,
    topicCopy.focus.split('、')[0],
    topicCopy.action.slice(0, 2),
    personalizationContext?.signals.length ? personalizationContext.toneLabel : '',
  ])
    .filter(Boolean)
    .slice(0, 4);
  const createdAt = request.timestamp || Date.now();
  const movingLineReading = hexagram.lineReadings?.[casting.movingLine - 1];
  const topicReading = buildTopicReading({
    topic: request.topic,
    hexagram,
    changedHexagram: changed,
    movingLineReading,
    movingLineLabel: casting.movingLineLabel,
    personalizationContext,
  });
  const oracle = buildOracle({
    question: normalizedQuestion,
    focus: topicCopy.focus,
    action: topicCopy.action,
    methodLabel: casting.methodLabel,
    hexagram,
    changedHexagram: changed,
    movingLineLabel: casting.movingLineLabel,
    movingLineText: buildMovingLineOracleText(movingLineReading),
    movingLineAdvice: movingLineReading?.advice,
    personalizationContext,
  });
  const readingFlow = buildTakashimaReadingFlow({
    topic: request.topic,
    topicLabel: topicCopy.label,
    hexagram,
    changedHexagram: changed,
    movingLineLabel: casting.movingLineLabel,
    movingLineReading,
    topicReading,
    oracle,
    personalizationContext,
  });
  const analysis = buildReadingFlowAnalysis(readingFlow);
  const personalizationSnapshot = buildPersonalizationSnapshot(personalizationContext, createdAt);

  return {
    id: `divination_${createdAt}_${seed.toString(16)}`,
    userId: request.userId || DEFAULT_USER_ID,
    topic: request.topic,
    topicLabel: topicCopy.label,
    question: normalizedQuestion || undefined,
    hexagram,
    changingLines: [casting.movingLine],
    changedHexagram:
      changed.id === hexagram.id
        ? undefined
        : changed,
    casting: {
      method: casting.method,
      methodLabel: casting.methodLabel,
      flow: casting.flow,
      flowLabel: casting.flowLabel,
      movingLine: casting.movingLine,
      movingLineLabel: casting.movingLineLabel,
      steps: casting.steps,
    },
    scores: {
      overall: baseScore,
      emotion: emotionScore,
      action: actionScore,
    },
    oracle,
    topicReading,
    readingFlow,
    review: getDivinationReview(`divination_${createdAt}_${seed.toString(16)}`),
    personalizationSnapshot,
    keywords,
    summary: `本卦为「${hexagram.name}」，动爻为「${casting.movingLineLabel}」。${hexagram.decision || `当前更适合${topicCopy.action}`}。`,
    analysis,
    personalizedReason: buildPersonalizedReason(
      request,
      topicCopy.focus,
      casting.methodLabel,
      personalizationContext,
    ),
    reminders: [
      '把占卜结果作为自我觉察和行动参考即可。',
      '涉及健康、投资、法律或重大人生决定时，仍建议结合现实信息判断。',
      personalizationContext?.signals.length ? `${personalizationContext.toneLabel}：${personalizationContext.riskHint}` : '',
      `今天更适合${topicCopy.action}。`,
    ].filter(Boolean),
    advice: buildPersonalizedAdvice(topicCopy.advice, personalizationContext),
    suitable: buildPersonalizedSuitable(topicCopy.suitable, personalizationContext),
    avoid: buildPersonalizedAvoid(topicCopy.avoidList, personalizationContext),
    lucky: {
      color: pickBySeed(luckyConfig.colors, seed, '淡紫色'),
      number: pickBySeed(luckyConfig.numbers, seed, 1),
      direction: pickBySeed(luckyConfig.directions, seed >> 2, '东南'),
      element: pickBySeed(luckyConfig.elements, seed >> 4, '水'),
    },
    createdAt,
  };
}

export function saveDivinationResult(result: DivinationResult) {
  const normalized = normalizeDivinationResult(result);
  const nextHistory = [normalized, ...listDivinationHistory().filter((item) => item.id !== normalized.id)].slice(
    0,
    MAX_HISTORY_COUNT,
  );

  try {
    uni.setStorageSync(HISTORY_STORAGE_KEY, nextHistory);
  } catch (error) {
    console.warn('save divination history failed', error);
  }
}

export function listDivinationHistory() {
  try {
    const raw = uni.getStorageSync(HISTORY_STORAGE_KEY) as DivinationResult[] | '';
    return Array.isArray(raw) ? raw.map((item) => normalizeDivinationResult(item)) : [];
  } catch (error) {
    console.warn('read divination history failed', error);
    return [];
  }
}

export function getDivinationResult(id?: string) {
  const history = listDivinationHistory();

  if (!id) {
    return history[0] || null;
  }

  return history.find((item) => item.id === id) || null;
}

export function getOrCreateTodayDivinationResult() {
  const todayKey = toDateKey(Date.now());
  const todayResult = listDivinationHistory().find((item) => toDateKey(item.createdAt) === todayKey);

  if (todayResult) {
    return todayResult;
  }

  const result = generateDivinationResult(createTodayDivinationRequest());
  saveDivinationResult(result);
  return result;
}

export function getDivinationTrend(history = listDivinationHistory()): DivinationHistoryTrendPoint[] {
  const labels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const recent = [...history].reverse().slice(-7);
  const fallback = [68, 72, 85, 78, 88, 82, 75];

  return labels.map((label, index) => ({
    label,
    value: recent[index]?.scores.overall ?? fallback[index],
  }));
}

export function formatDivinationDate(timestamp: number) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
}

export function formatDivinationDateTime(timestamp: number) {
  const date = new Date(timestamp);
  return `${formatDivinationDate(timestamp)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function toDateKey(timestamp: number) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function buildPersonalizedReason(
  request: DivinationRequest,
  focus: string,
  methodLabel = '略筮法',
  personalizationContext?: DivinationPersonalizationContext | null,
) {
  const insights = selectProfileInsights(personalizationContext, request.topic, 3);

  if (personalizationContext?.signals.length || insights.length) {
    const signalText = personalizationContext?.signals
      .map((item) => `${item.label}「${item.value}」`)
      .join('、');
    const detailText = personalizationContext?.signals
      .map((item) => `${item.label}：${item.summary}`)
      .join('；');
    const insightText = insights
      .map((item) => `${item.title}据「${item.evidence}」，断为${item.judgement}`)
      .join('；');
    const adviceText = unique(insights.map((item) => item.advice)).join(' ');
    const missText = personalizationContext?.hasPartialMiss
      ? ' 其中部分画像未命中，因此仅以已命中的资料参与解释。'
      : '';

    return `本次先以${methodLabel}定出本卦、动爻与变卦，再以${signalText || '命中的用户资料'}作为断语旁参；画像只校准解读轻重，不改变卦象。此占更偏向「${focus}」的当下指引。策略上取「${personalizationContext?.toneLabel}」：${personalizationContext?.toneSummary}旁参依据为${insightText || detailText}。${adviceText ? `落地时，${adviceText}` : ''}${missText}`;
  }

  const activeDimensionLabels =
    personalizationContext?.dimensionStates
      ?.filter((item) => item.enabled && item.state === 'active')
      .map((item) => item.label)
      .filter(Boolean) || [];

  if (!activeDimensionLabels.length) {
    const enabledDimensionLabels = personalizationContext?.enabledKeys.length
      ? personalizationContext.enabledKeys.map(personalizationKeyLabel)
      : [
          request.useBazi ? '八字' : '',
          request.useZodiac ? '星座' : '',
          request.useMood ? '心情' : '',
          request.usePersonality ? '性格' : '',
        ].filter(Boolean);

    if (!enabledDimensionLabels.length) {
      return `这次主要根据你选择的「${focus}」主题，以${methodLabel}完成起卦；未启用画像旁参，结果会更偏向卦象本身与当下可执行的提醒。`;
    }

    const missText = personalizationContext?.hasPartialMiss
      ? ' 其中部分画像未命中，因此仅以已命中的资料参与解释。'
      : '';

    return `本次以${methodLabel}定出本卦、动爻与变卦；${enabledDimensionLabels.join('、')}已启用，但本次没有命中可用资料，因此只保留卦象与问事主题的判断，不把这些维度写成断语主依据。${missText}`;
  }

  const missText = personalizationContext?.hasPartialMiss
    ? ' 其中部分画像未命中，因此仅以已命中的资料参与解释。'
    : '';

  return `本次以${methodLabel}定出本卦、动爻与变卦；${activeDimensionLabels.join('、')}只作为断语旁参，不改变卦象。本次占卜更偏向「${focus}」的当下指引。${missText}`;
}

function buildPersonalizationSnapshot(
  context: DivinationPersonalizationContext | null | undefined,
  generatedAt: number,
): DivinationPersonalizationSnapshot | undefined {
  if (!context) {
    return undefined;
  }

  return {
    generatedAt,
    enabledKeys: [...context.enabledKeys],
    activeKeys: [...context.activeKeys],
    signals: context.signals.map((item) => ({ ...item })),
    profileInsights: (context.profileInsights || []).map((item) => ({
      ...item,
      topics: item.topics ? [...item.topics] : undefined,
    })),
    dimensionStates: context.dimensionStates.map((item) => ({ ...item })),
    hasPartialMiss: context.hasPartialMiss,
    tone: context.tone,
    toneLabel: context.toneLabel,
    toneSummary: context.toneSummary,
    opportunityHint: context.opportunityHint,
    riskHint: context.riskHint,
    actionHint: context.actionHint,
    scoreAdjustments: { ...context.scoreAdjustments },
    moodScore: context.moodScore,
    zodiacScore: context.zodiacScore,
  };
}

function buildOracle(input: {
  question: string;
  focus: string;
  action: string;
  methodLabel: string;
  hexagram: DivinationResult['hexagram'];
  changedHexagram?: DivinationResult['hexagram'];
  movingLineLabel: string;
  movingLineText?: string;
  movingLineAdvice?: string;
  personalizationContext?: DivinationPersonalizationContext | null;
}): DivinationResult['oracle'] {
  const subject = input.question || input.focus;
  const changed = input.changedHexagram;
  const baseAction = input.movingLineAdvice || input.hexagram.decision || `今天更适合${input.action}。`;

  return {
    title: '高岛式断曰',
    subject,
    situation: `占得「${input.hexagram.name}」。${input.hexagram.judgement || input.hexagram.meaning}`,
    moving: `${input.movingLineLabel}为本次关键。${input.movingLineText || '动爻提示事情已有变化之机，宜看清眼前最容易失衡的位置。'}`,
    tendency: changed
      ? `变为「${changed.name}」。${changed.decision || changed.meaning}`
      : '本卦不变，宜守住当前判断，先把眼前一步做稳。',
    action: joinSentences([baseAction, input.personalizationContext?.actionHint]),
  };
}

function buildTakashimaReadingFlow(input: {
  topic?: DivinationTopic;
  topicLabel: string;
  hexagram: DivinationResult['hexagram'];
  changedHexagram?: DivinationResult['hexagram'];
  movingLineLabel: string;
  movingLineReading?: DivinationLineReading | null;
  topicReading?: DivinationResult['topicReading'];
  oracle?: DivinationResult['oracle'];
  personalizationContext?: DivinationPersonalizationContext | null;
}): NonNullable<DivinationResult['readingFlow']> {
  const movingLine = input.movingLineReading;
  const topicReading = input.topicReading;
  const profileSignals = input.personalizationContext?.signals || [];
  const profileInsights = selectProfileInsights(input.personalizationContext, input.topic, 2);
  const profileJudgement = buildProfileInsightJudgement(profileInsights);
  const profileAdvice = buildProfileInsightAdvice(profileInsights);

  return {
    hexagramTrend: joinSentences([
      `本卦大势：占得「${input.hexagram.name}」，${input.hexagram.judgement || input.hexagram.meaning}`,
      input.hexagram.decision,
    ]),
    movingLine: joinSentences([
      `动爻爻辞：${input.movingLineLabel}为本次关键`,
      movingLine?.classicText ? `爻辞曰「${movingLine.classicText}」` : '',
      movingLine?.takashimaText || movingLine?.text,
    ]),
    changedTrend: input.changedHexagram
      ? joinSentences([
          `变卦后势：由本卦变为「${input.changedHexagram.name}」`,
          input.changedHexagram.decision || input.changedHexagram.meaning,
        ])
      : '变卦后势：本卦不变，主当前局势尚未明显转向，宜先守住眼前判断。',
    topicJudgement: joinSentences([
      `问事分类：以「${input.topicLabel}」观之`,
      topicReading?.summary,
      topicReading?.opportunity,
      topicReading?.risk,
      profileJudgement,
    ]),
    practicalAdvice: joinSentences([
      '现实建议：以可验证的一步应卦',
      input.oracle?.action || topicReading?.action || movingLine?.advice || input.hexagram.decision,
      profileAdvice,
    ]),
    profileReference: buildProfileReference(profileInsights, profileSignals),
  };
}

function buildReadingFlowAnalysis(flow: NonNullable<DivinationResult['readingFlow']>) {
  return [
    flow.hexagramTrend,
    flow.movingLine,
    flow.changedTrend,
    flow.topicJudgement,
    flow.profileReference,
    flow.practicalAdvice,
  ].filter(Boolean).join('\n');
}

function buildMovingLineOracleText(reading?: DivinationLineReading | null) {
  if (!reading) {
    return undefined;
  }

  return joinSentences([
    reading.classicText ? `爻辞曰「${reading.classicText}」` : '',
    reading.takashimaText,
    reading.modernText || reading.text,
  ]);
}

const PROFILE_INSIGHT_WEIGHT_RANK: Record<DivinationProfileInsight['weight'], number> = {
  strong: 3,
  medium: 2,
  light: 1,
};

function selectProfileInsights(
  context?: DivinationPersonalizationContext | null,
  topic?: DivinationTopic,
  limit = 2,
) {
  const insights = context?.profileInsights || [];
  if (!insights.length) {
    return [];
  }

  const topicMatched = topic
    ? insights.filter((item) => !item.topics?.length || item.topics.includes(topic))
    : insights;
  const source = topicMatched.length ? topicMatched : insights;

  return [...source]
    .sort((left, right) => PROFILE_INSIGHT_WEIGHT_RANK[right.weight] - PROFILE_INSIGHT_WEIGHT_RANK[left.weight])
    .slice(0, limit);
}

function buildProfileInsightJudgement(insights: DivinationProfileInsight[]) {
  if (!insights.length) {
    return '';
  }

  return `画像旁参：${insights.map((item) => item.judgement).join('；')}`;
}

function buildProfileInsightAdvice(insights: DivinationProfileInsight[]) {
  if (!insights.length) {
    return '';
  }

  return unique(insights.map((item) => item.advice)).join(' ');
}

function buildProfileReference(
  insights: DivinationProfileInsight[],
  signals: DivinationPersonalizationContext['signals'],
) {
  if (insights.length) {
    const detail = insights
      .map((item) => `${item.title}「${item.evidence}」取${item.weight === 'strong' ? '重参' : item.weight === 'medium' ? '中参' : '轻参'}，${item.risk}`)
      .join('；');
    return `旁参画像：${detail}。这些资料只校准断语轻重，不改变本卦、动爻与变卦。`;
  }

  return signals.length
    ? `旁参画像：${signals.map((item) => `${item.label}「${item.value}」`).join('、')}。这些资料只校准断语轻重，不改变本卦、动爻与变卦。`
    : undefined;
}

function buildPersonalizedAdvice(
  advice: string[],
  context?: DivinationPersonalizationContext | null,
) {
  if (!context?.signals.length) {
    return advice;
  }

  return unique([context.actionHint, ...advice]).slice(0, 4);
}

function buildPersonalizedSuitable(
  suitable: string[],
  context?: DivinationPersonalizationContext | null,
) {
  if (!context?.signals.length) {
    return suitable;
  }

  const extra: Record<DivinationPersonalizationContext['tone'], string> = {
    move: '推进',
    clarify: '核对',
    soften: '休整',
  };

  return unique([...suitable, extra[context.tone]]).slice(0, 5);
}

function buildPersonalizedAvoid(
  avoidList: string[],
  context?: DivinationPersonalizationContext | null,
) {
  if (!context?.signals.length) {
    return avoidList;
  }

  const extra: Record<DivinationPersonalizationContext['tone'], string> = {
    move: '贪多',
    clarify: '猜测',
    soften: '硬撑',
  };

  return unique([...avoidList, extra[context.tone]]).slice(0, 5);
}

function normalizeDivinationResult(input: DivinationResult): DivinationResult {
  const movingLine = input.casting?.movingLine || input.changingLines?.[0] || 1;
  const movingLineLabel = input.casting?.movingLineLabel || `第 ${movingLine} 爻`;
  const hexagram = {
    ...input.hexagram,
    sequence: input.hexagram.sequence ?? input.hexagram.id,
    judgement: input.hexagram.judgement || input.hexagram.meaning,
    image: input.hexagram.image || input.hexagram.meaning,
    decision: input.hexagram.decision || input.summary || input.analysis,
    caution: input.hexagram.caution || '涉及重大决定时，仍需结合现实信息判断。',
  };
  const casting =
    input.casting ||
    ({
      method: 'split-stalk',
      methodLabel: '旧版本地起卦',
      flow: 'yang',
      flowLabel: '旧版记录',
      movingLine,
      movingLineLabel,
      steps: [],
    } satisfies NonNullable<DivinationResult['casting']>);
  const movingLineReading = hexagram.lineReadings?.[movingLine - 1];
  const changedHexagram = input.changedHexagram
    ? {
        ...input.changedHexagram,
        decision: input.changedHexagram.decision || input.changedHexagram.meaning,
      }
    : undefined;
  const topicReading =
    input.topicReading ||
    buildTopicReading({
      topic: input.topic,
      hexagram,
      changedHexagram: changedHexagram as DivinationResult['hexagram'] | undefined,
      movingLineReading,
      movingLineLabel,
    });
  const oracle =
    input.oracle ||
    buildOracle({
      question: input.question || '',
      focus: input.topicLabel || '当前所问',
      action: input.advice?.[0] || '先完成一件小而确定的事',
      methodLabel: casting.methodLabel,
      hexagram,
      changedHexagram: changedHexagram as DivinationResult['hexagram'] | undefined,
      movingLineLabel,
      movingLineText: buildMovingLineOracleText(movingLineReading),
      movingLineAdvice: movingLineReading?.advice,
    });
  const readingFlow =
    input.readingFlow ||
    buildTakashimaReadingFlow({
      topic: input.topic,
      topicLabel: input.topicLabel || '当前问事',
      hexagram,
      changedHexagram: changedHexagram as DivinationResult['hexagram'] | undefined,
      movingLineLabel,
      movingLineReading,
      topicReading,
      oracle,
      personalizationContext: input.personalizationSnapshot,
    });

  const storedReview = getDivinationReview(input.id);

  return {
    ...input,
    hexagram,
    changedHexagram,
    casting,
    oracle,
    topicReading,
    readingFlow,
    analysis: input.readingFlow ? input.analysis : buildReadingFlowAnalysis(readingFlow),
    review: storedReview || input.review,
    changingLines: input.changingLines?.length ? input.changingLines : [movingLine],
  };
}

function writeDivinationReviews(reviews: Record<string, DivinationReview>) {
  uni.setStorageSync(REVIEW_STORAGE_KEY, reviews);
}

function backfillReviewsFromHistory(reviews: Record<string, DivinationReview>) {
  const history = uni.getStorageSync(HISTORY_STORAGE_KEY) as DivinationResult[] | '';
  if (!Array.isArray(history)) {
    return reviews;
  }

  let changed = false;
  const nextReviews = { ...reviews };

  history.forEach((item) => {
    const embeddedReview = item.review;
    if (!embeddedReview?.resultId) {
      return;
    }

    const currentReview = nextReviews[embeddedReview.resultId];
    if (!currentReview || embeddedReview.updatedAt > currentReview.updatedAt) {
      nextReviews[embeddedReview.resultId] = {
        ...embeddedReview,
        note: embeddedReview.note.slice(0, 500),
      };
      changed = true;
    }
  });

  if (changed) {
    writeDivinationReviews(nextReviews);
  }

  return nextReviews;
}

async function syncDivinationReviewToServer(
  resultId: string,
  review: DivinationReview,
  result = getDivinationResult(resultId),
) {
  if (!getAuthToken()) {
    return review;
  }

  try {
    const response = await syncDivinationReview(buildReviewSyncPayload(resultId, review, result));
    const remoteReview = normalizeRemoteReview(response.data.item, review.updatedAt);
    const reviews = listDivinationReviews();
    writeDivinationReviews({
      ...reviews,
      [resultId]: remoteReview,
    });
    mergeRemoteResultSnapshot(response.data.item, remoteReview);
    return remoteReview;
  } catch (error) {
    console.warn('sync divination review failed', error);
    return review;
  }
}

function buildReviewSyncPayload(
  resultId: string,
  review: DivinationReview,
  result: DivinationResult | null,
): DivinationReviewSyncPayload {
  return {
    resultId,
    favorite: review.favorite,
    outcome: review.outcome,
    note: review.note,
    topic: result?.topic,
    title: result?.topicLabel || result?.hexagram.name,
    summary: result?.question || result?.summary,
    resultSnapshot: result ? { ...result, review } : undefined,
    preMood: review.preMood,
    preMoodIntensity: review.preMoodIntensity,
    postMood: review.postMood,
    postMoodIntensity: review.postMoodIntensity,
    expectation: review.expectation,
  };
}

function normalizeRemoteReview(
  item: DivinationReviewRemoteItem,
  fallbackUpdatedAt = 0,
): DivinationReview {
  return {
    resultId: item.resultId,
    favorite: Boolean(item.favorite),
    outcome: isReviewOutcome(item.outcome) ? item.outcome : 'pending',
    note: typeof item.note === 'string' ? item.note.slice(0, 500) : '',
    preMood: item.preMood || undefined,
    preMoodIntensity: item.preMoodIntensity ?? undefined,
    postMood: item.postMood || undefined,
    postMoodIntensity: item.postMoodIntensity ?? undefined,
    expectation: item.expectation || undefined,
    updatedAt: Math.max(parseRemoteDate(item.updatedAt), fallbackUpdatedAt),
  };
}

function mergeRemoteResultSnapshot(
  item: DivinationReviewRemoteItem,
  review: DivinationReview,
) {
  if (!item.resultSnapshot) {
    return;
  }

  const history = listDivinationHistory();
  const existing = history.find((result) => result.id === item.resultId);

  if (existing && existing.createdAt >= item.resultSnapshot.createdAt) {
    return;
  }

  saveDivinationResult({
    ...item.resultSnapshot,
    review,
  });
}

function parseRemoteDate(value: string) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function isReviewOutcome(value: string): value is DivinationReview['outcome'] {
  return value === 'pending' || value === 'fulfilled' || value === 'unfulfilled';
}

function createEmptyReview(resultId: string): DivinationReview {
  return {
    resultId,
    favorite: false,
    outcome: 'pending',
    note: '',
    updatedAt: Date.now(),
  };
}

function personalizedBonus(request: DivinationRequest) {
  return [request.useBazi, request.useZodiac, request.useMood, request.usePersonality].filter(Boolean).length;
}

function resolveScoreLevel(score: number): DivinationResult['hexagram']['level'] {
  if (score >= 88) {
    return '大吉';
  }

  if (score >= 78) {
    return '吉';
  }

  if (score >= 66) {
    return '小吉';
  }

  return '中平';
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function personalizationKeyLabel(key: DivinationPersonalizationKey) {
  return getDivinationProfileMapping().dimensionLabels[key] || key;
}

function pickBySeed<T>(items: T[], seed: number, fallback: T) {
  if (!items.length) {
    return fallback;
  }

  return items[Math.abs(seed) % items.length] ?? fallback;
}

function joinSentences(parts: Array<string | undefined | null>) {
  return parts
    .map((item) => item?.trim())
    .filter((item): item is string => Boolean(item))
    .map((item) => (/[。！？.!?]$/.test(item) ? item : `${item}。`))
    .join('');
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}
