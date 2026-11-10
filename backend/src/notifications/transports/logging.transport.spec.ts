import { Logger } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { LoggingEmailTransport } from './logging.transport';

describe('LoggingEmailTransport', () => {
  afterEach(() => jest.restoreAllMocks());

  it('logs the action link so reset and verify links can be followed in development', async () => {
    const log = jest.spyOn(Logger.prototype, 'log').mockImplementation();

    await new LoggingEmailTransport().send({
      userId: 'u-1',
      type: NotificationType.OTP,
      title: 'Reset your password',
      message: 'Use the button below.',
      email: 'kamala@example.lk',
      actionUrl: 'http://localhost:3000/reset-password?token=abc',
    });

    expect(log).toHaveBeenCalledWith(
      expect.stringContaining('http://localhost:3000/reset-password?token=abc'),
    );
  });
});
