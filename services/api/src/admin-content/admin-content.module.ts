import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { CommonModule } from '../common/common.module';
import { AppConfigEntity } from '../database/entities/app-config.entity';
import { FortuneContentEntity } from '../database/entities/fortune-content.entity';
import { LuckyItemEntity } from '../database/entities/lucky-item.entity';
import { ReportTemplateEntity } from '../database/entities/report-template.entity';
import { ReportTemplateVersionEntity } from '../database/entities/report-template-version.entity';
import {
  AdminConfigsController,
  AdminContentController,
  AdminLuckyItemsController,
  AdminUploadsController,
  PublicFilesController,
  AdminReportTemplatesController,
} from './admin-content.controller';
import { AdminContentService } from './admin-content.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FortuneContentEntity,
      LuckyItemEntity,
      ReportTemplateEntity,
      ReportTemplateVersionEntity,
      AppConfigEntity,
    ]),
    AdminAuthModule,
    CommonModule,
  ],
  controllers: [
    AdminContentController,
    AdminLuckyItemsController,
    AdminReportTemplatesController,
    AdminConfigsController,
    AdminUploadsController,
    PublicFilesController,
  ],
  providers: [AdminContentService],
})
export class AdminContentModule {}
