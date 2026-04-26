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

export interface BaziDayMasterAnalysis {
  dayStem: string;
  dayElement: string;
  polarity: 'yang' | 'yin';
  monthBranch: string;
  monthElement: string;
  strengthLevel: 'strong' | 'weak' | 'balanced';
  supportScore: number;
  pressureScore: number;
  balanceScore: number;
  usefulElements: Array<{ name: string; reason: string }>;
  avoidElements: Array<{ name: string; reason: string }>;
  tenGodDistribution: Array<{ name: string; count: number }>;
}

export interface BaziMajorLuck {
  available: boolean;
  reason?: string;
  gender: 'male' | 'female' | 'unknown';
  direction: 'forward' | 'backward' | 'unknown';
  startAgeYears: number | null;
  startAgeMonths: number | null;
  startAgeDays: number | null;
  startAgeHours: number | null;
  cycles: Array<{
    index: number;
    ganZhi: string;
    startAge: number;
    endAge: number;
    startYear: number;
    endYear: number;
    tenGod: string;
    element: string;
  }>;
}

export interface BaziAnnualFortune {
  year: number;
  nominalAge: number;
  ganZhi: string;
  tenGod: string;
  element: string;
  relation: 'support' | 'drain' | 'wealth' | 'officer' | 'peer';
}

export interface BaziResult {
  algorithmVersion: string;
  inputSnapshot: {
    birthday: string;
    birthTime: string;
    gender: 'male' | 'female' | 'unknown';
    mode: 'lite' | 'professional';
    calendarType: 'solar';
    birthPlace: string;
    longitude: number;
    latitude: number;
    timezoneOffset: number;
  };
  correctionSnapshot: {
    enabled: boolean;
    method: 'none' | 'longitude-true-solar-time';
    originalBirthday: string;
    originalBirthTime: string;
    adjustedBirthday: string;
    adjustedBirthTime: string;
    offsetMinutes: number;
    longitude: number;
    latitude: number;
    timezoneOffset: number;
    standardLongitude: number;
  };
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
    adjustedBirthday?: string;
    adjustedBirthTime?: string;
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
  dayMasterAnalysis: BaziDayMasterAnalysis;
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
    algorithmVersion: string;
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
    dayMasterAnalysis: BaziDayMasterAnalysis;
    majorLuck: BaziMajorLuck;
    annualFortunes: BaziAnnualFortune[];
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
  sourceCode: string;
  isProfessional: boolean;
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

export interface BaziProfessionalDetail {
  recordId: string;
  title: string;
  subtitle: string;
  summary: string;
  algorithmVersion: string;
  inputSnapshot: BaziResult['inputSnapshot'];
  correctionSnapshot: BaziResult['correctionSnapshot'];
  chart: BaziResult['chart'];
  baseProfile: BaziResult['baseProfile'];
  dominantElement: BaziElementItem;
  supportElement: BaziElementItem;
  fiveElements: BaziElementItem[];
  dayMasterAnalysis: BaziDayMasterAnalysis;
  professional: NonNullable<BaziResult['professional']>;
  annualFortunes: BaziAnnualFortune[];
  majorLuck: BaziMajorLuck;
  reading: BaziResult['reading'];
  practicalTips: BaziResult['practicalTips'];
  complianceNotice: string;
  generatedAt: string;
}

export interface BaziProfessionalDetailData {
  detail: BaziProfessionalDetail;
}

export type BaziAnalyzeResponse = ApiEnvelope<BaziAnalyzeData>;
export type BaziHistoryResponse = ApiEnvelope<BaziHistoryData>;
export type BaziBirthPlaceSearchResponse = ApiEnvelope<BaziBirthPlaceSearchData>;
export type BaziProfessionalDetailResponse = ApiEnvelope<BaziProfessionalDetailData>;
