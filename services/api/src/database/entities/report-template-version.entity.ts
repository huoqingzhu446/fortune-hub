import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'report_template_versions' })
@Index('idx_report_template_versions_template', ['templateId', 'versionNo'])
@Index('idx_report_template_versions_type_code', ['templateType', 'bizCode'])
export class ReportTemplateVersionEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'bigint', unsigned: true })
  templateId!: string;

  @Column({ type: 'varchar', length: 64 })
  templateType!: string;

  @Column({ type: 'varchar', length: 64 })
  bizCode!: string;

  @Column({ type: 'int', unsigned: true })
  versionNo!: number;

  @Column({ type: 'varchar', length: 128 })
  title!: string;

  @Column({ type: 'varchar', length: 32, default: 'json' })
  engine!: string;

  @Column({ type: 'json' })
  payloadJson!: Record<string, unknown>;

  @Column({ type: 'varchar', length: 16, default: 'snapshot' })
  status!: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  createdBy!: string | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;
}
