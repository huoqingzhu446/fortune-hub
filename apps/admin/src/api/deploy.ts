import { http } from './http';

export interface LastDeploy {
  status: string;
  startedAt: string | null;
  finishedAt: string | null;
  duration: number | null;
  triggeredBy: string | null;
  commitHash: string | null;
}

export interface DeployStatus {
  deploying: boolean;
  lastDeploy: LastDeploy | null;
}

interface DeployStatusResponse {
  code: number;
  message: string;
  data: DeployStatus;
  timestamp: string;
}

interface TriggerDeployResponse {
  code: number;
  message: string;
  data: Record<string, unknown>;
  timestamp: string;
}

interface DeployLogsResponse {
  code: number;
  message: string;
  data: {
    log: string;
  };
  timestamp: string;
}

export async function getDeployStatus() {
  const { data } = await http.get<DeployStatusResponse>('/admin/ops/deploy/status');
  return data.data;
}

export async function triggerDeploy() {
  const { data } = await http.post<TriggerDeployResponse>('/admin/ops/deploy/trigger');
  return data;
}

export async function getDeployLogs() {
  const { data } = await http.get<DeployLogsResponse>('/admin/ops/deploy/logs');
  return data.data;
}
