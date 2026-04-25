import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'user_consents' })
@Index('idx_user_consents_user_type', ['userId', 'consentType'])
@Index('idx_user_consents_type_version_status', ['consentType', 'version', 'status'])
export class UserConsentEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'bigint', unsigned: true })
  userId!: string;

  @Column({ type: 'varchar', length: 32 })
  consentType!: string;

  @Column({ type: 'varchar', length: 32 })
  version!: string;

  @Column({ type: 'varchar', length: 16, default: 'agreed' })
  status!: string;

  @Column({ type: 'varchar', length: 32, default: 'mobile' })
  source!: string;

  @Column({ type: 'json', nullable: true })
  clientInfoJson!: Record<string, unknown> | null;

  @Column({ type: 'datetime' })
  agreedAt!: Date;

  @Column({ type: 'datetime', nullable: true })
  revokedAt!: Date | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;
}
