import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import type { DataSource } from 'typeorm';

import { Movement } from '../database/entities/movement.entity';
import type { CreateMovementBody } from './schemas/create-movement.schema';
import {
  createMovementService,
  type MovementServiceFactoryReturn,
} from './services/movement/movement.factory';

@Injectable()
export class MovementsService {
  private readonly movementApi: MovementServiceFactoryReturn;

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {
    this.movementApi = createMovementService({ dataSource: this.dataSource });
  }

  register(body: CreateMovementBody): Promise<Movement> {
    return this.movementApi.registerMovement(body);
  }
}
