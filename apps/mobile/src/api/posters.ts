import { http } from '../services/request';
import type { PosterGenerateResponse } from '../types/poster';

export function generateReportPoster(recordId: string) {
  return http.post<PosterGenerateResponse, { recordId: string }>('/posters/generate', {
    recordId,
  });
}

export function generateLuckySignPoster(bizCode: string) {
  return http.post<
    PosterGenerateResponse,
    { sourceType: 'lucky_sign'; bizCode: string }
  >('/posters/generate', {
    sourceType: 'lucky_sign',
    bizCode,
  });
}

export function generateTodayIndexPoster() {
  return http.post<
    PosterGenerateResponse,
    { sourceType: 'today_index'; size: '1088x1472' }
  >('/posters/generate', {
    sourceType: 'today_index',
    size: '1088x1472',
  });
}
