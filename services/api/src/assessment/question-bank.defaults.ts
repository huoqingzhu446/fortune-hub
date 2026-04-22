export type QuestionBankCategory = 'personality' | 'emotion';

export const QUESTION_BANK_CATEGORY_LABELS: Record<QuestionBankCategory, string> = {
  personality: '性格测评',
  emotion: '情绪自检',
};

export interface PersonalityOptionDefinition {
  key: string;
  label: string;
  dimension: string;
  score: number;
}

export interface PersonalityQuestionDefinition {
  id: string;
  prompt: string;
  options: PersonalityOptionDefinition[];
}

export interface PersonalityProfileDefinition {
  title: string;
  summary: string;
  strengths: string[];
  suggestions: string[];
}

export interface PersonalityTestDefinition {
  code: string;
  title: string;
  subtitle: string;
  description: string;
  intro: string;
  durationMinutes: number;
  tags: string[];
  dimensionLabels: Record<string, string>;
  profiles: Record<string, PersonalityProfileDefinition>;
  questions: PersonalityQuestionDefinition[];
}

export interface EmotionOptionDefinition {
  key: string;
  label: string;
  score: number;
}

export interface EmotionQuestionDefinition {
  id: string;
  prompt: string;
  options: EmotionOptionDefinition[];
}

export interface EmotionThresholdDefinition {
  maxScore: number;
  level: 'steady' | 'watch' | 'support' | 'urgent';
  title: string;
  subtitle: string;
  summary: string;
  primarySuggestion: string;
  supportSignal: string;
}

export interface SharePosterConfigDefinition {
  headlineTemplate: string;
  subtitleTemplate: string;
  accentText: string;
  footerText: string;
  themeName: string;
}

export interface EmotionTestDefinition {
  code: string;
  title: string;
  subtitle: string;
  description: string;
  intro: string;
  durationMinutes: number;
  tags: string[];
  disclaimer: string;
  relaxSteps: string[];
  questions: EmotionQuestionDefinition[];
  thresholds: EmotionThresholdDefinition[];
}

export function createDefaultSharePosterConfig(
  category: QuestionBankCategory,
): SharePosterConfigDefinition {
  return category === 'emotion'
    ? {
        headlineTemplate: '{resultTitle}',
        subtitleTemplate: '这份{testTitle}结果提醒我：先把自己照顾好。',
        accentText: '轻量自检 · 先照顾自己',
        footerText: '结果仅用于日常自我观察，请按现实支持优先。',
        themeName: 'calm-amber',
      }
    : {
        headlineTemplate: '{resultTitle}',
        subtitleTemplate: '我刚完成了{testTitle}，现在最突出的优势是{dominantDimensionLabel}。',
        accentText: '轻量测评 · 认识自己',
        footerText: '先看见自己的自然优势，再决定下一步怎么用。',
        themeName: 'fresh-mint',
      };
}

export const PERSONALITY_TESTS: PersonalityTestDefinition[] = [
  {
    code: 'daily-rhythm',
    title: '日常节奏感测评',
    subtitle: '看你更偏行动、稳定还是感受',
    description: '适合先快速了解自己的日常推进方式和情绪节奏。',
    intro: '5 道轻量题，帮你看清自己在推进事情时最自然的状态。',
    durationMinutes: 3,
    tags: ['入门推荐', '节奏感', '轻量 3 分钟'],
    dimensionLabels: {
      drive: '行动感',
      balance: '稳定感',
      empathy: '感受力',
    },
    profiles: {
      drive: {
        title: '轻快执行型',
        summary: '你在启动与推进上很有优势，适合先动起来，再逐步打磨细节。',
        strengths: [
          '面对任务时容易迅速进入状态',
          '适合把复杂事项拆成清晰步骤',
          '在团队里常常能带出行动节奏',
        ],
        suggestions: [
          '给自己留一点复盘空间，避免只顾着往前冲',
          '关键节点多确认一次信息，稳定感会更强',
        ],
      },
      balance: {
        title: '稳感掌舵型',
        summary: '你擅长在变化中维持秩序，通常能把事情安排得更稳妥。',
        strengths: [
          '对节奏和边界有较好的掌控力',
          '在复杂安排里更容易保持清晰',
          '适合负责长期和持续性的任务',
        ],
        suggestions: [
          '偶尔允许自己更快开始，别把准备拖得太久',
          '为灵感留一点空白，会让行动更轻盈',
        ],
      },
      empathy: {
        title: '细腻感知型',
        summary: '你对氛围与他人感受很敏锐，往往能在细节里捕捉到真实需求。',
        strengths: [
          '能够快速感知情绪和环境变化',
          '适合需要理解他人和共情的场景',
          '在表达关心时更容易让人感到舒服',
        ],
        suggestions: [
          '重要事项先定一个时间点，能减少犹豫和消耗',
          '把感受写下来再行动，会更容易进入稳定节奏',
        ],
      },
    },
    questions: [
      {
        id: 'rhythm-1',
        prompt: '当你开始新一天时，最自然的方式通常是？',
        options: [
          { key: 'A', label: '先定一个最重要的目标，尽快开动。', dimension: 'drive', score: 4 },
          { key: 'B', label: '先看整体安排，按顺序推进。', dimension: 'balance', score: 3 },
          { key: 'C', label: '先感受状态，找最顺手的切入口。', dimension: 'empathy', score: 3 },
        ],
      },
      {
        id: 'rhythm-2',
        prompt: '计划突然变化时，你更像哪一种反应？',
        options: [
          { key: 'A', label: '马上调整方案，先让事情继续往前走。', dimension: 'drive', score: 4 },
          { key: 'B', label: '先确认影响范围，再决定怎么改。', dimension: 'balance', score: 4 },
          { key: 'C', label: '会先留意自己和他人的感受再处理。', dimension: 'empathy', score: 3 },
        ],
      },
      {
        id: 'rhythm-3',
        prompt: '如果朋友找你商量一件事，你通常会先？',
        options: [
          { key: 'A', label: '帮他列出几个可执行方案。', dimension: 'drive', score: 3 },
          { key: 'B', label: '先把信息听完整，梳理关键点。', dimension: 'balance', score: 4 },
          { key: 'C', label: '先理解他的真实情绪和顾虑。', dimension: 'empathy', score: 4 },
        ],
      },
      {
        id: 'rhythm-4',
        prompt: '遇到积压任务时，你更容易靠什么重新进入状态？',
        options: [
          { key: 'A', label: '先完成最短的一项，让节奏重新起来。', dimension: 'drive', score: 4 },
          { key: 'B', label: '把任务重新排序，给自己一个可控清单。', dimension: 'balance', score: 4 },
          { key: 'C', label: '让自己缓一缓，再回到更舒服的状态。', dimension: 'empathy', score: 3 },
        ],
      },
      {
        id: 'rhythm-5',
        prompt: '你理想中的一天，更接近下面哪种体验？',
        options: [
          { key: 'A', label: '做成几件具体的事，成就感明显。', dimension: 'drive', score: 4 },
          { key: 'B', label: '安排顺畅、节奏稳定、不慌不乱。', dimension: 'balance', score: 4 },
          { key: 'C', label: '身心放松，也和重要的人保持良好连接。', dimension: 'empathy', score: 4 },
        ],
      },
    ],
  },
  {
    code: 'expression-style',
    title: '表达风格测评',
    subtitle: '看你在交流里更偏条理、亲和还是灵感',
    description: '适合用来快速了解自己的表达习惯与对外沟通风格。',
    intro: '5 道小题，帮你识别自己更自然的沟通气质。',
    durationMinutes: 3,
    tags: ['沟通表达', '风格识别', '轻量 3 分钟'],
    dimensionLabels: {
      clarity: '条理感',
      warmth: '亲和感',
      spark: '灵感感',
    },
    profiles: {
      clarity: {
        title: '清晰表达型',
        summary: '你擅长把复杂内容讲清楚，交流时更容易让人快速抓住重点。',
        strengths: [
          '结构感强，适合做说明和总结',
          '能在讨论里稳定节奏，减少沟通成本',
          '在协作场景中更容易建立信任感',
        ],
        suggestions: [
          '适当加一点情绪温度，表达会更有连接感',
          '别把每句话都打磨到太完整，留一点自然感更舒服',
        ],
      },
      warmth: {
        title: '温柔连接型',
        summary: '你很会照顾交流中的情绪感受，能让对方更愿意继续打开自己。',
        strengths: [
          '容易营造轻松安全的沟通氛围',
          '适合做协调、陪伴和支持型表达',
          '在一对一关系里往往更有感染力',
        ],
        suggestions: [
          '关键观点可以再说得更直接一点',
          '重要信息尽量落到具体行动，避免只停留在感受层面',
        ],
      },
      spark: {
        title: '灵感激发型',
        summary: '你有很强的想法流动感，往往能给谈话带来新鲜视角和活力。',
        strengths: [
          '点子多，适合头脑风暴和创意表达',
          '容易带动场面，让沟通不沉闷',
          '擅长用画面感和比喻增强记忆点',
        ],
        suggestions: [
          '重要结论可以再收束一下，便于别人接住',
          '给观点配一个落地步骤，会更容易转化成行动',
        ],
      },
    },
    questions: [
      {
        id: 'expression-1',
        prompt: '需要向别人说明一件事时，你通常会先怎么组织？',
        options: [
          { key: 'A', label: '先给结构，再补细节。', dimension: 'clarity', score: 4 },
          { key: 'B', label: '先照顾对方的理解节奏和感受。', dimension: 'warmth', score: 3 },
          { key: 'C', label: '先抛一个有画面感的例子吸引注意。', dimension: 'spark', score: 4 },
        ],
      },
      {
        id: 'expression-2',
        prompt: '聊天气氛变冷时，你更可能怎么做？',
        options: [
          { key: 'A', label: '重新拉回重点，让对话更有方向。', dimension: 'clarity', score: 3 },
          { key: 'B', label: '换一种更轻松、让人舒服的说法。', dimension: 'warmth', score: 4 },
          { key: 'C', label: '抛出一个新角度或有趣的问题。', dimension: 'spark', score: 4 },
        ],
      },
      {
        id: 'expression-3',
        prompt: '如果要做一次分享，你最希望别人记住你什么？',
        options: [
          { key: 'A', label: '内容清晰，逻辑很顺。', dimension: 'clarity', score: 4 },
          { key: 'B', label: '氛围舒服，让人愿意继续交流。', dimension: 'warmth', score: 4 },
          { key: 'C', label: '观点新鲜，很有启发。', dimension: 'spark', score: 4 },
        ],
      },
      {
        id: 'expression-4',
        prompt: '当别人误解你时，你更自然的处理方式是？',
        options: [
          { key: 'A', label: '重新梳理逻辑，把误会解释清楚。', dimension: 'clarity', score: 4 },
          { key: 'B', label: '先缓和情绪，再继续沟通。', dimension: 'warmth', score: 4 },
          { key: 'C', label: '换一种说法或例子，让对方更容易理解。', dimension: 'spark', score: 3 },
        ],
      },
      {
        id: 'expression-5',
        prompt: '你更喜欢哪一种理想沟通状态？',
        options: [
          { key: 'A', label: '信息传递高效，大家很快有共识。', dimension: 'clarity', score: 4 },
          { key: 'B', label: '彼此都觉得被理解，关系更靠近。', dimension: 'warmth', score: 4 },
          { key: 'C', label: '对话里不断冒出新的想法和火花。', dimension: 'spark', score: 4 },
        ],
      },
    ],
  },
];

export const COMMON_EMOTION_OPTIONS: EmotionOptionDefinition[] = [
  { key: 'A', label: '几乎没有', score: 0 },
  { key: 'B', label: '偶尔会有', score: 1 },
  { key: 'C', label: '经常会有', score: 2 },
  { key: 'D', label: '几乎每天', score: 3 },
];

export const EMOTION_TESTS: EmotionTestDefinition[] = [
  {
    code: 'mood-check',
    title: '近七日低落感自检',
    subtitle: '观察近期心情、兴趣和能量的变化',
    description: '帮助你快速感受最近一周的情绪起伏，但它不能替代专业诊断。',
    intro: '请按最近 7 天的真实体验作答，不用追求标准答案。',
    durationMinutes: 3,
    tags: ['低落感', '非诊断', '轻量 3 分钟'],
    disclaimer:
      '本结果仅用于日常自我观察，不构成医学诊断或治疗建议；如持续低落或影响生活，请尽快联系专业机构。',
    relaxSteps: [
      '先把今天最耗能的一件事拆成更小的一步。',
      '给自己留 10 分钟的安静呼吸或散步时间。',
      '找一个信任的人，简单说出你最近最累的一件事。',
    ],
    questions: [
      {
        id: 'mood-1',
        prompt: '最近 7 天，你是否常常提不起劲去做原本能完成的事？',
        options: COMMON_EMOTION_OPTIONS,
      },
      {
        id: 'mood-2',
        prompt: '最近 7 天，你对原本会让你开心的事情是否变得没那么有兴趣？',
        options: COMMON_EMOTION_OPTIONS,
      },
      {
        id: 'mood-3',
        prompt: '最近 7 天，你是否会明显感到心情低落、空掉或者无力？',
        options: COMMON_EMOTION_OPTIONS,
      },
      {
        id: 'mood-4',
        prompt: '最近 7 天，你是否更容易自责，或者觉得自己做得不够好？',
        options: COMMON_EMOTION_OPTIONS,
      },
      {
        id: 'mood-5',
        prompt: '最近 7 天，你的睡眠或精力是否因为心情而受到影响？',
        options: COMMON_EMOTION_OPTIONS,
      },
    ],
    thresholds: [
      {
        maxScore: 3,
        level: 'steady',
        title: '平稳观察区',
        subtitle: '最近整体还算稳定，可以继续保持日常节奏。',
        summary: '你的情绪波动目前不算明显，更适合通过规律休息和轻量活动维持状态。',
        primarySuggestion: '继续保持作息、饮食和基础运动节奏。',
        supportSignal: '如果后面连续几天明显下滑，再回来做一次复查会更有参考价值。',
      },
      {
        maxScore: 7,
        level: 'watch',
        title: '轻度波动区',
        subtitle: '最近有一些情绪起伏，值得多留意自己的消耗来源。',
        summary: '你已经出现一定程度的低落感，建议先减少不必要的压力，给自己更多恢复空间。',
        primarySuggestion: '把目标先缩小一点，优先保证睡眠和稳定吃饭。',
        supportSignal: '如果连续两周都处在这种状态，可以考虑和信任的人聊聊，必要时寻求专业支持。',
      },
      {
        maxScore: 11,
        level: 'support',
        title: '需要多留意',
        subtitle: '你的低落感已经比较明显，建议尽快增加支持和照顾。',
        summary: '最近这段时间对你来说可能比较辛苦，单靠硬撑不一定是最有效的方式。',
        primarySuggestion: '尽量减少独自承受，优先联系信任的人或专业支持资源。',
        supportSignal: '如果这种状态已经影响学习、工作、吃饭或睡眠，建议尽快联系心理咨询或医疗机构。',
      },
      {
        maxScore: Number.POSITIVE_INFINITY,
        level: 'urgent',
        title: '建议尽快寻求支持',
        subtitle: '当前波动已经比较重，先把安全和支持放在第一位。',
        summary: '这份结果提示你近期的情绪压力较高，请不要一个人硬扛。',
        primarySuggestion: '尽快联系家人、朋友、学校或医院等现实支持渠道，优先获得陪伴和帮助。',
        supportSignal: '如果你已经出现明显失控感、持续失眠或伤害自己的想法，请立即联系当地急救、医院或心理危机干预热线。',
      },
    ],
  },
  {
    code: 'anxiety-check',
    title: '近期紧张感自检',
    subtitle: '观察担忧、紧绷和身体警觉感的变化',
    description: '帮助你了解最近的紧张压力水平，但它不能替代专业诊断。',
    intro: '请按最近 7 天的真实体验作答，越直觉越好。',
    durationMinutes: 3,
    tags: ['紧张感', '非诊断', '轻量 3 分钟'],
    disclaimer:
      '本结果仅用于日常自我观察，不构成医学诊断或治疗建议；如果紧张持续升级并影响生活，请尽快寻求专业帮助。',
    relaxSteps: [
      '先做 1 分钟缓慢呼气，把呼气时间拉长到吸气的两倍。',
      '把你现在最担心的事写成一句话，再写出一个可做的小动作。',
      '如果身体很绷，先离开屏幕做一次轻度拉伸或走动。',
    ],
    questions: [
      {
        id: 'anxiety-1',
        prompt: '最近 7 天，你是否常常停不下来地担心某些事？',
        options: COMMON_EMOTION_OPTIONS,
      },
      {
        id: 'anxiety-2',
        prompt: '最近 7 天，你是否经常感到身体紧绷、坐立不安或难以放松？',
        options: COMMON_EMOTION_OPTIONS,
      },
      {
        id: 'anxiety-3',
        prompt: '最近 7 天，你是否会因为紧张而影响专注或效率？',
        options: COMMON_EMOTION_OPTIONS,
      },
      {
        id: 'anxiety-4',
        prompt: '最近 7 天，你是否会反复预想不好的结果，难以停下来？',
        options: COMMON_EMOTION_OPTIONS,
      },
      {
        id: 'anxiety-5',
        prompt: '最近 7 天，你是否因为紧张而影响睡眠、食欲或身体状态？',
        options: COMMON_EMOTION_OPTIONS,
      },
    ],
    thresholds: [
      {
        maxScore: 3,
        level: 'steady',
        title: '平稳观察区',
        subtitle: '你的紧张感目前在可调节范围内。',
        summary: '现在更多像是日常压力波动，适合通过呼吸、运动和节奏管理继续维持稳定。',
        primarySuggestion: '把注意力放回当下能完成的一件事上，减少多线程消耗。',
        supportSignal: '如果后面几天明显变得更绷，可以再做一次自检观察变化。',
      },
      {
        maxScore: 7,
        level: 'watch',
        title: '轻度紧绷区',
        subtitle: '最近担忧感有点偏高，值得适当减压。',
        summary: '你的注意力可能被担忧感持续占用，先把节奏降下来，会更容易恢复。',
        primarySuggestion: '今天先减少一到两个非必要任务，给自己留出喘息空间。',
        supportSignal: '如果紧绷感持续影响效率或睡眠，可以考虑找人聊聊或寻求专业建议。',
      },
      {
        maxScore: 11,
        level: 'support',
        title: '需要多留意',
        subtitle: '你的紧张感已经比较明显，建议尽快增加支持。',
        summary: '最近你可能长期处在绷紧状态，身体和情绪都需要更多缓冲和照顾。',
        primarySuggestion: '把“先稳定下来”排在“再继续推进”之前，适当暂停并寻求支持。',
        supportSignal: '如果心慌、失眠、反复惊醒等情况已经比较明显，建议尽快联系专业机构。',
      },
      {
        maxScore: Number.POSITIVE_INFINITY,
        level: 'urgent',
        title: '建议尽快寻求支持',
        subtitle: '现在更重要的是先让自己回到安全和支持里。',
        summary: '这份结果提示你近期的紧张压力已经很高，不建议继续一个人硬撑。',
        primarySuggestion: '优先联系现实中的家人、朋友、老师、同事或专业机构，先获得陪伴和帮助。',
        supportSignal: '如果你已经出现明显惊恐、持续失眠或失控感，请立即联系当地急救、医院或心理危机干预热线。',
      },
    ],
  },
];
