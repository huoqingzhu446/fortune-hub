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
    points: Array<{
      day: string;
      value: number;
    }>;
  };
  recentRecords: UnifiedRecordItem[];
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
