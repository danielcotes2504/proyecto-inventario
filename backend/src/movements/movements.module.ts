import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Movement } from '../database/entities/movement.entity';
import { Product } from '../database/entities/product.entity';
import { MovementsController } from './movements.controller';
import { MovementsService } from './movements.service';

@Module({
  imports: [TypeOrmModule.forFeature([Movement, Product])],
  controllers: [MovementsController],
  providers: [MovementsService],
})
export class MovementsModule {}
