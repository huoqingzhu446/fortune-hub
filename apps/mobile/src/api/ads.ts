import { http } from '../services/request';
import type { ReportResponse } from '../types/report';

export function verifyRewardUnlock(recordId: string, slotCode: string) {
  return http.post<ReportResponse, { recordId: string; slotCode: string }>(
    '/ads/reward/verify',
    {
      recordId,
      slotCode,
    },
  );
}
