import { Body, Controller, Delete, Get, Headers, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type { AdminProfile } from '../admin-auth/admin-auth.service';
import { AdminSessionGuard } from '../admin-auth/admin-session.guard';
import { AuthService } from '../auth/auth.service';
import { RunNotificationDto } from './dto/run-notification.dto';
import { SubscribeNotificationDto } from './dto/subscribe-notification.dto';
import { UnsubscribeNotificationDto } from './dto/unsubscribe-notification.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly authService: AuthService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get('subscriptions')
  async getSubscriptions(@Headers('authorization') authorization?: string) {
    const user = await this.authService.requireUserFromAuthorization(authorization);
    return this.notificationsService.getMySubscriptions(user);
  }

  @Post('subscribe')
  async subscribe(
    @Body() dto: SubscribeNotificationDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.authService.requireUserFromAuthorization(authorization);
    return this.notificationsService.subscribe(user, dto);
  }

  @Delete('subscribe')
  async unsubscribe(
    @Body() dto: UnsubscribeNotificationDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.authService.requireUserFromAuthorization(authorization);
    return this.notificationsService.unsubscribe(user, dto);
  }
}

@Controller('admin/notifications')
@UseGuards(AdminSessionGuard)
export class AdminNotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('logs')
  listLogs(
    @Query('scene') scene?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notificationsService.listDeliveryLogs({
      scene,
      status,
      limit: Number(limit) || undefined,
    });
  }

  @Post('run')
  async run(
    @Body() dto: RunNotificationDto,
    @Req() request: Request & { admin?: AdminProfile },
  ) {
    await this.notificationsService.auditAdminRun({
      actorId: request.admin?.username ?? null,
      action: dto.mode === 'send' ? 'notification.run_send' : 'notification.queue',
      scene: dto.scene || 'daily_reminder',
    });
    if (dto.mode === 'send') {
      return this.notificationsService.runNow(dto.scene || 'daily_reminder');
    }

    return this.notificationsService.queueDailyNotifications(dto.scene || 'daily_reminder');
  }

  @Post('retry')
  async retry(@Req() request: Request & { admin?: AdminProfile }) {
    await this.notificationsService.auditAdminRun({
      actorId: request.admin?.username ?? null,
      action: 'notification.retry',
    });
    return this.notificationsService.processDueRetries();
  }

  @Post('cleanup-expired')
  async cleanupExpired(@Req() request: Request & { admin?: AdminProfile }) {
    await this.notificationsService.auditAdminRun({
      actorId: request.admin?.username ?? null,
      action: 'notification.cleanup_expired',
    });
    return this.notificationsService.cleanupExpiredSubscriptions();
  }

  @Post('run-scheduled')
  async runScheduled(@Req() request: Request & { admin?: AdminProfile }) {
    await this.notificationsService.auditAdminRun({
      actorId: request.admin?.username ?? null,
      action: 'notification.run_scheduled',
    });
    return this.notificationsService.runScheduledDaily();
  }
}
