import type { ApiEnvelope } from './auth';

export interface EmotionTestSummary {
  code: string;
  title: string;
  subtitle: string;
  description: string;
  durationMinutes: number;
  questionCount: number;
  tags: string[];
}

export interface EmotionQuestionOption {
  key: string;
  label: string;
}

export interface EmotionQuestion {
  id: string;
  prompt: string;
  options: EmotionQuestionOption[];
}

export interface EmotionTestDetail extends EmotionTestSummary {
  intro: string;
  disclaimer: string;
  questions: EmotionQuestion[];
}

export interface EmotionResult {
  title: string;
  subtitle: string;
  summary: string;
  riskLevel: 'steady' | 'watch' | 'support' | 'urgent';
  score: number;
  scoreRangeLabel: string;
  primarySuggestion: string;
  supportSignal: string;
  relaxSteps: string[];
  disclaimer: string;
  completedAt: string;
}

export interface EmotionHistoryItem {
  id: string;
  testCode: string | null;
  title: string;
  score: number | null;
  level: string | null;
  subtitle: string;
  summary: string;
  supportSignal: string;
  completedAt: string;
}

export interface EmotionTestListData {
  tests: EmotionTestSummary[];
}

export interface EmotionTestDetailData {
  test: EmotionTestDetail;
}

export interface EmotionSubmitPayload {
  answers: Array<{
    questionId: string;
    optionKey: string;
  }>;
}

export interface EmotionSubmitData {
  recordId: string | null;
  isSaved: boolean;
  test: EmotionTestSummary;
  result: EmotionResult;
}

export interface EmotionHistoryData {
  items: EmotionHistoryItem[];
}

export type EmotionTestListResponse = ApiEnvelope<EmotionTestListData>;
export type EmotionTestDetailResponse = ApiEnvelope<EmotionTestDetailData>;
export type EmotionSubmitResponse = ApiEnvelope<EmotionSubmitData>;
export type EmotionHistoryResponse = ApiEnvelope<EmotionHistoryData>;
