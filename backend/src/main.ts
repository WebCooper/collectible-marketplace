import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // The client (Next.js) owns port 3000 and the admin panel (Vite) owns 5173,
  // so the API defaults to 3001. See the team's shared decisions.
  const port = process.env.PORT ?? 3001;

  app.enableCors({
    origin: (process.env.CORS_ORIGINS ?? 'http://localhost:3000,http://localhost:5173')
      .split(',')
      .map((o) => o.trim()),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new PrismaExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Sri Lankan Collectible Marketplace API')
    .setDescription(
      'REST + WebSocket API backing the collectible marketplace (EC8208).',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api', app, SwaggerModule.createDocument(app, config));

  await app.listen(port);
  Logger.log(`API listening on http://localhost:${port} (docs at /api)`, 'Bootstrap');
}
void bootstrap();
