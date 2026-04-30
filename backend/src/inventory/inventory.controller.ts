import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { ProductsService } from '../products/products.service';
import { InventoryAlertDto } from './dto/inventory-alert.dto';
import { InventoryPositionDto } from './dto/inventory-position.dto';
import { InventoryProductDetailDto } from './dto/inventory-product-detail.dto';

@ApiTags('inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({
    summary: 'Global inventory positions',
    description:
      'T-012 — One row per product: `id`, `name`, `stock_actual` (same SUM(IN)−SUM(OUT) aggregation as `GET /products`), `stock_minimo`, and **low_stock** (`stock_actual <= stock_minimo`, M8 inclusive). Single aggregated query; no per-product movement loops.',
  })
  @ApiOkResponse({
    description: 'All catalog positions with stock and low-stock flag',
    type: InventoryPositionDto,
    isArray: true,
  })
  positions(): Promise<InventoryPositionDto[]> {
    return this.productsService.findInventoryPositions();
  }

  @Get('alerts/low-stock')
  @ApiOperation({
    summary:
      'Get products that have reached or dropped below their minimum stock (M8 Rule)',
    description:
      'T-005 — Returns only products where stock_actual ≤ stock_minimo (inclusive). Path: GET /inventory/alerts/low-stock. Uses the same stock aggregation as product listings.',
  })
  @ApiOkResponse({
    description: 'List of products in alert status',
    type: InventoryAlertDto,
    isArray: true,
  })
  alerts(): Promise<InventoryAlertDto[]> {
    return this.productsService.findInventoryAlerts();
  }

  /** Declared after static paths so `alerts` is never parsed as a UUID. */
  @Get(':productId')
  @ApiOperation({
    summary: 'Inventory detail for one product',
    description:
      'T-013 — Product subset (`id`, `name`, `description`, `unit`, `category`, `status`), **`stock_actual`** (same aggregation as `GET /products/:id`), **`stock_minimo`**, **`low_stock`** (M8 inclusive). **404** if the product does not exist. For full movement history use `GET /movements?productId=…`.',
  })
  @ApiParam({
    name: 'productId',
    description: 'Product UUID',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({
    description: 'Product inventory snapshot',
    type: InventoryProductDetailDto,
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
  productDetail(
    @Param('productId', new ParseUUIDPipe({ version: '4' }))
    productId: string,
  ): Promise<InventoryProductDetailDto> {
    return this.productsService.findInventoryProductDetail(productId);
  }
}
