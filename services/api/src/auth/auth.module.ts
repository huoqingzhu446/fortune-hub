import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../database/entities/user.entity';
import { EntitlementsModule } from '../entitlements/entitlements.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SmsCodeService } from './sms-code.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), EntitlementsModule],
  controllers: [AuthController],
  providers: [AuthService, SmsCodeService],
  exports: [AuthService, TypeOrmModule],
})
export class AuthModule {}
