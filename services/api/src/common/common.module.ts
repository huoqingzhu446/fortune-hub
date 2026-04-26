import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogEntity } from '../database/entities/audit-log.entity';
import { AuditService } from './audit.service';
import { ImageGenerationService } from './image-generation.service';
import { PosterRendererService } from './poster-renderer.service';
import { ZhipuImageService } from './zhipu-image.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLogEntity])],
  providers: [AuditService, ImageGenerationService, PosterRendererService, ZhipuImageService],
  exports: [AuditService, ImageGenerationService, PosterRendererService, ZhipuImageService],
})
export class CommonModule {}
