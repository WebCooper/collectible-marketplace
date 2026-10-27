import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/// Global so every feature module can inject PrismaService without re-importing.
/// This is the "Shared Data Architecture" from the design report: one database,
/// one client, ACID transactions across module boundaries.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
