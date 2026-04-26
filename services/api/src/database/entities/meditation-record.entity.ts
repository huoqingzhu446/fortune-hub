import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'meditation_records' })
@Index('idx_meditation_records_user_record_date', ['userId', 'recordDate'])
@Index('idx_meditation_records_user_updated_at', ['userId', 'updatedAt'])
export class MeditationRecordEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'bigint', unsigned: true })
  userId!: string;

  @Column({ type: 'date' })
  recordDate!: string;

  @Column({ type: 'varchar', length: 128 })
  title!: string;

  @Column({ type: 'varchar', length: 32, default: 'meditation' })
  category!: string;

  @Column({ type: 'varchar', length: 32, default: 'custom' })
  sourceType!: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  sourceTitle!: string | null;

  @Column({ type: 'int', unsigned: true })
  durationMinutes!: number;

  @Column({ type: 'boolean', default: true })
  completed!: boolean;

  @Column({ type: 'varchar', length: 16, default: 'completed' })
  completionStatus!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  summary!: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  intention!: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  moodBefore!: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  moodAfter!: string | null;

  @Column({ type: 'tinyint', unsigned: true, nullable: true })
  focusScore!: number | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  bodySignal!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  insight!: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  nextAction!: string | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;
}
