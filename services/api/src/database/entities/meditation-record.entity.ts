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

  @Column({ type: 'int', unsigned: true })
  durationMinutes!: number;

  @Column({ type: 'boolean', default: true })
  completed!: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  summary!: string | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;
}
