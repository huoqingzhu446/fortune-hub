import type { ApiEnvelope } from './auth';

export interface GeneratedPoster {
  posterId: string;
  title: string;
  subtitle: string;
  accentText: string;
  footerText: string;
  themeName: string;
  providerImageUrl: string | null;
  providerPrompt: string;
  downloadFileName: string;
  generatedAt: string;
  format: 'svg';
  svgMarkup: string;
  imageDataUrl: string;
}

export type PosterGenerateResponse = ApiEnvelope<{
  poster: GeneratedPoster;
}>;
