import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'report_templates' })
@Index('uniq_report_templates_type_code', ['templateType', 'bizCode'], { unique: true })
@Index('idx_report_templates_type_status_sort', ['templateType', 'status', 'sortOrder'])
export class ReportTemplateEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ length: 64 })
  templateType!: string;

  @Column({ length: 64 })
  bizCode!: string;

  @Column({ length: 128 })
  title!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string | null;

  @Column({ length: 32, default: 'json' })
  engine!: string;

  @Column({ type: 'int', unsigned: true, default: 100 })
  sortOrder!: number;

  @Column({ type: 'json' })
  payloadJson!: Record<string, unknown>;

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
