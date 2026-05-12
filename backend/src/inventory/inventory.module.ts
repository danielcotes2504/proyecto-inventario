import { Module } from '@nestjs/common';

import { ProductsModule } from '../products/products.module';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';

@Module({
  imports: [ProductsModule],
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}
