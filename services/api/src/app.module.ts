import { Module } from '@nestjs/common';
import { AdminAuthModule } from './admin-auth/admin-auth.module';
import { AdminCommerceModule } from './admin-commerce/admin-commerce.module';
import { AdminContentModule } from './admin-content/admin-content.module';
import { AdminOpsModule } from './admin-ops/admin-ops.module';
import { AdsModule } from './ads/ads.module';
import { AssessmentModule } from './assessment/assessment.module';
import { BaziModule } from './bazi/bazi.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdConfigEntity } from './database/entities/ad-config.entity';
import { AppConfigEntity } from './database/entities/app-config.entity';
import { AuditLogEntity } from './database/entities/audit-log.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssessmentQuestionEntity } from './database/entities/assessment-question.entity';
import { AssessmentSessionEntity } from './database/entities/assessment-session.entity';
import { AssessmentTestConfigEntity } from './database/entities/assessment-test-config.entity';
import { AssessmentTestGroupEntity } from './database/entities/assessment-test-group.entity';
import { FavoriteEntity } from './database/entities/favorite.entity';
import { FeedbackEntity } from './database/entities/feedback.entity';
import { FortuneContentEntity } from './database/entities/fortune-content.entity';
import { LuckyItemEntity } from './database/entities/lucky-item.entity';
import { MeditationRecordEntity } from './database/entities/meditation-record.entity';
import { MembershipProductEntity } from './database/entities/membership-product.entity';
import { MoodRecordEntity } from './database/entities/mood-record.entity';
import { OrderEntity } from './database/entities/order.entity';
import { PosterJobEntity } from './database/entities/poster-job.entity';
import { PushDeliveryLogEntity } from './database/entities/push-delivery-log.entity';
import { PushSubscriptionEntity } from './database/entities/push-subscription.entity';
import { ReportTemplateEntity } from './database/entities/report-template.entity';
import { ReportTemplateVersionEntity } from './database/entities/report-template-version.entity';
import { ShareRecordEntity } from './database/entities/share-record.entity';
import { UserConsentEntity } from './database/entities/user-consent.entity';
import { UserEntity } from './database/entities/user.entity';
import { UserRecordEntity } from './database/entities/user-record.entity';
import { AuthModule } from './auth/auth.module';
import { FortuneModule } from './fortune/fortune.module';
import { ExploreModule } from './explore/explore.module';
import { FavoritesModule } from './favorites/favorites.module';
import { HomeModule } from './home/home.module';
import { HealthController } from './health/health.controller';
import { LuckyModule } from './lucky/lucky.module';
import { MembershipModule } from './membership/membership.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OrdersModule } from './orders/orders.module';
import { PostersModule } from './posters/posters.module';
import { RedisModule } from './redis/redis.module';
import { ReportsModule } from './reports/reports.module';
import { SettingsModule } from './settings/settings.module';
import { UsersModule } from './users/users.module';
import { ZodiacModule } from './zodiac/zodiac.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql' as const,
        host: configService.get<string>('MYSQL_HOST', '127.0.0.1'),
        port: configService.get<number>('MYSQL_PORT', 3306),
        username: configService.get<string>('MYSQL_USER', 'fortune'),
        password: configService.get<string>('MYSQL_PASSWORD', 'fortune123'),
        database: configService.get<string>('MYSQL_DATABASE', 'fortune_hub'),
        entities: [
          AssessmentSessionEntity,
          AssessmentQuestionEntity,
          AssessmentTestConfigEntity,
          AssessmentTestGroupEntity,
          FavoriteEntity,
          FeedbackEntity,
          UserEntity,
          UserConsentEntity,
          UserRecordEntity,
          MoodRecordEntity,
          MeditationRecordEntity,
          FortuneContentEntity,
          LuckyItemEntity,
          AppConfigEntity,
          ReportTemplateEntity,
          MembershipProductEntity,
          OrderEntity,
          AdConfigEntity,
          ShareRecordEntity,
          PushSubscriptionEntity,
          PushDeliveryLogEntity,
          AuditLogEntity,
          ReportTemplateVersionEntity,
          PosterJobEntity,
        ],
        autoLoadEntities: true,
        migrations: ['dist/database/migrations/*.js'],
        migrationsRun: configService.get<string>('DB_RUN_MIGRATIONS', 'false') === 'true',
        synchronize: configService.get<string>('DB_SYNCHRONIZE')
          ? configService.get<string>('DB_SYNCHRONIZE') === 'true'
          : configService.get<string>('NODE_ENV') !== 'production',
        timezone: 'Z',
      }),
    }),
    RedisModule,
    AdminAuthModule,
    AdminContentModule,
    AdminCommerceModule,
    AdminOpsModule,
    SettingsModule,
    NotificationsModule,
    MembershipModule,
    OrdersModule,
    AdsModule,
    ReportsModule,
    PostersModule,
    AssessmentModule,
    BaziModule,
    AuthModule,
    UsersModule,
    ExploreModule,
    FavoritesModule,
    HomeModule,
    ZodiacModule,
    FortuneModule,
    LuckyModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
