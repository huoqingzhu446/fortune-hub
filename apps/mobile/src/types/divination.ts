export type DivinationTopic =
  | 'general'
  | 'love'
  | 'career'
  | 'wealth'
  | 'emotion'
  | 'relationship'
  | 'growth';

export type DivinationMethod = 'split-stalk' | 'draw-lots';

export type DivinationFlow = 'yang' | 'yin';

export interface DivinationPersonalizationFlags {
  useBazi: boolean;
  useZodiac: boolean;
  useMood: boolean;
  usePersonality: boolean;
}

export type DivinationPersonalizationKey = 'bazi' | 'zodiac' | 'mood' | 'personality';

export type DivinationInterpretationTone = 'move' | 'clarify' | 'soften';

export interface DivinationPersonalizationSignal {
  key: DivinationPersonalizationKey;
  label: string;
  value: string;
  summary: string;
}

export interface DivinationPersonalizationContext {
  enabledKeys: DivinationPersonalizationKey[];
  activeKeys: DivinationPersonalizationKey[];
  signals: DivinationPersonalizationSignal[];
  tone: DivinationInterpretationTone;
  toneLabel: string;
  toneSummary: string;
  opportunityHint: string;
  riskHint: string;
  actionHint: string;
  scoreAdjustments: {
    overall: number;
    emotion: number;
    action: number;
  };
  moodScore?: number;
  zodiacScore?: number;
}

export interface DivinationRequest extends DivinationPersonalizationFlags {
  userId: string;
  topic: DivinationTopic;
  question?: string;
  timestamp: number;
  method?: DivinationMethod;
  flow?: DivinationFlow;
  interactionSeed?: string;
}

export interface DivinationHexagram {
  id: number;
  sequence?: number;
  name: string;
  symbol: string;
  upperTrigram: string;
  lowerTrigram: string;
  meaning: string;
  judgement?: string;
  image?: string;
  decision?: string;
  caution?: string;
  level: '大吉' | '吉' | '小吉' | '中平' | '小凶' | '凶';
  lines: boolean[];
  lineReadings?: DivinationLineReading[];
}

export interface DivinationResult {
  id: string;
  userId: string;
  topic: DivinationTopic;
  topicLabel: string;
  question?: string;
  hexagram: DivinationHexagram;
  changingLines: number[];
  changedHexagram?: {
    id: number;
    name: string;
    meaning: string;
    symbol?: string;
    upperTrigram?: string;
    lowerTrigram?: string;
    lines?: boolean[];
    judgement?: string;
    image?: string;
    decision?: string;
    caution?: string;
    lineReadings?: DivinationLineReading[];
  };
  casting?: DivinationCastingDetail;
  oracle?: DivinationOracle;
  topicReading?: DivinationTopicReading;
  review?: DivinationReview;
  scores: {
    overall: number;
    emotion: number;
    action: number;
  };
  keywords: string[];
  summary: string;
  analysis: string;
  personalizedReason: string;
  reminders: string[];
  advice: string[];
  suitable: string[];
  avoid: string[];
  lucky: {
    color: string;
    number: number;
    direction: string;
    element: string;
  };
  createdAt: number;
}

export interface DivinationLineReading {
  line: number;
  label: string;
  theme: string;
  text: string;
  advice: string;
  risk?: string;
  topicReadings?: Partial<Record<DivinationTopic, DivinationTopicReading>>;
}

export interface DivinationCastingStep {
  key: 'upper' | 'lower' | 'moving';
  title: string;
  action: string;
  remainder: number;
  resultLabel: string;
  resultValue: string;
  leftCount?: number;
  rightCount?: number;
  selectedSide?: 'left' | 'right';
  selectedCount?: number;
}

export interface DivinationCastingDetail {
  method: DivinationMethod;
  methodLabel: string;
  flow: DivinationFlow;
  flowLabel: string;
  movingLine: number;
  movingLineLabel: string;
  steps: DivinationCastingStep[];
}

export interface DivinationOracle {
  title: string;
  subject: string;
  situation: string;
  moving: string;
  tendency: string;
  action: string;
}

export interface DivinationTopicReading {
  topic: DivinationTopic;
  title: string;
  summary: string;
  opportunity: string;
  risk: string;
  action: string;
}

export interface DivinationReview {
  resultId: string;
  favorite: boolean;
  outcome: 'pending' | 'fulfilled' | 'unfulfilled';
  note: string;
  updatedAt: number;
}

export interface DivinationReviewEntry {
  result: DivinationResult;
  review: DivinationReview;
}

export interface DivinationTopicOption {
  value: DivinationTopic;
  label: string;
  subtitle: string;
  icon: string;
}

export interface DivinationHistoryTrendPoint {
  label: string;
  value: number;
}
