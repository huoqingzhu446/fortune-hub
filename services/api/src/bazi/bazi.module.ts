import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { UserRecordEntity } from '../database/entities/user-record.entity';
import { BaziEngine } from './bazi-engine';
import { BaziController } from './bazi.controller';
import { BaziService } from './bazi.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserRecordEntity]), AuthModule],
  controllers: [BaziController],
  providers: [BaziEngine, BaziService],
})
export class BaziModule {}
