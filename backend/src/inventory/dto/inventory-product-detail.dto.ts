import { ApiProperty } from '@nestjs/swagger';

import {
  PRODUCT_STATUS,
  PRODUCT_UNIT,
} from '../../common/domain/inventory-domain';

/**
 * T-013 — `GET /inventory/:productId`: catalog subset plus aggregated stock (same as `GET /products/:id`)
 * and **low_stock** (M8 inclusive).
 */
export class InventoryProductDetailDto {
  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({ example: 'Aceite de oliva' })
  name: string;

  @ApiProperty({ example: 'Presentación 1 L' })
  description: string;

  @ApiProperty({
    enum: Object.values(PRODUCT_UNIT),
    example: PRODUCT_UNIT.LITROS,
  })
  unit: string;

  @ApiProperty({ example: 'Abarrotes' })
  category: string;

  @ApiProperty({
    enum: Object.values(PRODUCT_STATUS),
    example: PRODUCT_STATUS.ACTIVO,
  })
  status: string;

  @ApiProperty({
    example: 10,
    description: 'Configured minimum stock threshold (alerts / M8).',
  })
  stock_minimo: number;

  @ApiProperty({
    example: 15,
    description:
      'Current calculated stock (SUM IN − SUM OUT); same aggregation as `GET /products/:id`.',
  })
  stock_actual: number;

  @ApiProperty({
    example: false,
    description:
      'True if and only if `stock_actual <= stock_minimo` (M8 inclusive at the boundary).',
  })
  low_stock: boolean;
}
