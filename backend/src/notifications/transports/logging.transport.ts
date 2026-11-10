import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel } from '@prisma/client';
import {
  NotificationTransport,
  OutboundNotification,
} from '../notification-dispatcher';

/**
 * Placeholder transport: writes the message to the application log instead of
 * calling a provider. It keeps the whole notification path exercisable before
 * Member 4 wires SMTP and the SMS gateway, and stays useful in local
 * development where nobody wants real e-mail.
 */
class LoggingTransport implements NotificationTransport {
  private readonly logger = new Logger(LoggingTransport.name);

  constructor(readonly channel: NotificationChannel) {}

  send(notification: OutboundNotification): Promise<void> {
    this.logger.log(
      `[${this.channel}] -> ${notification.email ?? notification.phone ?? notification.userId}: ` +
        `${notification.title} | ${notification.message}` +
        // Reset and verify links live here, not in the message; without this a
        // developer using the log-only transport could never follow them.
        (notification.actionUrl ? ` | ${notification.actionUrl}` : ''),
    );
    return Promise.resolve();
  }
}

@Injectable()
export class LoggingEmailTransport extends LoggingTransport {
  constructor() {
    super(NotificationChannel.EMAIL);
  }
}

@Injectable()
export class LoggingSmsTransport extends LoggingTransport {
  constructor() {
    super(NotificationChannel.SMS);
  }
}
