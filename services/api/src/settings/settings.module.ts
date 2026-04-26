import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AuthModule } from '../auth/auth.module';
import { CommonModule } from '../common/common.module';
import { AppConfigEntity } from '../database/entities/app-config.entity';
import { FeedbackEntity } from '../database/entities/feedback.entity';
import { UserConsentEntity } from '../database/entities/user-consent.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminFeedbackController } from './admin-feedback.controller';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AppConfigEntity, FeedbackEntity, UserConsentEntity]),
    AuthModule,
    AdminAuthModule,
    CommonModule,
    NotificationsModule,
  ],
  controllers: [SettingsController, AdminFeedbackController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
