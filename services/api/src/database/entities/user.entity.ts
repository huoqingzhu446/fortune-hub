import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'users' })
@Index('uniq_users_openid', ['openid'], { unique: true })
@Index('idx_users_zodiac', ['zodiac'])
export class UserEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ length: 64 })
  openid!: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  unionid!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  nickname!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatarUrl!: string | null;

  @Column({ length: 16, default: 'unknown' })
  gender!: string;

  @Column({ type: 'date', nullable: true })
  birthday!: string | null;

  @Column({ type: 'varchar', length: 8, nullable: true })
  birthTime!: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  zodiac!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  baziSummary!: string | null;

  @Column({ type: 'json', nullable: true })
  fiveElements!: Record<string, number> | null;

  @Column({ length: 16, default: 'inactive' })
  vipStatus!: string;

  @Column({ type: 'datetime', nullable: true })
  vipExpiredAt!: Date | null;

  @Column({ type: 'datetime', nullable: true })
  lastLoginAt!: Date | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;
}
