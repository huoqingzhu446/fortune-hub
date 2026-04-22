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
