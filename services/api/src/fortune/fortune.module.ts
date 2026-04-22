import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AssessmentSessionEntity } from '../database/entities/assessment-session.entity';
import { FortuneController } from './fortune.controller';
import { FortuneService } from './fortune.service';

@Module({
  imports: [TypeOrmModule.forFeature([AssessmentSessionEntity]), AdminAuthModule],
  controllers: [FortuneController],
  providers: [FortuneService],
})
export class FortuneModule {}
