import { http } from '../services/request';
import type {
  RecordOverviewResponse,
  UnifiedRecordListResponse,
} from '../types/records';

export function fetchUnifiedHistory(limit?: number) {
  const suffix = limit ? `?limit=${limit}` : '';
  return http.get<UnifiedRecordListResponse>(`/records${suffix}`);
}

export function fetchRecordOverview() {
  return http.get<RecordOverviewResponse>('/record/overview');
}
