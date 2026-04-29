import { ApiProperty } from '@nestjs/swagger';

import {
  PRODUCT_STATUS,
  PRODUCT_UNIT,
} from '../../database/domain/inventory-domain';

/**
 * OpenAPI-only shape for `POST /products`. Runtime validation remains Zod (`create-product.schema`).
 */
export class CreateProductApiDto {
  @ApiProperty({ example: 'Aceite de oliva', maxLength: 255 })
  name: string;

  @ApiProperty({ example: 'Presentación 1 L' })
  description: string;

  @ApiProperty({
    enum: Object.values(PRODUCT_UNIT),
    description:
      'Accepted values (case-insensitive in request body; stored uppercase)',
  })
  unit: string;

  @ApiProperty({ example: 'Abarrotes', maxLength: 255 })
  category: string;

  @ApiProperty({
    example: 10,
    minimum: 0,
    description: 'Minimum stock threshold (M8)',
  })
  stock_minimo: number;

  @ApiProperty({
    enum: Object.values(PRODUCT_STATUS),
    description:
      'Accepted values (case-insensitive in request body; stored uppercase)',
  })
  status: string;
}
