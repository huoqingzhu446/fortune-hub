import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'orders' })
@Index('uniq_orders_order_no', ['orderNo'], { unique: true })
@Index('idx_orders_user_status', ['userId', 'status'])
export class OrderEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'bigint', unsigned: true })
  userId!: string;

  @Column({ type: 'varchar', length: 64 })
  orderNo!: string;

  @Column({ type: 'varchar', length: 32 })
  productCode!: string;

  @Column({ type: 'varchar', length: 128 })
  productTitle!: string;

  @Column({ type: 'int', unsigned: true })
  amountFen!: number;

  @Column({ type: 'varchar', length: 32, default: 'membership' })
  orderType!: string;

  @Column({ type: 'varchar', length: 16, default: 'pending' })
  status!: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  transactionNo!: string | null;

  @Column({ type: 'json', nullable: true })
  extraJson!: Record<string, unknown> | null;

  @Column({ type: 'datetime', nullable: true })
  paidAt!: Date | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;
}
