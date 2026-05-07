import { http } from '../services/request';
import type {
  DivinationReviewListResponse,
  DivinationReviewSyncPayload,
  DivinationReviewSyncResponse,
} from '../types/divination';

export function fetchDivinationReviews() {
  return http.get<DivinationReviewListResponse>('/divination/reviews');
}

export function syncDivinationReview(payload: DivinationReviewSyncPayload) {
  return http.post<DivinationReviewSyncResponse, DivinationReviewSyncPayload>(
    '/divination/reviews/sync',
    payload,
  );
}
