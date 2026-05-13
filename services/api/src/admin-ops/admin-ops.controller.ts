import { Body, Controller, Get, Param, Post, Put, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import type { AdminProfile } from '../admin-auth/admin-auth.service';
import { AdminSessionGuard } from '../admin-auth/admin-session.guard';
import { AdminOpsService } from './admin-ops.service';

@Controller('admin/ops')
@UseGuards(AdminSessionGuard)
export class AdminOpsController {
  constructor(private readonly adminOpsService: AdminOpsService) {}

  @Get('release-readiness')
  getReleaseReadiness() {
    return this.adminOpsService.getReleaseReadiness();
  }

  @Get('users')
  listUsers(
    @Query('keyword') keyword?: string,
    @Query('vipStatus') vipStatus?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminOpsService.listUsers({
      keyword,
      vipStatus,
      limit: Number(limit) || undefined,
    });
  }

  @Get('users/export')
  async exportUsers(
    @Res() res: Response,
    @Query('keyword') keyword?: string,
    @Query('vipStatus') vipStatus?: string,
  ) {
    const csv = await this.adminOpsService.exportUsersCsv({ keyword, vipStatus });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="users-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    );
    res.send(csv);
  }

  @Get('users/:id')
  getUserDetail(@Param('id') id: string) {
    return this.adminOpsService.getUserDetail(id);
  }

  @Put('users/:id/membership')
  updateUserMembership(
    @Param('id') id: string,
    @Body() dto: { vipStatus: string; vipExpiredAt?: string | null },
    @Req() request: Request & { admin?: AdminProfile },
  ) {
    return this.adminOpsService.updateUserMembership(id, dto, request.admin?.username ?? null);
  }

  @Get('orders')
  listOrders(
    @Query('status') status?: string,
    @Query('keyword') keyword?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminOpsService.listOrders({
      status,
      keyword,
      limit: Number(limit) || undefined,
    });
  }

  @Get('notification-logs')
  listNotificationLogs(
    @Query('scene') scene?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminOpsService.listNotificationLogs({
      scene,
      status,
      limit: Number(limit) || undefined,
    });
  }

  @Get('audit-logs')
  listAuditLogs(
    @Query('action') action?: string,
    @Query('resourceType') resourceType?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminOpsService.listAuditLogs({
      action,
      resourceType,
      limit: Number(limit) || undefined,
    });
  }

  @Get('zhipu-image/status')
  getZhipuImageStatus() {
    return this.adminOpsService.getZhipuImageStatus();
  }

  @Post('zhipu-image/test')
  testZhipuImage(
    @Body() dto: { prompt?: string },
    @Req() request: Request & { admin?: AdminProfile },
  ) {
    return this.adminOpsService.testZhipuImage(request.admin?.username ?? null, dto.prompt);
  }
}
