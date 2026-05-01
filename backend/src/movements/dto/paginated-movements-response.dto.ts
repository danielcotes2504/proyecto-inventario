import { ApiProperty } from '@nestjs/swagger';

import { Movement } from '../entities/movement.entity';

export class MovementsPageMetaDto {
  @ApiProperty({
    example: 42,
    description: 'Total movements matching filters (all pages)',
  })
  total: number;

  @ApiProperty({ example: 1, description: 'Current page (1-based)' })
  page: number;

  @ApiProperty({ example: 20, description: 'Page size (max 100)' })
  pageSize: number;

  @ApiProperty({
    example: 3,
    description: 'Total pages; 0 when total is 0',
  })
  totalPages: number;
}

/** T-010 — `GET /movements` response envelope. */
export class PaginatedMovementsResponseDto {
  @ApiProperty({ type: [Movement] })
  items: Movement[];

  @ApiProperty({ type: MovementsPageMetaDto })
  meta: MovementsPageMetaDto;
}
