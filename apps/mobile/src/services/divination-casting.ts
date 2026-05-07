import type {
  DivinationCastingStep,
  DivinationFlow,
  DivinationHexagram,
  DivinationMethod,
  DivinationTopic,
} from '../types/divination';
import { buildHexagramLineReadings } from './divination-content';

type TrigramName = '乾' | '兑' | '离' | '震' | '巽' | '坎' | '艮' | '坤';

interface TrigramSeed {
  remainder: number;
  name: TrigramName;
  symbol: string;
  nature: string;
  quality: string;
  keywords: string[];
  lines: boolean[];
}

interface HexagramMeta {
  sequence: number;
  name: string;
  upper: TrigramName;
  lower: TrigramName;
  theme: string;
  judgement: string;
  image: string;
  decision: string;
  caution: string;
  keywords: string[];
}

export interface BuildDivinationCastingInput {
  userId: string;
  topic: DivinationTopic;
  question?: string;
  timestamp: number;
  method?: DivinationMethod;
  flow?: DivinationFlow;
  interactionSeed?: string;
  useBazi?: boolean;
  useZodiac?: boolean;
  useMood?: boolean;
  usePersonality?: boolean;
}

export interface BuildDivinationCastingResult {
  method: DivinationMethod;
  methodLabel: string;
  flow: DivinationFlow;
  flowLabel: string;
  seed: number;
  upperTrigram: TrigramSeed;
  lowerTrigram: TrigramSeed;
  movingLine: number;
  movingLineLabel: string;
  hexagram: DivinationHexagram;
  changedHexagram: DivinationHexagram;
  keywords: string[];
  steps: DivinationCastingStep[];
}

const STALK_COUNT = 49;

const METHOD_LABELS: Record<DivinationMethod, string> = {
  'split-stalk': '略筮分策法',
  'draw-lots': '略筮抽签法',
};

const FLOW_LABELS: Record<DivinationFlow, string> = {
  yang: '阳式：左 · 右 · 左',
  yin: '阴式：右 · 左 · 右',
};

const FLOW_SEQUENCE: Record<DivinationFlow, Array<'left' | 'right'>> = {
  yang: ['left', 'right', 'left'],
  yin: ['right', 'left', 'right'],
};

const TRIGRAMS: TrigramSeed[] = [
  {
    remainder: 1,
    name: '乾',
    symbol: '☰',
    nature: '天',
    quality: '刚健、开创、主动',
    keywords: ['开创', '清明', '担当'],
    lines: [true, true, true],
  },
  {
    remainder: 2,
    name: '兑',
    symbol: '☱',
    nature: '泽',
    quality: '悦纳、表达、回应',
    keywords: ['表达', '回应', '喜悦'],
    lines: [true, true, false],
  },
  {
    remainder: 3,
    name: '离',
    symbol: '☲',
    nature: '火',
    quality: '明辨、看见、依附',
    keywords: ['明辨', '呈现', '看见'],
    lines: [true, false, true],
  },
  {
    remainder: 4,
    name: '震',
    symbol: '☳',
    nature: '雷',
    quality: '发动、惊醒、突破',
    keywords: ['行动', '启动', '突破'],
    lines: [true, false, false],
  },
  {
    remainder: 5,
    name: '巽',
    symbol: '☴',
    nature: '风',
    quality: '入微、顺势、渗透',
    keywords: ['顺势', '入微', '调整'],
    lines: [false, true, true],
  },
  {
    remainder: 6,
    name: '坎',
    symbol: '☵',
    nature: '水',
    quality: '险中求通、流动、试探',
    keywords: ['试探', '流动', '谨慎'],
    lines: [false, true, false],
  },
  {
    remainder: 7,
    name: '艮',
    symbol: '☶',
    nature: '山',
    quality: '止息、边界、沉稳',
    keywords: ['止息', '边界', '沉静'],
    lines: [false, false, true],
  },
  {
    remainder: 8,
    name: '坤',
    symbol: '☷',
    nature: '地',
    quality: '承载、接纳、培育',
    keywords: ['承载', '等待', '滋养'],
    lines: [false, false, false],
  },
];

const HEXAGRAMS: HexagramMeta[] = [
  h(1, '乾为天', '乾', '乾', '自强开创', '气势纯阳，宜立志、定纲、主动担当。', '天行健，重在持续而不躁进。', '宜以清晰目标统领行动，先定方向再发力。', '忌逞强独断，越有势越要守住分寸。', ['开创', '担当', '清明']),
  h(2, '坤为地', '坤', '坤', '承载顺势', '气象纯阴，宜接纳、培育、厚积薄发。', '地势坤，重在承载与成全。', '宜把资源、人情和节奏先安顿好。', '忌被动拖延，把顺势误作无主见。', ['承载', '稳定', '滋养']),
  h(3, '水雷屯', '坎', '震', '初始艰难', '事在初生，多阻多乱，但生机已动。', '云雷屯，先乱后立。', '宜小步开局，先解决最碍事的一环。', '忌急求全局明朗，越急越易失序。', ['初始', '破局', '耐心']),
  h(4, '山水蒙', '艮', '坎', '启蒙求明', '前路未明，宜请教、学习、校正认知。', '山下出泉，知浅而可进。', '宜承认未知，把问题问得更准确。', '忌凭半懂判断大事。', ['学习', '求问', '校正']),
  h(5, '水天需', '坎', '乾', '待时蓄势', '有险在前，宜等待时机、养足资源。', '云上于天，雨未落而势已成。', '宜准备方案，等关键条件成熟。', '忌因等待焦虑而提前冒进。', ['等待', '准备', '蓄势']),
  h(6, '天水讼', '乾', '坎', '争端辨明', '意见相违，宜辨事实、守边界。', '天与水违行，争由分歧而起。', '宜把证据、规则和底线说清楚。', '忌逞口舌之快，争赢未必得利。', ['争议', '边界', '事实']),
  h(7, '地水师', '坤', '坎', '组织纪律', '险在内而众在外，宜整队、立规、听令。', '地中有水，众力需有统摄。', '宜明确角色分工，统一行动节奏。', '忌群起无序，各行其是。', ['组织', '纪律', '协同']),
  h(8, '水地比', '坎', '坤', '亲比归属', '水润地上，宜亲近同道、建立信任。', '水附于地，合则有依。', '宜选择可信之人结伴推进。', '忌只为安全感而依附不合适的人。', ['亲近', '信任', '结伴']),
  h(9, '风天小畜', '巽', '乾', '小有积蓄', '大势欲进，细处仍需收束。', '风行天上，轻柔能蓄刚健。', '宜先修细节、积小成势。', '忌急着证明成果，火候还差一点。', ['积累', '细节', '收束']),
  h(10, '天泽履', '乾', '兑', '谨慎践行', '上刚下悦，行事须知礼知险。', '履虎尾，重在有礼有度。', '宜按规则前进，姿态柔和但底线清楚。', '忌轻率试探权威或边界。', ['谨慎', '礼度', '践行']),
  h(11, '地天泰', '坤', '乾', '通泰相交', '天地交感，阻隔渐通，宜合作推进。', '天地交而万物通。', '宜趁顺势修复关系、推进计划。', '忌得势后松散，通泰也要维护。', ['通达', '合作', '生长']),
  h(12, '天地否', '乾', '坤', '闭塞不交', '上下不交，气机闭塞，宜守正待变。', '天地不交，信息与力量暂不相通。', '宜收缩战线，保住核心。', '忌强行沟通无回应之局。', ['闭塞', '守正', '收缩']),
  h(13, '天火同人', '乾', '离', '同道相合', '明在内而天在上，宜公开结盟、求同存异。', '火照天际，同人以明。', '宜把共同目标摆到明处。', '忌小圈子私心破坏大局。', ['同盟', '公开', '共识']),
  h(14, '火天大有', '离', '乾', '资源丰盛', '明而能健，资源可用，宜整理优势。', '火在天上，所有被照见。', '宜把已有成果公开呈现。', '忌有而不守，丰盛反成消耗。', ['资源', '明朗', '丰盛']),
  h(15, '地山谦', '坤', '艮', '谦退有成', '山藏地中，才德宜内敛。', '高者能下，谦则受益。', '宜低姿态做实事，让成果自己说话。', '忌自满争功。', ['谦逊', '内敛', '稳成']),
  h(16, '雷地豫', '震', '坤', '顺势动员', '雷出地上，人心可动，宜鼓舞与预备。', '雷动于地，先振其气。', '宜用清晰愿景带动团队。', '忌沉迷兴奋，计划仍要落地。', ['动员', '预备', '振作']),
  h(17, '泽雷随', '兑', '震', '随时而动', '悦在上而动在下，宜顺势跟进。', '泽中有雷，动而能悦。', '宜观察趋势，跟随真正有效的方向。', '忌盲从热闹。', ['随顺', '跟进', '响应']),
  h(18, '山风蛊', '艮', '巽', '整弊更新', '积弊已成，宜清理旧账、修复根基。', '山下有风，内里需整治。', '宜找出问题源头，逐件修补。', '忌只做表面美化。', ['修复', '清理', '更新']),
  h(19, '地泽临', '坤', '兑', '临近照拂', '上临于下，机会靠近，宜主动关照。', '地上有泽，临以亲近。', '宜靠近现场、靠近真实需求。', '忌居高临下。', ['靠近', '照拂', '机会']),
  h(20, '风地观', '巽', '坤', '观察省察', '风行地上，宜观察形势、反观自身。', '风过大地，万象可观。', '宜先看清模式，再表达判断。', '忌没看全就急着下结论。', ['观察', '复盘', '洞察']),
  h(21, '火雷噬嗑', '离', '震', '决断障碍', '明与动相合，宜咬断阻碍、明罚立规。', '雷电合章，障碍需处理。', '宜明确规则，果断解决卡点。', '忌优柔寡断让问题发酵。', ['决断', '规则', '清障']),
  h(22, '山火贲', '艮', '离', '修饰成文', '内明外止，宜整理形象与表达。', '山下有火，文饰有光。', '宜包装成果，但不掩盖实质。', '忌只重形式，内容空心。', ['修饰', '呈现', '秩序']),
  h(23, '山地剥', '艮', '坤', '剥落见底', '阳气剥落，宜止损、保根。', '山附于地，外壳渐去。', '宜舍弃虚耗，保存核心力量。', '忌硬撑旧局。', ['剥落', '止损', '保根']),
  h(24, '地雷复', '坤', '震', '一阳来复', '生机初回，宜重新开始。', '雷在地中，复归有时。', '宜从小而确定的一步恢复节奏。', '忌刚恢复就过度用力。', ['回归', '重启', '萌发']),
  h(25, '天雷无妄', '乾', '震', '真实无妄', '动而合天，宜真诚自然，不做虚伪安排。', '天下雷行，物与无妄。', '宜按事实行动，不强加戏码。', '忌妄想侥幸。', ['真实', '自然', '无妄']),
  h(26, '山天大畜', '艮', '乾', '大蓄待发', '刚健被止，能量宜蓄养成器。', '天在山中，大者可畜。', '宜学习、储备、训练能力。', '忌有力便急于外放。', ['蓄养', '训练', '沉淀']),
  h(27, '山雷颐', '艮', '震', '养正入口', '动在内而止在外，宜养身养言。', '山下有雷，颐养其正。', '宜管理输入、饮食、言语和念头。', '忌被低质信息和情绪喂养。', ['滋养', '慎言', '输入']),
  h(28, '泽风大过', '兑', '巽', '重压过载', '栋梁承重，局势过度，宜非常处置。', '泽灭木，大者过也。', '宜减压、换梁、用特别方案。', '忌照常推进，问题会被压垮。', ['过载', '非常', '减压']),
  h(29, '坎为水', '坎', '坎', '重险习坎', '险象重复，宜守信、练习、循序出险。', '水洊至，习坎而不失其信。', '宜稳定心神，按流程过关。', '忌惊慌乱动。', ['险阻', '练习', '守信']),
  h(30, '离为火', '离', '离', '明丽附着', '光明相继，宜看清依附关系。', '明两作，离以相续。', '宜找到可靠依托，让表达更清楚。', '忌只求耀眼而失根。', ['明辨', '依附', '照见']),
  h(31, '泽山咸', '兑', '艮', '感应相通', '悦与止相遇，真诚感应可开局。', '山上有泽，彼此相感。', '宜以真实感受沟通。', '忌过度试探。', ['感应', '真诚', '回应']),
  h(32, '雷风恒', '震', '巽', '恒久守常', '动而能入，宜稳定承诺、长期推进。', '雷风相与，恒以久也。', '宜定节律，守住长期主义。', '忌频繁改向。', ['恒心', '秩序', '承诺']),
  h(33, '天山遁', '乾', '艮', '退避保全', '刚健遇止，宜退一步保全大局。', '天下有山，遁而不失其正。', '宜暂避锋芒，保留主动权。', '忌恋战。', ['退避', '保全', '止争']),
  h(34, '雷天大壮', '震', '乾', '强势有节', '阳刚盛大，宜有力而守礼。', '雷在天上，大壮以正。', '宜把强势用在正当处。', '忌凭气势压人。', ['强势', '节制', '正当']),
  h(35, '火地晋', '离', '坤', '渐进上升', '明出地上，宜展示成果、顺势晋升。', '明出地上，进而有光。', '宜主动呈现，让努力被看见。', '忌急功近利。', ['上升', '呈现', '机会']),
  h(36, '地火明夷', '坤', '离', '明入地中', '光明受伤，宜藏光养晦。', '明入地中，宜内明外柔。', '宜保护核心想法，低调行事。', '忌硬碰黑暗局面。', ['藏光', '保护', '韬晦']),
  h(37, '风火家人', '巽', '离', '内外有序', '风自火出，宜正家、正位、正沟通。', '风自火出，家道以正。', '宜明确关系中的责任与秩序。', '忌情绪化处理家内事。', ['家人', '秩序', '沟通']),
  h(38, '火泽睽', '离', '兑', '异中求同', '明与悦相背，分歧显现。', '上火下泽，异而可通。', '宜承认差异，找最低共识。', '忌强求一致。', ['分歧', '差异', '共识']),
  h(39, '水山蹇', '坎', '艮', '险止难行', '前险后止，行路艰难，宜求助转向。', '山上有水，蹇以反身修德。', '宜暂停硬闯，换路线或找支持。', '忌孤身强进。', ['困难', '求助', '转向']),
  h(40, '雷水解', '震', '坎', '化解松绑', '动出险外，郁结可解。', '雷雨作，解其困结。', '宜释放压力，处理拖延的结。', '忌刚解困又制造新负担。', ['化解', '释放', '松绑']),
  h(41, '山泽损', '艮', '兑', '减损成益', '悦被山止，宜做减法。', '山下有泽，损其有余。', '宜删减消耗，把资源给关键处。', '忌舍本逐末。', ['减负', '边界', '收束']),
  h(42, '风雷益', '巽', '震', '增益行动', '风雷相助，宜主动利人利己。', '风雷益，动而入。', '宜学习、协作、把帮助送出去。', '忌只索取不贡献。', ['增益', '支持', '行动']),
  h(43, '泽天夬', '兑', '乾', '决裂决断', '泽上于天，积势将决，宜明快处置。', '泽气上腾，夬以决也。', '宜公开说清，果断切断隐患。', '忌以怒断事。', ['决断', '公开', '切断']),
  h(44, '天风姤', '乾', '巽', '不期而遇', '风行天下，偶遇之缘需辨其正邪。', '天下有风，姤遇而来。', '宜审慎接触新机会。', '忌被突然吸引带偏节奏。', ['相遇', '诱因', '审慎']),
  h(45, '泽地萃', '兑', '坤', '聚合成群', '泽聚于地，人事汇集。', '泽上于地，萃以聚也。', '宜聚人聚资源，设立共同中心。', '忌人多无主。', ['聚合', '资源', '中心']),
  h(46, '地风升', '坤', '巽', '渐次上升', '木生地中，循序而升。', '地中生木，升以渐进。', '宜稳步累积，向上争取空间。', '忌跳级求快。', ['上升', '渐进', '成长']),
  h(47, '泽水困', '兑', '坎', '困中守心', '泽无水而困，外局受限。', '泽中无水，困而不失其所。', '宜守住心志，先解决生存压力。', '忌在困境中自乱阵脚。', ['困顿', '守心', '节用']),
  h(48, '水风井', '坎', '巽', '汲养不移', '井养众人，宜修复稳定供给。', '木上有水，井以养人。', '宜检查基础系统和长期资源。', '忌只换外表不修井道。', ['供给', '基础', '修复']),
  h(49, '泽火革', '兑', '离', '革故更新', '泽火相息，旧局当革。', '泽中有火，革以去故。', '宜在时机成熟时清楚变革。', '忌时机未到就硬改。', ['变革', '更新', '时机']),
  h(50, '火风鼎', '离', '巽', '鼎新成器', '木入火中，旧材可成新器。', '火上有木，鼎以养贤。', '宜重组资源，做成可承载的新结构。', '忌只换口号不换结构。', ['鼎新', '结构', '成器']),
  h(51, '震为雷', '震', '震', '震动惊醒', '雷声重复，惊而后定。', '洊雷震，先惊后省。', '宜把突发当提醒，快速校准。', '忌被惊吓牵着跑。', ['震动', '警醒', '行动']),
  h(52, '艮为山', '艮', '艮', '止息守界', '两山相重，宜止、定、守界。', '兼山艮，止于其所。', '宜停下来整理边界。', '忌该止不止。', ['止息', '边界', '沉静']),
  h(53, '风山渐', '巽', '艮', '渐进有序', '山上有木，成长有序。', '木渐于山，进以礼也。', '宜按阶段推进，不越序。', '忌急于求成。', ['渐进', '礼序', '成长']),
  h(54, '雷泽归妹', '震', '兑', '关系失序', '动而悦，情势易急，名分秩序需谨慎。', '泽上有雷，归妹以终始。', '宜先厘清关系位置与代价。', '忌被一时情动带走。', ['关系', '秩序', '谨慎']),
  h(55, '雷火丰', '震', '离', '盛大明动', '雷电皆至，盛势已临。', '雷电皆至，丰以明断。', '宜在高峰期果断完成关键事。', '忌盛极忘收。', ['丰盛', '明断', '高峰']),
  h(56, '火山旅', '离', '艮', '旅途暂居', '火在山上，明而不久留。', '山上有火，旅以慎行。', '宜轻装、守礼、少承诺。', '忌把临时关系当永久归处。', ['旅居', '谨慎', '暂时']),
  h(57, '巽为风', '巽', '巽', '入微顺入', '风风相续，柔入而渐成。', '随风巽，入而不迫。', '宜用温和持续的方式影响局面。', '忌犹疑无断。', ['顺入', '持续', '影响']),
  h(58, '兑为泽', '兑', '兑', '喜悦沟通', '两泽相连，悦而相应。', '丽泽兑，朋友讲习。', '宜交流、分享、互相启发。', '忌讨好取悦而失真。', ['喜悦', '交流', '回应']),
  h(59, '风水涣', '巽', '坎', '涣散化结', '风行水上，散其郁结。', '风行水上，涣以解散。', '宜疏通情绪和信息堵点。', '忌放任涣散无收束。', ['疏散', '流动', '化结']),
  h(60, '水泽节', '坎', '兑', '节制成度', '泽上有水，容量有限，宜立节度。', '水在泽上，节以制度。', '宜设预算、边界和时间限制。', '忌过度压抑或毫无节制。', ['节制', '边界', '制度']),
  h(61, '风泽中孚', '巽', '兑', '诚信感通', '风行泽上，内诚可感人。', '泽上有风，中孚以内信。', '宜用真实稳定的态度沟通。', '忌口头漂亮而心不诚。', ['诚信', '感通', '内信']),
  h(62, '雷山小过', '震', '艮', '小事过谨', '雷过山上，小事宜谨慎。', '山上有雷，小过以慎行。', '宜小步校准，先低飞。', '忌贪大越界。', ['小步', '谨慎', '校准']),
  h(63, '水火既济', '坎', '离', '事成防乱', '水火相交，阶段已成。', '水在火上，既济而防终乱。', '宜收尾复盘，守住成果。', '忌成功后松懈。', ['完成', '收尾', '防乱']),
  h(64, '火水未济', '离', '坎', '未成待济', '火水未交，事情尚未完成。', '火在水上，未济而求其渡。', '宜补最后短板，谨慎过渡。', '忌临门一脚时冒进。', ['未成', '过渡', '补缺']),
];

const HEXAGRAM_BY_TRIGRAMS = HEXAGRAMS.reduce<Record<string, HexagramMeta>>((result, item) => {
  result[hexagramKey(item.upper, item.lower)] = item;
  return result;
}, {});

export function buildDivinationCasting(input: BuildDivinationCastingInput): BuildDivinationCastingResult {
  const method = input.method || 'split-stalk';
  const flow = input.flow || 'yang';
  const seed = hashString(
    [
      input.userId,
      input.topic,
      input.question || '',
      toDateKey(input.timestamp),
      method,
      flow,
      input.interactionSeed || '',
      input.useBazi ? 'bazi' : '',
      input.useZodiac ? 'zodiac' : '',
      input.useMood ? 'mood' : '',
      input.usePersonality ? 'personality' : '',
    ].join('|'),
  );

  return method === 'draw-lots' ? buildDrawLotsCasting(input, seed, method, flow) : buildSplitStalkCasting(input, seed, method, flow);
}

function buildSplitStalkCasting(
  input: BuildDivinationCastingInput,
  seed: number,
  method: DivinationMethod,
  flow: DivinationFlow,
) {
  const sides = FLOW_SEQUENCE[flow];
  const upperStep = buildSplitStep(input, seed, 0, 8, sides[0], 'upper');
  const lowerStep = buildSplitStep(input, seed, 1, 8, sides[1], 'lower');
  const movingStep = buildSplitStep(input, seed, 2, 6, sides[2], 'moving');
  const upperTrigram = getTrigramByRemainder(upperStep.remainder);
  const lowerTrigram = getTrigramByRemainder(lowerStep.remainder);
  const movingLine = movingStep.remainder;

  return assembleCasting({
    method,
    flow,
    seed,
    upperTrigram,
    lowerTrigram,
    movingLine,
    steps: [
      {
        ...upperStep,
        title: '一分定上卦',
        action: `${sideLabel(upperStep.selectedSide)}取 ${upperStep.selectedCount} 策，余 ${upperStep.remainder}`,
        resultLabel: '上卦',
        resultValue: `${upperTrigram.name}${upperTrigram.symbol}`,
      },
      {
        ...lowerStep,
        title: '二分定下卦',
        action: `${sideLabel(lowerStep.selectedSide)}取 ${lowerStep.selectedCount} 策，余 ${lowerStep.remainder}`,
        resultLabel: '下卦',
        resultValue: `${lowerTrigram.name}${lowerTrigram.symbol}`,
      },
      {
        ...movingStep,
        title: '三分定动爻',
        action: `${sideLabel(movingStep.selectedSide)}取 ${movingStep.selectedCount} 策，余 ${movingStep.remainder}`,
        resultLabel: '动爻',
        resultValue: `${movingLine} 爻`,
      },
    ],
  });
}

function buildDrawLotsCasting(
  input: BuildDivinationCastingInput,
  seed: number,
  method: DivinationMethod,
  flow: DivinationFlow,
) {
  const upperRemainder = normalizeRemainder(hashString(`${seed}|${input.question || ''}|upper`), 8);
  const lowerRemainder = normalizeRemainder(hashString(`${seed}|${input.question || ''}|lower`), 8);
  const movingLine = normalizeRemainder(hashString(`${seed}|${input.question || ''}|moving`), 6);
  const upperTrigram = getTrigramByRemainder(upperRemainder);
  const lowerTrigram = getTrigramByRemainder(lowerRemainder);

  return assembleCasting({
    method,
    flow,
    seed,
    upperTrigram,
    lowerTrigram,
    movingLine,
    steps: [
      {
        key: 'upper',
        title: '一抽定上卦',
        action: '八卦签筒取一签，放回',
        remainder: upperRemainder,
        resultLabel: '上卦',
        resultValue: `${upperTrigram.name}${upperTrigram.symbol}`,
      },
      {
        key: 'lower',
        title: '二抽定下卦',
        action: '八卦签筒再取一签',
        remainder: lowerRemainder,
        resultLabel: '下卦',
        resultValue: `${lowerTrigram.name}${lowerTrigram.symbol}`,
      },
      {
        key: 'moving',
        title: '三抽定动爻',
        action: '六爻签筒取一签',
        remainder: movingLine,
        resultLabel: '动爻',
        resultValue: `${movingLine} 爻`,
      },
    ],
  });
}

function assembleCasting(input: {
  method: DivinationMethod;
  flow: DivinationFlow;
  seed: number;
  upperTrigram: TrigramSeed;
  lowerTrigram: TrigramSeed;
  movingLine: number;
  steps: DivinationCastingStep[];
}): BuildDivinationCastingResult {
  const lines = [...input.lowerTrigram.lines, ...input.upperTrigram.lines];
  const movingLineLabel = resolveMovingLineLabel(input.movingLine, lines);
  const changedLines = [...lines];
  changedLines[input.movingLine - 1] = !changedLines[input.movingLine - 1];
  const changedLower = getTrigramByLines(changedLines.slice(0, 3));
  const changedUpper = getTrigramByLines(changedLines.slice(3, 6));
  const hexagram = buildHexagram(input.upperTrigram, input.lowerTrigram, lines);
  const changedHexagram = buildHexagram(changedUpper, changedLower, changedLines);
  const meta = HEXAGRAM_BY_TRIGRAMS[hexagramKey(input.upperTrigram.name, input.lowerTrigram.name)];

  return {
    method: input.method,
    methodLabel: METHOD_LABELS[input.method],
    flow: input.flow,
    flowLabel: FLOW_LABELS[input.flow],
    seed: input.seed,
    upperTrigram: input.upperTrigram,
    lowerTrigram: input.lowerTrigram,
    movingLine: input.movingLine,
    movingLineLabel,
    hexagram,
    changedHexagram,
    keywords: unique([...(meta?.keywords ?? []), ...input.upperTrigram.keywords, ...input.lowerTrigram.keywords]),
    steps: input.steps,
  };
}

function buildSplitStep(
  input: BuildDivinationCastingInput,
  seed: number,
  index: number,
  divisor: 8 | 6,
  selectedSide: 'left' | 'right',
  key: DivinationCastingStep['key'],
) {
  const splitSeed = hashString(`${seed}|${input.topic}|${input.interactionSeed || ''}|split-${index}`);
  const leftCount = 1 + (splitSeed % (STALK_COUNT - 1));
  const rightCount = STALK_COUNT - leftCount;
  const selectedCount = selectedSide === 'left' ? leftCount : rightCount;
  const remainder = normalizeRemainder(selectedCount, divisor);

  return {
    key,
    leftCount,
    rightCount,
    selectedSide,
    selectedCount,
    remainder,
    title: '',
    action: '',
    resultLabel: '',
    resultValue: '',
  };
}

function buildHexagram(upper: TrigramSeed, lower: TrigramSeed, lines: boolean[]): DivinationHexagram {
  const meta = HEXAGRAM_BY_TRIGRAMS[hexagramKey(upper.name, lower.name)];
  const sequence = meta?.sequence ?? (upper.remainder - 1) * 8 + lower.remainder;
  const name = meta?.name ?? `${upper.name}上${lower.name}下`;
  const judgement = meta?.judgement ?? `${upper.name}${upper.nature}在上，${lower.name}${lower.nature}在下。`;
  const image = meta?.image ?? `上${upper.name}下${lower.name}，象征${upper.quality}与${lower.quality}相遇。`;
  const decision = meta?.decision ?? '宜先辨清局势，再落下一步行动。';
  const caution = meta?.caution ?? '忌急于把一时感受当成全部结论。';

  return {
    id: sequence,
    sequence,
    name,
    symbol: String.fromCodePoint(0x4dbf + sequence),
    upperTrigram: upper.name,
    lowerTrigram: lower.name,
    meaning: meta?.theme ?? `${upper.name}${upper.nature}在上，${lower.name}${lower.nature}在下。`,
    judgement,
    image,
    decision,
    caution,
    level: '中平',
    lines,
    lineReadings: buildHexagramLineReadings({
      sequence,
      name,
      theme: meta?.theme ?? name,
      judgement,
      decision,
      caution,
      lines,
    }),
  };
}

function h(
  sequence: number,
  name: string,
  upper: TrigramName,
  lower: TrigramName,
  theme: string,
  judgement: string,
  image: string,
  decision: string,
  caution: string,
  keywords: string[],
): HexagramMeta {
  return {
    sequence,
    name,
    upper,
    lower,
    theme,
    judgement,
    image,
    decision,
    caution,
    keywords,
  };
}

function hexagramKey(upper: TrigramName, lower: TrigramName) {
  return `${upper}-${lower}`;
}

function getTrigramByRemainder(remainder: number) {
  return TRIGRAMS.find((item) => item.remainder === remainder) || TRIGRAMS[0];
}

function getTrigramByLines(lines: boolean[]) {
  return (
    TRIGRAMS.find((item) => item.lines.every((solid, index) => solid === lines[index])) ||
    TRIGRAMS[0]
  );
}

function resolveMovingLineLabel(movingLine: number, lines: boolean[]) {
  const stem = lines[movingLine - 1] ? '九' : '六';

  if (movingLine === 1) {
    return `初${stem}`;
  }

  if (movingLine === 6) {
    return `上${stem}`;
  }

  return `${stem}${['', '二', '三', '四', '五'][movingLine - 1]}`;
}

function normalizeRemainder(value: number, divisor: 8 | 6) {
  const remainder = value % divisor;
  return remainder === 0 ? divisor : remainder;
}

function sideLabel(side?: 'left' | 'right') {
  return side === 'right' ? '右手' : '左手';
}

function toDateKey(timestamp: number) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function hashString(input: string) {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }

  return Math.abs(hash >>> 0);
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}
