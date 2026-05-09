import type { ApiEnvelope } from './auth';

export type ProfileMetricKey =
  | 'fortune_index'
  | 'mood_days'
  | 'explore_reports'
  | 'lucky_energy';

export interface ProfileMetricPoint {
  date: string;
  value: number | null;
  label: string;
}

export interface ProfileMetricBreakdownItem {
  label: string;
  value: string;
  hint?: string;
}

export interface ProfileMetricHistoryItem {
  id: string;
  date: string;
  title: string;
  summary: string;
  sourceType: string;
  sourceTypeLabel: string;
  route: string;
  happenedAt: string;
  value?: number | null;
  unit?: string;
  valueDelta?: number | null;
}

export interface ProfileMetricDetailData {
  metric: {
    key: ProfileMetricKey;
    title: string;
    value: number;
    unit: string;
    label: string;
    summary: string;
    hasData: boolean;
    updatedAt: string;
  };
  trend: {
    range: string;
    points: ProfileMetricPoint[];
    delta: number;
    direction: 'up' | 'down' | 'flat';
  };
  breakdown: ProfileMetricBreakdownItem[];
  history: {
    items: ProfileMetricHistoryItem[];
    nextCursor: string | null;
  };
  snapshots: Array<{
    id: string;
    date: string;
    value: number | null;
    label: string;
    unit: string;
  }>;
}

export type ProfileMetricDetailResponse =
  ApiEnvelope<ProfileMetricDetailData>;
