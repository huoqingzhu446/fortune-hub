import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'favorites' })
@Index('uniq_favorites_user_item', ['userId', 'itemType', 'itemKey'], {
  unique: true,
})
@Index('idx_favorites_user_created_at', ['userId', 'createdAt'])
export class FavoriteEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'bigint', unsigned: true })
  userId!: string;

  @Column({ type: 'varchar', length: 32 })
  itemType!: string;

  @Column({ type: 'varchar', length: 128 })
  itemKey!: string;

  @Column({ type: 'varchar', length: 128 })
  title!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  summary!: string | null;

  @Column({ type: 'varchar', length: 16, nullable: true })
  icon!: string | null;

  @Column({ type: 'varchar', length: 255 })
  route!: string;

  @Column({ type: 'json', nullable: true })
  extraJson!: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;
}
