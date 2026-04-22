import { http } from '../services/request';
import type {
  GenerateLuckyWallpaperPayload,
  LuckySignDetailResponse,
  LuckyTodayResponse,
  LuckyWallpaperResponse,
} from '../types/lucky';

export function fetchLuckyToday() {
  return http.get<LuckyTodayResponse>('/lucky/today');
}

export function fetchLuckySignDetail(bizCode: string) {
  return http.get<LuckySignDetailResponse>(`/lucky/signs/${bizCode}`);
}

export function generateLuckyWallpaper(payload: GenerateLuckyWallpaperPayload) {
  return http.post<LuckyWallpaperResponse, GenerateLuckyWallpaperPayload>(
    '/lucky/wallpaper/generate',
    payload,
  );
}
