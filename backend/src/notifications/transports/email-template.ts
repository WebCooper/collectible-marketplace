import type { OutboundNotification } from '../notification-dispatcher';

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/// Where the e-mail's button should lead: an explicit link wins, otherwise a
/// listing the notification is about. Only listing pages exist on the client
/// today, so other kinds of notification simply carry no button.
function resolveAction(notification: OutboundNotification, clientUrl: string) {
  if (notification.actionUrl) {
    return {
      url: notification.actionUrl,
      label: notification.actionLabel ?? 'Open',
    };
  }
  const listingId = notification.payload?.listingId;
  if (typeof listingId === 'string') {
    return {
      url: `${clientUrl}/listings/${encodeURIComponent(listingId)}`,
      label: notification.actionLabel ?? 'View listing',
    };
  }
  return null;
}

/// A deliberately plain, table-free layout with inline styles: it renders the
/// same in Gmail, Outlook and phone clients. Every interpolated value is
/// escaped - titles and messages can contain seller-supplied text such as a
/// listing title.
export function renderEmail(
  notification: OutboundNotification,
  options: { clientUrl: string; brand: string },
) {
  const action = resolveAction(notification, options.clientUrl);
  const brand = escapeHtml(options.brand);

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:8px;padding:32px;">
      <p style="margin:0 0 16px;font-size:13px;color:#71717a;">${brand}</p>
      <h1 style="margin:0 0 16px;font-size:20px;">${escapeHtml(notification.title)}</h1>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.5;">${escapeHtml(notification.message)}</p>${
        action
          ? `
      <p style="margin:0 0 24px;"><a href="${escapeHtml(action.url)}" style="display:inline-block;padding:12px 20px;background:#18181b;color:#ffffff;text-decoration:none;border-radius:6px;font-size:15px;">${escapeHtml(action.label)}</a></p>
      <p style="margin:0 0 24px;font-size:12px;color:#71717a;word-break:break-all;">Or open this link: ${escapeHtml(action.url)}</p>`
          : ''
      }
      <p style="margin:0;font-size:12px;color:#a1a1aa;">You received this e-mail because of activity on your ${brand} account.</p>
    </div>
  </body>
</html>`;

  const text = [
    notification.title,
    '',
    notification.message,
    ...(action ? ['', `${action.label}: ${action.url}`] : []),
    '',
    `— ${options.brand}`,
  ].join('\n');

  return { subject: notification.title, html, text };
}
