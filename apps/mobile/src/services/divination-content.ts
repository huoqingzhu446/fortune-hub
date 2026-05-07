import { appEnv } from '../config/env';
import { http } from './request';
import { resolveUrl } from './url';
import type {
  DivinationHexagram,
  DivinationLineReading,
  DivinationMethod,
  DivinationPersonalizationContext,
  DivinationProfileInsight,
  DivinationTopic,
  DivinationTopicOption,
  DivinationTopicReading,
} from '../types/divination';
import {
  DEFAULT_DIVINATION_RUNTIME_CONFIG,
  normalizeDivinationRuntimeConfig,
  type DivinationFlowOption,
  type DivinationHistoryTab,
  type DivinationHomeFeatureEntry,
  type DivinationLuckyConfig,
  type DivinationMethodOption,
  type DivinationPageTabConfig,
  type DivinationProfileMappingConfig,
  type DivinationRuntimeConfig,
  type DivinationTopicStrategy,
} from './divination-runtime-config';
import { buildTakashimaLineReading } from './divination-line-catalog';

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
  topicOptions: DivinationTopicOption[];
  topicStrategies: Record<DivinationTopic, DivinationTopicStrategy>;
  luckyItems: DivinationLuckyConfig;
  profileMapping: DivinationProfileMappingConfig;
  pageTabs: DivinationPageTabConfig;
}

type DivinationLineBuildInput = {
  sequence: number;
  name: string;
  theme: string;
  judgement: string;
  decision: string;
  caution: string;
  lines: boolean[];
};

type DivinationTopicBuildInput = {
  topic: DivinationTopic;
  hexagram: DivinationHexagram;
  changedHexagram?: DivinationHexagram;
  movingLineReading?: DivinationLineReading | null;
  movingLineLabel: string;
  personalizationContext?: DivinationPersonalizationContext | null;
};

type DivinationContentEnvelope = {
  code?: number;
  message?: string;
  data?: {
    catalog?: Partial<DivinationContentCatalog>;
  };
  timestamp?: string;
};

const DIVINATION_CONTENT_PATH = 'divination/content';

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
  ...DEFAULT_DIVINATION_RUNTIME_CONFIG,
};

let cachedCatalog = DIVINATION_DEFAULT_CONTENT_CATALOG;

export function getDivinationContentCatalog() {
  return cachedCatalog;
}

export function getDivinationRuntimeConfig(): DivinationRuntimeConfig {
  return {
    topicOptions: cachedCatalog.topicOptions,
    topicStrategies: cachedCatalog.topicStrategies,
    luckyItems: cachedCatalog.luckyItems,
    profileMapping: cachedCatalog.profileMapping,
    pageTabs: cachedCatalog.pageTabs,
  };
}

export function getDivinationTopicOptions() {
  return getDivinationRuntimeConfig().topicOptions;
}

export function getDivinationTopicStrategy(topic: DivinationTopic) {
  return getDivinationRuntimeConfig().topicStrategies[topic] || getDivinationRuntimeConfig().topicStrategies.general;
}

export function getDivinationLuckyConfig() {
  return getDivinationRuntimeConfig().luckyItems;
}

export function getDivinationProfileMapping() {
  return getDivinationRuntimeConfig().profileMapping;
}

export function getDivinationPageTabs() {
  return getDivinationRuntimeConfig().pageTabs;
}

export function getDivinationSelectTopicOptions() {
  const { selectTopics } = getDivinationPageTabs();
  return getDivinationTopicOptions().filter((item) => selectTopics.includes(item.value));
}

export function getDivinationHistoryTabs() {
  return getDivinationPageTabs().historyTabs;
}

export function getDivinationReviewScopes() {
  return getDivinationPageTabs().reviewScopes;
}

export function getDivinationReviewTopicTabs(): Array<DivinationHistoryTab & { icon: string }> {
  return getDivinationPageTabs().reviewTopics.map((item) => ({
    ...item,
    icon: item.value === 'all'
      ? '☷'
      : getDivinationTopicOptions().find((topic) => topic.value === item.value)?.icon || '✦',
  }));
}

export function getDivinationHomeFeatures(): DivinationHomeFeatureEntry[] {
  return getDivinationPageTabs().homeFeatures;
}

export function getDivinationCastingMethods(): DivinationMethodOption[] {
  return getDivinationPageTabs().castingMethods;
}

export function getDivinationCastingFlows(): DivinationFlowOption[] {
  return getDivinationPageTabs().castingFlows;
}

export function getDivinationMethodOption(method: DivinationMethod) {
  return getDivinationCastingMethods().find((item) => item.value === method) || getDivinationCastingMethods()[0];
}

export async function ensureDivinationContentCatalog() {
  try {
    const response = await http.get<DivinationContentEnvelope>(
      resolveUrl(DIVINATION_CONTENT_PATH, appEnv.apiBaseUrl),
    );
    const remoteCatalog = response.data?.catalog;
    cachedCatalog = normalizeDivinationContentCatalog(remoteCatalog);
  } catch (error) {
    console.warn('load divination content catalog failed', error);
  }

  return cachedCatalog;
}

export function normalizeDivinationContentCatalog(
  input?: Partial<DivinationContentCatalog> | null,
) {
  const linePositionContent = DIVINATION_DEFAULT_CONTENT_CATALOG.linePositionContent.map(
    (fallback, index) => {
      const sourceList = input?.linePositionContent;
      const source = Array.isArray(sourceList) ? sourceList[index] : undefined;

      return {
        theme: pickString(source?.theme, fallback.theme),
        focus: pickString(source?.focus, fallback.focus),
        action: pickString(source?.action, fallback.action),
        risk: pickString(source?.risk, fallback.risk),
      };
    },
  );

  const topicCopy = Object.entries(DIVINATION_DEFAULT_CONTENT_CATALOG.topicCopy).reduce<
    Record<DivinationTopic, DivinationTopicCopy>
  >((result, [topic, fallback]) => {
    const source = input?.topicCopy?.[topic as DivinationTopic];
    result[topic as DivinationTopic] = {
      title: pickString(source?.title, fallback.title),
      lens: pickString(source?.lens, fallback.lens),
      opportunity: pickString(source?.opportunity, fallback.opportunity),
      risk: pickString(source?.risk, fallback.risk),
      actionPrefix: pickString(source?.actionPrefix, fallback.actionPrefix),
    };
    return result;
  }, {} as Record<DivinationTopic, DivinationTopicCopy>);
  const runtimeConfig = normalizeDivinationRuntimeConfig(input);

  return {
    linePositionContent,
    topicCopy,
    ...runtimeConfig,
  };
}

export function buildHexagramLineReadings(input: DivinationLineBuildInput) {
  return buildHexagramLineReadingsFromCatalog(getDivinationContentCatalog(), input);
}

export function buildTopicReading(input: DivinationTopicBuildInput) {
  return buildTopicReadingFromCatalog(getDivinationContentCatalog(), input);
}

export function buildHexagramLineReadingsFromCatalog(
  catalog: DivinationContentCatalog,
  input: DivinationLineBuildInput,
): DivinationLineReading[] {
  return catalog.linePositionContent.map((lineContent, index) => {
    const line = index + 1;
    const label = resolveMovingLineLabel(line, input.lines);
    const reading = buildTakashimaLineReading({
      sequence: input.sequence,
      name: input.name,
      theme: input.theme,
      judgement: input.judgement,
      decision: input.decision,
      caution: input.caution,
      lines: input.lines,
      line,
      fallbackLabel: label,
      linePosition: lineContent,
    });

    return {
      ...reading,
      line,
      topicReadings: buildLineTopicReadings(
        catalog,
        input,
        line,
        reading.label,
        reading.advice,
        reading.risk || lineContent.risk,
      ),
    };
  });
}

export function buildTopicReadingFromCatalog(
  catalog: DivinationContentCatalog,
  input: DivinationTopicBuildInput,
): DivinationTopicReading {
  const topicCopy = catalog.topicCopy[input.topic] || catalog.topicCopy.general;
  const personalization = input.personalizationContext;
  const movingAdvice =
    input.movingLineReading?.topicReadings?.[input.topic]?.action ||
    input.movingLineReading?.advice ||
    input.hexagram.decision ||
    '';
  const changedText = input.changedHexagram
    ? `变卦「${input.changedHexagram.name}」提示后势：${input.changedHexagram.decision || input.changedHexagram.meaning}`
    : '本卦不变，后势重在守住当前判断。';

  return {
    topic: input.topic,
    title: topicCopy.title,
    summary: joinSentences([
      `${topicCopy.lens}本次占得「${input.hexagram.name}」，${input.movingLineLabel}为关键。`,
      buildProfileLens(personalization, input.topic),
    ]),
    opportunity: joinSentences([
      topicCopy.opportunity,
      buildProfileInsightJudgement(personalization, input.topic),
      personalization?.opportunityHint,
      changedText,
    ]),
    risk: joinSentences([
      topicCopy.risk,
      buildProfileInsightRisk(personalization, input.topic),
      personalization?.riskHint,
      input.movingLineReading?.risk,
    ]),
    action: joinSentences([
      `${topicCopy.actionPrefix}${movingAdvice || input.hexagram.decision || '先完成一件小而确定的事。'}`,
      buildProfileInsightAdvice(personalization, input.topic),
      personalization?.actionHint,
    ]),
  };
}

function buildLineTopicReadings(
  catalog: DivinationContentCatalog,
  input: DivinationLineBuildInput,
  line: number,
  label: string,
  action: string,
  risk: string,
) {
  return Object.entries(catalog.topicCopy).reduce<Partial<Record<DivinationTopic, DivinationTopicReading>>>(
    (result, [topic, topicCopy]) => {
      const typedTopic = topic as DivinationTopic;
      result[typedTopic] = {
        topic: typedTopic,
        title: `${topicCopy.title} · ${label}`,
        summary: `以${topicCopy.lens}来看，「${input.name}」${label}强调${catalog.linePositionContent[line - 1].focus}。`,
        opportunity: topicCopy.opportunity,
        risk: `${topicCopy.risk} ${risk}`,
        action: `${topicCopy.actionPrefix}${line === 5 ? input.decision : action}`,
      };
      return result;
    },
    {},
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

const PROFILE_INSIGHT_WEIGHT_RANK: Record<DivinationProfileInsight['weight'], number> = {
  strong: 3,
  medium: 2,
  light: 1,
};

function buildProfileLens(
  context?: DivinationPersonalizationContext | null,
  topic?: DivinationTopic,
) {
  const insights = selectProfileInsights(context, topic, 2);
  if (insights.length) {
    const insightText = insights
      .map((item) => `${item.title}据「${item.evidence}」取${item.weight === 'strong' ? '重参' : item.weight === 'medium' ? '中参' : '轻参'}`)
      .join('；');
    return `结合画像旁参，${insightText}读法落在「${context?.toneLabel}」：${context?.toneSummary}`;
  }

  if (!context?.signals.length) {
    return '';
  }

  const signalText = context.signals
    .map((item) => `${item.label}为「${item.value}」`)
    .join('，');
  return `结合${signalText}，本次读法落在「${context.toneLabel}」：${context.toneSummary}`;
}

function buildProfileInsightJudgement(
  context?: DivinationPersonalizationContext | null,
  topic?: DivinationTopic,
) {
  const insights = selectProfileInsights(context, topic, 2);
  if (!insights.length) {
    return '';
  }

  return insights.map((item) => item.judgement).join('；');
}

function buildProfileInsightRisk(
  context?: DivinationPersonalizationContext | null,
  topic?: DivinationTopic,
) {
  const insights = selectProfileInsights(context, topic, 2);
  if (!insights.length) {
    return '';
  }

  return unique(insights.map((item) => item.risk)).join(' ');
}

function buildProfileInsightAdvice(
  context?: DivinationPersonalizationContext | null,
  topic?: DivinationTopic,
) {
  const insights = selectProfileInsights(context, topic, 2);
  if (!insights.length) {
    return '';
  }

  return unique(insights.map((item) => item.advice)).join(' ');
}

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

function joinSentences(parts: Array<string | undefined | null>) {
  return parts
    .map((item) => item?.trim())
    .filter((item): item is string => Boolean(item))
    .map(normalizeSentence)
    .join('');
}

function normalizeSentence(text: string) {
  return /[。！？.!?]$/.test(text) ? text : `${text}。`;
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items.filter(Boolean)));
}

function pickString(value: string | undefined, fallback: string) {
  return value?.trim() || fallback;
}
