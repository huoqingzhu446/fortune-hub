import { http } from '../services/request';
import type {
  GenerateLuckyWallpaperPayload,
  LuckyRecommendationsResponse,
  LuckySignDetailResponse,
  LuckyTodayResponse,
  LuckyYearlyResponse,
  LuckyWallpaperResponse,
} from '../types/lucky';

export function fetchLuckyToday() {
  return http.get<LuckyTodayResponse>('/lucky/today');
}

export function fetchLuckySignDetail(bizCode: string) {
  return http.get<LuckySignDetailResponse>(`/lucky/signs/${bizCode}`);
}

export function fetchLuckyYearly(year?: number) {
  const suffix = year ? `?year=${encodeURIComponent(year)}` : '';
  return http.get<LuckyYearlyResponse>(`/lucky/yearly${suffix}`);
}

export function fetchLuckyRecommendations() {
  return http.get<LuckyRecommendationsResponse>('/lucky/recommendations');
}

export function generateLuckyWallpaper(payload: GenerateLuckyWallpaperPayload) {
  return http.post<LuckyWallpaperResponse, GenerateLuckyWallpaperPayload>(
    '/lucky/wallpaper/generate',
    payload,
  );
}
