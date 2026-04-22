import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { FortuneContentEntity } from '../database/entities/fortune-content.entity';
import { AdminContentController } from './admin-content.controller';
import { AdminContentService } from './admin-content.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([FortuneContentEntity]),
    AdminAuthModule,
  ],
  controllers: [AdminContentController],
  providers: [AdminContentService],
})
export class AdminContentModule {}
