import { issuedBeforePasswordChange } from './jwt.strategy';

describe('issuedBeforePasswordChange', () => {
  const changedAt = new Date('2026-10-27T10:00:00Z');
  const seconds = (d: Date) => Math.floor(d.getTime() / 1000);

  it('never rejects when the password has not changed', () => {
    expect(issuedBeforePasswordChange(1, null)).toBe(false);
  });

  it('rejects a token issued before the change', () => {
    expect(issuedBeforePasswordChange(seconds(changedAt) - 1, changedAt)).toBe(
      true,
    );
  });

  it('keeps a token issued in the same second as the change', () => {
    expect(issuedBeforePasswordChange(seconds(changedAt), changedAt)).toBe(
      false,
    );
  });

  it('rejects a token with no issued-at claim once the password changed', () => {
    expect(issuedBeforePasswordChange(undefined, changedAt)).toBe(true);
  });
});
