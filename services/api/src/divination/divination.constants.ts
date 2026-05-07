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

export interface DivinationContentCatalog {
  linePositionContent: DivinationLinePositionContent[];
  topicCopy: Record<DivinationTopic, DivinationTopicCopy>;
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
] as const;
