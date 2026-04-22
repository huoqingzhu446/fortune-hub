import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FortuneContentEntity } from '../database/entities/fortune-content.entity';
import { ZodiacController } from './zodiac.controller';
import { ZodiacService } from './zodiac.service';

@Module({
  imports: [TypeOrmModule.forFeature([FortuneContentEntity])],
  controllers: [ZodiacController],
  providers: [ZodiacService],
})
export class ZodiacModule {}
