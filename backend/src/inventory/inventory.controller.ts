import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ProductsService } from '../products/products.service';
import { InventoryAlertDto } from './dto/inventory-alert.dto';
import { InventoryPositionDto } from './dto/inventory-position.dto';

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
}
