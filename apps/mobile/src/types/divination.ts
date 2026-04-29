export type DivinationTopic =
  | 'general'
  | 'love'
  | 'career'
  | 'wealth'
  | 'emotion'
  | 'relationship'
  | 'growth';

export interface DivinationPersonalizationFlags {
  useBazi: boolean;
  useZodiac: boolean;
  useMood: boolean;
  usePersonality: boolean;
}

export interface DivinationRequest extends DivinationPersonalizationFlags {
  userId: string;
  topic: DivinationTopic;
  question?: string;
  timestamp: number;
}

export interface DivinationHexagram {
  id: number;
  name: string;
  symbol: string;
  upperTrigram: string;
  lowerTrigram: string;
  meaning: string;
  level: '大吉' | '吉' | '小吉' | '中平' | '小凶' | '凶';
  lines: boolean[];
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
  };
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
