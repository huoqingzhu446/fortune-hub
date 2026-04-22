import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { FortuneContentEntity } from '../database/entities/fortune-content.entity';
import { UserRecordEntity } from '../database/entities/user-record.entity';
import { LuckyController } from './lucky.controller';
import { LuckyService } from './lucky.service';

@Module({
  imports: [TypeOrmModule.forFeature([FortuneContentEntity, UserRecordEntity]), AuthModule],
  controllers: [LuckyController],
  providers: [LuckyService],
  exports: [LuckyService],
})
export class LuckyModule {}
