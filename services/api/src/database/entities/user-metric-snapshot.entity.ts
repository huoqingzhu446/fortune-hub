import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'user_metric_snapshots' })
@Index('uniq_user_metric_snapshot_date', ['userId', 'metricKey', 'snapshotDate'], {
  unique: true,
})
@Index('idx_user_metric_snapshots_user_metric_date', [
  'userId',
  'metricKey',
  'snapshotDate',
])
export class UserMetricSnapshotEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'bigint', unsigned: true })
  userId!: string;

  @Column({ type: 'varchar', length: 32 })
  metricKey!: string;

  @Column({ type: 'date' })
  snapshotDate!: string;

  @Column({ type: 'int' })
  value!: number;

  @Column({ type: 'varchar', length: 16 })
  unit!: string;

  @Column({ type: 'varchar', length: 32 })
  label!: string;

  @Column({ type: 'varchar', length: 255 })
  summary!: string;

  @Column({ type: 'varchar', length: 32, default: 'v1' })
  formulaVersion!: string;

  @Column({ type: 'json', nullable: true })
  breakdownJson!: Array<Record<string, unknown>> | null;

  @Column({ type: 'json', nullable: true })
  sourceJson!: Array<Record<string, unknown>> | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;
}
