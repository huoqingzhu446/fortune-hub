import type { ApiEnvelope } from './auth';

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

export interface DivinationProfileInsight {
  key: DivinationPersonalizationKey;
  title: string;
  evidence: string;
  judgement: string;
  advice: string;
  risk: string;
  weight: 'light' | 'medium' | 'strong';
  topics?: DivinationTopic[];
}

export type DivinationPersonalizationState = 'active' | 'missing' | 'disabled';

export type DivinationPersonalizationMissReason =
  | 'no-data'
  | 'api-failed'
  | 'not-logged-in'
  | 'disabled';

export interface DivinationPersonalizationDimensionState {
  key: DivinationPersonalizationKey;
  label: string;
  enabled: boolean;
  state: DivinationPersonalizationState;
  statusLabel: string;
  valueLabel: string;
  summary: string;
  source: 'local' | 'remote' | 'none';
  reason?: DivinationPersonalizationMissReason;
  updatedAt?: number;
}

export interface DivinationPersonalizationContext {
  enabledKeys: DivinationPersonalizationKey[];
  activeKeys: DivinationPersonalizationKey[];
  signals: DivinationPersonalizationSignal[];
  profileInsights: DivinationProfileInsight[];
  dimensionStates: DivinationPersonalizationDimensionState[];
  hasPartialMiss: boolean;
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

export interface DivinationPersonalizationSnapshot extends DivinationPersonalizationContext {
  generatedAt: number;
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
  readingFlow?: DivinationReadingFlow;
  review?: DivinationReview;
  personalizationSnapshot?: DivinationPersonalizationSnapshot;
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
  sequence?: number;
  line: number;
  label: string;
  theme: string;
  text: string;
  classicText?: string;
  takashimaText?: string;
  modernText?: string;
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

export interface DivinationReadingFlow {
  hexagramTrend: string;
  movingLine: string;
  changedTrend: string;
  topicJudgement: string;
  practicalAdvice: string;
  profileReference?: string;
}

export interface DivinationReview {
  resultId: string;
  favorite: boolean;
  outcome: 'pending' | 'fulfilled' | 'unfulfilled';
  note: string;
  preMood?: string;
  preMoodIntensity?: number;
  postMood?: string;
  postMoodIntensity?: number;
  expectation?: string;
  updatedAt: number;
}

export interface DivinationReviewEntry {
  result: DivinationResult;
  review: DivinationReview;
}

export interface DivinationReviewRemoteItem {
  id: string;
  resultId: string;
  favorite: boolean;
  outcome: DivinationReview['outcome'];
  note: string;
  topic: string;
  title: string;
  summary: string;
  resultSnapshot: DivinationResult | null;
  preMood: string;
  preMoodIntensity: number | null;
  postMood: string;
  postMoodIntensity: number | null;
  expectation: string;
  createdAt: string;
  updatedAt: string;
}

export interface DivinationReviewSyncPayload {
  resultId: string;
  favorite?: boolean;
  outcome?: DivinationReview['outcome'];
  note?: string;
  topic?: string;
  title?: string;
  summary?: string;
  resultSnapshot?: DivinationResult;
  preMood?: string;
  preMoodIntensity?: number;
  postMood?: string;
  postMoodIntensity?: number;
  expectation?: string;
}

export type DivinationReviewListResponse = ApiEnvelope<{
  items: DivinationReviewRemoteItem[];
}>;

export type DivinationReviewSyncResponse = ApiEnvelope<{
  item: DivinationReviewRemoteItem;
}>;

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
