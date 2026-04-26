import { http } from '../services/request';
import type { PosterGenerateResponse, PosterJob, PosterJobResponse } from '../types/poster';

const POSTER_GENERATION_TIMEOUT = 60000;

export function generateReportPoster(recordId: string) {
  return http.post<PosterGenerateResponse, { recordId: string }>('/posters/generate', {
    recordId,
  }, undefined, POSTER_GENERATION_TIMEOUT);
}

export function generateLuckySignPoster(bizCode: string) {
  return http.post<
    PosterGenerateResponse,
    { sourceType: 'lucky_sign'; bizCode: string }
  >('/posters/generate', {
    sourceType: 'lucky_sign',
    bizCode,
  }, undefined, POSTER_GENERATION_TIMEOUT);
}

export function generateTodayIndexPoster() {
  return http.post<
    PosterGenerateResponse,
    { sourceType: 'today_index'; size: '1088x1472' }
  >('/posters/generate', {
    sourceType: 'today_index',
    size: '1088x1472',
  }, undefined, POSTER_GENERATION_TIMEOUT);
}

export function generateZodiacTodayPoster(zodiac: string) {
  return http.post<
    PosterGenerateResponse,
    { sourceType: 'zodiac_today'; bizCode: string; size: '1088x1472' }
  >('/posters/generate', {
    sourceType: 'zodiac_today',
    bizCode: zodiac,
    size: '1088x1472',
  }, undefined, POSTER_GENERATION_TIMEOUT);
}

export function createPosterJob(payload: {
  recordId?: string;
  sourceType?: 'lucky_sign' | 'today_index' | 'zodiac_today';
  bizCode?: string;
  size?: '1280x1280' | '1088x1472';
}) {
  return http.post<PosterJobResponse, typeof payload>('/posters/jobs', payload);
}

export function fetchPosterJob(jobId: string) {
  return http.get<PosterJobResponse>(`/posters/jobs/${encodeURIComponent(jobId)}`);
}

export async function waitPosterJob(
  jobId: string,
  options: { attempts?: number; intervalMs?: number } = {},
) {
  const attempts = options.attempts ?? 40;
  const intervalMs = options.intervalMs ?? 1500;

  for (let index = 0; index < attempts; index += 1) {
    const response = await fetchPosterJob(jobId);
    const job = response.data.job;

    if (job.status === 'completed') {
      return job;
    }

    if (job.status === 'failed') {
      throw new Error(job.errorMessage || '海报生成失败');
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error('海报生成仍在处理中，请稍后刷新');
}

export async function generateReportPosterAsync(recordId: string) {
  const response = await createPosterJob({ recordId });
  const job = await waitPosterJob(response.data.job.jobId);
  if (!job.result) {
    throw new Error('海报任务没有返回结果');
  }
  return job.result;
}

export async function generateLuckySignPosterAsync(bizCode: string) {
  const response = await createPosterJob({ sourceType: 'lucky_sign', bizCode });
  const job = await waitPosterJob(response.data.job.jobId);
  if (!job.result) {
    throw new Error('海报任务没有返回结果');
  }
  return job.result;
}

export async function generateTodayIndexPosterAsync() {
  const response = await createPosterJob({ sourceType: 'today_index', size: '1088x1472' });
  const job = await waitPosterJob(response.data.job.jobId);
  if (!job.result) {
    throw new Error('海报任务没有返回结果');
  }
  return job.result;
}

export async function generateZodiacTodayPosterAsync(zodiac: string) {
  const response = await createPosterJob({
    sourceType: 'zodiac_today',
    bizCode: zodiac,
    size: '1088x1472',
  });
  const job = await waitPosterJob(response.data.job.jobId);
  if (!job.result) {
    throw new Error('海报任务没有返回结果');
  }
  return job.result;
}
