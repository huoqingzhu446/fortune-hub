import { http } from '../services/request';
import type {
  ZodiacCompatibilityResponse,
  ZodiacDailyResponse,
  ZodiacKnowledgeResponse,
  ZodiacMonthlyResponse,
  ZodiacTodayResponse,
  ZodiacWeeklyResponse,
  ZodiacYearlyResponse,
} from '../types/zodiac';

function buildQuery(params: Record<string, string | number | undefined>) {
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');

  return query ? `?${query}` : '';
}

export function fetchZodiacDaily(zodiac: string) {
  return http.get<ZodiacDailyResponse>(`/zodiac/daily${buildQuery({ zodiac })}`);
}

export function fetchZodiacToday(zodiac: string) {
  return http.get<ZodiacTodayResponse>(`/zodiac/today${buildQuery({ zodiac })}`);
}

export function fetchZodiacWeekly(zodiac: string) {
  return http.get<ZodiacWeeklyResponse>(`/zodiac/weekly${buildQuery({ zodiac })}`);
}

export function fetchZodiacMonthly(zodiac: string, month?: string) {
  return http.get<ZodiacMonthlyResponse>(`/zodiac/monthly${buildQuery({ zodiac, month })}`);
}

export function fetchZodiacYearly(zodiac: string, year?: number) {
  return http.get<ZodiacYearlyResponse>(`/zodiac/yearly${buildQuery({ zodiac, year })}`);
}

export function fetchZodiacCompatibility(zodiac: string, partner?: string) {
  return http.get<ZodiacCompatibilityResponse>(
    `/zodiac/compatibility${buildQuery({ zodiac, partner })}`,
  );
}

export function fetchZodiacKnowledge(zodiac: string) {
  return http.get<ZodiacKnowledgeResponse>(`/zodiac/knowledge${buildQuery({ zodiac })}`);
}
