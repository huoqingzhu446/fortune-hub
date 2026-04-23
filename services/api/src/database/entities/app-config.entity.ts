import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'configs' })
@Index('uniq_configs_namespace_key', ['namespace', 'configKey'], { unique: true })
@Index('idx_configs_namespace_status', ['namespace', 'status'])
export class AppConfigEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ length: 64 })
  namespace!: string;

  @Column({ length: 128 })
  configKey!: string;

  @Column({ length: 128 })
  title!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string | null;

  @Column({ length: 16, default: 'json' })
  valueType!: string;

  @Column({ type: 'json' })
  valueJson!: Record<string, unknown>;

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
