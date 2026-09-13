import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { NotificationChannel, NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  PaginationDto,
  paginate,
} from '../common/dto/pagination.dto';
import { EMAIL_TRANSPORT, SMS_TRANSPORT } from './notification-dispatcher';
import type {
  NotificationTransport,
  OutboundNotification,
} from './notification-dispatcher';

interface QueuedDelivery {
  notification: OutboundNotification;
  channel: NotificationChannel;
  attempts: number;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  /// Deliveries awaiting a retry after a transport failure.
  private readonly retryQueue: QueuedDelivery[] = [];
  private static readonly MAX_ATTEMPTS = 5;

  constructor(
    private readonly prisma: PrismaService,
    @Optional() @Inject(EMAIL_TRANSPORT)
    private readonly emailTransport?: NotificationTransport,
    @Optional() @Inject(SMS_TRANSPORT)
    private readonly smsTransport?: NotificationTransport,
  ) {}

  /**
   * Records an in-app notification and fans the same message out to e-mail and
   * SMS in the background.
   *
   * The database write is awaited (it is a single indexed insert, and the
   * in-app notification centre must show the message immediately); the external
   * transports are deliberately *not* awaited. A slow SMTP or SMS provider must
   * never add latency to bidding or checkout - see the Performance and
   * Availability sections of the design report.
   */
  async notify(
    outbound: OutboundNotification,
    channels: NotificationChannel[] = [NotificationChannel.IN_APP],
  ) {
    const record = await this.prisma.notification.create({
      data: {
        userId: outbound.userId,
        type: outbound.type,
        title: outbound.title,
        message: outbound.message,
        channel: NotificationChannel.IN_APP,
        payload: (outbound.payload ?? undefined) as Prisma.InputJsonValue,
      },
    });

    const externalChannels = channels.filter(
      (channel) => channel !== NotificationChannel.IN_APP,
    );

    if (externalChannels.length) {
      // Callers that already hold the recipient's contact details pass them in;
      // for the rest we resolve them once here so transports never have to.
      const contact =
        outbound.email || outbound.phone
          ? outbound
          : { ...outbound, ...(await this.resolveContact(outbound.userId)) };

      for (const channel of externalChannels) {
        void this.deliver({ notification: contact, channel, attempts: 0 });
      }
    }

    return record;
  }

  /// Same as notify() but for many recipients - used by auction-wide alerts.
  async notifyMany(
    outbounds: OutboundNotification[],
    channels: NotificationChannel[] = [NotificationChannel.IN_APP],
  ) {
    await Promise.all(outbounds.map((o) => this.notify(o, channels)));
  }

  private async resolveContact(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, phone: true },
    });
    return { email: user?.email, phone: user?.phone ?? undefined };
  }

  private async deliver(job: QueuedDelivery): Promise<void> {
    const transport =
      job.channel === NotificationChannel.EMAIL
        ? this.emailTransport
        : this.smsTransport;

    if (!transport) {
      this.logger.warn(
        `No ${job.channel} transport registered; dropping "${job.notification.title}"`,
      );
      return;
    }

    try {
      await transport.send(job.notification);
    } catch (error) {
      job.attempts += 1;
      if (job.attempts >= NotificationsService.MAX_ATTEMPTS) {
        this.logger.error(
          `Giving up on ${job.channel} delivery to ${job.notification.userId} after ${job.attempts} attempts`,
        );
        return;
      }
      // Exponential backoff. The retry queue is what makes delivery eventual
      // rather than best-effort (NFR: Reliability). Member 4 can swap this for
      // a Bull/Redis queue without changing any calling module.
      this.retryQueue.push(job);
      const delayMs = 2 ** job.attempts * 1000;
      setTimeout(() => {
        const index = this.retryQueue.indexOf(job);
        if (index >= 0) this.retryQueue.splice(index, 1);
        void this.deliver(job);
      }, delayMs).unref?.();
      this.logger.warn(
        `${job.channel} delivery failed (attempt ${job.attempts}), retrying in ${delayMs}ms: ${(error as Error).message}`,
      );
    }
  }

  // --- In-app notification centre -----------------------------------------

  async findForUser(
    userId: string,
    pagination: PaginationDto,
    unreadOnly = false,
  ) {
    const where = { userId, ...(unreadOnly ? { readStatus: false } : {}) };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        orderBy: { sentAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.notification.count({ where }),
    ]);
    return paginate(data, total, pagination);
  }

  unreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, readStatus: false },
    });
  }

  async markRead(userId: string, id: string) {
    // Scoping the update by userId means one user can never mark another
    // user's notification as read.
    const result = await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { readStatus: true },
    });
    return { updated: result.count };
  }

  async markAllRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, readStatus: false },
      data: { readStatus: true },
    });
    return { updated: result.count };
  }

  /// Convenience wrapper for the most common shape: look up the recipient's
  /// contact details, then notify in-app plus e-mail.
  async notifyUser(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    payload?: Record<string, unknown>,
    channels: NotificationChannel[] = [
      NotificationChannel.IN_APP,
      NotificationChannel.EMAIL,
    ],
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, phone: true },
    });
    return this.notify(
      {
        userId,
        type,
        title,
        message,
        payload,
        email: user?.email,
        phone: user?.phone ?? undefined,
      },
      channels,
    );
  }
}
