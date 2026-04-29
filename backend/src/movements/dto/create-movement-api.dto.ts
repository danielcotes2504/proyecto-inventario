import { ApiProperty } from '@nestjs/swagger';

import {
  MOVEMENT_REASON,
  MOVEMENT_TYPE,
} from '../../database/domain/inventory-domain';

export class CreateMovementApiDto {
  @ApiProperty({
    enum: Object.values(MOVEMENT_TYPE),
    description: 'IN = entrada, OUT = salida',
  })
  type: string;

  @ApiProperty({ example: 10, minimum: 1 })
  quantity: number;

  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  productId: string;

  @ApiProperty({
    enum: Object.values(MOVEMENT_REASON),
    description: 'Razón del movimiento (normalizada a mayúsculas)',
  })
  reason: string;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    description: 'Fecha del movimiento (ISO 8601)',
    example: '2026-04-29T12:00:00.000Z',
  })
  date: Date;
}
