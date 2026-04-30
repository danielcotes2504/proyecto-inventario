import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
