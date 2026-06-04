import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { OrderEntity } from '../database/entities/order.entity';
import { EntitlementsModule } from '../entitlements/entitlements.module';
import { MembershipModule } from '../membership/membership.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { WechatPayService } from './wechat-pay.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderEntity]),
    AuthModule,
    EntitlementsModule,
    MembershipModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, WechatPayService],
  exports: [OrdersService],
})
export class OrdersModule {}
