import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/// Built in one place so the interactive docs served at /api and the committed
/// docs/openapi.json (`npm run docs:openapi`) can never describe different APIs.
export function buildOpenApiDocument(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Sri Lankan Collectible Marketplace API')
    .setDescription(
      'REST API for the collectible marketplace (EC8208). Live bid updates are ' +
        'delivered over a Socket.IO namespace (/auctions), documented in docs/API.md.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth('access_token')
    .build();
  return SwaggerModule.createDocument(app, config);
}
