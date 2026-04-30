import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

import { AppModule } from './app.module';

/** Vite / TanStack Start dev servers commonly use these hosts and ports. */
const DEFAULT_DEV_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
] as const;

/**
 * `CORS_ORIGIN`: comma-separated list (e.g. `http://localhost:5174,http://localhost:3000`).
 * Use `*` to reflect any request origin (dev only; do not use with cookie credentials).
 */
function buildCorsOptions(): CorsOptions {
  const raw = process.env.CORS_ORIGIN?.trim();
  let origin: CorsOptions['origin'];
  if (raw === '*') {
    origin = true;
  } else if (raw && raw.length > 0) {
    origin = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  } else {
    origin = [...DEFAULT_DEV_ORIGINS];
  }

  return {
    origin,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: [],
    credentials: false,
  };
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors(buildCorsOptions());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Inventario API')
    .setDescription(
      'REST API for inventory management (NestJS, TypeORM, PostgreSQL). Aligns with docs/architecture and PRD.',
    )
    .setVersion('1.0')
    .addTag('app', 'Application root')
    .addTag('products', 'Products — catalog & stock inputs')
    .addTag('movements', 'Stock movements — IN/OUT (T-003)')
    .addTag(
      'inventory',
      'Positions (T-012), per-product detail (T-013), low-stock alerts / M8 (T-005)',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs/json',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
    },
  });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
