import { http } from '../services/request';
import type {
  ProfileMetricDetailResponse,
  ProfileMetricKey,
} from '../types/profile-metrics';

export function fetchProfileMetricDetail(
  metricKey: ProfileMetricKey,
  range = '30d',
) {
  return http.get<ProfileMetricDetailResponse>(
    `/user/metrics/${encodeURIComponent(metricKey)}/detail?range=${encodeURIComponent(range)}`,
  );
}
