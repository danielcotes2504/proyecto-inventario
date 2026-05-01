import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import {
  PRODUCT_STATUS,
  PRODUCT_UNIT,
  type ProductStatus,
  type ProductUnit,
} from '../../common/domain/inventory-domain';
import { Movement } from '../../movements/entities/movement.entity';

@Entity('products')
@Index('IDX_products_name', ['name'])
export class Product {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ type: 'varchar' })
  name: string;

  @ApiProperty()
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({ enum: Object.values(PRODUCT_UNIT) })
  @Column({ type: 'varchar' })
  unit: ProductUnit;

  @ApiProperty()
  @Column({ type: 'varchar' })
  category: string;

  @ApiProperty({ description: 'Minimum stock threshold (alerts / M8)' })
  @Column({ type: 'int', name: 'stock_minimo' })
  stock_minimo: number;

  @ApiProperty({ enum: Object.values(PRODUCT_STATUS) })
  @Column({ type: 'varchar' })
  status: ProductStatus;

  @ApiProperty({ type: 'string', format: 'date-time' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ApiProperty({ type: 'string', format: 'date-time' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ApiHideProperty()
  @OneToMany(() => Movement, (movement) => movement.product)
  movements: Movement[];
}
