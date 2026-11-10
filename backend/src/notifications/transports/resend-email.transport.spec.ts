import { ConfigService } from '@nestjs/config';
import { NotificationType } from '@prisma/client';
import { ResendEmailTransport } from './resend-email.transport';

const mockSend = jest.fn();
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({ emails: { send: mockSend } })),
}));

const notification = {
  userId: 'user-1',
  type: NotificationType.OTP,
  title: 'Verify your account',
  message: 'Your verification code is 123456.',
  email: 'kamala@example.lk',
};

function transportWith(env: Record<string, string>) {
  const config = new ConfigService(env);
  return new ResendEmailTransport(config);
}

describe('ResendEmailTransport', () => {
  beforeEach(() => mockSend.mockReset());

  it('sends the e-mail through Resend with the configured sender', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email-1' }, error: null });
    const transport = transportWith({
      RESEND_API_KEY: 're_test',
      EMAIL_FROM: 'Shop <noreply@shop.lk>',
    });

    await transport.send(notification);

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'Shop <noreply@shop.lk>',
        to: 'kamala@example.lk',
        subject: 'Verify your account',
        html: expect.stringContaining('123456'),
        text: expect.stringContaining('123456'),
      }),
    );
  });

  it('throws when Resend returns an error, so the retry queue engages', async () => {
    mockSend.mockResolvedValue({
      data: null,
      error: { name: 'rate_limit_exceeded', message: 'Too many requests' },
    });
    const transport = transportWith({ RESEND_API_KEY: 're_test' });

    await expect(transport.send(notification)).rejects.toThrow(
      /rate_limit_exceeded/,
    );
  });

  it('throws when the network call itself fails', async () => {
    mockSend.mockRejectedValue(new Error('socket hang up'));
    const transport = transportWith({ RESEND_API_KEY: 're_test' });

    await expect(transport.send(notification)).rejects.toThrow(
      'socket hang up',
    );
  });

  it('skips a recipient with no address instead of retrying forever', async () => {
    const transport = transportWith({ RESEND_API_KEY: 're_test' });

    await expect(
      transport.send({ ...notification, email: undefined }),
    ).resolves.toBeUndefined();
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('refuses to start without an API key', () => {
    expect(() => transportWith({})).toThrow();
  });
});
