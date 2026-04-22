import type { ApiEnvelope } from './auth';

export interface BaziAnalyzePayload {
  birthday: string;
  birthTime: string;
  gender?: 'male' | 'female' | 'unknown';
}

export interface BaziElementItem {
  name: string;
  value: number;
}

export interface BaziResult {
  title: string;
  subtitle: string;
  summary: string;
  chart: {
    yearPillar: string;
    monthPillar: string;
    dayPillar: string;
    hourPillar: string;
  };
  baseProfile: {
    birthday: string;
    birthTime: string;
    birthMomentLabel: string;
    gender: string;
    zodiac: string;
    dayMaster: string;
  };
  dominantElement: BaziElementItem;
  supportElement: BaziElementItem;
  fiveElements: BaziElementItem[];
  keywords: string[];
  reading: {
    career: string;
    relationship: string;
    rhythm: string;
  };
  practicalTips: {
    favorableDirection: string;
    supportiveColor: string;
    dailyFocus: string;
  };
  complianceNotice: string;
  generatedAt: string;
}

export interface BaziAnalyzeData {
  recordId: string | null;
  isSaved: boolean;
  result: BaziResult;
}

export interface BaziHistoryItem {
  id: string;
  title: string;
  subtitle: string;
  summary: string;
  dominantElementName: string;
  yearPillar: string;
  dayPillar: string;
  createdAt: string;
}

export interface BaziHistoryData {
  items: BaziHistoryItem[];
}

export type BaziAnalyzeResponse = ApiEnvelope<BaziAnalyzeData>;
export type BaziHistoryResponse = ApiEnvelope<BaziHistoryData>;
