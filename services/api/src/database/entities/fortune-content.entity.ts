import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'fortune_contents' })
@Index('idx_fortune_contents_type_status_date', ['contentType', 'status', 'publishDate'])
export class FortuneContentEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ length: 32 })
  contentType!: string;

  @Column({ length: 64 })
  bizCode!: string;

  @Column({ type: 'date', nullable: true })
  publishDate!: string | null;

  @Column({ length: 128 })
  title!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  summary!: string | null;

  @Column({ type: 'json' })
  contentJson!: Record<string, unknown>;

  @Column({ length: 16, default: 'draft' })
  status!: string;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;
}
