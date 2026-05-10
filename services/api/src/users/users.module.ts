import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AppConfigEntity } from '../database/entities/app-config.entity';
import { BreathingRecordEntity } from '../database/entities/breathing-record.entity';
import { DailyPulseRecordEntity } from '../database/entities/daily-pulse-record.entity';
import { FavoriteEntity } from '../database/entities/favorite.entity';
import { OrderEntity } from '../database/entities/order.entity';
import { MeditationRecordEntity } from '../database/entities/meditation-record.entity';
import { MoodRecordEntity } from '../database/entities/mood-record.entity';
import { PosterJobEntity } from '../database/entities/poster-job.entity';
import { ShareRecordEntity } from '../database/entities/share-record.entity';
import { UserMetricSnapshotEntity } from '../database/entities/user-metric-snapshot.entity';
import { UserRecordEntity } from '../database/entities/user-record.entity';
import { UserEntity } from '../database/entities/user.entity';
import { EntitlementsModule } from '../entitlements/entitlements.module';
import { FavoritesModule } from '../favorites/favorites.module';
import { ProfileMetricsService } from './profile-metrics.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AppConfigEntity,
      UserEntity,
      UserRecordEntity,
      MoodRecordEntity,
      MeditationRecordEntity,
      DailyPulseRecordEntity,
      BreathingRecordEntity,
      OrderEntity,
      FavoriteEntity,
      ShareRecordEntity,
      PosterJobEntity,
      UserMetricSnapshotEntity,
    ]),
    AuthModule,
    EntitlementsModule,
    FavoritesModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, ProfileMetricsService],
})
export class UsersModule {}
