import type {
  DivinationHistoryTrendPoint,
  DivinationPersonalizationFlags,
  DivinationRequest,
  DivinationResult,
  DivinationTopic,
  DivinationTopicOption,
} from '../types/divination';

type HexagramSeed = {
  id: number;
  name: string;
  symbol: string;
  upperTrigram: string;
  lowerTrigram: string;
  meaning: string;
  level: DivinationResult['hexagram']['level'];
  keywords: string[];
  lines: boolean[];
};

const HISTORY_STORAGE_KEY = 'fortune-hub:divination-history';
const PENDING_REQUEST_STORAGE_KEY = 'fortune-hub:divination-pending-request';
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

const HEXAGRAMS: HexagramSeed[] = [
  {
    id: 1,
    name: '乾为天',
    symbol: '䷀',
    upperTrigram: '乾',
    lowerTrigram: '乾',
    meaning: '主动、开创与清明的行动力',
    level: '吉',
    keywords: ['开创', '自信', '节奏', '担当'],
    lines: [true, true, true, true, true, true],
  },
  {
    id: 2,
    name: '坤为地',
    symbol: '䷁',
    upperTrigram: '坤',
    lowerTrigram: '坤',
    meaning: '承载、照料与稳定的积累',
    level: '吉',
    keywords: ['接纳', '稳定', '滋养', '等待'],
    lines: [false, false, false, false, false, false],
  },
  {
    id: 11,
    name: '地天泰',
    symbol: '䷊',
    upperTrigram: '坤',
    lowerTrigram: '乾',
    meaning: '上下相通，适合修复关系与推进计划',
    level: '大吉',
    keywords: ['通达', '合作', '和缓', '生长'],
    lines: [true, true, true, false, false, false],
  },
  {
    id: 14,
    name: '火天大有',
    symbol: '䷍',
    upperTrigram: '离',
    lowerTrigram: '乾',
    meaning: '资源明亮，适合把优势整理出来',
    level: '吉',
    keywords: ['资源', '明朗', '自持', '丰盛'],
    lines: [true, true, true, true, false, true],
  },
  {
    id: 20,
    name: '风地观',
    symbol: '䷓',
    upperTrigram: '巽',
    lowerTrigram: '坤',
    meaning: '先观察再表达，从细节里看见方向',
    level: '中平',
    keywords: ['观察', '复盘', '洞察', '放慢'],
    lines: [false, false, false, false, true, true],
  },
  {
    id: 24,
    name: '地雷复',
    symbol: '䷗',
    upperTrigram: '坤',
    lowerTrigram: '震',
    meaning: '能量回升，适合从一件小事重新开始',
    level: '小吉',
    keywords: ['回归', '重启', '修复', '萌发'],
    lines: [true, false, false, false, false, false],
  },
  {
    id: 31,
    name: '泽山咸',
    symbol: '䷞',
    upperTrigram: '兑',
    lowerTrigram: '艮',
    meaning: '彼此感应，真诚沟通会打开局面',
    level: '吉',
    keywords: ['感应', '真诚', '克制', '顺势'],
    lines: [false, false, true, true, true, false],
  },
  {
    id: 32,
    name: '雷风恒',
    symbol: '䷟',
    upperTrigram: '震',
    lowerTrigram: '巽',
    meaning: '长期主义，适合稳定推进而不是频繁改向',
    level: '吉',
    keywords: ['恒心', '秩序', '耐心', '承诺'],
    lines: [false, true, true, true, false, false],
  },
  {
    id: 35,
    name: '火地晋',
    symbol: '䷢',
    upperTrigram: '离',
    lowerTrigram: '坤',
    meaning: '逐步上升，适合展示成果与争取机会',
    level: '吉',
    keywords: ['上升', '呈现', '机会', '清晰'],
    lines: [false, false, false, true, false, true],
  },
  {
    id: 41,
    name: '山泽损',
    symbol: '䷨',
    upperTrigram: '艮',
    lowerTrigram: '兑',
    meaning: '减法带来轻盈，适合减少消耗',
    level: '中平',
    keywords: ['减负', '边界', '收束', '照顾'],
    lines: [true, true, false, false, false, true],
  },
  {
    id: 42,
    name: '风雷益',
    symbol: '䷩',
    upperTrigram: '巽',
    lowerTrigram: '震',
    meaning: '外部助力渐起，主动学习会带来增益',
    level: '吉',
    keywords: ['增益', '学习', '支持', '行动'],
    lines: [true, false, false, false, true, true],
  },
  {
    id: 52,
    name: '艮为山',
    symbol: '䷳',
    upperTrigram: '艮',
    lowerTrigram: '艮',
    meaning: '适合止息与整理，不必急着给出答案',
    level: '中平',
    keywords: ['止息', '沉静', '边界', '观察'],
    lines: [false, false, true, false, false, true],
  },
  {
    id: 58,
    name: '兑为泽',
    symbol: '䷹',
    upperTrigram: '兑',
    lowerTrigram: '兑',
    meaning: '交流与喜悦正在靠近，适合轻松表达',
    level: '小吉',
    keywords: ['表达', '愉悦', '回应', '松弛'],
    lines: [true, true, false, true, true, false],
  },
  {
    id: 62,
    name: '雷山小过',
    symbol: '䷽',
    upperTrigram: '震',
    lowerTrigram: '艮',
    meaning: '小步试探比一次到位更稳妥',
    level: '中平',
    keywords: ['小步', '谨慎', '校准', '留白'],
    lines: [false, false, true, true, false, false],
  },
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

export function createTodayDivinationRequest(topic: DivinationTopic = 'general'): DivinationRequest {
  return {
    userId: DEFAULT_USER_ID,
    topic,
    timestamp: Date.now(),
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

export function generateDivinationResult(request: DivinationRequest): DivinationResult {
  const normalizedQuestion = (request.question || '').trim();
  const salt = [
    request.userId || DEFAULT_USER_ID,
    request.topic,
    normalizedQuestion,
    toDateKey(request.timestamp),
    request.useBazi ? 'bazi' : '',
    request.useZodiac ? 'zodiac' : '',
    request.useMood ? 'mood' : '',
    request.usePersonality ? 'personality' : '',
  ].join('|');
  const seed = hashString(salt);
  const hexagram = HEXAGRAMS[seed % HEXAGRAMS.length];
  const changed = HEXAGRAMS[(seed + 5 + request.topic.length) % HEXAGRAMS.length];
  const topicCopy = TOPIC_COPY[request.topic] || TOPIC_COPY.general;
  const baseScore = clamp(70 + (seed % 19) + personalizedBonus(request), 58, 96);
  const emotionScore = clamp(baseScore - 8 + ((seed >> 3) % 14), 52, 95);
  const actionScore = clamp(baseScore - 3 + ((seed >> 5) % 16), 55, 98);
  const changingLines = resolveChangingLines(seed);
  const keywords = unique([...hexagram.keywords, topicCopy.focus.split('、')[0], topicCopy.action.slice(0, 2)])
    .filter(Boolean)
    .slice(0, 4);
  const createdAt = request.timestamp || Date.now();

  return {
    id: `divination_${createdAt}_${seed.toString(16)}`,
    userId: request.userId || DEFAULT_USER_ID,
    topic: request.topic,
    topicLabel: topicCopy.label,
    question: normalizedQuestion || undefined,
    hexagram: {
      id: hexagram.id,
      name: hexagram.name,
      symbol: hexagram.symbol,
      upperTrigram: hexagram.upperTrigram,
      lowerTrigram: hexagram.lowerTrigram,
      meaning: hexagram.meaning,
      level: hexagram.level,
      lines: hexagram.lines,
    },
    changingLines,
    changedHexagram:
      changed.id === hexagram.id
        ? undefined
        : {
            id: changed.id,
            name: changed.name,
            meaning: changed.meaning,
          },
    scores: {
      overall: baseScore,
      emotion: emotionScore,
      action: actionScore,
    },
    keywords,
    summary: `本卦为「${hexagram.name}」，象征${hexagram.meaning}。当前更适合${topicCopy.action}，不宜${topicCopy.avoid}。`,
    analysis: `本次卦象呈现出「${keywords.join('、')}」的气质。结合你选择的${topicCopy.focus}主题，眼前的重点不是替未来下定论，而是看清当下最值得照顾的部分。若事情还没有完全明朗，可以先做一个低风险的小行动，让真实反馈慢慢浮现。`,
    personalizedReason: buildPersonalizedReason(request, topicCopy.focus),
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
  const nextHistory = [result, ...listDivinationHistory().filter((item) => item.id !== result.id)].slice(
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
    return Array.isArray(raw) ? raw : [];
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

function buildPersonalizedReason(request: DivinationRequest, focus: string) {
  const dimensions = [
    request.useBazi ? '八字五行' : '',
    request.useZodiac ? '星座周期' : '',
    request.useMood ? '近期心情' : '',
    request.usePersonality ? '性格倾向' : '',
  ].filter(Boolean);

  if (!dimensions.length) {
    return `这次主要根据你选择的「${focus}」主题与当前时间起卦生成，结果会更偏向当下可执行的提醒。`;
  }

  return `结合你的${dimensions.join('、')}，本次占卜更偏向「${focus}」的当下指引。完善更多资料后，结果会更贴近你的真实状态。`;
}

function personalizedBonus(request: DivinationRequest) {
  return [request.useBazi, request.useZodiac, request.useMood, request.usePersonality].filter(Boolean).length;
}

function resolveChangingLines(seed: number) {
  const first = (seed % 6) + 1;
  const second = ((seed >> 4) % 6) + 1;
  return unique([first, second]).sort((a, b) => a - b);
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function hashString(input: string) {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }

  return Math.abs(hash >>> 0);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}
