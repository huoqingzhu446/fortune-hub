import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'assessment_sessions' })
export class AssessmentSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 32 })
  channel!: string;

  @Column({ length: 32 })
  assessmentType!: string;

  @Column({ length: 32 })
  zodiac!: string;

  @Column({ type: 'int', default: 0 })
  luckyScore!: number;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;
}
