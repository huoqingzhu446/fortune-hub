import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'audit_logs' })
@Index('idx_audit_logs_actor_action', ['actorType', 'action'])
@Index('idx_audit_logs_resource', ['resourceType', 'resourceId'])
export class AuditLogEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'varchar', length: 16, default: 'admin' })
  actorType!: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  actorId!: string | null;

  @Column({ type: 'varchar', length: 64 })
  action!: string;

  @Column({ type: 'varchar', length: 64 })
  resourceType!: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  resourceId!: string | null;

  @Column({ type: 'json', nullable: true })
  payloadJson!: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;
}
