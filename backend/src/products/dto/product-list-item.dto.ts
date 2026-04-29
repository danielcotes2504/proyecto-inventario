import { ApiProperty } from '@nestjs/swagger';

import {
  PRODUCT_STATUS,
  PRODUCT_UNIT,
} from '../../database/domain/inventory-domain';

/**
 * OpenAPI shape for `GET /products` — persisted fields plus aggregated `stock_actual`.
 */
export class ProductListItemDto {
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
    example: 10,
    description: 'Minimum stock threshold (alerts / M8)',
  })
  stock_minimo: number;

  @ApiProperty({
    enum: Object.values(PRODUCT_STATUS),
    example: PRODUCT_STATUS.ACTIVO,
  })
  status: string;

  @ApiProperty({ type: 'string', format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: 'string', format: 'date-time' })
  updatedAt: Date;

  @ApiProperty({
    type: 'number',
    example: 15,
    description:
      'Current calculated stock based on movement history (sum of IN quantities minus sum of OUT quantities).',
  })
  stock_actual: number;
}
