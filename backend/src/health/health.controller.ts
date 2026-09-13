import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /// Liveness probe - the process is up. Used by Cloud Run (Member 5).
  @Get('health')
  @ApiOperation({ summary: 'Liveness probe' })
  health() {
    return { status: 'ok', uptime: process.uptime() };
  }

  /// Readiness probe - the process is up AND the database answers.
  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe (includes database round-trip)' })
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ready', database: 'up' };
    } catch {
      return { status: 'degraded', database: 'down' };
    }
  }
}
