import { Injectable } from '@nestjs/common';

import { ProductsService } from '../products/products.service';
import type {
  InventoryAlertItem,
  InventoryPositionItem,
} from '../products/services/product/product.factory';
import type { InventoryProductDetailDto } from './dto/inventory-product-detail.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly productsService: ProductsService) {}

  getPositions(): Promise<InventoryPositionItem[]> {
    return this.productsService.findInventoryPositions();
  }

  getAlerts(): Promise<InventoryAlertItem[]> {
    return this.productsService.findInventoryAlerts();
  }

  async getProductDetail(productId: string): Promise<InventoryProductDetailDto> {
    const p = await this.productsService.findOne(productId);
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      unit: p.unit,
      category: p.category,
      status: p.status,
      stock_minimo: p.stock_minimo,
      stock_actual: p.stock_actual,
      low_stock: p.stock_actual <= p.stock_minimo,
    };
  }
}
