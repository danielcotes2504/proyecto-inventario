import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { Movement } from '../database/entities/movement.entity';
import { CreateMovementApiDto } from './dto/create-movement-api.dto';
import { MovementDetailResponseDto } from './dto/movement-detail-response.dto';
import { PaginatedMovementsResponseDto } from './dto/paginated-movements-response.dto';
import {
  createMovementBodySchema,
  type CreateMovementBody,
} from './schemas/create-movement.schema';
import {
  listMovementsQuerySchema,
  type ListMovementsQuery,
} from './schemas/list-movements-query.schema';
import { MovementsService } from './movements.service';

@ApiTags('movements')
@Controller('movements')
export class MovementsController {
  constructor(private readonly movementsService: MovementsService) {}

  @Get()
  @ApiOperation({
    summary: 'List movements (paginated)',
    description:
      'T-010 — Ordered by `createdAt` descending (then `id`). Pagination: **page** (1-based) and **pageSize** (max 100). Optional filters: `productId`, `type` (IN/OUT), `dateFrom` / `dateTo` on movement business date (`movement_date`).',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'Page number (default 1)',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    example: 20,
    description: 'Items per page (default 20, max 100)',
  })
  @ApiQuery({
    name: 'productId',
    required: false,
    format: 'uuid',
    description: 'Filter by product',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['IN', 'OUT'],
    description: 'Filter by movement type',
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    example: '2026-01-01T00:00:00.000Z',
    description: 'Inclusive lower bound on movement business date',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    example: '2026-12-31T23:59:59.999Z',
    description: 'Inclusive upper bound on movement business date',
  })
  @ApiOkResponse({
    description: 'Paginated movements',
    type: PaginatedMovementsResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid query (e.g. dateFrom > dateTo, unknown params)',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Validation failed' },
        errors: { type: 'object' },
      },
    },
  })
  list(
    @Query(new ZodValidationPipe(listMovementsQuerySchema))
    query: ListMovementsQuery,
  ): Promise<PaginatedMovementsResponseDto> {
    return this.movementsService.list(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get movement by id',
    description:
      'T-011 — Returns one movement; **404** if the UUID does not exist. Includes minimal linked **product** (`id`, `name`, `unit`, `category`) for read-only context.',
  })
  @ApiParam({
    name: 'id',
    description: 'Movement UUID',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({
    description: 'Movement found',
    type: MovementDetailResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Movement not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<MovementDetailResponseDto> {
    return this.movementsService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Register a new stock movement (IN/OUT) with transactional validation',
    description:
      'T-003 — OUT movements reject when quantity exceeds computed stock (sum IN − sum OUT).',
  })
  @ApiBody({ type: CreateMovementApiDto })
  @ApiCreatedResponse({
    description: 'Movement registered successfully',
    type: Movement,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input or insufficient stock',
    schema: {
      oneOf: [
        {
          description: 'Zod validation',
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Validation failed' },
            errors: { type: 'object' },
          },
        },
        {
          description: 'Insufficient stock (OUT)',
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 400 },
            message: {
              type: 'string',
              example: 'Insufficient stock for this operation.',
            },
            error: { type: 'string', example: 'Bad Request' },
          },
        },
      ],
    },
  })
  @ApiNotFoundResponse({
    description: 'Product not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  async create(
    @Body(new ZodValidationPipe(createMovementBodySchema))
    body: CreateMovementBody,
  ): Promise<Movement> {
    return this.movementsService.register(body);
  }
}
