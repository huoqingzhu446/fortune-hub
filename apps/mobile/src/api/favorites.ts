import { http } from '../services/request';
import type {
  FavoriteListResponse,
  ToggleFavoritePayload,
  ToggleFavoriteResponse,
} from '../types/favorite';

export function fetchFavorites() {
  return http.get<FavoriteListResponse>('/favorites');
}

export function toggleFavorite(payload: ToggleFavoritePayload) {
  return http.post<ToggleFavoriteResponse, ToggleFavoritePayload>(
    '/favorites/toggle',
    payload,
  );
}
