import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';
import { LuckyModule } from '../lucky/lucky.module';

@Module({
  imports: [AuthModule, LuckyModule],
  controllers: [HomeController],
  providers: [HomeService],
})
export class HomeModule {}
