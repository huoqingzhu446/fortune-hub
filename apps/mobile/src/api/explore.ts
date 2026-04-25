import { http } from '../services/request';
import type {
  ExploreIndexResponse,
  ExploreSearchResponse,
} from '../types/explore';

export function fetchExploreIndex() {
  return http.get<ExploreIndexResponse>('/explore/index');
}

export function fetchExploreSearch(params: {
  keyword: string;
  type?: string;
  goal?: string[];
  sort?: 'recommended' | 'related' | 'latest';
}) {
  const searchParams = new URLSearchParams();
  searchParams.set('keyword', params.keyword);

  if (params.type) {
    searchParams.set('type', params.type);
  }

  if (params.goal?.length) {
    searchParams.set('goal', params.goal.join(','));
  }

  if (params.sort) {
    searchParams.set('sort', params.sort);
  }

  return http.get<ExploreSearchResponse>(`/explore/search?${searchParams.toString()}`);
}
