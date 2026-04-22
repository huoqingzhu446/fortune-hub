import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'ad_configs' })
@Index('uniq_ad_configs_slot_code', ['slotCode'], { unique: true })
export class AdConfigEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'varchar', length: 32 })
  slotCode!: string;

  @Column({ type: 'varchar', length: 128 })
  title!: string;

  @Column({ type: 'varchar', length: 64 })
  placement!: string;

  @Column({ type: 'varchar', length: 32, default: 'unlock_full_report' })
  rewardType!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  rewardDescription!: string | null;

  @Column({ type: 'boolean', default: true })
  enabled!: boolean;

  @Column({ type: 'json', nullable: true })
  configJson!: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;
}
