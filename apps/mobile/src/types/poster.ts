import type { ApiEnvelope } from './auth';

export interface GeneratedPoster {
  posterId: string;
  sourceType: string;
  title: string;
  subtitle: string;
  accentText: string;
  footerText: string;
  themeName: string;
  providerImageUrl: string | null;
  providerRequestId?: string | null;
  providerError?: string | null;
  providerPrompt: string;
  width: number;
  height: number;
  size: '1280x1280' | '1088x1472';
  downloadFileName: string;
  generatedAt: string;
  format: 'png';
  svgMarkup: string;
  imageDataUrl: string;
  fileUrl?: string | null;
}

export type PosterGenerateResponse = ApiEnvelope<{
  poster: GeneratedPoster;
}>;

export interface PosterJob {
  jobId: string;
  userId: string | null;
  jobType: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  request: Record<string, unknown>;
  result: GeneratedPoster | null;
  fileUrl: string | null;
  errorMessage: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PosterJobResponse = ApiEnvelope<{
  job: PosterJob;
}>;
