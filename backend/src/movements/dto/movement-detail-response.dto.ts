import { ApiProperty } from '@nestjs/swagger';

import {
  MOVEMENT_REASON,
  MOVEMENT_TYPE,
  PRODUCT_UNIT,
} from '../../common/domain/inventory-domain';

/** Minimal linked product for read-only context (T-011). */
export class MovementProductSummaryDto {
  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  id: string;

  @ApiProperty({ example: 'Aceite de oliva' })
  name: string;

  @ApiProperty({
    enum: Object.values(PRODUCT_UNIT),
    example: PRODUCT_UNIT.LITROS,
  })
  unit: string;

  @ApiProperty({ example: 'Abarrotes' })
  category: string;
}

/** T-011 — `GET /movements/:id` response body. */
export class MovementDetailResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ enum: Object.values(MOVEMENT_TYPE) })
  type: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty({ enum: Object.values(MOVEMENT_REASON) })
  reason: string;

  @ApiProperty({ type: 'string', format: 'date-time' })
  date: Date;

  @ApiProperty({ format: 'uuid' })
  productId: string;

  @ApiProperty({ type: 'string', format: 'date-time' })
  createdAt: Date;

  @ApiProperty({
    type: MovementProductSummaryDto,
    description:
      'Linked product (read-only snapshot: id, name, unit, category)',
  })
  product: MovementProductSummaryDto;
}
