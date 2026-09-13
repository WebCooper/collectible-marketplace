import { NotificationChannel, NotificationType } from '@prisma/client';

export interface OutboundNotification {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  /// Free-form context the frontend uses to deep-link (listingId, auctionId...).
  payload?: Record<string, unknown>;
  /// Address used by the e-mail/SMS transports. Ignored for IN_APP.
  email?: string;
  phone?: string;
}

/**
 * Contract between this module and the external delivery transports.
 *
 * Member 3 owns the in-app notification record and decides *when* a
 * notification fires. Member 4 implements this interface on top of
 * SMTP/SendGrid and an SMS gateway and registers it under EMAIL_TRANSPORT /
 * SMS_TRANSPORT, without touching any business module.
 */
export interface NotificationTransport {
  readonly channel: NotificationChannel;
  send(notification: OutboundNotification): Promise<void>;
}

export const EMAIL_TRANSPORT = Symbol('EMAIL_TRANSPORT');
export const SMS_TRANSPORT = Symbol('SMS_TRANSPORT');
