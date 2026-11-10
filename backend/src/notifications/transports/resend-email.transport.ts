import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationChannel } from '@prisma/client';
import { Resend } from 'resend';
import type {
  NotificationTransport,
  OutboundNotification,
} from '../notification-dispatcher';
import { renderEmail } from './email-template';

const DEFAULT_FROM = 'Collectible Marketplace <onboarding@resend.dev>';
const DEFAULT_CLIENT_URL = 'http://localhost:3000';
const BRAND = 'Sri Lankan Collectible Marketplace';

/**
 * Delivers e-mail through Resend (https://resend.com).
 *
 * `send` throws on any failure, including the `{ error }` result the SDK
 * returns instead of throwing, so NotificationsService's retry-with-backoff
 * sees every failed delivery.
 */
@Injectable()
export class ResendEmailTransport implements NotificationTransport {
  readonly channel = NotificationChannel.EMAIL;
  private readonly logger = new Logger(ResendEmailTransport.name);
  private readonly client: Resend;
  private readonly from: string;
  private readonly clientUrl: string;

  constructor(config: ConfigService) {
    this.client = new Resend(config.getOrThrow<string>('RESEND_API_KEY'));
    this.from = config.get<string>('EMAIL_FROM') || DEFAULT_FROM;
    // Links in e-mails must point at the public site, not the API.
    this.clientUrl = (
      config.get<string>('CLIENT_URL') || DEFAULT_CLIENT_URL
    ).replace(/\/+$/, '');
  }

  async send(notification: OutboundNotification): Promise<void> {
    if (!notification.email) {
      // Nothing to retry: the recipient has no address on record.
      this.logger.warn(
        `No e-mail address for user ${notification.userId}; skipping "${notification.title}"`,
      );
      return;
    }

    const { subject, html, text } = renderEmail(notification, {
      clientUrl: this.clientUrl,
      brand: BRAND,
    });

    const { data, error } = await this.client.emails.send({
      from: this.from,
      to: notification.email,
      subject,
      html,
      text,
    });

    if (error) {
      throw new Error(
        `Resend rejected the message (${error.name}): ${error.message}`,
      );
    }
    this.logger.log(`E-mail "${subject}" sent (Resend id ${data?.id})`);
  }
}
