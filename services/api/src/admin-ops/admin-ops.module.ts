import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AuditLogEntity } from '../database/entities/audit-log.entity';
import { OrderEntity } from '../database/entities/order.entity';
import { PushDeliveryLogEntity } from '../database/entities/push-delivery-log.entity';
import { UserRecordEntity } from '../database/entities/user-record.entity';
import { UserEntity } from '../database/entities/user.entity';
import { MembershipModule } from '../membership/membership.module';
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
    ]),
    AdminAuthModule,
    MembershipModule,
  ],
  controllers: [AdminOpsController],
  providers: [AdminOpsService],
  exports: [AdminOpsService],
})
export class AdminOpsModule {}
