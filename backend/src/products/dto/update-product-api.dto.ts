import { PartialType } from '@nestjs/swagger';

import { CreateProductApiDto } from './create-product-api.dto';

/** OpenAPI-only shape for `PATCH /products/:id`. Runtime validation: Zod (`update-product.schema`). */
export class UpdateProductApiDto extends PartialType(CreateProductApiDto) {}
