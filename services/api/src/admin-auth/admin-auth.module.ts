import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { AdminSessionGuard } from './admin-session.guard';

@Module({
  imports: [RedisModule],
  controllers: [AdminAuthController],
  providers: [AdminAuthService, AdminSessionGuard],
  exports: [AdminAuthService, AdminSessionGuard],
})
export class AdminAuthModule {}
