import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'breathing_records' })
@Index('idx_breathing_user', ['userId'])
export class BreathingRecordEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'bigint', unsigned: true })
  userId!: string;

  @Column({ type: 'varchar', length: 32 })
  mode!: string;

  @Column({ type: 'smallint', unsigned: true, default: 1 })
  rounds!: number;

  @Column({ type: 'smallint', unsigned: true, default: 60 })
  durationSeconds!: number;

  @Column({ type: 'varchar', length: 16, nullable: true })
  preMood!: string | null;

  @Column({ type: 'tinyint', unsigned: true, nullable: true })
  preMoodIntensity!: number | null;

  @Column({ type: 'varchar', length: 16, nullable: true })
  postMood!: string | null;

  @Column({ type: 'tinyint', unsigned: true, nullable: true })
  postMoodIntensity!: number | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;
}
