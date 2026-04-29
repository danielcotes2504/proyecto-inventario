import { Module } from '@nestjs/common';

import { ProductsModule } from '../products/products.module';
import { InventoryController } from './inventory.controller';

@Module({
  imports: [ProductsModule],
  controllers: [InventoryController],
})
export class InventoryModule {}
