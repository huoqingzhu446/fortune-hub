import type { ApiEnvelope } from './auth';

export const zodiacSigns = [
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

export type ZodiacSign = (typeof zodiacSigns)[number];

export type ZodiacViewMode =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'compatibility'
  | 'knowledge';

export interface ZodiacProfileSummary {
  element: string;
  modality: string;
  keywords: string[];
}

export interface ZodiacDailyData {
  zodiac: ZodiacSign | string;
  date: string;
  profile: ZodiacProfileSummary;
  summary: string;
  metrics: {
    love: string;
    career: string;
    wealth: string;
    health: string;
  };
  lucky: {
    color: string;
    number: string;
    direction: string;
  };
  compatibility: {
    bestMatch: string;
    message: string;
  };
  knowledge: string;
  suggestion: string;
}

export interface ZodiacTodayData {
  zodiac: ZodiacSign | string;
  date: string;
  profile: ZodiacProfileSummary;
  score: {
    overall: number;
    love: number;
    career: number;
    wealth: number;
    wellbeing: number;
  };
  theme: {
    title: string;
    summary: string;
    keywords: string[];
  };
  dimensions: Array<{
    key: 'love' | 'career' | 'wealth' | 'wellbeing';
    label: string;
    score: number;
    title: string;
    summary: string;
    action: string;
  }>;
  dayparts: Array<{
    label: string;
    suitable: string;
    avoid: string;
    hint: string;
  }>;
  lucky: {
    color: string;
    number: string;
    direction: string;
    item: string;
  };
  action: {
    id: string;
    title: string;
    description: string;
    difficulty: string;
    checkInText: string;
  };
  compatibility: {
    bestMatch: string;
    message: string;
  };
  sharePoster: {
    title: string;
    subtitle: string;
    accentText: string;
    footerText: string;
    themeName: string;
  };
}

export interface ZodiacWeeklyData {
  zodiac: ZodiacSign | string;
  weekRange: string;
  profile: ZodiacProfileSummary;
  theme: string;
  overview: string;
  rhythm: Array<{
    label: string;
    summary: string;
  }>;
  focus: {
    love: string;
    career: string;
    wealth: string;
    health: string;
  };
  luckyWindow: string;
  bestMatch: string;
  action: string;
  caution: string;
}

export interface ZodiacMonthlyData {
  zodiac: ZodiacSign | string;
  month: string;
  profile: ZodiacProfileSummary;
  theme: {
    title: string;
    summary: string;
  };
  rhythm: Array<{
    label: string;
    summary: string;
  }>;
  focus: {
    relationship: string;
    career: string;
    money: string;
    wellbeing: string;
  };
  opportunities: string[];
  cautions: string[];
  keyDays: string[];
  action: string;
}

export interface ZodiacYearlyData {
  zodiac: ZodiacSign | string;
  year: number;
  profile: ZodiacProfileSummary;
  theme: {
    title: string;
    summary: string;
  };
  quarterForecasts: Array<{
    quarter: string;
    title: string;
    summary: string;
  }>;
  focus: {
    relationship: string;
    career: string;
    money: string;
    wellbeing: string;
  };
  keyMonths: string[];
  anchorAdvice: string;
}

export interface ZodiacCompatibilityData {
  zodiac: ZodiacSign | string;
  partner: ZodiacSign | string;
  score: number;
  level: string;
  summary: string;
  chemistry: {
    emotion: string;
    communication: string;
    growth: string;
  };
  highlights: string[];
  caution: string;
  tips: string[];
}

export interface ZodiacKnowledgeData {
  zodiac: ZodiacSign | string;
  title: string;
  overview: string;
  quickFacts: Array<{
    label: string;
    value: string;
  }>;
  strengths: string[];
  relationshipStyle: string;
  workStyle: string;
  growthTip: string;
  keywords: string[];
}

export type ZodiacDailyResponse = ApiEnvelope<ZodiacDailyData>;
export type ZodiacTodayResponse = ApiEnvelope<ZodiacTodayData>;
export type ZodiacWeeklyResponse = ApiEnvelope<ZodiacWeeklyData>;
export type ZodiacMonthlyResponse = ApiEnvelope<ZodiacMonthlyData>;
export type ZodiacYearlyResponse = ApiEnvelope<ZodiacYearlyData>;
export type ZodiacCompatibilityResponse = ApiEnvelope<ZodiacCompatibilityData>;
export type ZodiacKnowledgeResponse = ApiEnvelope<ZodiacKnowledgeData>;
