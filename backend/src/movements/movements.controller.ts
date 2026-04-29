import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { Movement } from '../database/entities/movement.entity';
import { CreateMovementApiDto } from './dto/create-movement-api.dto';
import {
  createMovementBodySchema,
  type CreateMovementBody,
} from './schemas/create-movement.schema';
import { MovementsService } from './movements.service';

@ApiTags('movements')
@Controller('movements')
export class MovementsController {
  constructor(private readonly movementsService: MovementsService) {}

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
