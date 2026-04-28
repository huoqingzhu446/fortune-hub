import { http } from '../services/request';
import { appendQueryString } from '../services/url';
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
  return http.get<ExploreSearchResponse>(
    appendQueryString('/explore/search', {
      keyword: params.keyword,
      type: params.type,
      goal: params.goal?.length ? params.goal.join(',') : undefined,
      sort: params.sort,
    }),
  );
}
