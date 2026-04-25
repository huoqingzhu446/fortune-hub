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
  themeKey?: string;
}

export interface LuckyRecommendationItem {
  bizCode: string;
  title: string;
  summary: string;
  category: string;
  fitScore: number;
  fitTags: string[];
  highlight: string;
  supportiveFocus: string;
  useMoment: string;
  styleHint: string;
  palette: string[];
  wallpaperPrompt: string;
}

export interface LuckyWallpaperTheme {
  id: string;
  sourceBizCode: string;
  title: string;
  prompt: string;
  palette: string[];
  mood: string;
}

export interface MeditationMusicItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'sleep' | 'breath' | 'focus' | 'healing';
  durationMinutes: number;
  atmosphere: string;
  previewUrl: string;
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
    sharePoster: {
      themeName: string;
      title: string;
      subtitle: string;
      accentText: string;
    footerText: string;
    };
    themeKey?: string;
  };
}

export interface LuckyYearlyData {
  year: number;
  profile: {
    personalized: boolean;
    nickname: string | null;
    zodiac: string | null;
    dominantElement: string;
  };
  score: LuckyScoreMetric;
  theme: {
    title: string;
    summary: string;
    themeKey: string;
  };
  quarters: Array<{
    label: string;
    title: string;
    summary: string;
  }>;
  annualFocus: string[];
}

export interface LuckyRecommendationsData {
  profile: {
    personalized: boolean;
    zodiac: string | null;
    dominantElement: string;
  };
  themeKey: string;
  items: LuckyRecommendationItem[];
}

export interface GenerateLuckyWallpaperPayload {
  sourceBizCode?: string;
  title?: string;
  prompt?: string;
  mood?: string;
  palette?: string[];
  aspectRatio?: '9:16' | '16:9' | '1:1';
}

export interface LuckyWallpaperData {
  wallpaper: {
    title: string;
    subtitle: string;
    guidance: string;
    prompt: string;
    palette: string[];
    mood: string;
    aspectRatio: '9:16' | '16:9' | '1:1';
    width: number;
    height: number;
    format: 'svg';
    generatedAt: string;
    downloadFileName: string;
    svgMarkup: string;
    imageDataUrl: string;
  };
}

export type LuckyTodayResponse = ApiEnvelope<LuckyTodayData>;
export type LuckySignDetailResponse = ApiEnvelope<LuckySignDetailData>;
export type LuckyYearlyResponse = ApiEnvelope<LuckyYearlyData>;
export type LuckyRecommendationsResponse = ApiEnvelope<LuckyRecommendationsData>;
export type LuckyWallpaperResponse = ApiEnvelope<LuckyWallpaperData>;
