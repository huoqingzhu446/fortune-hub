import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'poster_jobs' })
@Index('uniq_poster_jobs_job_id', ['jobId'], { unique: true })
@Index('idx_poster_jobs_user_status', ['userId', 'status'])
export class PosterJobEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'varchar', length: 64 })
  jobId!: string;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  userId!: string | null;

  @Column({ type: 'varchar', length: 32 })
  jobType!: string;

  @Column({ type: 'varchar', length: 16, default: 'queued' })
  status!: string;

  @Column({ type: 'json', nullable: true })
  requestJson!: Record<string, unknown> | null;

  @Column({ type: 'json', nullable: true })
  resultJson!: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fileUrl!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  errorMessage!: string | null;

  @Column({ type: 'datetime', nullable: true })
  startedAt!: Date | null;

  @Column({ type: 'datetime', nullable: true })
  finishedAt!: Date | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;
}
