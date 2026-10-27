import { writeFileSync } from 'fs';
import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { buildOpenApiDocument } from '../src/swagger';

/// Writes docs/openapi.json from the live controllers and DTOs. Needs no
/// database: the API tolerates an unreachable one at start-up, and nothing
/// here issues a query.
async function main() {
  const app = await NestFactory.create(AppModule, { logger: false });
  await app.init();

  const target = join(__dirname, '..', 'docs', 'openapi.json');
  writeFileSync(
    target,
    JSON.stringify(buildOpenApiDocument(app), null, 2) + '\n',
  );
  console.log(`Wrote ${target}`);

  await app.close();
}

void main();
