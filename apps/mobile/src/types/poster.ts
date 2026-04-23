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
  providerPrompt: string;
  width: number;
  height: number;
  size: '1280x1280' | '1088x1472';
  downloadFileName: string;
  generatedAt: string;
  format: 'png';
  svgMarkup: string;
  imageDataUrl: string;
}

export type PosterGenerateResponse = ApiEnvelope<{
  poster: GeneratedPoster;
}>;
