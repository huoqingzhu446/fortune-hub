import { http } from '../services/request';
import type {
  PersonalityHistoryResponse,
  PersonalitySubmitPayload,
  PersonalitySubmitResponse,
  PersonalityTestDetailResponse,
  PersonalityTestListResponse,
} from '../types/assessment';

export function fetchPersonalityTests() {
  return http.get<PersonalityTestListResponse>('/assessments/personality/tests');
}

export function fetchPersonalityTestDetail(code: string) {
  return http.get<PersonalityTestDetailResponse>(`/assessments/personality/tests/${code}`);
}

export function submitPersonalityAssessment(
  code: string,
  payload: PersonalitySubmitPayload,
) {
  return http.post<PersonalitySubmitResponse, PersonalitySubmitPayload>(
    `/assessments/personality/tests/${code}/submit`,
    payload,
  );
}

export function fetchPersonalityHistory() {
  return http.get<PersonalityHistoryResponse>('/assessments/personality/history');
}
