import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { CommonModule } from '../common/common.module';
import { AppConfigEntity } from '../database/entities/app-config.entity';
import { AssessmentQuestionEntity } from '../database/entities/assessment-question.entity';
import { AssessmentTestConfigEntity } from '../database/entities/assessment-test-config.entity';
import { AuditLogEntity } from '../database/entities/audit-log.entity';
import { FortuneContentEntity } from '../database/entities/fortune-content.entity';
import { LuckyItemEntity } from '../database/entities/lucky-item.entity';
import { MembershipProductEntity } from '../database/entities/membership-product.entity';
import { OrderEntity } from '../database/entities/order.entity';
import { PushDeliveryLogEntity } from '../database/entities/push-delivery-log.entity';
import { ReportTemplateEntity } from '../database/entities/report-template.entity';
import { UserRecordEntity } from '../database/entities/user-record.entity';
import { UserEntity } from '../database/entities/user.entity';
import { EntitlementsModule } from '../entitlements/entitlements.module';
import { AdminOpsController } from './admin-ops.controller';
import { AdminOpsService } from './admin-ops.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      OrderEntity,
      UserRecordEntity,
      PushDeliveryLogEntity,
      AuditLogEntity,
      AppConfigEntity,
      AssessmentTestConfigEntity,
      AssessmentQuestionEntity,
      FortuneContentEntity,
      LuckyItemEntity,
      ReportTemplateEntity,
      MembershipProductEntity,
    ]),
    AdminAuthModule,
    EntitlementsModule,
    CommonModule,
  ],
  controllers: [AdminOpsController],
  providers: [AdminOpsService],
  exports: [AdminOpsService],
})
export class AdminOpsModule {}
