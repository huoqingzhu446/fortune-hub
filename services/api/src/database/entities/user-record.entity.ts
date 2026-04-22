import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'records' })
@Index('idx_records_user_type', ['userId', 'recordType'])
@Index('idx_records_created_at', ['createdAt'])
export class UserRecordEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'bigint', unsigned: true })
  userId!: string;

  @Column({ length: 32 })
  recordType!: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  sourceCode!: string | null;

  @Column({ length: 128 })
  resultTitle!: string;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  score!: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  resultLevel!: string | null;

  @Column({ type: 'json' })
  resultData!: Record<string, unknown>;

  @Column({ type: 'boolean', default: false })
  isFullReportUnlocked!: boolean;

  @Column({ type: 'varchar', length: 16, nullable: true })
  unlockType!: string | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;
}
