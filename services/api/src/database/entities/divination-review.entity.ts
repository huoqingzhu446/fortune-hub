import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'divination_reviews' })
@Index('uniq_divination_reviews_user_result', ['userId', 'resultId'], {
  unique: true,
})
@Index('idx_divination_reviews_user_updated_at', ['userId', 'updatedAt'])
export class DivinationReviewEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'bigint', unsigned: true })
  userId!: string;

  @Column({ type: 'varchar', length: 128 })
  resultId!: string;

  @Column({ type: 'boolean', default: false })
  favorite!: boolean;

  @Column({ type: 'varchar', length: 16, default: 'pending' })
  outcome!: 'pending' | 'fulfilled' | 'unfulfilled';

  @Column({ type: 'varchar', length: 500, nullable: true })
  note!: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  topic!: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  title!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  summary!: string | null;

  @Column({ type: 'json', nullable: true })
  resultSnapshot!: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 16, nullable: true })
  preMood!: string | null;

  @Column({ type: 'tinyint', unsigned: true, nullable: true })
  preMoodIntensity!: number | null;

  @Column({ type: 'varchar', length: 16, nullable: true })
  postMood!: string | null;

  @Column({ type: 'tinyint', unsigned: true, nullable: true })
  postMoodIntensity!: number | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  expectation!: string | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;
}
