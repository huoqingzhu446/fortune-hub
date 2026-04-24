import { http } from '../services/request';
import type { ProfilePageResponse } from '../types/profile';

export function fetchProfilePage() {
  return http.get<ProfilePageResponse>('/user/profile');
}
