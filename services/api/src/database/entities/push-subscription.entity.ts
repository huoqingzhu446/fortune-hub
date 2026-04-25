import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'push_subscriptions' })
@Index('uniq_push_subscriptions_user_scene_template', ['userId', 'scene', 'templateId'], {
  unique: true,
})
@Index('idx_push_subscriptions_scene_status', ['scene', 'status'])
export class PushSubscriptionEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'bigint', unsigned: true })
  userId!: string;

  @Column({ type: 'varchar', length: 32 })
  scene!: string;

  @Column({ type: 'varchar', length: 128 })
  templateId!: string;

  @Column({ type: 'varchar', length: 16, default: 'active' })
  status!: string;

  @Column({ type: 'json', nullable: true })
  extraJson!: Record<string, unknown> | null;

  @Column({ type: 'datetime' })
  lastSubscribedAt!: Date;

  @Column({ type: 'datetime', nullable: true })
  expireAt!: Date | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;
}
