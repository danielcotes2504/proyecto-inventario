import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import type { DataSource, Repository } from 'typeorm';

import { Product } from '../database/entities/product.entity';
import type { InventoryProductDetailDto } from '../inventory/dto/inventory-product-detail.dto';
import type { InventoryAlertItem } from '../inventory/types/inventory-alert.item';
import type { CreateProductBody } from './schemas/create-product.schema';
import type { UpdateProductBody } from './schemas/update-product.schema';
import {
  createProductService,
  type InventoryPositionItem,
  type ProductServiceFactoryReturn,
  type ProductWithStockActual,
} from './services/product/product.factory';

@Injectable()
export class ProductsService {
  private readonly productApi: ProductServiceFactoryReturn;

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    this.productApi = createProductService({
      productRepository: this.productRepository,
      dataSource: this.dataSource,
    });
  }

  create(body: CreateProductBody): Promise<Product> {
    return this.productApi.createProduct(body);
  }

  findAll(): Promise<ProductWithStockActual[]> {
    return this.productApi.findAllWithStock();
  }

  findInventoryPositions(): Promise<InventoryPositionItem[]> {
    return this.productApi.findAllInventoryPositions();
  }

  /**
   * T-013 — Single-product inventory view; reuses `findOneWithStock` (one aggregated query, 404 if missing).
   */
  async findInventoryProductDetail(
    productId: string,
  ): Promise<InventoryProductDetailDto> {
    const p = await this.productApi.findOneWithStock(productId);
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

  findOne(id: string): Promise<ProductWithStockActual> {
    return this.productApi.findOneWithStock(id);
  }

  update(id: string, body: UpdateProductBody): Promise<ProductWithStockActual> {
    return this.productApi.patchProduct(id, body);
  }

  findInventoryAlerts(): Promise<InventoryAlertItem[]> {
    return this.productApi.findAlertsWithStock();
  }

  delete(productId: string): Promise<void> {
    return this.productApi.deleteProduct(productId);
  }
}
