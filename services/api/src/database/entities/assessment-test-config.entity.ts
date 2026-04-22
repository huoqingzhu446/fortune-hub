import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'assessment_test_configs' })
@Index('uniq_assessment_test_configs_category_code', ['category', 'code'], {
  unique: true,
})
@Index('idx_assessment_test_configs_category_status', ['category', 'status'])
export class AssessmentTestConfigEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ length: 32 })
  category!: string;

  @Column({ length: 64 })
  code!: string;

  @Column({ length: 64, default: 'default' })
  groupCode!: string;

  @Column({ length: 128 })
  title!: string;

  @Column({ length: 255, default: '' })
  subtitle!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'text' })
  intro!: string;

  @Column({ type: 'int', unsigned: true, default: 3 })
  durationMinutes!: number;

  @Column({ length: 24 })
  optionSchema!: string;

  @Column({ type: 'json' })
  tagsJson!: string[];

  @Column({ type: 'json' })
  configJson!: Record<string, unknown>;

  @Column({ length: 16, default: 'published' })
  status!: string;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;
}
