import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogEntity } from '../database/entities/audit-log.entity';
import { AuditService } from './audit.service';
import { ZhipuImageService } from './zhipu-image.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLogEntity])],
  providers: [AuditService, ZhipuImageService],
  exports: [AuditService, ZhipuImageService],
})
export class CommonModule {}
