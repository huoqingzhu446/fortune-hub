import type { ApiEnvelope } from './auth';

export interface PersonalityTestSummary {
  code: string;
  title: string;
  subtitle: string;
  description: string;
  durationMinutes: number;
  questionCount: number;
  tags: string[];
}

export interface PersonalityQuestionOption {
  key: string;
  label: string;
}

export interface PersonalityQuestion {
  id: string;
  prompt: string;
  options: PersonalityQuestionOption[];
}

export interface PersonalityTestDetail extends PersonalityTestSummary {
  intro: string;
  questions: PersonalityQuestion[];
}

export interface PersonalityDimensionScore {
  key: string;
  label: string;
  value: number;
  ratio: number;
}

export interface PersonalityResult {
  title: string;
  subtitle: string;
  summary: string;
  level: string;
  score: number;
  dominantDimension: {
    key: string;
    label: string;
    value: number;
  };
  dimensionScores: PersonalityDimensionScore[];
  strengths: string[];
  suggestions: string[];
  sharePoster: {
    themeName: string;
    title: string;
    subtitle: string;
    accentText: string;
    footerText: string;
  };
  completedAt: string;
}

export interface PersonalityHistoryItem {
  id: string;
  testCode: string | null;
  title: string;
  score: number | null;
  level: string | null;
  subtitle: string;
  summary: string;
  dominantDimensionLabel: string;
  completedAt: string;
}

export interface PersonalityTestListData {
  tests: PersonalityTestSummary[];
}

export interface PersonalityTestDetailData {
  test: PersonalityTestDetail;
}

export interface PersonalitySubmitPayload {
  answers: Array<{
    questionId: string;
    optionKey: string;
  }>;
}

export interface PersonalitySubmitData {
  recordId: string | null;
  isSaved: boolean;
  test: PersonalityTestSummary;
  result: PersonalityResult;
}

export interface PersonalityHistoryData {
  items: PersonalityHistoryItem[];
}

export type PersonalityTestListResponse = ApiEnvelope<PersonalityTestListData>;
export type PersonalityTestDetailResponse = ApiEnvelope<PersonalityTestDetailData>;
export type PersonalitySubmitResponse = ApiEnvelope<PersonalitySubmitData>;
export type PersonalityHistoryResponse = ApiEnvelope<PersonalityHistoryData>;
