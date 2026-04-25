import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogEntity } from '../database/entities/audit-log.entity';

export type AuditInput = {
  actorType?: string;
  actorId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  payload?: Record<string, unknown> | null;
};

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditLogRepository: Repository<AuditLogEntity>,
  ) {}

  async write(input: AuditInput) {
    await this.auditLogRepository.save(
      this.auditLogRepository.create({
        actorType: input.actorType ?? 'admin',
        actorId: input.actorId ?? null,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId ?? null,
        payloadJson: input.payload ?? null,
      }),
    );
  }
}
