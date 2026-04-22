import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FortuneContentEntity } from '../database/entities/fortune-content.entity';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';

@Module({
  imports: [TypeOrmModule.forFeature([FortuneContentEntity])],
  controllers: [HomeController],
  providers: [HomeService],
})
export class HomeModule {}
