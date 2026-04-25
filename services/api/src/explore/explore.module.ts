import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AssessmentTestConfigEntity } from '../database/entities/assessment-test-config.entity';
import { FortuneContentEntity } from '../database/entities/fortune-content.entity';
import { LuckyItemEntity } from '../database/entities/lucky-item.entity';
import { ReportTemplateEntity } from '../database/entities/report-template.entity';
import { ExploreController } from './explore.controller';
import { ExploreService } from './explore.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AssessmentTestConfigEntity,
      FortuneContentEntity,
      LuckyItemEntity,
      ReportTemplateEntity,
    ]),
    AuthModule,
  ],
  controllers: [ExploreController],
  providers: [ExploreService],
})
export class ExploreModule {}
