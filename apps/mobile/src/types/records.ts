import type { ApiEnvelope } from './auth';

export interface UnifiedRecordItem {
  id: string;
  recordType: string;
  recordTypeLabel: string;
  sourceCode: string | null;
  title: string;
  score: number | null;
  level: string | null;
  summary: string;
  subtitle: string;
  detailHint: string;
  completedAt: string;
  route: string;
  isFullReportUnlocked: boolean;
}

export interface UnifiedRecordListData {
  items: UnifiedRecordItem[];
}

export type UnifiedRecordListResponse = ApiEnvelope<UnifiedRecordListData>;

export interface RecordCalendarDay {
  date: string;
  day: number;
  moodType: 'calm' | 'low' | 'anxious' | 'happy' | 'tired';
  hasRecord: boolean;
}

export interface MoodJournalItem {
  id: string;
  recordDate: string;
  moodType: 'calm' | 'low' | 'anxious' | 'happy' | 'tired';
  moodScore: number;
  emotionTags: string[];
  content: string;
  updatedAt: string;
  route: string;
}

export interface MeditationLogItem {
  id: string;
  recordDate: string;
  title: string;
  category: string;
  durationMinutes: number;
  completed: boolean;
  summary: string;
  updatedAt: string;
  route: string;
}

export interface RecordOverviewData {
  isLoggedIn: boolean;
  overview: {
    recordedDays: number;
    emotionalStability: number;
    healingProgress: number;
    encouragement: string;
    actionText: string;
  };
  calendar: {
    monthLabel: string;
    weekdays: string[];
    days: RecordCalendarDay[];
    legend: Array<{
      type: 'calm' | 'low' | 'anxious' | 'happy' | 'tired';
      label: string;
    }>;
  };
  trend: {
    summary: string;
    hasEnoughData: boolean;
    points: Array<{
      day: string;
      value: number | null;
    }>;
  };
  moodRecords: MoodJournalItem[];
  testRecords: UnifiedRecordItem[];
  meditationRecords: MeditationLogItem[];
  growth: {
    continuousDays: number;
    monthKeywords: string;
  };
  favorites: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    action: string;
    route: string;
  }>;
}

export type RecordOverviewResponse = ApiEnvelope<RecordOverviewData>;

export interface MoodRecordListData {
  items: MoodJournalItem[];
}

export interface MeditationRecordListData {
  items: MeditationLogItem[];
}

export interface SaveMoodRecordPayload {
  recordDate: string;
  moodType: 'calm' | 'low' | 'anxious' | 'happy' | 'tired';
  moodScore: number;
  emotionTags?: string[];
  content?: string;
}

export interface SaveMeditationRecordPayload {
  recordDate: string;
  title: string;
  category?: string;
  durationMinutes: number;
  completed?: boolean;
  summary?: string;
}

export type MoodRecordListResponse = ApiEnvelope<MoodRecordListData>;
export type MeditationRecordListResponse = ApiEnvelope<MeditationRecordListData>;
export type SaveMoodRecordResponse = ApiEnvelope<{ item: MoodJournalItem }>;
export type SaveMeditationRecordResponse = ApiEnvelope<{ item: MeditationLogItem }>;
