import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AppConfigEntity } from '../database/entities/app-config.entity';
import { MoodRecordEntity } from '../database/entities/mood-record.entity';
import { UserRecordEntity } from '../database/entities/user-record.entity';
import { EntitlementsModule } from '../entitlements/entitlements.module';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';

@Module({
  imports: [
    AuthModule,
    EntitlementsModule,
    TypeOrmModule.forFeature([
      UserRecordEntity,
      MoodRecordEntity,
      AppConfigEntity,
    ]),
  ],
  controllers: [HomeController],
  providers: [HomeService],
})
export class HomeModule {}
