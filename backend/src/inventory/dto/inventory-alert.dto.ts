import { ApiProperty } from '@nestjs/swagger';

/** Response row for `GET /inventory/alerts` (M8 inclusive rule). */
export class InventoryAlertDto {
  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({ example: 'Aceite de oliva' })
  name: string;

  @ApiProperty({
    example: 5,
    description:
      'Current calculated stock (SUM IN − SUM OUT), same definition as `GET /products`.',
  })
  stock_actual: number;

  @ApiProperty({
    example: 10,
    description:
      'Configured minimum stock threshold; alert when stock_actual ≤ this value (inclusive).',
  })
  stock_minimo: number;
}
