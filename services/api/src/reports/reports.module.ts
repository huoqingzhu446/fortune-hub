import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AdConfigEntity } from '../database/entities/ad-config.entity';
import { ReportTemplateEntity } from '../database/entities/report-template.entity';
import { UserRecordEntity } from '../database/entities/user-record.entity';
import { MembershipModule } from '../membership/membership.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserRecordEntity,
      AdConfigEntity,
      ReportTemplateEntity,
    ]),
    AuthModule,
    MembershipModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
