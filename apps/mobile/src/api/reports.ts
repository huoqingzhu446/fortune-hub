import { http } from '../services/request';
import type { ReportResponse } from '../types/report';

export function fetchReport(recordId: string) {
  return http.get<ReportResponse>(`/reports/${recordId}`);
}
