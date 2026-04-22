import { http } from '../services/request';
import type {
  EmotionHistoryResponse,
  EmotionSubmitPayload,
  EmotionSubmitResponse,
  EmotionTestDetailResponse,
  EmotionTestListResponse,
} from '../types/emotion';

export function fetchEmotionTests() {
  return http.get<EmotionTestListResponse>('/assessments/emotion/tests');
}

export function fetchEmotionTestDetail(code: string) {
  return http.get<EmotionTestDetailResponse>(`/assessments/emotion/tests/${code}`);
}

export function submitEmotionAssessment(
  code: string,
  payload: EmotionSubmitPayload,
) {
  return http.post<EmotionSubmitResponse, EmotionSubmitPayload>(
    `/assessments/emotion/tests/${code}/submit`,
    payload,
  );
}

export function fetchEmotionHistory() {
  return http.get<EmotionHistoryResponse>('/assessments/emotion/history');
}
