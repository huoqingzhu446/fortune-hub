import type { ApiEnvelope } from './auth';

export interface BaziAnalyzePayload {
  birthday: string;
  birthTime: string;
  gender?: 'male' | 'female' | 'unknown';
  mode?: 'lite' | 'professional';
  birthPlace?: string;
  longitude?: number;
  latitude?: number;
  timezoneOffset?: number;
}

export interface BaziBirthPlace {
  code: string;
  label: string;
  province: string;
  country: string;
  longitude: number;
  latitude: number;
  timezoneOffset: number;
  keywords: string[];
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
    birthPlace?: string;
    longitude?: number;
    latitude?: number;
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
  professional?: {
    mode: 'professional';
    library: string;
    adjustedBirthday: string;
    adjustedBirthTime: string;
    birthPlace: string;
    trueSolarOffsetMinutes: number;
    longitude: number;
    latitude: number;
    timezoneOffset: number;
    monthRule: string;
    lunar: {
      year: number;
      month: number;
      day: number;
      yearInChinese: string;
      monthInChinese: string;
      dayInChinese: string;
    };
    tenGods: {
      year: string;
      month: string;
      day: string;
      time: string;
    };
    hiddenStems: {
      year: string[];
      month: string[];
      day: string[];
      time: string[];
    };
    naYin: {
      year: string;
      month: string;
      day: string;
      time: string;
    };
    regressionSamples: Array<Record<string, string>>;
  };
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

export interface BaziBirthPlaceSearchData {
  items: BaziBirthPlace[];
}

export type BaziAnalyzeResponse = ApiEnvelope<BaziAnalyzeData>;
export type BaziHistoryResponse = ApiEnvelope<BaziHistoryData>;
export type BaziBirthPlaceSearchResponse = ApiEnvelope<BaziBirthPlaceSearchData>;
