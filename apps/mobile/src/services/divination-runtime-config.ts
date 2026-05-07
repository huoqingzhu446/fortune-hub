import type {
  DivinationFlow,
  DivinationInterpretationTone,
  DivinationMethod,
  DivinationPersonalizationFlags,
  DivinationPersonalizationKey,
  DivinationReview,
  DivinationTopic,
  DivinationTopicOption,
} from '../types/divination';

export type DivinationHistoryTabValue = 'all' | DivinationTopic;
export type DivinationReviewScopeValue = 'all' | 'favorite' | DivinationReview['outcome'];

export interface DivinationTopicStrategy {
  label: string;
  focus: string;
  action: string;
  avoid: string;
  advice: string[];
  suitable: string[];
  avoidList: string[];
}

export interface DivinationLuckyConfig {
  colors: string[];
  numbers: number[];
  directions: string[];
  elements: string[];
}

export interface DivinationToneCopy {
  toneLabel: string;
  toneSummary: string;
  opportunityHint: string;
  riskHint: string;
  actionHint: string;
}

export interface DivinationProfileMappingConfig {
  toneCopy: Record<DivinationInterpretationTone, DivinationToneCopy>;
  dimensionLabels: Record<DivinationPersonalizationKey, string>;
  moodLabels: Record<string, string>;
  moodToneScores: Record<string, Partial<Record<DivinationInterpretationTone, number>>>;
  elementTone: Record<string, DivinationInterpretationTone>;
  elementLabels: Record<string, string>;
  elementHints: Record<string, string>;
  personalityToneRules: Array<{
    tone: DivinationInterpretationTone;
    pattern: string;
    weight: number;
  }>;
  scoreRules: {
    defaultTone: DivinationInterpretationTone;
    baseToneScores: Record<DivinationInterpretationTone, number>;
    zodiacMoveAt: number;
    zodiacSoftenAt: number;
    emotionalMoveAt: number;
    emotionalSoftenBelow: number;
    toneAction: Record<DivinationInterpretationTone, number>;
    toneOverall: Record<DivinationInterpretationTone, number>;
    zodiacScoreBase: number;
    zodiacScoreStep: number;
    moodScoreBase: number;
    moodScoreStep: number;
    activeCountMax: number;
  };
}

export interface DivinationDimensionOption {
  flagKey: keyof DivinationPersonalizationFlags;
  personalizationKey: DivinationPersonalizationKey;
  title: string;
  desc: string;
  icon: string;
}

export interface DivinationHistoryTab {
  value: DivinationHistoryTabValue;
  label: string;
}

export interface DivinationReviewScopeTab {
  value: DivinationReviewScopeValue;
  label: string;
}

export interface DivinationHomeFeatureEntry {
  key: string;
  title: string;
  desc: string;
  icon: string;
  action: 'topic' | 'history';
  topic?: DivinationTopic;
}

export interface DivinationMethodOption {
  value: DivinationMethod;
  title: string;
  desc: string;
}

export interface DivinationFlowOption {
  value: DivinationFlow;
  label: string;
}

export interface DivinationPageTabConfig {
  selectTopics: DivinationTopic[];
  dimensionOptions: DivinationDimensionOption[];
  historyTabs: DivinationHistoryTab[];
  reviewScopes: DivinationReviewScopeTab[];
  reviewTopics: DivinationHistoryTab[];
  homeFeatures: DivinationHomeFeatureEntry[];
  castingMethods: DivinationMethodOption[];
  castingFlows: DivinationFlowOption[];
}

export interface DivinationRuntimeConfig {
  topicOptions: DivinationTopicOption[];
  topicStrategies: Record<DivinationTopic, DivinationTopicStrategy>;
  luckyItems: DivinationLuckyConfig;
  profileMapping: DivinationProfileMappingConfig;
  pageTabs: DivinationPageTabConfig;
}

export const DIVINATION_TOPIC_VALUES: DivinationTopic[] = [
  'general',
  'love',
  'career',
  'wealth',
  'emotion',
  'relationship',
  'growth',
];

const TONE_VALUES: DivinationInterpretationTone[] = ['move', 'clarify', 'soften'];
const METHOD_VALUES: DivinationMethod[] = ['split-stalk', 'draw-lots'];
const FLOW_VALUES: DivinationFlow[] = ['yang', 'yin'];
const REVIEW_SCOPE_VALUES: DivinationReviewScopeValue[] = [
  'all',
  'favorite',
  'fulfilled',
  'unfulfilled',
  'pending',
];

export const DEFAULT_DIVINATION_RUNTIME_CONFIG: DivinationRuntimeConfig = {
  topicOptions: [
    { value: 'general', label: '综合', subtitle: '今日方向', icon: '✦' },
    { value: 'love', label: '感情', subtitle: '缘分关系', icon: '♡' },
    { value: 'career', label: '事业', subtitle: '职业学业', icon: '▣' },
    { value: 'wealth', label: '财运', subtitle: '收支节奏', icon: '◍' },
    { value: 'emotion', label: '情绪', subtitle: '身心安顿', icon: '☻' },
    { value: 'relationship', label: '人际', subtitle: '沟通边界', icon: '◎' },
    { value: 'growth', label: '成长', subtitle: '自我复盘', icon: '✶' },
  ],
  topicStrategies: {
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
  },
  luckyItems: {
    colors: ['淡紫色', '月白色', '莲叶绿', '暖金色', '雾蓝色', '桃粉色'],
    numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    directions: ['东南', '西南', '正东', '正北', '西北', '正南'],
    elements: ['水', '木', '火', '土', '金'],
  },
  profileMapping: {
    toneCopy: {
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
    },
    dimensionLabels: {
      bazi: '八字',
      zodiac: '星座',
      mood: '心情',
      personality: '性格',
    },
    moodLabels: {
      calm: '平和',
      low: '低落',
      anxious: '焦虑',
      happy: '明亮',
      tired: '疲惫',
    },
    moodToneScores: {
      happy: { move: 2 },
      calm: { clarify: 2 },
      anxious: { clarify: 1, soften: 2 },
      low: { soften: 2 },
      tired: { soften: 2 },
    },
    elementTone: {
      木: 'move',
      火: 'move',
      金: 'clarify',
      土: 'soften',
      水: 'soften',
    },
    elementLabels: {
      wood: '木',
      fire: '火',
      earth: '土',
      metal: '金',
      water: '水',
    },
    elementHints: {
      木: '生长和启动',
      火: '表达和呈现',
      土: '承载和稳定',
      金: '边界和决断',
      水: '流动和蓄养',
    },
    personalityToneRules: [
      { tone: 'move', pattern: '行动|外向|果断|开拓|表达|主动', weight: 2 },
      { tone: 'clarify', pattern: '理性|分析|逻辑|观察|规划|谨慎|秩序|边界', weight: 2 },
      { tone: 'soften', pattern: '敏感|共情|内向|细腻|焦虑|温和|疗愈|感受', weight: 2 },
    ],
    scoreRules: {
      defaultTone: 'clarify',
      baseToneScores: {
        move: 0,
        clarify: 1,
        soften: 0,
      },
      zodiacMoveAt: 82,
      zodiacSoftenAt: 68,
      emotionalMoveAt: 80,
      emotionalSoftenBelow: 62,
      toneAction: {
        move: 3,
        clarify: 1,
        soften: -2,
      },
      toneOverall: {
        move: 2,
        clarify: 0,
        soften: -1,
      },
      zodiacScoreBase: 76,
      zodiacScoreStep: 10,
      moodScoreBase: 70,
      moodScoreStep: 8,
      activeCountMax: 3,
    },
  },
  pageTabs: {
    selectTopics: ['general', 'love', 'career', 'wealth', 'emotion'],
    dimensionOptions: [
      {
        flagKey: 'useBazi',
        personalizationKey: 'bazi',
        title: '八字',
        desc: '出生资料只作断语旁参',
        icon: '♎',
      },
      {
        flagKey: 'useZodiac',
        personalizationKey: 'zodiac',
        title: '星座',
        desc: '补充生日后可识别星座节奏',
        icon: '✶',
      },
      {
        flagKey: 'useMood',
        personalizationKey: 'mood',
        title: '心情',
        desc: '最近记录会校准断语轻重',
        icon: '☁',
      },
      {
        flagKey: 'usePersonality',
        personalizationKey: 'personality',
        title: '性格',
        desc: '最近测评结果会进入旁参判断',
        icon: '☯',
      },
    ],
    historyTabs: [
      { value: 'all', label: '全部' },
      { value: 'love', label: '感情' },
      { value: 'career', label: '事业' },
      { value: 'emotion', label: '情绪' },
      { value: 'wealth', label: '财运' },
    ],
    reviewScopes: [
      { value: 'all', label: '全部' },
      { value: 'favorite', label: '收藏' },
      { value: 'fulfilled', label: '已应验' },
      { value: 'unfulfilled', label: '未应验' },
      { value: 'pending', label: '待复盘' },
    ],
    reviewTopics: [
      { value: 'all', label: '全部' },
      { value: 'general', label: '综合' },
      { value: 'love', label: '感情' },
      { value: 'career', label: '事业' },
      { value: 'wealth', label: '财运' },
      { value: 'emotion', label: '情绪' },
      { value: 'relationship', label: '人际' },
      { value: 'growth', label: '成长' },
    ],
    homeFeatures: [
      { key: 'general', action: 'topic', topic: 'general', title: '今日运势', desc: '每日趋势指引', icon: '✦' },
      { key: 'love', action: 'topic', topic: 'love', title: '感情占卜', desc: '缘分与关系', icon: '♡' },
      { key: 'career', action: 'topic', topic: 'career', title: '事业占卜', desc: '职业与发展', icon: '▣' },
      { key: 'wealth', action: 'topic', topic: 'wealth', title: '财运占卜', desc: '收支与资源', icon: '◍' },
      { key: 'emotion', action: 'topic', topic: 'emotion', title: '情绪疗愈', desc: '身心成长指南', icon: '✺' },
      { key: 'history', action: 'history', title: '历史记录', desc: '复盘近期趋势', icon: '☷' },
    ],
    castingMethods: [
      { value: 'split-stalk', title: '分策法', desc: '三次分策，取余定上下卦与动爻' },
      { value: 'draw-lots', title: '抽签法', desc: '三次抽签，快速定卦与动爻' },
    ],
    castingFlows: [
      { value: 'yang', label: '阳式 左右左' },
      { value: 'yin', label: '阴式 右左右' },
    ],
  },
};

export function normalizeDivinationRuntimeConfig(
  input?: Partial<DivinationRuntimeConfig> | null,
): DivinationRuntimeConfig {
  return {
    topicOptions: normalizeTopicOptions(input?.topicOptions),
    topicStrategies: normalizeTopicStrategies(input?.topicStrategies),
    luckyItems: normalizeLuckyConfig(input?.luckyItems),
    profileMapping: normalizeProfileMapping(input?.profileMapping),
    pageTabs: normalizePageTabs(input?.pageTabs),
  };
}

export function isDivinationTopic(value: unknown): value is DivinationTopic {
  return typeof value === 'string' && DIVINATION_TOPIC_VALUES.includes(value as DivinationTopic);
}

function normalizeTopicOptions(input?: DivinationTopicOption[]) {
  const source = Array.isArray(input) ? input : [];
  return DEFAULT_DIVINATION_RUNTIME_CONFIG.topicOptions.map((fallback) => {
    const item = source.find((entry) => entry?.value === fallback.value);
    return {
      value: fallback.value,
      label: pickString(item?.label, fallback.label),
      subtitle: pickString(item?.subtitle, fallback.subtitle),
      icon: pickString(item?.icon, fallback.icon),
    };
  });
}

function normalizeTopicStrategies(input?: Partial<Record<DivinationTopic, Partial<DivinationTopicStrategy>>>) {
  return DIVINATION_TOPIC_VALUES.reduce<Record<DivinationTopic, DivinationTopicStrategy>>((result, topic) => {
    const fallback = DEFAULT_DIVINATION_RUNTIME_CONFIG.topicStrategies[topic];
    const source = input?.[topic];
    result[topic] = {
      label: pickString(source?.label, fallback.label),
      focus: pickString(source?.focus, fallback.focus),
      action: pickString(source?.action, fallback.action),
      avoid: pickString(source?.avoid, fallback.avoid),
      advice: pickStringArray(source?.advice, fallback.advice),
      suitable: pickStringArray(source?.suitable, fallback.suitable),
      avoidList: pickStringArray(source?.avoidList, fallback.avoidList),
    };
    return result;
  }, {} as Record<DivinationTopic, DivinationTopicStrategy>);
}

function normalizeLuckyConfig(input?: Partial<DivinationLuckyConfig>) {
  const fallback = DEFAULT_DIVINATION_RUNTIME_CONFIG.luckyItems;
  return {
    colors: pickStringArray(input?.colors, fallback.colors),
    numbers: pickNumberArray(input?.numbers, fallback.numbers),
    directions: pickStringArray(input?.directions, fallback.directions),
    elements: pickStringArray(input?.elements, fallback.elements),
  };
}

function normalizeProfileMapping(input?: Partial<DivinationProfileMappingConfig>) {
  const fallback = DEFAULT_DIVINATION_RUNTIME_CONFIG.profileMapping;
  const scoreSource = input?.scoreRules as Partial<DivinationProfileMappingConfig['scoreRules']> | undefined;
  const defaultTone = scoreSource?.defaultTone;

  return {
    toneCopy: TONE_VALUES.reduce<Record<DivinationInterpretationTone, DivinationToneCopy>>((result, tone) => {
      const source = input?.toneCopy?.[tone];
      const fallbackCopy = fallback.toneCopy[tone];
      result[tone] = {
        toneLabel: pickString(source?.toneLabel, fallbackCopy.toneLabel),
        toneSummary: pickString(source?.toneSummary, fallbackCopy.toneSummary),
        opportunityHint: pickString(source?.opportunityHint, fallbackCopy.opportunityHint),
        riskHint: pickString(source?.riskHint, fallbackCopy.riskHint),
        actionHint: pickString(source?.actionHint, fallbackCopy.actionHint),
      };
      return result;
    }, {} as Record<DivinationInterpretationTone, DivinationToneCopy>),
    dimensionLabels: mergeStringRecord(fallback.dimensionLabels, input?.dimensionLabels),
    moodLabels: mergeStringRecord(fallback.moodLabels, input?.moodLabels),
    moodToneScores: mergeToneScoreRecord(fallback.moodToneScores, input?.moodToneScores),
    elementTone: mergeToneRecord(fallback.elementTone, input?.elementTone),
    elementLabels: mergeStringRecord(fallback.elementLabels, input?.elementLabels),
    elementHints: mergeStringRecord(fallback.elementHints, input?.elementHints),
    personalityToneRules: normalizePersonalityToneRules(input?.personalityToneRules),
    scoreRules: {
      defaultTone: isTone(defaultTone) ? defaultTone : fallback.scoreRules.defaultTone,
      baseToneScores: mergeNumberToneRecord(fallback.scoreRules.baseToneScores, scoreSource?.baseToneScores),
      zodiacMoveAt: pickNumber(scoreSource?.zodiacMoveAt, fallback.scoreRules.zodiacMoveAt),
      zodiacSoftenAt: pickNumber(scoreSource?.zodiacSoftenAt, fallback.scoreRules.zodiacSoftenAt),
      emotionalMoveAt: pickNumber(scoreSource?.emotionalMoveAt, fallback.scoreRules.emotionalMoveAt),
      emotionalSoftenBelow: pickNumber(scoreSource?.emotionalSoftenBelow, fallback.scoreRules.emotionalSoftenBelow),
      toneAction: mergeNumberToneRecord(fallback.scoreRules.toneAction, scoreSource?.toneAction),
      toneOverall: mergeNumberToneRecord(fallback.scoreRules.toneOverall, scoreSource?.toneOverall),
      zodiacScoreBase: pickNumber(scoreSource?.zodiacScoreBase, fallback.scoreRules.zodiacScoreBase),
      zodiacScoreStep: Math.max(1, pickNumber(scoreSource?.zodiacScoreStep, fallback.scoreRules.zodiacScoreStep)),
      moodScoreBase: pickNumber(scoreSource?.moodScoreBase, fallback.scoreRules.moodScoreBase),
      moodScoreStep: Math.max(1, pickNumber(scoreSource?.moodScoreStep, fallback.scoreRules.moodScoreStep)),
      activeCountMax: Math.max(1, pickNumber(scoreSource?.activeCountMax, fallback.scoreRules.activeCountMax)),
    },
  };
}

function normalizePageTabs(input?: Partial<DivinationPageTabConfig>) {
  const fallback = DEFAULT_DIVINATION_RUNTIME_CONFIG.pageTabs;
  return {
    selectTopics: pickTopicArray(input?.selectTopics, fallback.selectTopics),
    dimensionOptions: normalizeDimensionOptions(input?.dimensionOptions),
    historyTabs: normalizeHistoryTabs(input?.historyTabs, fallback.historyTabs),
    reviewScopes: normalizeReviewScopeTabs(input?.reviewScopes, fallback.reviewScopes),
    reviewTopics: normalizeHistoryTabs(input?.reviewTopics, fallback.reviewTopics),
    homeFeatures: normalizeHomeFeatures(input?.homeFeatures, fallback.homeFeatures),
    castingMethods: normalizeMethodOptions(input?.castingMethods, fallback.castingMethods),
    castingFlows: normalizeFlowOptions(input?.castingFlows, fallback.castingFlows),
  };
}

function normalizeDimensionOptions(input?: DivinationDimensionOption[]) {
  const source = Array.isArray(input) ? input : [];
  const fallback = DEFAULT_DIVINATION_RUNTIME_CONFIG.pageTabs.dimensionOptions;
  const flags: Array<keyof DivinationPersonalizationFlags> = [
    'useBazi',
    'useZodiac',
    'useMood',
    'usePersonality',
  ];

  return fallback.map((fallbackItem) => {
    const item = source.find(
      (entry) => entry?.flagKey === fallbackItem.flagKey && entry?.personalizationKey === fallbackItem.personalizationKey,
    );
    return {
      flagKey: flags.includes(item?.flagKey as keyof DivinationPersonalizationFlags) ? item!.flagKey : fallbackItem.flagKey,
      personalizationKey: isPersonalizationKey(item?.personalizationKey) ? item!.personalizationKey : fallbackItem.personalizationKey,
      title: pickString(item?.title, fallbackItem.title),
      desc: pickString(item?.desc, fallbackItem.desc),
      icon: pickString(item?.icon, fallbackItem.icon),
    };
  });
}

function normalizeHistoryTabs(input: DivinationHistoryTab[] | undefined, fallback: DivinationHistoryTab[]) {
  const source = Array.isArray(input) ? input : [];
  const normalized = source
    .filter((item) => item && (item.value === 'all' || isDivinationTopic(item.value)))
    .map((item) => ({
      value: item.value,
      label: pickString(item.label, item.value === 'all' ? '全部' : topicOptionLabel(item.value)),
    }));

  return normalized.length ? normalized : fallback;
}

function normalizeReviewScopeTabs(input: DivinationReviewScopeTab[] | undefined, fallback: DivinationReviewScopeTab[]) {
  const source = Array.isArray(input) ? input : [];
  const normalized = source
    .filter((item) => item && REVIEW_SCOPE_VALUES.includes(item.value))
    .map((item) => ({
      value: item.value,
      label: pickString(item.label, fallback.find((fallbackItem) => fallbackItem.value === item.value)?.label || '全部'),
    }));

  return normalized.length ? normalized : fallback;
}

function normalizeHomeFeatures(input: DivinationHomeFeatureEntry[] | undefined, fallback: DivinationHomeFeatureEntry[]) {
  const source = Array.isArray(input) ? input : [];
  const normalized = source
    .filter((item) => item && (item.action === 'history' || (item.action === 'topic' && isDivinationTopic(item.topic))))
    .map((item, index) => {
      const topic = item.action === 'topic' && isDivinationTopic(item.topic) ? item.topic : undefined;
      const fallbackItem = fallback[index] || fallback[0];
      return {
        key: pickString(item.key, topic || fallbackItem.key),
        action: item.action,
        topic,
        title: pickString(item.title, topic ? topicOptionLabel(topic) : fallbackItem.title),
        desc: pickString(item.desc, fallbackItem.desc),
        icon: pickString(item.icon, topic ? topicOptionIcon(topic) : fallbackItem.icon),
      };
    });

  return normalized.length ? normalized : fallback;
}

function normalizeMethodOptions(input: DivinationMethodOption[] | undefined, fallback: DivinationMethodOption[]) {
  const source = Array.isArray(input) ? input : [];
  const normalized = source
    .filter((item) => item && METHOD_VALUES.includes(item.value))
    .map((item) => {
      const fallbackItem = fallback.find((entry) => entry.value === item.value) || fallback[0];
      return {
        value: item.value,
        title: pickString(item.title, fallbackItem.title),
        desc: pickString(item.desc, fallbackItem.desc),
      };
    });

  return normalized.length ? normalized : fallback;
}

function normalizeFlowOptions(input: DivinationFlowOption[] | undefined, fallback: DivinationFlowOption[]) {
  const source = Array.isArray(input) ? input : [];
  const normalized = source
    .filter((item) => item && FLOW_VALUES.includes(item.value))
    .map((item) => {
      const fallbackItem = fallback.find((entry) => entry.value === item.value) || fallback[0];
      return {
        value: item.value,
        label: pickString(item.label, fallbackItem.label),
      };
    });

  return normalized.length ? normalized : fallback;
}

function normalizePersonalityToneRules(input?: DivinationProfileMappingConfig['personalityToneRules']) {
  const source = Array.isArray(input) ? input : [];
  const normalized = source
    .filter((item) => item && isTone(item.tone) && item.pattern.trim())
    .map((item) => ({
      tone: item.tone,
      pattern: item.pattern.trim(),
      weight: pickNumber(item.weight, 1),
    }));

  return normalized.length ? normalized : DEFAULT_DIVINATION_RUNTIME_CONFIG.profileMapping.personalityToneRules;
}

function pickTopicArray(input: unknown, fallback: DivinationTopic[]) {
  const source = Array.isArray(input) ? input.filter(isDivinationTopic) : [];
  return source.length ? source : fallback;
}

function pickString(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function pickStringArray(value: unknown, fallback: string[]) {
  const source = Array.isArray(value)
    ? value.map((item) => (typeof item === 'string' ? item.trim() : '')).filter(Boolean)
    : [];
  return source.length ? source : fallback;
}

function pickNumberArray(value: unknown, fallback: number[]) {
  const source = Array.isArray(value)
    ? value.filter((item): item is number => typeof item === 'number' && Number.isFinite(item))
    : [];
  return source.length ? source : fallback;
}

function pickNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function mergeStringRecord<T extends string>(fallback: Record<T, string>, source?: Partial<Record<T, string>>) {
  const result = Object.entries(fallback).reduce<Record<T, string>>((next, [key, fallbackValue]) => {
    next[key as T] = pickString(source?.[key as T], fallbackValue as string);
    return next;
  }, {} as Record<T, string>);

  Object.entries(source || {}).forEach(([key, value]) => {
    if (typeof value === 'string' && value.trim()) {
      result[key as T] = value.trim();
    }
  });

  return result;
}

function mergeToneRecord<T extends string>(
  fallback: Record<T, DivinationInterpretationTone>,
  source?: Partial<Record<T, DivinationInterpretationTone>>,
) {
  const result = Object.entries(fallback).reduce<Record<T, DivinationInterpretationTone>>((next, [key, fallbackValue]) => {
    const value = source?.[key as T];
    next[key as T] = isTone(value) ? value : fallbackValue as DivinationInterpretationTone;
    return next;
  }, {} as Record<T, DivinationInterpretationTone>);

  Object.entries(source || {}).forEach(([key, value]) => {
    if (isTone(value)) {
      result[key as T] = value;
    }
  });

  return result;
}

function mergeNumberToneRecord(
  fallback: Record<DivinationInterpretationTone, number>,
  source?: Partial<Record<DivinationInterpretationTone, number>>,
) {
  return TONE_VALUES.reduce<Record<DivinationInterpretationTone, number>>((result, tone) => {
    result[tone] = pickNumber(source?.[tone], fallback[tone]);
    return result;
  }, {} as Record<DivinationInterpretationTone, number>);
}

function mergeToneScoreRecord(
  fallback: DivinationProfileMappingConfig['moodToneScores'],
  source?: DivinationProfileMappingConfig['moodToneScores'],
) {
  const next = { ...fallback };
  Object.entries(source || {}).forEach(([key, value]) => {
    next[key] = TONE_VALUES.reduce<Partial<Record<DivinationInterpretationTone, number>>>((result, tone) => {
      const score = value?.[tone];
      if (typeof score === 'number' && Number.isFinite(score)) {
        result[tone] = score;
      }
      return result;
    }, {});
  });
  return next;
}

function isTone(value: unknown): value is DivinationInterpretationTone {
  return typeof value === 'string' && TONE_VALUES.includes(value as DivinationInterpretationTone);
}

function isPersonalizationKey(value: unknown): value is DivinationPersonalizationKey {
  return value === 'bazi' || value === 'zodiac' || value === 'mood' || value === 'personality';
}

function topicOptionLabel(topic: DivinationTopic) {
  return DEFAULT_DIVINATION_RUNTIME_CONFIG.topicOptions.find((item) => item.value === topic)?.label || topic;
}

function topicOptionIcon(topic: DivinationTopic) {
  return DEFAULT_DIVINATION_RUNTIME_CONFIG.topicOptions.find((item) => item.value === topic)?.icon || '✦';
}
