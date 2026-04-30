import { ApiProperty } from '@nestjs/swagger';

/**
 * T-012 — One row in `GET /inventory`: product identity, calculated stock (same as `GET /products`),
 * threshold, and **low_stock** (M8 inclusive: `stock_actual <= stock_minimo`).
 */
export class InventoryPositionDto {
  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({ example: 'Aceite de oliva' })
  name: string;

  @ApiProperty({
    example: 15,
    description:
      'Current calculated stock (SUM IN − SUM OUT); identical aggregation to `GET /products`.',
  })
  stock_actual: number;

  @ApiProperty({
    example: 10,
    description: 'Configured minimum stock threshold (alerts / M8).',
  })
  stock_minimo: number;

  @ApiProperty({
    example: false,
    description:
      'True if and only if `stock_actual <= stock_minimo` (M8 inclusive at the boundary).',
  })
  low_stock: boolean;
}
