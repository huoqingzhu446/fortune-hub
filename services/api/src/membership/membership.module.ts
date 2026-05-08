import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { MembershipProductEntity } from '../database/entities/membership-product.entity';
import { EntitlementsModule } from '../entitlements/entitlements.module';
import { MembershipController } from './membership.controller';
import { MembershipService } from './membership.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([MembershipProductEntity]),
    AuthModule,
    EntitlementsModule,
  ],
  controllers: [MembershipController],
  providers: [MembershipService],
  exports: [MembershipService],
})
export class MembershipModule {}
