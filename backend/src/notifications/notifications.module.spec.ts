import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { EMAIL_TRANSPORT } from './notification-dispatcher';
import { NotificationsModule } from './notifications.module';
import { LoggingEmailTransport } from './transports/logging.transport';
import { ResendEmailTransport } from './transports/resend-email.transport';

jest.mock('resend', () => ({ Resend: jest.fn() }));

/// Stands in for the app's global PrismaModule, which NotificationsService needs.
@Global()
@Module({
  providers: [{ provide: PrismaService, useValue: {} }],
  exports: [PrismaService],
})
class FakePrismaModule {}

async function emailTransportFor(env: Record<string, string>) {
  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        ignoreEnvFile: true,
        load: [() => env],
      }),
      FakePrismaModule,
      NotificationsModule,
    ],
  }).compile();
  return moduleRef.get(EMAIL_TRANSPORT);
}

describe('NotificationsModule e-mail transport', () => {
  it('uses Resend when an API key is configured', async () => {
    const transport = await emailTransportFor({ RESEND_API_KEY: 're_test' });

    expect(transport).toBeInstanceOf(ResendEmailTransport);
  });

  it('falls back to logging when no API key is configured', async () => {
    const transport = await emailTransportFor({});

    expect(transport).toBeInstanceOf(LoggingEmailTransport);
  });
});
