import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'lucky_items' })
@Index('uniq_lucky_items_biz_code', ['bizCode'], { unique: true })
@Index('idx_lucky_items_status_publish_date', ['status', 'publishDate'])
export class LuckyItemEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ length: 64 })
  bizCode!: string;

  @Column({ length: 128 })
  title!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  summary!: string | null;

  @Column({ length: 64, default: '幸运物' })
  category!: string;

  @Column({ type: 'date', nullable: true })
  publishDate!: string | null;

  @Column({ type: 'int', unsigned: true, default: 100 })
  sortOrder!: number;

  @Column({ type: 'json' })
  contentJson!: Record<string, unknown>;

  @Column({ length: 16, default: 'draft' })
  status!: string;

  @Column({ type: 'datetime', nullable: true })
  publishedAt!: Date | null;

  @Column({ type: 'datetime', nullable: true })
  archivedAt!: Date | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;
}
