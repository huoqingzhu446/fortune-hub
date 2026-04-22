import { http } from '../services/request';
import type {
  BaziAnalyzePayload,
  BaziAnalyzeResponse,
  BaziHistoryResponse,
} from '../types/bazi';

export function analyzeBazi(payload: BaziAnalyzePayload) {
  return http.post<BaziAnalyzeResponse, BaziAnalyzePayload>('/bazi/analyze', payload);
}

export function fetchBaziHistory() {
  return http.get<BaziHistoryResponse>('/bazi/history');
}
