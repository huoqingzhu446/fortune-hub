import { http } from './http';

export type QuestionBankCategory = 'personality' | 'emotion';
export type LifecycleStatus = 'draft' | 'published' | 'archived';

export interface QuestionBankTestSummary {
  id?: string;
  category: QuestionBankCategory;
  categoryLabel: string;
  code: string;
  groupCode: string;
  groupLabel: string;
  title: string;
  subtitle: string;
  description: string;
  questionCount: number;
  optionSchema: 'personality' | 'emotion';
  dimensionLabels?: Record<string, string>;
  status: LifecycleStatus;
  publishedAt: string | null;
  archivedAt: string | null;
  updatedAt: string | null;
}

export interface QuestionBankOption {
  key: string;
  label: string;
  dimension?: string;
  score: number;
}

export interface QuestionBankQuestion {
  id: string;
  questionId: string;
  prompt: string;
  sortOrder: number;
  options: QuestionBankOption[];
}

export interface PersonalityProfileConfig {
  title: string;
  summary: string;
  strengths: string[];
  suggestions: string[];
}

export interface EmotionThresholdConfig {
  maxScore: number;
  level: 'steady' | 'watch' | 'support' | 'urgent';
  title: string;
  subtitle: string;
  summary: string;
  primarySuggestion: string;
  supportSignal: string;
}

export interface SharePosterConfig {
  headlineTemplate: string;
  subtitleTemplate: string;
  accentText: string;
  footerText: string;
  themeName: string;
}

export interface QuestionBankGroup {
  id: string;
  category: QuestionBankCategory;
  code: string;
  label: string;
  description: string;
  sortOrder: number;
  status: LifecycleStatus;
  publishedAt: string | null;
  archivedAt: string | null;
  isDefault: boolean;
}

export interface QuestionBankBaseDetail extends QuestionBankTestSummary {
  intro: string;
  durationMinutes: number;
  tags: string[];
  questions: QuestionBankQuestion[];
}

export interface PersonalityQuestionBankDetail extends QuestionBankBaseDetail {
  optionSchema: 'personality';
  dimensionLabels: Record<string, string>;
  profiles: Record<string, PersonalityProfileConfig>;
  sharePoster: SharePosterConfig;
}

export interface EmotionQuestionBankDetail extends QuestionBankBaseDetail {
  optionSchema: 'emotion';
  disclaimer: string;
  relaxSteps: string[];
  thresholds: EmotionThresholdConfig[];
  sharePoster: SharePosterConfig;
}

export type QuestionBankDetail =
  | PersonalityQuestionBankDetail
  | EmotionQuestionBankDetail;

export interface CreateQuestionBankTestPayload {
  category: QuestionBankCategory;
  code: string;
  groupCode?: string;
  title: string;
  subtitle?: string;
  description?: string;
  cloneFromCode?: string;
}

export interface UpdateQuestionBankDetailPayload {
  title: string;
  subtitle: string;
  description: string;
  intro: string;
  durationMinutes: number;
  tags: string[];
  groupCode: string;
  dimensionLabels?: Record<string, string>;
  profiles?: Record<string, PersonalityProfileConfig>;
  disclaimer?: string;
  relaxSteps?: string[];
  thresholds?: EmotionThresholdConfig[];
  sharePoster: SharePosterConfig;
  questions: Array<{
    questionId?: string;
    prompt: string;
    options: QuestionBankOption[];
  }>;
}

export interface CreateQuestionBankGroupPayload {
  category: QuestionBankCategory;
  code: string;
  label: string;
  description?: string;
}

export async function fetchQuestionBankTests(category?: string) {
  const { data } = await http.get<{
    code: number;
    message: string;
    data: {
      categories: Array<{ value: string; label: string }>;
      tests: QuestionBankTestSummary[];
    };
    timestamp: string;
  }>('/admin/question-bank/tests', {
    params: category ? { category } : undefined,
  });

  return data.data;
}

export async function fetchQuestionBankDetail(category: string, code: string) {
  const { data } = await http.get<{
    code: number;
    message: string;
    data: {
      test: QuestionBankDetail;
    };
    timestamp: string;
  }>(`/admin/question-bank/tests/${category}/${code}`);

  return data.data.test;
}

export async function fetchQuestionBankGroups(category?: string) {
  const { data } = await http.get<{
    code: number;
    message: string;
    data: {
      groups: QuestionBankGroup[];
    };
    timestamp: string;
  }>('/admin/question-bank/groups', {
    params: category ? { category } : undefined,
  });

  return data.data.groups;
}

export async function createQuestionBankTest(payload: CreateQuestionBankTestPayload) {
  const { data } = await http.post<{
    code: number;
    message: string;
    data: {
      test: QuestionBankDetail;
    };
    timestamp: string;
  }>('/admin/question-bank/tests', payload);

  return data.data.test;
}

export async function createQuestionBankGroup(payload: CreateQuestionBankGroupPayload) {
  const { data } = await http.post<{
    code: number;
    message: string;
    data: {
      groups: QuestionBankGroup[];
    };
    timestamp: string;
  }>('/admin/question-bank/groups', payload);

  return data.data.groups;
}

export async function deleteQuestionBankGroup(category: string, code: string) {
  const { data } = await http.delete<{
    code: number;
    message: string;
    data: {
      groups: QuestionBankGroup[];
    };
    timestamp: string;
  }>(`/admin/question-bank/groups/${category}/${code}`);

  return data.data.groups;
}

export async function updateQuestionBankGroupStatus(
  category: string,
  code: string,
  status: LifecycleStatus,
) {
  const { data } = await http.post<{
    code: number;
    message: string;
    data: {
      groups: QuestionBankGroup[];
    };
    timestamp: string;
  }>(`/admin/question-bank/groups/${category}/${code}/status`, { status });

  return data.data.groups;
}

export async function updateQuestionBankDetail(
  category: string,
  code: string,
  payload: UpdateQuestionBankDetailPayload,
) {
  const { data } = await http.put<{
    code: number;
    message: string;
    data: {
      test: QuestionBankDetail;
    };
    timestamp: string;
  }>(`/admin/question-bank/tests/${category}/${code}`, payload);

  return data.data.test;
}

export async function updateQuestionBankTestStatus(
  category: string,
  code: string,
  status: LifecycleStatus,
) {
  const { data } = await http.post<{
    code: number;
    message: string;
    data: {
      test: QuestionBankDetail;
    };
    timestamp: string;
  }>(`/admin/question-bank/tests/${category}/${code}/status`, { status });

  return data.data.test;
}
