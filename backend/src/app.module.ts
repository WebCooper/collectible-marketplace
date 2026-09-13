import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Drives the auction-closing sweep and auction reminder jobs.
    ScheduleModule.forRoot(),
    PrismaModule,
    HealthModule,
    NotificationsModule,
  ],
})
export class AppModule {}
