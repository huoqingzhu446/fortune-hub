import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'mood_records' })
@Index('uniq_mood_records_user_date', ['userId', 'recordDate'], { unique: true })
@Index('idx_mood_records_user_updated_at', ['userId', 'updatedAt'])
export class MoodRecordEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'bigint', unsigned: true })
  userId!: string;

  @Column({ type: 'date' })
  recordDate!: string;

  @Column({ type: 'varchar', length: 16 })
  moodType!: string;

  @Column({ type: 'int', unsigned: true })
  moodScore!: number;

  @Column({ type: 'json', nullable: true })
  emotionTags!: string[] | null;

  @Column({ type: 'text', nullable: true })
  content!: string | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;
}
