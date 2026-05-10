import { http } from '../services/request';
import type { ApiEnvelope } from '../types/auth';

export interface DailyPulseRecord {
  id: string;
  recordDate: string;
  mood: string;
  intensity: number;
  category: string | null;
  note: string | null;
  createdAt: string;
}

export interface SavePulseResponse extends ApiEnvelope<{
  pulse: DailyPulseRecord;
  streak: number;
  response: string;
}> {}

export interface PulseHistoryResponse extends ApiEnvelope<{
  items: DailyPulseRecord[];
}> {}

export interface PulseStreakResponse extends ApiEnvelope<{
  streak: number;
}> {}

export function saveDailyPulse(payload: {
  mood: string;
  intensity: number;
  category?: string;
  note?: string;
}) {
  return http.post<SavePulseResponse, typeof payload>('/me/pulse', payload);
}

export function fetchPulseHistory(from?: string, to?: string) {
  return http.get<PulseHistoryResponse>('/me/pulse', { from, to } as Record<string, string>);
}

export function fetchPulseStreak() {
  return http.get<PulseStreakResponse>('/me/pulse/streak');
}
