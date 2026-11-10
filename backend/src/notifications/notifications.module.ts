import { Global, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { EMAIL_TRANSPORT, SMS_TRANSPORT } from './notification-dispatcher';
import {
  LoggingEmailTransport,
  LoggingSmsTransport,
} from './transports/logging.transport';
import { ResendEmailTransport } from './transports/resend-email.transport';

/**
 * Global because almost every feature module raises notifications.
 *
 * E-mail goes out through Resend when RESEND_API_KEY is set. Without a key
 * (local development, CI) the log-only transport is used instead, so nothing
 * needs an account to run. SMS is still log-only: swap SMS_TRANSPORT for a real
 * NotificationTransport the same way.
 */
@Global()
@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    {
      provide: EMAIL_TRANSPORT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        if (config.get<string>('RESEND_API_KEY')) {
          return new ResendEmailTransport(config);
        }
        new Logger('NotificationsModule').warn(
          config.get('NODE_ENV') === 'production'
            ? 'RESEND_API_KEY is not set: e-mail (including sign-up OTPs) is only being logged, not sent'
            : 'RESEND_API_KEY is not set: e-mails are written to the log instead of being sent',
        );
        return new LoggingEmailTransport();
      },
    },
    { provide: SMS_TRANSPORT, useClass: LoggingSmsTransport },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
