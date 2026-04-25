import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AppConfigEntity } from '../database/entities/app-config.entity';
import { FortuneContentEntity } from '../database/entities/fortune-content.entity';
import { LuckyItemEntity } from '../database/entities/lucky-item.entity';
import { PosterJobEntity } from '../database/entities/poster-job.entity';
import { UserRecordEntity } from '../database/entities/user-record.entity';
import { LuckyController } from './lucky.controller';
import { LuckyService } from './lucky.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FortuneContentEntity,
      LuckyItemEntity,
      PosterJobEntity,
      AppConfigEntity,
      UserRecordEntity,
    ]),
    AuthModule,
  ],
  controllers: [LuckyController],
  providers: [LuckyService],
  exports: [LuckyService],
})
export class LuckyModule {}
