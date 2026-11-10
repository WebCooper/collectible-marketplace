import { NotificationType } from '@prisma/client';
import { renderEmail } from './email-template';

const base = {
  userId: 'user-1',
  type: NotificationType.OUTBID,
  title: 'You have been outbid',
  message: 'Someone bid LKR 10500.00 on "Ceylon 1 Rupee".',
};
const options = { clientUrl: 'https://shop.example.lk', brand: 'Marketplace' };

describe('renderEmail', () => {
  it('uses the title as the subject and includes a plain-text part', () => {
    const { subject, text } = renderEmail(base, options);

    expect(subject).toBe('You have been outbid');
    expect(text).toContain('Someone bid LKR 10500.00');
  });

  it('escapes seller-supplied text so it cannot inject markup', () => {
    const { html } = renderEmail(
      {
        ...base,
        title: '<script>alert(1)</script>',
        message: '"><img src=x onerror=alert(1)>',
      },
      options,
    );

    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;script&gt;');
  });

  it('renders an explicit action as a button', () => {
    const { html, text } = renderEmail(
      {
        ...base,
        actionUrl: 'https://shop.example.lk/reset-password?token=abc',
        actionLabel: 'Choose a new password',
      },
      options,
    );

    expect(html).toContain(
      'href="https://shop.example.lk/reset-password?token=abc"',
    );
    expect(html).toContain('Choose a new password');
    expect(text).toContain('reset-password?token=abc');
  });

  it('links to the listing when the notification is about one', () => {
    const { html } = renderEmail(
      { ...base, payload: { listingId: 'abc-123' } },
      options,
    );

    expect(html).toContain('href="https://shop.example.lk/listings/abc-123"');
  });

  it('shows no button when there is nowhere sensible to link', () => {
    const { html } = renderEmail(
      { ...base, payload: { orderId: 'o-1' } },
      options,
    );

    expect(html).not.toContain('<a ');
  });
});
