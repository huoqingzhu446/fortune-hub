import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'membership_products' })
@Index('uniq_membership_products_code', ['code'], { unique: true })
@Index('idx_membership_products_status_sort', ['status', 'sortOrder'])
export class MembershipProductEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'varchar', length: 32 })
  code!: string;

  @Column({ type: 'varchar', length: 128 })
  title!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  subtitle!: string | null;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  description!: string | null;

  @Column({ type: 'int', unsigned: true })
  priceFen!: number;

  @Column({ type: 'int', unsigned: true, default: 30 })
  durationDays!: number;

  @Column({ type: 'json', nullable: true })
  benefitsJson!: string[] | null;

  @Column({ type: 'int', default: 100 })
  sortOrder!: number;

  @Column({ type: 'varchar', length: 16, default: 'published' })
  status!: string;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;
}
