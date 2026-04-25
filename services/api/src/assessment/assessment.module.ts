import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AuthModule } from '../auth/auth.module';
import { AppConfigEntity } from '../database/entities/app-config.entity';
import { AssessmentQuestionEntity } from '../database/entities/assessment-question.entity';
import { AssessmentTestConfigEntity } from '../database/entities/assessment-test-config.entity';
import { AssessmentTestGroupEntity } from '../database/entities/assessment-test-group.entity';
import { UserRecordEntity } from '../database/entities/user-record.entity';
import { QuestionBankController } from './question-bank.controller';
import { QuestionBankService } from './question-bank.service';
import { AssessmentController } from './assessment.controller';
import { AssessmentService } from './assessment.service';
import { EmotionAssessmentController } from './emotion-assessment.controller';
import { EmotionAssessmentService } from './emotion-assessment.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserRecordEntity,
      AppConfigEntity,
      AssessmentQuestionEntity,
      AssessmentTestConfigEntity,
      AssessmentTestGroupEntity,
    ]),
    AdminAuthModule,
    AuthModule,
  ],
  controllers: [
    AssessmentController,
    EmotionAssessmentController,
    QuestionBankController,
  ],
  providers: [AssessmentService, EmotionAssessmentService, QuestionBankService],
})
export class AssessmentModule {}
