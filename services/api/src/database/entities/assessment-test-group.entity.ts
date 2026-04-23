import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'assessment_test_groups' })
@Index('uniq_assessment_test_groups_category_code', ['category', 'code'], {
  unique: true,
})
@Index('idx_assessment_test_groups_category_status', ['category', 'status'])
export class AssessmentTestGroupEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ length: 32 })
  category!: string;

  @Column({ length: 64 })
  code!: string;

  @Column({ length: 64 })
  label!: string;

  @Column({ length: 255, default: '' })
  description!: string;

  @Column({ type: 'int', unsigned: true, default: 100 })
  sortOrder!: number;

  @Column({ length: 16, default: 'published' })
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
