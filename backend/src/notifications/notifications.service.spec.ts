import { Test } from '@nestjs/testing';
import { NotificationChannel, NotificationType } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import { EMAIL_TRANSPORT, SMS_TRANSPORT } from './notification-dispatcher';
import { PrismaService } from '../prisma/prisma.service';

const flush = () => new Promise((resolve) => setImmediate(resolve));

describe('NotificationsService.notify', () => {
  let service: NotificationsService;
  let prisma: {
    notification: { create: jest.Mock };
    user: { findUnique: jest.Mock };
  };
  let email: { channel: string; send: jest.Mock };

  beforeEach(async () => {
    prisma = {
      notification: { create: jest.fn().mockResolvedValue({ id: 'n-1' }) },
      user: { findUnique: jest.fn() },
    };
    email = { channel: 'EMAIL', send: jest.fn().mockResolvedValue(undefined) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: EMAIL_TRANSPORT, useValue: email },
        { provide: SMS_TRANSPORT, useValue: { send: jest.fn() } },
      ],
    }).compile();
    service = moduleRef.get(NotificationsService);
  });

  const outbound = {
    userId: 'user-1',
    type: NotificationType.OTP,
    title: 'Verify your account',
    message: 'Your verification code is 123456.',
    email: 'kamala@example.lk',
  };

  it('stores an in-app record and e-mails an ordinary notification', async () => {
    await service.notify(outbound, [
      NotificationChannel.IN_APP,
      NotificationChannel.EMAIL,
    ]);
    await flush();

    expect(prisma.notification.create).toHaveBeenCalledTimes(1);
    expect(email.send).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'kamala@example.lk' }),
    );
  });

  it('e-mails a sensitive notification without storing its text', async () => {
    const record = await service.notify({ ...outbound, sensitive: true }, [
      NotificationChannel.EMAIL,
    ]);
    await flush();

    expect(record).toBeNull();
    expect(prisma.notification.create).not.toHaveBeenCalled();
    expect(email.send).toHaveBeenCalledTimes(1);
  });

  it('retries a failed delivery rather than dropping it', async () => {
    jest.useFakeTimers();
    try {
      email.send
        .mockRejectedValueOnce(new Error('provider down'))
        .mockResolvedValue(undefined);

      await service.notify(outbound, [NotificationChannel.EMAIL]);
      await jest.advanceTimersByTimeAsync(5000);

      expect(email.send).toHaveBeenCalledTimes(2);
    } finally {
      jest.useRealTimers();
    }
  });
});
