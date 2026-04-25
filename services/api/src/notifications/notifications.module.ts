import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AuthModule } from '../auth/auth.module';
import { CommonModule } from '../common/common.module';
import { PushDeliveryLogEntity } from '../database/entities/push-delivery-log.entity';
import { PushSubscriptionEntity } from '../database/entities/push-subscription.entity';
import { UserEntity } from '../database/entities/user.entity';
import {
  AdminNotificationsController,
  NotificationsController,
} from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PushSubscriptionEntity,
      PushDeliveryLogEntity,
      UserEntity,
    ]),
    AuthModule,
    AdminAuthModule,
    CommonModule,
  ],
  controllers: [NotificationsController, AdminNotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
