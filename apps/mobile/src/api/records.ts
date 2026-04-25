import { http } from '../services/request';
import type {
  MeditationRecordListResponse,
  MeditationRecordDetailResponse,
  RecordOverviewResponse,
  MoodRecordDetailResponse,
  MoodRecordListResponse,
  SaveMeditationRecordPayload,
  SaveMeditationRecordResponse,
  SaveMoodRecordPayload,
  SaveMoodRecordResponse,
  UnifiedRecordListResponse,
} from '../types/records';

export function fetchUnifiedHistory(limit?: number) {
  const suffix = limit ? `?limit=${limit}` : '';
  return http.get<UnifiedRecordListResponse>(`/records${suffix}`);
}

export function fetchRecordOverview() {
  return http.get<RecordOverviewResponse>('/record/overview');
}

export function fetchMoodRecords() {
  return http.get<MoodRecordListResponse>('/record/mood');
}

export function fetchMoodRecordDetail(params: {
  recordId?: string;
  recordDate?: string;
}) {
  const searchParams = new URLSearchParams();

  if (params.recordId) {
    searchParams.set('recordId', params.recordId);
  }

  if (params.recordDate) {
    searchParams.set('recordDate', params.recordDate);
  }

  return http.get<MoodRecordDetailResponse>(`/record/mood/detail?${searchParams.toString()}`);
}

export function saveMoodRecord(payload: SaveMoodRecordPayload) {
  return http.post<SaveMoodRecordResponse, SaveMoodRecordPayload>(
    '/record/mood',
    payload,
  );
}

export function fetchMeditationRecords() {
  return http.get<MeditationRecordListResponse>('/record/meditation');
}

export function fetchMeditationRecordDetail(recordId: string) {
  return http.get<MeditationRecordDetailResponse>(
    `/record/meditation/detail?recordId=${encodeURIComponent(recordId)}`,
  );
}

export function saveMeditationRecord(payload: SaveMeditationRecordPayload) {
  return http.post<SaveMeditationRecordResponse, SaveMeditationRecordPayload>(
    '/record/meditation',
    payload,
  );
}
