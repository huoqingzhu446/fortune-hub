import { http } from '../services/request';
import { appendQueryString } from '../services/url';
import type {
  MeditationRecordListResponse,
  MeditationRecordDetailResponse,
  MeditationMusicLibraryResponse,
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
  return http.get<MoodRecordDetailResponse>(
    appendQueryString('/record/mood/detail', {
      recordId: params.recordId,
      recordDate: params.recordDate,
    }),
  );
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

export function fetchMeditationMusicLibrary() {
  return http.get<MeditationMusicLibraryResponse>('/record/meditation/music');
}

export function saveMeditationRecord(payload: SaveMeditationRecordPayload) {
  return http.post<SaveMeditationRecordResponse, SaveMeditationRecordPayload>(
    '/record/meditation',
    payload,
  );
}
