import { Injectable, Logger } from '@nestjs/common';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { RedisService } from '../redis/redis.service';

const DEPLOY_DIR = '/app/deploy-trigger';
const TRIGGER_FILE = join(DEPLOY_DIR, 'trigger.json');
const RESULT_FILE = join(DEPLOY_DIR, 'result.json');
const LOG_FILE = join(DEPLOY_DIR, 'deploy.log');

const DEPLOY_LOCK_KEY = 'deploy:lock';
const DEPLOY_LOCK_TTL = 10 * 60; // 10 minutes
const COOLDOWN_SECONDS = 5 * 60; // 5 minutes
const POLL_INTERVAL_MS = 5_000;
const POLL_MAX_DURATION_MS = DEPLOY_LOCK_TTL * 1000;

interface TriggerPayload {
  action: string;
  branch: string;
  triggeredBy: string;
  triggeredAt: string;
}

export interface DeployResult {
  status: 'success' | 'failed';
  startedAt: string;
  finishedAt: string;
  duration: number;
  triggeredBy: string;
  commitHash: string;
}

@Injectable()
export class AdminOpsDeployService {
  private readonly logger = new Logger(AdminOpsDeployService.name);

  constructor(private readonly redisService: RedisService) {}

  async triggerDeploy(triggeredBy: string) {
    // Check if already deploying
    const lockValue = await this.redisService.get(DEPLOY_LOCK_KEY);
    if (lockValue) {
      return { conflict: true as const };
    }

    // Check cooldown
    const cooldownRemaining = await this.getCooldownRemaining();
    if (cooldownRemaining > 0) {
      return { cooldown: true as const, remainingSeconds: cooldownRemaining };
    }

    // Set Redis lock
    const lockSet = await this.redisService.set(
      DEPLOY_LOCK_KEY,
      JSON.stringify({ triggeredBy, triggeredAt: new Date().toISOString() }),
      DEPLOY_LOCK_TTL,
    );
    if (!lockSet) {
      return { conflict: true as const };
    }

    // Write trigger.json
    const payload: TriggerPayload = {
      action: 'deploy',
      branch: 'main',
      triggeredBy,
      triggeredAt: new Date().toISOString(),
    };

    try {
      writeFileSync(TRIGGER_FILE, JSON.stringify(payload, null, 2), 'utf-8');
    } catch (error) {
      // Failed to write trigger file - release lock
      await this.redisService.del(DEPLOY_LOCK_KEY);
      this.logger.error(`Failed to write trigger.json: ${this.formatError(error)}`);
      throw error;
    }

    // Start background polling to release lock when deploy completes
    this.startDeployPolling();

    return {
      conflict: false as const,
      cooldown: false as const,
      triggeredAt: payload.triggeredAt,
    };
  }

  async getDeployStatus() {
    const lockValue = await this.redisService.get(DEPLOY_LOCK_KEY);
    const deploying = !!lockValue;

    let lastDeploy: DeployResult | null = null;

    if (existsSync(RESULT_FILE)) {
      try {
        const content = readFileSync(RESULT_FILE, 'utf-8');
        lastDeploy = JSON.parse(content) as DeployResult;
      } catch {
        this.logger.warn('Failed to read or parse result.json');
      }
    }

    return { deploying, lastDeploy };
  }

  async getDeployLogs() {
    if (!existsSync(LOG_FILE)) {
      return { log: '' };
    }

    try {
      const content = readFileSync(LOG_FILE, 'utf-8');
      const lines = content.split('\n');

      // Return last 500 lines max
      const lastLines = lines.slice(-500).join('\n');
      return { log: lastLines };
    } catch {
      this.logger.warn('Failed to read deploy.log');
      return { log: '' };
    }
  }

  private async getCooldownRemaining(): Promise<number> {
    if (!existsSync(RESULT_FILE)) {
      return 0;
    }

    try {
      const content = readFileSync(RESULT_FILE, 'utf-8');
      const result = JSON.parse(content) as DeployResult;

      if (!result.finishedAt) {
        return 0;
      }

      const finishedAt = new Date(result.finishedAt).getTime();
      const now = Date.now();
      const elapsed = (now - finishedAt) / 1000;

      if (elapsed >= COOLDOWN_SECONDS) {
        return 0;
      }

      return Math.ceil(COOLDOWN_SECONDS - elapsed);
    } catch {
      return 0;
    }
  }

  private startDeployPolling() {
    const startTime = Date.now();

    const timer = setInterval(async () => {
      try {
        const elapsed = Date.now() - startTime;

        // Max wait reached - lock will expire via TTL anyway
        if (elapsed >= POLL_MAX_DURATION_MS) {
          clearInterval(timer);
          this.logger.warn('Deploy polling timed out, lock will expire via TTL');
          return;
        }

        // Check if trigger.json still exists
        if (!existsSync(TRIGGER_FILE)) {
          // Trigger file has been consumed - deploy likely finished
          await this.redisService.del(DEPLOY_LOCK_KEY);
          clearInterval(timer);
          this.logger.log('Deploy completed, lock released');
          return;
        }
      } catch (error) {
        this.logger.error(`Deploy polling error: ${this.formatError(error)}`);
      }
    }, POLL_INTERVAL_MS);
  }

  private formatError(error: unknown) {
    return error instanceof Error ? error.message : String(error);
  }
}
