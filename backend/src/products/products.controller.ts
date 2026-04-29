import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
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
  @ApiOperation({
    summary: 'Create product',
    description: 'T-001 — persist product with validated payload.',
  })
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

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a product only if it has no movements',
    description:
      'T-002 — Rejects with 409 when any movement references this product.',
  })
  @ApiParam({
    name: 'id',
    description: 'Product UUID',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({
    description: 'Product deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Product deleted successfully',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Product not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiConflictResponse({
    description: 'Conflict: Product has associated movements',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: {
          type: 'string',
          example: 'Cannot delete product: associated movements found.',
        },
        error: { type: 'string', example: 'Conflict' },
      },
    },
  })
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<{ message: string }> {
    await this.productsService.delete(id);
    return { message: 'Product deleted successfully' };
  }
}
