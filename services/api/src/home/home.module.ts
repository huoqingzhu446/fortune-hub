import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { UserRecordEntity } from '../database/entities/user-record.entity';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';
import { LuckyModule } from '../lucky/lucky.module';

@Module({
  imports: [AuthModule, LuckyModule, TypeOrmModule.forFeature([UserRecordEntity])],
  controllers: [HomeController],
  providers: [HomeService],
})
export class HomeModule {}
