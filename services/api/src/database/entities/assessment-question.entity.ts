import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'assessment_questions' })
@Index('idx_assessment_questions_category_test_sort', ['category', 'testCode', 'sortOrder'])
@Index('uniq_assessment_questions_test_question', ['category', 'testCode', 'questionId'], {
  unique: true,
})
export class AssessmentQuestionEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ length: 32 })
  category!: string;

  @Column({ length: 64 })
  testCode!: string;

  @Column({ length: 64 })
  questionId!: string;

  @Column({ type: 'text' })
  prompt!: string;

  @Column({ type: 'json' })
  optionsJson!: Array<Record<string, unknown>>;

  @Column({ type: 'int', unsigned: true })
  sortOrder!: number;

  @Column({ length: 16, default: 'published' })
  status!: string;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;
}
