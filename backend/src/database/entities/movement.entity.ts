import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import type { MovementReason, MovementType } from '../domain/inventory-domain';
import { Product } from './product.entity';

@Entity('movements')
@Index('IDX_movements_created_at', ['createdAt'])
export class Movement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  type: MovementType;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'varchar' })
  reason: MovementReason;

  /** Business date of the movement (PRD / data model). */
  @Column({ type: 'timestamptz', name: 'movement_date' })
  date: Date;

  @Column({ name: 'product_id' })
  productId: string;

  @ManyToOne(() => Product, (product) => product.movements, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
