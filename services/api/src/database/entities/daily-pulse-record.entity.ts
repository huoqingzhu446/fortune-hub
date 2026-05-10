import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'daily_pulse_records' })
@Index('idx_pulse_user_date', ['userId', 'recordDate'], { unique: true })
export class DailyPulseRecordEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'bigint', unsigned: true })
  userId!: string;

  @Column({ type: 'date' })
  recordDate!: string;

  @Column({ type: 'varchar', length: 16 })
  mood!: string;

  @Column({ type: 'tinyint', unsigned: true, default: 3 })
  intensity!: number;

  @Column({ type: 'varchar', length: 32, nullable: true })
  category!: string | null;

  @Column({ type: 'varchar', length: 256, nullable: true })
  note!: string | null;

  @Column({ type: 'varchar', length: 16, nullable: true })
  responseMood!: string | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;
}
