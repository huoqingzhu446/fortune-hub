import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { MembershipProductEntity } from '../database/entities/membership-product.entity';
import { AdminCommerceController } from './admin-commerce.controller';
import { AdminCommerceService } from './admin-commerce.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([MembershipProductEntity]),
    AdminAuthModule,
  ],
  controllers: [AdminCommerceController],
  providers: [AdminCommerceService],
})
export class AdminCommerceModule {}
