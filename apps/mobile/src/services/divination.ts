import type {
  DivinationHistoryTrendPoint,
  DivinationFlow,
  DivinationMethod,
  DivinationPersonalizationFlags,
  DivinationRequest,
  DivinationReview,
  DivinationResult,
  DivinationTopic,
  DivinationTopicOption,
} from '../types/divination';
import { buildDivinationCasting } from './divination-casting';
import { buildTopicReading } from './divination-content';

const HISTORY_STORAGE_KEY = 'fortune-hub:divination-history';
const PENDING_REQUEST_STORAGE_KEY = 'fortune-hub:divination-pending-request';
const REVIEW_STORAGE_KEY = 'fortune-hub:divination-reviews';
const DEFAULT_USER_ID = 'local-user';
const MAX_HISTORY_COUNT = 30;

export const DIVINATION_TOPICS: DivinationTopicOption[] = [
  { value: 'general', label: '综合', subtitle: '今日方向', icon: '✦' },
  { value: 'love', label: '感情', subtitle: '缘分关系', icon: '♡' },
  { value: 'career', label: '事业', subtitle: '职业学业', icon: '▣' },
  { value: 'wealth', label: '财运', subtitle: '收支节奏', icon: '◍' },
  { value: 'emotion', label: '情绪', subtitle: '身心安顿', icon: '☻' },
  { value: 'relationship', label: '人际', subtitle: '沟通边界', icon: '◎' },
  { value: 'growth', label: '成长', subtitle: '自我复盘', icon: '✶' },
];

const TOPIC_COPY: Record<
  DivinationTopic,
  {
    label: string;
    focus: string;
    action: string;
    avoid: string;
    advice: string[];
    suitable: string[];
    avoidList: string[];
  }
> = {
  general: {
    label: '综合占卜',
    focus: '整体节奏与当下选择',
    action: '把注意力放回最重要的一件事',
    avoid: '被临时情绪带着频繁改向',
    advice: ['先完成一件小而确定的事。', '把今天的计划拆成三步，先做第一步。', '晚上留一点时间复盘，不急着否定自己。'],
    suitable: ['沟通', '整理', '学习', '复盘'],
    avoidList: ['冲动决定', '熬夜', '争执'],
  },
  love: {
    label: '感情占卜',
    focus: '关系里的感受、回应与边界',
    action: '用真诚表达代替反复试探',
    avoid: '逼迫对方立刻给出答案',
    advice: ['重要沟通可以放慢语速，先说感受。', '把期待说清楚，也给彼此一点缓冲。', '不急着定义关系，先观察真实互动。'],
    suitable: ['表达', '倾听', '约见', '修复'],
    avoidList: ['试探', '冷处理', '翻旧账'],
  },
  career: {
    label: '事业占卜',
    focus: '工作推进、学业节奏与机会判断',
    action: '把成果整理出来，主动争取一次反馈',
    avoid: '同时开启太多未收口的计划',
    advice: ['今天适合梳理任务优先级。', '关键合作先确认边界和交付时间。', '重大变动建议结合现实信息再判断。'],
    suitable: ['计划', '汇报', '学习', '面谈'],
    avoidList: ['拖延', '过度承诺', '临时跳槽'],
  },
  wealth: {
    label: '财运占卜',
    focus: '收支节奏、资源配置与安全感',
    action: '先盘点已有资源，再决定下一步',
    avoid: '凭情绪做大额消费或投资决定',
    advice: ['今天适合整理账单和预算。', '把冲动消费放入 24 小时观察清单。', '投资相关事项仍建议以专业信息为准。'],
    suitable: ['记账', '预算', '储蓄', '比价'],
    avoidList: ['冲动消费', '借贷压力', '盲目投资'],
  },
  emotion: {
    label: '情绪疗愈',
    focus: '压力、敏感度与自我安抚',
    action: '先照顾身体感受，再处理复杂问题',
    avoid: '把一时低落解读成全部结论',
    advice: ['给自己十分钟安静呼吸。', '写下一个正在消耗你的念头。', '需要支持时，可以主动找可信任的人聊聊。'],
    suitable: ['休息', '书写', '散步', '冥想'],
    avoidList: ['压抑情绪', '过度内耗', '熬夜'],
  },
  relationship: {
    label: '人际占卜',
    focus: '社交回应、协作边界与信任建立',
    action: '先确认事实，再回应情绪',
    avoid: '替别人做过多猜测',
    advice: ['今天适合把需求讲得更具体。', '不必承担所有人的情绪。', '遇到误会时，先问清楚再判断。'],
    suitable: ['协商', '倾听', '澄清', '合作'],
    avoidList: ['揣测', '讨好', '急着解释'],
  },
  growth: {
    label: '成长占卜',
    focus: '自我复盘、长期方向与行动力',
    action: '用一个微小行动确认真正想要的方向',
    avoid: '用完美标准阻止自己开始',
    advice: ['今天适合复盘近期最有能量的一刻。', '挑一个可完成的小目标。', '把结果留给时间，把行动留给今天。'],
    suitable: ['复盘', '阅读', '练习', '计划'],
    avoidList: ['自责', '比较', '空想'],
  },
};

const LUCKY_COLORS = ['淡紫色', '月白色', '莲叶绿', '暖金色', '雾蓝色', '桃粉色'];
const LUCKY_DIRECTIONS = ['东南', '西南', '正东', '正北', '西北', '正南'];
const LUCKY_ELEMENTS = ['水', '木', '火', '土', '金'];

export function getTopicOption(topic: DivinationTopic) {
  return DIVINATION_TOPICS.find((item) => item.value === topic) || DIVINATION_TOPICS[0];
}

export function getTopicLabel(topic: DivinationTopic) {
  return TOPIC_COPY[topic]?.label || getTopicOption(topic).label;
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
    return raw && typeof raw === 'object' ? raw : {};
  } catch (error) {
    console.warn('read divination reviews failed', error);
    return {};
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
  patch: Partial<Pick<DivinationReview, 'favorite' | 'outcome' | 'note'>>,
) {
  const reviews = listDivinationReviews();
  const current = reviews[resultId] || createEmptyReview(resultId);
  const next: DivinationReview = {
    ...current,
    ...patch,
    note: typeof patch.note === 'string' ? patch.note.slice(0, 500) : current.note,
    updatedAt: Date.now(),
  };

  try {
    uni.setStorageSync(REVIEW_STORAGE_KEY, {
      ...reviews,
      [resultId]: next,
    });
  } catch (error) {
    console.warn('save divination review failed', error);
  }

  return next;
}

export function generateDivinationResult(request: DivinationRequest): DivinationResult {
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
  const topicCopy = TOPIC_COPY[request.topic] || TOPIC_COPY.general;
  const baseScore = clamp(66 + (seed % 23) + personalizedBonus(request), 56, 96);
  const emotionScore = clamp(baseScore - 8 + ((seed >> 3) % 14), 52, 95);
  const actionScore = clamp(baseScore - 3 + ((seed >> 5) % 16), 55, 98);
  const level = resolveScoreLevel(baseScore);
  const hexagram = {
    ...casting.hexagram,
    level,
  };
  const changed = casting.changedHexagram;
  const keywords = unique([...casting.keywords, topicCopy.focus.split('、')[0], topicCopy.action.slice(0, 2)])
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
  });
  const oracle = buildOracle({
    question: normalizedQuestion,
    focus: topicCopy.focus,
    action: topicCopy.action,
    methodLabel: casting.methodLabel,
    hexagram,
    changedHexagram: changed,
    movingLineLabel: casting.movingLineLabel,
    movingLineText: movingLineReading?.text,
    movingLineAdvice: movingLineReading?.advice,
  });

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
    review: getDivinationReview(`divination_${createdAt}_${seed.toString(16)}`),
    keywords,
    summary: `本卦为「${hexagram.name}」，动爻为「${casting.movingLineLabel}」。${hexagram.decision || `当前更适合${topicCopy.action}`}。`,
    analysis: `本次以${casting.methodLabel}起卦，得${hexagram.upperTrigram}上${hexagram.lowerTrigram}下，卦象呈现「${keywords.join('、')}」的气质。${hexagram.judgement || ''}动爻指出变化关键，变卦「${changed.name}」提示后续趋向。`,
    personalizedReason: buildPersonalizedReason(request, topicCopy.focus, casting.methodLabel),
    reminders: [
      '把占卜结果作为自我觉察和行动参考即可。',
      '涉及健康、投资、法律或重大人生决定时，仍建议结合现实信息判断。',
      `今天更适合${topicCopy.action}。`,
    ],
    advice: topicCopy.advice,
    suitable: topicCopy.suitable,
    avoid: topicCopy.avoidList,
    lucky: {
      color: LUCKY_COLORS[seed % LUCKY_COLORS.length],
      number: (seed % 9) + 1,
      direction: LUCKY_DIRECTIONS[(seed >> 2) % LUCKY_DIRECTIONS.length],
      element: LUCKY_ELEMENTS[(seed >> 4) % LUCKY_ELEMENTS.length],
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

function buildPersonalizedReason(request: DivinationRequest, focus: string, methodLabel = '略筮法') {
  const dimensions = [
    request.useBazi ? '八字五行' : '',
    request.useZodiac ? '星座周期' : '',
    request.useMood ? '近期心情' : '',
    request.usePersonality ? '性格倾向' : '',
  ].filter(Boolean);

  if (!dimensions.length) {
    return `这次主要根据你选择的「${focus}」主题，以${methodLabel}完成起卦，结果会更偏向当下可执行的提醒。`;
  }

  return `结合你的${dimensions.join('、')}，并以${methodLabel}定出本卦、动爻与变卦，本次占卜更偏向「${focus}」的当下指引。`;
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
}): DivinationResult['oracle'] {
  const subject = input.question || input.focus;
  const changed = input.changedHexagram;

  return {
    title: '高岛式断曰',
    subject,
    situation: `占得「${input.hexagram.name}」。${input.hexagram.judgement || input.hexagram.meaning}`,
    moving: `${input.movingLineLabel}为本次关键。${input.movingLineText || '动爻提示事情已有变化之机，宜看清眼前最容易失衡的位置。'}`,
    tendency: changed
      ? `变为「${changed.name}」。${changed.decision || changed.meaning}`
      : '本卦不变，宜守住当前判断，先把眼前一步做稳。',
    action: input.movingLineAdvice || input.hexagram.decision || `今天更适合${input.action}。`,
  };
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
      movingLineText: movingLineReading?.text,
      movingLineAdvice: movingLineReading?.advice,
    });

  return {
    ...input,
    hexagram,
    changedHexagram,
    casting,
    oracle,
    topicReading,
    review: input.review || getDivinationReview(input.id),
    changingLines: input.changingLines?.length ? input.changingLines : [movingLine],
  };
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}
