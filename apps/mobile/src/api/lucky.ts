import { http } from '../services/request';
import type { LuckySignDetailResponse, LuckyTodayResponse } from '../types/lucky';

export function fetchLuckyToday() {
  return http.get<LuckyTodayResponse>('/lucky/today');
}

export function fetchLuckySignDetail(bizCode: string) {
  return http.get<LuckySignDetailResponse>(`/lucky/signs/${bizCode}`);
}
