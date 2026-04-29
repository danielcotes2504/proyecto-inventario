import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ProductsService } from '../products/products.service';
import { InventoryAlertDto } from './dto/inventory-alert.dto';

@ApiTags('inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('alerts')
  @ApiOperation({
    summary:
      'Get products that have reached or dropped below their minimum stock (M8 Rule)',
    description:
      'T-005 — Returns only products where stock_actual ≤ stock_minimo (inclusive). Uses the same stock aggregation as product listings.',
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
