import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import {
  MOVEMENT_REASON,
  MOVEMENT_TYPE,
  type MovementReason,
  type MovementType,
} from '../domain/inventory-domain';
import { Product } from './product.entity';

@Entity('movements')
@Index('IDX_movements_created_at', ['createdAt'])
export class Movement {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ enum: Object.values(MOVEMENT_TYPE) })
  @Column({ type: 'varchar' })
  type: MovementType;

  @ApiProperty()
  @Column({ type: 'int' })
  quantity: number;

  @ApiProperty({ enum: Object.values(MOVEMENT_REASON) })
  @Column({ type: 'varchar' })
  reason: MovementReason;

  /** Business date of the movement (PRD / data model). */
  @ApiProperty({ type: 'string', format: 'date-time' })
  @Column({ type: 'timestamptz', name: 'movement_date' })
  date: Date;

  @ApiProperty({ format: 'uuid' })
  @Column({ name: 'product_id' })
  productId: string;

  @ApiHideProperty()
  @ManyToOne(() => Product, (product) => product.movements, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ApiProperty({ type: 'string', format: 'date-time' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
