import { http } from '../services/request';
import type { ExploreIndexResponse } from '../types/explore';

export function fetchExploreIndex() {
  return http.get<ExploreIndexResponse>('/explore/index');
}
