import { Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type { AdminProfile } from '../admin-auth/admin-auth.service';
import { AdminSessionGuard } from '../admin-auth/admin-session.guard';
import { AdminOpsDeployService } from './admin-ops-deploy.service';

@Controller('admin/ops/deploy')
@UseGuards(AdminSessionGuard)
export class AdminOpsDeployController {
  constructor(private readonly deployService: AdminOpsDeployService) {}

  @Get('status')
  async getDeployStatus() {
    const { deploying, lastDeploy } = await this.deployService.getDeployStatus();
    return this.buildEnvelope({ deploying, lastDeploy });
  }

  @Post('trigger')
  @HttpCode(HttpStatus.ACCEPTED)
  async triggerDeploy(@Req() request: Request & { admin?: AdminProfile }) {
    const result = await this.deployService.triggerDeploy(request.admin?.username ?? 'unknown');

    if (result.conflict) {
      return {
        code: 409,
        message: '部署正在进行中，请稍后再试',
        data: null,
        timestamp: new Date().toISOString(),
      };
    }

    if (result.cooldown) {
      return {
        code: 429,
        message: `部署冷却中，请 ${result.remainingSeconds} 秒后再试`,
        data: { remainingSeconds: result.remainingSeconds },
        timestamp: new Date().toISOString(),
      };
    }

    return {
      code: 202,
      message: '部署已触发',
      data: { triggeredAt: result.triggeredAt },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('logs')
  async getDeployLogs() {
    const { log } = await this.deployService.getDeployLogs();
    return this.buildEnvelope({ log });
  }

  private buildEnvelope<TData>(data: TData) {
    return {
      code: 0,
      message: 'ok',
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
