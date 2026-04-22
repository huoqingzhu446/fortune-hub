export const ZODIAC_SIGNS = [
  '白羊座',
  '金牛座',
  '双子座',
  '巨蟹座',
  '狮子座',
  '处女座',
  '天秤座',
  '天蝎座',
  '射手座',
  '摩羯座',
  '水瓶座',
  '双鱼座',
] as const;

export type ZodiacSign = (typeof ZODIAC_SIGNS)[number];
export type ZodiacElement = 'fire' | 'earth' | 'air' | 'water';
export type ZodiacModality = 'cardinal' | 'fixed' | 'mutable';

export interface ZodiacDailyStyle {
  summary: string;
  love: string;
  career: string;
  wealth: string;
  health: string;
  color: string;
  number: string;
  direction: string;
  partner: ZodiacSign;
  knowledge: string;
}

export interface ZodiacProfile {
  element: ZodiacElement;
  modality: ZodiacModality;
  season: string;
  tone: string;
  bestMatches: ZodiacSign[];
  keywords: string[];
  strengths: string[];
  relationshipStyle: string;
  workStyle: string;
  growthTip: string;
  knowledge: string;
  weeklyTheme: string;
  weeklyAction: string;
  yearlyTheme: string;
  yearlyAdvice: string;
}

export const ZODIAC_ELEMENT_LABELS: Record<ZodiacElement, string> = {
  fire: '火象',
  earth: '土象',
  air: '风象',
  water: '水象',
};

export const ZODIAC_MODALITY_LABELS: Record<ZodiacModality, string> = {
  cardinal: '开创型',
  fixed: '固定型',
  mutable: '变动型',
};

export const ZODIAC_LUCKY_STYLES: Record<ZodiacSign, ZodiacDailyStyle> = {
  白羊座: {
    summary: '今天适合快速决策，但别忘了给自己留一点余地。',
    love: '主动表达会更有回应，真诚比技巧更有效。',
    career: '执行力在线，先处理最重要的一件事。',
    wealth: '适合谨慎消费，优先选择有长期价值的东西。',
    health: '保持充足饮水，避免节奏过快。',
    color: '珊瑚红',
    number: '7',
    direction: '东南',
    partner: '狮子座',
    knowledge: '白羊座通常带着直接、热烈和很强的启动能量。',
  },
  金牛座: {
    summary: '稳住节奏会比追求速度更容易拿到结果。',
    love: '温柔和耐心会让关系更靠近一步。',
    career: '适合做细节优化和长期规划。',
    wealth: '适合整理预算和复盘支出。',
    health: '注意肩颈放松与久坐后的伸展。',
    color: '奶油绿',
    number: '4',
    direction: '正南',
    partner: '处女座',
    knowledge: '金牛座通常重视安全感、品味和长期积累。',
  },
  双子座: {
    summary: '信息量会很多，挑最重要的方向切入就够了。',
    love: '聊天气氛轻松，适合发起新话题。',
    career: '今天适合沟通、提案和快速协作。',
    wealth: '别因为一时新鲜感做冲动消费。',
    health: '减少熬夜，给大脑一点留白。',
    color: '晴空蓝',
    number: '5',
    direction: '东北',
    partner: '天秤座',
    knowledge: '双子座的优势常常在于反应快、连接多、表达顺。',
  },
  巨蟹座: {
    summary: '今天适合照顾内在节奏，也适合照顾重要的人。',
    love: '柔软表达能带来稳定的安全感。',
    career: '适合推进合作关系和团队沟通。',
    wealth: '更适合保守配置和日常管理。',
    health: '记得按时吃饭，不要被情绪打乱作息。',
    color: '雾感银',
    number: '2',
    direction: '西南',
    partner: '双鱼座',
    knowledge: '巨蟹座通常对情绪、家庭和亲密感受很敏锐。',
  },
  狮子座: {
    summary: '你的光芒感很强，但今天更适合温和发力。',
    love: '自然的自信会让关系更有吸引力。',
    career: '适合展示成果，也适合带动团队士气。',
    wealth: '控制面子型消费，优先真实需要。',
    health: '给自己安排一点真正放松的时间。',
    color: '金杏色',
    number: '9',
    direction: '正东',
    partner: '白羊座',
    knowledge: '狮子座通常带着表现力、热情和强烈的存在感。',
  },
  处女座: {
    summary: '细节处理会让你今天的整体状态更顺。',
    love: '少一点自我苛责，关系会更舒服。',
    career: '适合复盘、整理和流程优化。',
    wealth: '今天适合把钱花在提升效率的事上。',
    health: '注意胃部与规律作息。',
    color: '浅鼠尾草绿',
    number: '6',
    direction: '西北',
    partner: '金牛座',
    knowledge: '处女座的优势常常在于秩序感、观察力和可靠性。',
  },
  天秤座: {
    summary: '平衡感会帮助你把复杂事变得更顺。',
    love: '适合温和表达真实想法，不必过度讨好。',
    career: '适合谈合作、定方向和审美相关工作。',
    wealth: '保持克制，别被短期愉悦带着走。',
    health: '多活动腰背，减少久坐负担。',
    color: '雾霾粉蓝',
    number: '8',
    direction: '正西',
    partner: '双子座',
    knowledge: '天秤座常常擅长判断关系气氛和整体协调。',
  },
  天蝎座: {
    summary: '今天适合做深度判断，不适合被表面情绪带走。',
    love: '适合建立更深的信任，而不是猜测。',
    career: '适合推进需要专注力和洞察力的任务。',
    wealth: '理性评估风险，避免信息不透明的支出。',
    health: '注意情绪累积后的疲惫感。',
    color: '深莓紫红',
    number: '3',
    direction: '正北',
    partner: '巨蟹座',
    knowledge: '天蝎座通常拥有专注、敏锐和较强的洞察能力。',
  },
  射手座: {
    summary: '今天适合保持开放，但也要给计划留边界。',
    love: '轻松自然的互动比刻意安排更有效。',
    career: '适合启动新想法，也适合外部沟通。',
    wealth: '先想清楚长期价值，再决定投入。',
    health: '适合散步、拉伸或短时运动。',
    color: '日光橙',
    number: '1',
    direction: '东南',
    partner: '白羊座',
    knowledge: '射手座常带着自由感、探索欲和理想驱动力。',
  },
  摩羯座: {
    summary: '今天适合稳步推进，耐心会替你赢得空间。',
    love: '把在意说出口，比沉默更能建立连接。',
    career: '适合沉下心处理关键任务。',
    wealth: '理财和储蓄意识会帮助你保持稳定。',
    health: '注意肩颈与疲劳累积。',
    color: '岩灰蓝',
    number: '10',
    direction: '西南',
    partner: '处女座',
    knowledge: '摩羯座通常重视长期结果，也擅长持续推进。',
  },
  水瓶座: {
    summary: '今天适合跳出惯性，用新的角度看待旧问题。',
    love: '轻松但真诚的交流会更有效。',
    career: '适合脑暴、创新和结构性调整。',
    wealth: '避免因为兴趣驱动做非计划支出。',
    health: '让眼睛和神经系统都休息一下。',
    color: '冰川蓝',
    number: '11',
    direction: '东北',
    partner: '双子座',
    knowledge: '水瓶座常常擅长创新、抽离观察和独立判断。',
  },
  双鱼座: {
    summary: '今天适合相信直觉，但仍然要给现实一点锚点。',
    love: '柔和而清晰的表达能减少误会。',
    career: '适合做创意、内容和情绪感知类工作。',
    wealth: '先确认需求，再决定是否消费。',
    health: '情绪容易消耗体力，记得留给自己独处时间。',
    color: '海盐青',
    number: '12',
    direction: '正南',
    partner: '巨蟹座',
    knowledge: '双鱼座通常在共情、直觉和想象力方面更有优势。',
  },
};

export const ZODIAC_PROFILES: Record<ZodiacSign, ZodiacProfile> = {
  白羊座: {
    element: 'fire',
    modality: 'cardinal',
    season: '仲春',
    tone: '直接、热烈、反应快',
    bestMatches: ['狮子座', '射手座', '双子座'],
    keywords: ['启动', '勇气', '直觉'],
    strengths: ['启动快', '感染力强', '敢于试错'],
    relationshipStyle: '先把感受说出来，比反复试探更容易收获回应。',
    workStyle: '先定目标再快速试跑，小步验证会比一次做满更高效。',
    growthTip: '给冲劲留出复盘和休息时间，状态会更持久。',
    knowledge: '白羊座是典型的开创型火象星座，通常会在第一时间感知机会并迅速起步。',
    weeklyTheme: '把主动权握在手里的整合周',
    weeklyAction: '先拍板一件关键小事，再把精力投到真正重要的方向。',
    yearlyTheme: '把热情变成长期成果的一年',
    yearlyAdvice: '用阶段性目标替代持续冲刺，你会更容易把亮点稳稳留住。',
  },
  金牛座: {
    element: 'earth',
    modality: 'fixed',
    season: '暮春',
    tone: '稳定、细腻、重长期',
    bestMatches: ['处女座', '摩羯座', '巨蟹座'],
    keywords: ['稳定', '质感', '积累'],
    strengths: ['耐心足', '执行稳', '感官敏锐'],
    relationshipStyle: '温和而稳定的陪伴，比一时的热烈更能打动你。',
    workStyle: '适合先把基础资源稳住，再逐步把质量和效率一起拉高。',
    growthTip: '适度接受变化，你的稳定感不会因此丢失，反而更有弹性。',
    knowledge: '金牛座偏向稳定型土象能量，通常重视现实价值、舒适感和长期累积。',
    weeklyTheme: '稳中见增量的打磨周',
    weeklyAction: '把注意力放到预算、节奏和品质，耐心会给你回报。',
    yearlyTheme: '积累转化为可见回报的一年',
    yearlyAdvice: '别低估长期主义的力量，你的稳步推进正在变成真正的成果。',
  },
  双子座: {
    element: 'air',
    modality: 'mutable',
    season: '初夏',
    tone: '灵活、轻盈、善交流',
    bestMatches: ['天秤座', '水瓶座', '白羊座'],
    keywords: ['连接', '表达', '变化'],
    strengths: ['反应快', '信息整合强', '沟通轻松'],
    relationshipStyle: '好奇和分享欲会让关系更轻盈，真诚的对话就是你的加分项。',
    workStyle: '适合先收集信息，再快速建立几个轻量方案并并行试验。',
    growthTip: '把注意力收束到少数重点上，会让你的效率和满足感都更高。',
    knowledge: '双子座是风象里的变动型，擅长沟通、连接和在不同观点之间切换。',
    weeklyTheme: '信息整合与高效协作周',
    weeklyAction: '先做信息筛选，再决定要把时间投到哪些真正有效的连接上。',
    yearlyTheme: '把分散灵感聚成代表作的一年',
    yearlyAdvice: '当你愿意为重点内容留出深度，轻盈的天赋反而更容易被看见。',
  },
  巨蟹座: {
    element: 'water',
    modality: 'cardinal',
    season: '盛夏',
    tone: '敏感、照顾型、重连接',
    bestMatches: ['双鱼座', '天蝎座', '金牛座'],
    keywords: ['照顾', '安全感', '情绪'],
    strengths: ['共情力强', '有保护欲', '擅长建立亲密感'],
    relationshipStyle: '安全感不是靠猜出来的，清楚表达需要会让关系更舒服。',
    workStyle: '适合先稳住团队气氛与资源，再去推进真正重要的合作事项。',
    growthTip: '把情绪感知和边界感一起练起来，会更有力量。',
    knowledge: '巨蟹座的感知力和照顾属性很强，常常会先关注人心和关系是否安稳。',
    weeklyTheme: '照顾自己也照顾关系的平衡周',
    weeklyAction: '先把作息和情绪安顿好，再处理外部合作，结果会更顺。',
    yearlyTheme: '建立稳定内核与关系质量的一年',
    yearlyAdvice: '温柔从来不是退让，当你愿意给自己也留位置，关系会更稳。',
  },
  狮子座: {
    element: 'fire',
    modality: 'fixed',
    season: '盛夏',
    tone: '明亮、表达型、存在感强',
    bestMatches: ['白羊座', '射手座', '天秤座'],
    keywords: ['表达', '领导力', '热情'],
    strengths: ['感染力强', '愿意承担', '有舞台感'],
    relationshipStyle: '被看见和被回应很重要，坦率地说出在意会让互动更有温度。',
    workStyle: '适合站到台前整合资源，但要把关键细节交代清楚。',
    growthTip: '放下不必要的面子负担，真实会比完美更有力量。',
    knowledge: '狮子座通常天然自带光感和存在感，既渴望表达，也有带动他人的意愿。',
    weeklyTheme: '光芒收束后更有成果的一周',
    weeklyAction: '把最值得展示的内容放到前面，其余部分保持克制，效果会更亮。',
    yearlyTheme: '把影响力做深做实的一年',
    yearlyAdvice: '当你把热情投向长期作品和真实关系，认可会来得更稳更久。',
  },
  处女座: {
    element: 'earth',
    modality: 'mutable',
    season: '初秋',
    tone: '细致、清醒、追求秩序',
    bestMatches: ['金牛座', '摩羯座', '巨蟹座'],
    keywords: ['秩序', '效率', '修正'],
    strengths: ['观察细', '执行准', '善于优化'],
    relationshipStyle: '少一点自我苛责，多一点直接而温和的表达，关系会更轻松。',
    workStyle: '先搭好结构和流程，再去打磨细节，效率会明显提升。',
    growthTip: '允许自己先完成再优化，很多压力会因此松开。',
    knowledge: '处女座擅长通过秩序感与细节观察，把模糊的问题变得清晰可执行。',
    weeklyTheme: '把细节变成优势的效率周',
    weeklyAction: '把任务拆到更小粒度，再按优先级推进，秩序感会帮你节省很多精力。',
    yearlyTheme: '从精细执行走向体系能力的一年',
    yearlyAdvice: '先把自己从过度自检里松开，你的专业感会因此更稳定地输出。',
  },
  天秤座: {
    element: 'air',
    modality: 'cardinal',
    season: '仲秋',
    tone: '协调、审美敏锐、擅沟通',
    bestMatches: ['双子座', '水瓶座', '狮子座'],
    keywords: ['平衡', '关系', '审美'],
    strengths: ['善于协调', '表达体面', '有整体感'],
    relationshipStyle: '把真实感受讲清楚，比一味维持和气更能让关系变好。',
    workStyle: '适合在多人合作和需要判断取舍的场景里做定调者。',
    growthTip: '决策时先问自己真正想要什么，再考虑如何让大家舒服。',
    knowledge: '天秤座对关系氛围和审美秩序尤其敏感，常能看见多方之间的平衡点。',
    weeklyTheme: '理顺关系与节奏的协调周',
    weeklyAction: '先定判断标准，再谈取舍，你的平衡力会在关键时刻派上用场。',
    yearlyTheme: '关系质量和个人判断同时升级的一年',
    yearlyAdvice: '把取悦感降下来一点，你会更容易在关系和决策里站稳自己。',
  },
  天蝎座: {
    element: 'water',
    modality: 'fixed',
    season: '深秋',
    tone: '深度、专注、洞察强',
    bestMatches: ['巨蟹座', '双鱼座', '处女座'],
    keywords: ['专注', '洞察', '信任'],
    strengths: ['感知深', '执行隐忍', '有穿透力'],
    relationshipStyle: '比起试探，你更需要真实和一致的回应，信任会慢慢累积。',
    workStyle: '适合做深度判断、重点推进和需要保密或专注的任务。',
    growthTip: '把控制感换成边界感，你会更轻松也更有掌控力。',
    knowledge: '天蝎座擅长深挖信息和情绪本质，常常能看到别人不容易察觉的层次。',
    weeklyTheme: '聚焦关键议题的深潜周',
    weeklyAction: '少做分散尝试，把时间和心力留给最重要的一件事。',
    yearlyTheme: '深度转化为成果与信任的一年',
    yearlyAdvice: '当你把敏锐用于创造而不是防御，很多事情都会开始松动。',
  },
  射手座: {
    element: 'fire',
    modality: 'mutable',
    season: '初冬',
    tone: '开放、理想感强、重自由',
    bestMatches: ['白羊座', '狮子座', '水瓶座'],
    keywords: ['探索', '信念', '自由'],
    strengths: ['看得远', '气氛轻松', '愿意尝试'],
    relationshipStyle: '保留空间感的同时说清承诺边界，关系会更轻盈也更可靠。',
    workStyle: '适合打开新方向、连接外部资源，但要给计划留落点。',
    growthTip: '当灵感很多时，先选一条主线深做，会更有成就感。',
    knowledge: '射手座往往带着很强的探索欲和理想驱动力，喜欢在行动中寻找更大的意义。',
    weeklyTheme: '打开视野又不失边界的一周',
    weeklyAction: '让好奇心带路，但要给每个新想法一个清晰的下一步。',
    yearlyTheme: '把视野扩张成清晰方向的一年',
    yearlyAdvice: '自由不是分散，而是知道该把自己投向哪里。',
  },
  摩羯座: {
    element: 'earth',
    modality: 'cardinal',
    season: '隆冬',
    tone: '克制、务实、长期导向',
    bestMatches: ['处女座', '金牛座', '天蝎座'],
    keywords: ['目标', '责任', '耐力'],
    strengths: ['耐力强', '结构感好', '擅长兑现'],
    relationshipStyle: '把在意和需求说出口，比默默承担更能建立真正的连接。',
    workStyle: '适合处理长期项目、关键节点和需要稳定推进的事务。',
    growthTip: '把休息纳入计划不是偷懒，而是让长期输出更可持续。',
    knowledge: '摩羯座往往很清楚现实代价与长期结果，擅长稳步向目标靠近。',
    weeklyTheme: '稳稳推进核心目标的一周',
    weeklyAction: '把时间留给真正重要的任务，外部噪音可以先放一放。',
    yearlyTheme: '长期能力被真正看见的一年',
    yearlyAdvice: '你不需要每一步都证明自己，持续兑现本身就很有力量。',
  },
  水瓶座: {
    element: 'air',
    modality: 'fixed',
    season: '深冬',
    tone: '独立、理性、创新欲强',
    bestMatches: ['双子座', '天秤座', '射手座'],
    keywords: ['创新', '独立', '观察'],
    strengths: ['视角新', '善于抽离', '愿意打破惯性'],
    relationshipStyle: '轻松坦诚的交流最适合你，彼此保有空间反而更容易靠近。',
    workStyle: '适合做结构调整、创新尝试和需要独立判断的任务。',
    growthTip: '把灵感落实为可执行路径，你的独特感会更有落地力量。',
    knowledge: '水瓶座擅长从更远一点的位置观察问题，也常常能提出不按常规的解法。',
    weeklyTheme: '跳出旧轨道的刷新周',
    weeklyAction: '先把新想法写成可执行步骤，再决定哪些值得投入时间。',
    yearlyTheme: '把独特洞见变成系统能力的一年',
    yearlyAdvice: '不必为了合群放掉你的判断力，但也别忘了把观点讲到别人听得懂。',
  },
  双鱼座: {
    element: 'water',
    modality: 'mutable',
    season: '早春',
    tone: '柔软、直觉强、共情力高',
    bestMatches: ['巨蟹座', '天蝎座', '金牛座'],
    keywords: ['共情', '直觉', '想象'],
    strengths: ['感受细', '想象力强', '善于安抚'],
    relationshipStyle: '温柔表达会很有力量，只要边界清楚，你的柔软就是优势。',
    workStyle: '适合内容、创意和需要情绪感知的任务，也适合连接不同需求。',
    growthTip: '给直觉一个现实锚点，情绪和灵感都会更稳。',
    knowledge: '双鱼座往往拥有很高的共情和想象能力，容易捕捉细微情绪与氛围变化。',
    weeklyTheme: '把直觉落实成行动的柔韧周',
    weeklyAction: '先听见自己的真实感受，再给它一个可执行的表达方式。',
    yearlyTheme: '灵感与边界一起成长的一年',
    yearlyAdvice: '当你既照顾感受又照顾现实，很多天赋会开始稳定发光。',
  },
};

export const ZODIAC_WEEKLY_RHYTHM: Record<
  ZodiacElement,
  Array<{ label: string; summary: string }>
> = {
  fire: [
    { label: '周初', summary: '开场速度快，适合先拍板一件关键小事。' },
    { label: '周中', summary: '外部互动会增多，表达会带来更多机会。' },
    { label: '周末', summary: '放慢一点后，你会更清楚真正想把力气给谁。' },
  ],
  earth: [
    { label: '周初', summary: '先稳住基本盘，整理边界比硬冲更值。' },
    { label: '周中', summary: '适合做细节优化、预算梳理和长期规划。' },
    { label: '周末', summary: '给自己一点舒缓时间，状态会更容易续航。' },
  ],
  air: [
    { label: '周初', summary: '信息量会明显增加，先筛重点最关键。' },
    { label: '周中', summary: '沟通合作最顺，适合提案、协商和联动。' },
    { label: '周末', summary: '留一点独处和复盘时间，灵感会更容易沉下来。' },
  ],
  water: [
    { label: '周初', summary: '情绪感知更敏锐，先照顾好节奏会让一周更顺。' },
    { label: '周中', summary: '适合处理关系议题和需要耐心的合作。' },
    { label: '周末', summary: '把心思从他人身上收回一点，也是在照顾自己。' },
  ],
};

export const ZODIAC_YEARLY_FOCUS: Record<
  ZodiacElement,
  {
    relationship: string;
    career: string;
    money: string;
    wellbeing: string;
  }
> = {
  fire: {
    relationship: '关系里会更看重回应和同频感，主动与真诚会带来更多靠近。',
    career: '事业与学业适合把能见度和影响力转成稳定成果。',
    money: '财务上要学会把冲劲放到最值得投入的方向，减少即时型消费。',
    wellbeing: '维持稳定作息和运动感，会让你的热情更可持续。',
  },
  earth: {
    relationship: '关系里更适合用稳定行动建立信任，不必用沉默代替表达。',
    career: '事业与学业会因为秩序感、耐力和长期规划而逐渐拉开差距。',
    money: '财务上适合做结构化管理，稳健配置会比短线更有安全感。',
    wellbeing: '给身体和情绪留出缓冲区，会让你走得更稳更久。',
  },
  air: {
    relationship: '关系里最重要的是把想法讲清楚，轻松而真诚的交流会带来转机。',
    career: '事业与学业会在协作、传播、跨界和新思路中找到突破口。',
    money: '财务上要减少因为兴趣和新鲜感带来的分散支出，把重点投向高价值方向。',
    wellbeing: '注意睡眠和神经系统的放松，让大脑从高频切换里停一停。',
  },
  water: {
    relationship: '关系里会更重视安全感和信任，清晰边界会让亲密感更稳定。',
    career: '事业与学业适合在深度合作、内容表达和长期信任里积累成果。',
    money: '财务上更适合先稳住基础，再决定是否为情绪或理想型消费买单。',
    wellbeing: '情绪管理和休息质量会直接影响你的能量感，别忽略自我照顾。',
  },
};

export const ZODIAC_QUARTER_TEMPLATES: Record<
  ZodiacModality,
  Array<{ quarter: string; title: string; summary: string }>
> = {
  cardinal: [
    { quarter: 'Q1', title: '开局定调', summary: '适合先立年度主轴，把资源集中到真正重要的方向。' },
    { quarter: 'Q2', title: '推进加速', summary: '执行力会明显提升，但仍要预留调整空间。' },
    { quarter: 'Q3', title: '连接扩张', summary: '合作、表达和外部机会会逐渐增多。' },
    { quarter: 'Q4', title: '成果收束', summary: '适合复盘、定型和把经验沉淀成方法。' },
  ],
  fixed: [
    { quarter: 'Q1', title: '找到主轴', summary: '先确认真正想守住和想扩大的部分。' },
    { quarter: 'Q2', title: '稳步抬升', summary: '适合长期推进，慢一点反而能换到更扎实的结果。' },
    { quarter: 'Q3', title: '结构优化', summary: '会经历几次必要调整，去旧留新很重要。' },
    { quarter: 'Q4', title: '价值兑现', summary: '你长期投入的东西会开始被看见并给出回报。' },
  ],
  mutable: [
    { quarter: 'Q1', title: '观察试跑', summary: '先通过轻量尝试找出真正有效的方向。' },
    { quarter: 'Q2', title: '聚焦主线', summary: '把分散的灵感与事务收束到一两条主线上。' },
    { quarter: 'Q3', title: '灵活应变', summary: '变化增多，但你也最容易在这一阶段找到优势。' },
    { quarter: 'Q4', title: '沉淀方法', summary: '适合把有效经验整理下来，为下一年打底。' },
  ],
};

export const ZODIAC_KEY_MONTHS: Record<ZodiacElement, string[]> = {
  fire: ['3月', '7月', '11月'],
  earth: ['4月', '8月', '12月'],
  air: ['1月', '5月', '9月'],
  water: ['2月', '6月', '10月'],
};

export function isKnownZodiacSign(sign: string): sign is ZodiacSign {
  return ZODIAC_SIGNS.includes(sign as ZodiacSign);
}
