import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import type { DataSource, Repository } from 'typeorm';

import { Movement } from '../database/entities/movement.entity';
import type { CreateMovementBody } from './schemas/create-movement.schema';
import type { ListMovementsQuery } from './schemas/list-movements-query.schema';
import {
  createMovementService,
  type MovementDetail,
  type MovementServiceFactoryReturn,
  type PaginatedMovements,
} from './services/movement/movement.factory';

@Injectable()
export class MovementsService {
  private readonly movementApi: MovementServiceFactoryReturn;

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(Movement)
    private readonly movementRepository: Repository<Movement>,
  ) {
    this.movementApi = createMovementService({
      dataSource: this.dataSource,
      movementRepository: this.movementRepository,
    });
  }

  list(query: ListMovementsQuery): Promise<PaginatedMovements> {
    return this.movementApi.listMovements(query);
  }

  findOne(id: string): Promise<MovementDetail> {
    return this.movementApi.getMovementById(id);
  }

  register(body: CreateMovementBody): Promise<Movement> {
    return this.movementApi.registerMovement(body);
  }
}
