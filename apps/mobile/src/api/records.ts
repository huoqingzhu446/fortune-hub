import { http } from '../services/request';
import type { UnifiedRecordListResponse } from '../types/records';

export function fetchUnifiedHistory(limit?: number) {
  const suffix = limit ? `?limit=${limit}` : '';
  return http.get<UnifiedRecordListResponse>(`/records${suffix}`);
}
