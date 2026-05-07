import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FortuneContentEntity } from '../database/entities/fortune-content.entity';
import { DivinationController } from './divination.controller';
import { DivinationService } from './divination.service';

@Module({
  imports: [TypeOrmModule.forFeature([FortuneContentEntity])],
  controllers: [DivinationController],
  providers: [DivinationService],
  exports: [DivinationService],
})
export class DivinationModule {}
