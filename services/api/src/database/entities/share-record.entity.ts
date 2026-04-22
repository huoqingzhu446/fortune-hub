import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'shares' })
@Index('uniq_shares_poster_id', ['posterId'], { unique: true })
@Index('idx_shares_user_source', ['userId', 'sourceType'])
export class ShareRecordEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'varchar', length: 64 })
  posterId!: string;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  userId!: string | null;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  recordId!: string | null;

  @Column({ type: 'varchar', length: 32 })
  sourceType!: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  sourceCode!: string | null;

  @Column({ type: 'varchar', length: 128 })
  posterTitle!: string;

  @Column({ type: 'varchar', length: 32, default: 'zhipu' })
  provider!: string;

  @Column({ type: 'varchar', length: 16, default: 'generated' })
  status!: string;

  @Column({ type: 'varchar', length: 2000 })
  prompt!: string;

  @Column({ type: 'json', nullable: true })
  payloadJson!: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;
}
