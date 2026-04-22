import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AdConfigEntity } from '../database/entities/ad-config.entity';
import { UserRecordEntity } from '../database/entities/user-record.entity';
import { ReportsModule } from '../reports/reports.module';
import { AdsController } from './ads.controller';
import { AdsService } from './ads.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdConfigEntity, UserRecordEntity]),
    AuthModule,
    ReportsModule,
  ],
  controllers: [AdsController],
  providers: [AdsService],
})
export class AdsModule {}
