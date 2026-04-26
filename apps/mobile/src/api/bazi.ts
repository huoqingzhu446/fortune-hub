import { http } from '../services/request';
import type {
  BaziAnalyzePayload,
  BaziAnalyzeResponse,
  BaziBirthPlaceSearchResponse,
  BaziHistoryResponse,
  BaziProfessionalDetailResponse,
} from '../types/bazi';

export function analyzeBazi(payload: BaziAnalyzePayload) {
  return http.post<BaziAnalyzeResponse, BaziAnalyzePayload>('/bazi/analyze', payload);
}

export function analyzeProfessionalBazi(payload: BaziAnalyzePayload) {
  return http.post<BaziAnalyzeResponse, BaziAnalyzePayload>(
    '/bazi/professional/analyze',
    {
      ...payload,
      mode: 'professional',
    },
  );
}

export function fetchBaziHistory() {
  return http.get<BaziHistoryResponse>('/bazi/history');
}

export function fetchProfessionalBaziDetail(recordId: string) {
  return http.get<BaziProfessionalDetailResponse>(
    `/bazi/professional/records/${encodeURIComponent(recordId)}/detail`,
  );
}

export function searchBaziBirthPlaces(keyword: string, limit = 10) {
  const searchParams = new URLSearchParams({
    keyword,
    limit: String(limit),
  });

  return http.get<BaziBirthPlaceSearchResponse>(`/bazi/birth-places?${searchParams.toString()}`);
}
