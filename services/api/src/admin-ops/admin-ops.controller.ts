import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminSessionGuard } from '../admin-auth/admin-session.guard';
import { AdminOpsService } from './admin-ops.service';

@Controller('admin/ops')
@UseGuards(AdminSessionGuard)
export class AdminOpsController {
  constructor(private readonly adminOpsService: AdminOpsService) {}

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

  @Get('ad-unlocks')
  listAdUnlocks(@Query('limit') limit?: string) {
    return this.adminOpsService.listAdUnlocks({
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
}
