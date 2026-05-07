export type DivinationTopic =
  | 'general'
  | 'love'
  | 'career'
  | 'wealth'
  | 'emotion'
  | 'relationship'
  | 'growth';

export interface DivinationLinePositionContent {
  theme: string;
  focus: string;
  action: string;
  risk: string;
}

export interface DivinationTopicCopy {
  title: string;
  lens: string;
  opportunity: string;
  risk: string;
  actionPrefix: string;
}

export interface DivinationTopicOption {
  value: DivinationTopic;
  label: string;
  subtitle: string;
  icon: string;
}

export interface DivinationTopicStrategy {
  label: string;
  focus: string;
  action: string;
  avoid: string;
  advice: string[];
  suitable: string[];
  avoidList: string[];
}

export interface DivinationContentCatalog {
  linePositionContent: DivinationLinePositionContent[];
  topicCopy: Record<DivinationTopic, DivinationTopicCopy>;
  topicOptions: DivinationTopicOption[];
  topicStrategies: Record<DivinationTopic, DivinationTopicStrategy>;
  luckyItems: Record<string, unknown>;
  profileMapping: Record<string, unknown>;
  pageTabs: Record<string, unknown>;
}

export const DIVINATION_CONTENT_TYPE = 'divination_copy';

export const DIVINATION_DEFAULT_CONTENT_CATALOG: DivinationContentCatalog = {
  linePositionContent: [
    {
      theme: '初始',
      focus: '事机初动，尚在萌芽',
      action: '先定心，不急着求大结果，从一个低风险动作开始。',
      risk: '忌一开始就押上全部筹码。',
    },
    {
      theme: '显露',
      focus: '线索渐明，适合求证',
      action: '宜把想法说清楚，争取一次稳定反馈。',
      risk: '忌独自揣测，把未验证的信息当结论。',
    },
    {
      theme: '转折',
      focus: '内外相接，易有失衡',
      action: '先校准边界，别让情绪或外界催促替你做决定。',
      risk: '忌逞强推进，三爻多有进退两难之象。',
    },
    {
      theme: '近应',
      focus: '局势牵动他人或环境',
      action: '宜观察回应，再决定是否推进到下一步。',
      risk: '忌只看自己的意愿，忽略对方或环境的承接能力。',
    },
    {
      theme: '主位',
      focus: '本卦主旨最明显',
      action: '抓住核心，不被枝节分散。',
      risk: '忌站到主位后反而失去谦和与弹性。',
    },
    {
      theme: '极处',
      focus: '一卦之势走到边界',
      action: '该收束的收束，该转向的转向，避免把好势用过头。',
      risk: '忌贪恋既有路径，过极则反。',
    },
  ],
  topicCopy: {
    general: {
      title: '综合问事',
      lens: '看整体节奏、当下阻力与最稳的一步。',
      opportunity: '若能顺着卦象提示调整节奏，事情会更容易回到可控范围。',
      risk: '风险在于把一时感受放大成全部判断。',
      actionPrefix: '今天先做一件能让局势变清楚的小事：',
    },
    love: {
      title: '感情关系',
      lens: '看感受回应、关系位置与沟通边界。',
      opportunity: '机会在于真诚表达，而不是反复试探对方态度。',
      risk: '风险在于情绪上头、急着确认关系或旧事重提。',
      actionPrefix: '感情上更适合：',
    },
    career: {
      title: '事业学业',
      lens: '看推进时机、合作结构与成果呈现。',
      opportunity: '机会在于把已有能力整理出来，争取清晰反馈。',
      risk: '风险在于任务过载、承诺过多或规则未明就急进。',
      actionPrefix: '工作学业上更适合：',
    },
    wealth: {
      title: '财运资源',
      lens: '看收支节奏、资源分配与风险承受力。',
      opportunity: '机会在于先盘点已有资源，再决定是否加码。',
      risk: '风险在于凭情绪消费、借贷或做大额投资判断。',
      actionPrefix: '财务上更适合：',
    },
    emotion: {
      title: '情绪安顿',
      lens: '看压力来源、身体感受与自我照料方式。',
      opportunity: '机会在于把注意力从结论拉回身体和当下。',
      risk: '风险在于把短暂低落解释成长期失败。',
      actionPrefix: '情绪上更适合：',
    },
    relationship: {
      title: '人际协作',
      lens: '看信任、边界、回应方式与协作节奏。',
      opportunity: '机会在于先确认事实，再回应情绪。',
      risk: '风险在于替别人猜太多，或为了和气牺牲边界。',
      actionPrefix: '人际上更适合：',
    },
    growth: {
      title: '自我成长',
      lens: '看长期方向、复盘重点与下一步练习。',
      opportunity: '机会在于用一个微小行动验证真正想要的方向。',
      risk: '风险在于用完美标准阻止自己开始。',
      actionPrefix: '成长上更适合：',
    },
  },
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
      { flagKey: 'useBazi', personalizationKey: 'bazi', title: '八字', desc: '出生资料只作断语旁参', icon: '♎' },
      { flagKey: 'useZodiac', personalizationKey: 'zodiac', title: '星座', desc: '补充生日后可识别星座节奏', icon: '✶' },
      { flagKey: 'useMood', personalizationKey: 'mood', title: '心情', desc: '最近记录会校准断语轻重', icon: '☁' },
      { flagKey: 'usePersonality', personalizationKey: 'personality', title: '性格', desc: '最近测评结果会进入旁参判断', icon: '☯' },
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

export const DIVINATION_CONTENT_SEEDS = [
  {
    contentType: DIVINATION_CONTENT_TYPE,
    bizCode: 'line_positions',
    title: '高岛易断爻位文案',
    summary: '六爻位置的通用解读与行动建议',
    publishDate: null,
    status: 'published',
    contentJson: {
      linePositionContent: DIVINATION_DEFAULT_CONTENT_CATALOG.linePositionContent,
    },
  },
  {
    contentType: DIVINATION_CONTENT_TYPE,
    bizCode: 'topic_copy',
    title: '高岛易断主题文案',
    summary: '问事主题的提示、机会、风险与行动前缀',
    publishDate: null,
    status: 'published',
    contentJson: {
      topicCopy: DIVINATION_DEFAULT_CONTENT_CATALOG.topicCopy,
    },
  },
  {
    contentType: DIVINATION_CONTENT_TYPE,
    bizCode: 'topic_options',
    title: '占卜主题入口配置',
    summary: '主题图标、名称、副标题与入口顺序',
    publishDate: null,
    status: 'published',
    contentJson: {
      topicOptions: DIVINATION_DEFAULT_CONTENT_CATALOG.topicOptions,
    },
  },
  {
    contentType: DIVINATION_CONTENT_TYPE,
    bizCode: 'topic_strategies',
    title: '占卜主题策略文案',
    summary: '结果页主题标签、焦点、建议、宜忌与行动模板',
    publishDate: null,
    status: 'published',
    contentJson: {
      topicStrategies: DIVINATION_DEFAULT_CONTENT_CATALOG.topicStrategies,
    },
  },
  {
    contentType: DIVINATION_CONTENT_TYPE,
    bizCode: 'profile_mapping',
    title: '占卜画像映射配置',
    summary: '画像信号到解读策略、分数修正与维度文案的映射',
    publishDate: null,
    status: 'published',
    contentJson: {
      profileMapping: DIVINATION_DEFAULT_CONTENT_CATALOG.profileMapping,
    },
  },
  {
    contentType: DIVINATION_CONTENT_TYPE,
    bizCode: 'lucky_items',
    title: '占卜幸运项配置',
    summary: '幸运色、数字、方位与元素的候选列表',
    publishDate: null,
    status: 'published',
    contentJson: {
      luckyItems: DIVINATION_DEFAULT_CONTENT_CATALOG.luckyItems,
    },
  },
  {
    contentType: DIVINATION_CONTENT_TYPE,
    bizCode: 'page_tabs',
    title: '占卜页面 Tab 配置',
    summary: '首页入口、主题页、历史页、复盘页和起卦页的 tab 与选项',
    publishDate: null,
    status: 'published',
    contentJson: {
      pageTabs: DIVINATION_DEFAULT_CONTENT_CATALOG.pageTabs,
    },
  },
] as const;
