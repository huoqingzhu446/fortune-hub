import { http } from '../services/request';
import type {
  GenerateLuckyWallpaperPayload,
  LuckyRecommendationsResponse,
  LuckySignDetailResponse,
  LuckyTodayResponse,
  LuckyYearlyResponse,
  LuckyWallpaperJobResponse,
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

export function createLuckyWallpaperJob(payload: GenerateLuckyWallpaperPayload) {
  return http.post<LuckyWallpaperJobResponse, GenerateLuckyWallpaperPayload>(
    '/lucky/wallpaper/jobs',
    payload,
  );
}

export function fetchLuckyWallpaperJob(jobId: string) {
  return http.get<LuckyWallpaperJobResponse>(
    `/lucky/wallpaper/jobs/${encodeURIComponent(jobId)}`,
  );
}

export async function generateLuckyWallpaperAsync(payload: GenerateLuckyWallpaperPayload) {
  const response = await createLuckyWallpaperJob(payload);
  const jobId = response.data.job.jobId;

  for (let index = 0; index < 40; index += 1) {
    const jobResponse = await fetchLuckyWallpaperJob(jobId);
    const job = jobResponse.data.job;

    if (job.status === 'completed') {
      if (!job.result) {
        throw new Error('壁纸任务没有返回结果');
      }
      return job.result;
    }

    if (job.status === 'failed') {
      throw new Error(job.errorMessage || '壁纸生成失败');
    }

    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  throw new Error('壁纸生成仍在处理中，请稍后刷新');
}
