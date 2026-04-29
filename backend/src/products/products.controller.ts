import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { Product } from '../database/entities/product.entity';
import { CreateProductApiDto } from './dto/create-product-api.dto';
import {
  createProductBodySchema,
  type CreateProductBody,
} from './schemas/create-product.schema';
import { ProductsService } from './products.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create product', description: 'T-001 — persist product with validated payload.' })
  @ApiBody({ type: CreateProductApiDto })
  @ApiCreatedResponse({ description: 'Created', type: Product })
  @ApiBadRequestResponse({
    description: 'Validation failed (Zod)',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Validation failed' },
        errors: {
          type: 'object',
          additionalProperties: {
            type: 'array',
            items: { type: 'string' },
          },
          example: { unit: ['Invalid enum value'] },
        },
      },
    },
  })
  async create(
    @Body(new ZodValidationPipe(createProductBodySchema))
    body: CreateProductBody,
  ): Promise<Product> {
    return this.productsService.create(body);
  }
}
