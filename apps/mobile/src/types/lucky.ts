import type { ApiEnvelope } from './auth';

export interface LuckyScoreMetric {
  label: string;
  value: string;
  hint: string;
}

export interface LuckyTodaySign {
  bizCode: string;
  title: string;
  summary: string;
  tag: string;
  mantra: string;
  accent: string;
}

export interface LuckyRecommendationItem {
  bizCode: string;
  title: string;
  summary: string;
  category: string;
  fitScore: number;
  highlight: string;
  useMoment: string;
  styleHint: string;
  palette: string[];
  wallpaperPrompt: string;
}

export interface LuckyWallpaperTheme {
  id: string;
  title: string;
  prompt: string;
  palette: string[];
  mood: string;
}

export interface LuckyTodayData {
  profile: {
    personalized: boolean;
    nickname: string | null;
    zodiac: string | null;
    dominantElement: string;
    guidance: string;
  };
  scores: {
    today: LuckyScoreMetric;
    annual: LuckyScoreMetric;
  };
  sign: LuckyTodaySign;
  actionTips: string[];
  recommendations: LuckyRecommendationItem[];
  wallpaperThemes: LuckyWallpaperTheme[];
}

export interface LuckySignDetailData {
  profile: {
    personalized: boolean;
    zodiac: string | null;
    dominantElement: string;
  };
  sign: {
    bizCode: string;
    title: string;
    summary: string;
    tag: string;
    interpretation: string;
    mantra: string;
    favorableWindow: string;
    goodFor: string;
    avoid: string;
    suggestions: string[];
  };
}

export type LuckyTodayResponse = ApiEnvelope<LuckyTodayData>;
export type LuckySignDetailResponse = ApiEnvelope<LuckySignDetailData>;
