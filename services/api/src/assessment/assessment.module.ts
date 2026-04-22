import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { UserRecordEntity } from '../database/entities/user-record.entity';
import { AssessmentController } from './assessment.controller';
import { AssessmentService } from './assessment.service';
import { EmotionAssessmentController } from './emotion-assessment.controller';
import { EmotionAssessmentService } from './emotion-assessment.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserRecordEntity]), AuthModule],
  controllers: [AssessmentController, EmotionAssessmentController],
  providers: [AssessmentService, EmotionAssessmentService],
})
export class AssessmentModule {}
