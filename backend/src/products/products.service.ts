import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import type { DataSource, Repository } from 'typeorm';

import { Product } from '../database/entities/product.entity';
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
