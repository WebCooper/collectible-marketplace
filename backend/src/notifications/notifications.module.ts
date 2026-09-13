import { Global, Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { EMAIL_TRANSPORT, SMS_TRANSPORT } from './notification-dispatcher';
import {
  LoggingEmailTransport,
  LoggingSmsTransport,
} from './transports/logging.transport';

/**
 * Global because almost every feature module raises notifications.
 *
 * The two transport providers are the seam for Member 4: replacing
 * LoggingEmailTransport with a Nodemailer/SendGrid implementation of
 * NotificationTransport is a one-line change here, and no business module
 * needs to know.
 */
@Global()
@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    { provide: EMAIL_TRANSPORT, useClass: LoggingEmailTransport },
    { provide: SMS_TRANSPORT, useClass: LoggingSmsTransport },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
