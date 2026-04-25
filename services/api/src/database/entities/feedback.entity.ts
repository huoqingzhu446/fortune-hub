import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'feedbacks' })
@Index('idx_feedbacks_user_status', ['userId', 'status'])
@Index('idx_feedbacks_created_at', ['createdAt'])
export class FeedbackEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  userId!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  contact!: string | null;

  @Column({ type: 'varchar', length: 32, default: 'general' })
  category!: string;

  @Column({ type: 'varchar', length: 32, default: 'mobile' })
  source!: string;

  @Column({ type: 'varchar', length: 16, default: 'open' })
  status!: string;

  @Column({ type: 'varchar', length: 16, default: 'normal' })
  priority!: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  assignee!: string | null;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'text', nullable: true })
  adminNote!: string | null;

  @Column({ type: 'text', nullable: true })
  adminReply!: string | null;

  @Column({ type: 'json', nullable: true })
  attachmentsJson!: Array<Record<string, unknown>> | null;

  @Column({ type: 'json', nullable: true })
  clientInfoJson!: Record<string, unknown> | null;

  @Column({ type: 'datetime', nullable: true })
  repliedAt!: Date | null;

  @Column({ type: 'datetime', nullable: true })
  resolvedAt!: Date | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;
}
