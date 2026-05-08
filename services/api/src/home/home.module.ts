import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { MoodRecordEntity } from '../database/entities/mood-record.entity';
import { UserRecordEntity } from '../database/entities/user-record.entity';
import { EntitlementsModule } from '../entitlements/entitlements.module';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';
import { LuckyModule } from '../lucky/lucky.module';

@Module({
  imports: [
    AuthModule,
    EntitlementsModule,
    LuckyModule,
    TypeOrmModule.forFeature([UserRecordEntity, MoodRecordEntity]),
  ],
  controllers: [HomeController],
  providers: [HomeService],
})
export class HomeModule {}
