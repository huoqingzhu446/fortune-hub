import { Body, Controller, Get, Headers, Post, Query, UseGuards } from '@nestjs/common';
import { AdminSessionGuard } from '../admin-auth/admin-session.guard';
import { AuthService } from '../auth/auth.service';
import { RunNotificationDto } from './dto/run-notification.dto';
import { SubscribeNotificationDto } from './dto/subscribe-notification.dto';
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
  run(@Body() dto: RunNotificationDto) {
    if (dto.mode === 'send') {
      return this.notificationsService.runNow(dto.scene || 'daily_reminder');
    }

    return this.notificationsService.queueDailyNotifications(dto.scene || 'daily_reminder');
  }

  @Post('retry')
  retry() {
    return this.notificationsService.processDueRetries();
  }
}
