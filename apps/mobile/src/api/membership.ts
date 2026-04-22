import { http } from '../services/request';
import type { MembershipStatusResponse } from '../types/membership';

export function fetchMembershipStatus() {
  return http.get<MembershipStatusResponse>('/membership/status');
}
