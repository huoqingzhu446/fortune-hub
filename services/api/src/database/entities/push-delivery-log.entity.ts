import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'push_delivery_logs' })
@Index('idx_push_delivery_logs_user_scene', ['userId', 'scene'])
@Index('idx_push_delivery_logs_status_retry', ['status', 'nextRetryAt'])
export class PushDeliveryLogEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'bigint', unsigned: true })
  userId!: string;

  @Column({ type: 'varchar', length: 32 })
  scene!: string;

  @Column({ type: 'varchar', length: 128 })
  templateId!: string;

  @Column({ type: 'varchar', length: 16, default: 'queued' })
  status!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  errorMessage!: string | null;

  @Column({ type: 'json', nullable: true })
  payloadJson!: Record<string, unknown> | null;

  @Column({ type: 'int', unsigned: true, default: 0 })
  retryCount!: number;

  @Column({ type: 'datetime', nullable: true })
  nextRetryAt!: Date | null;

  @Column({ type: 'datetime', nullable: true })
  lastAttemptAt!: Date | null;

  @Column({ type: 'datetime', nullable: true })
  sentAt!: Date | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;
}
