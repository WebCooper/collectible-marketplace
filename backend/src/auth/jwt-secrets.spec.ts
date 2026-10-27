import { jwtAccessSecret, jwtRefreshSecret } from './jwt-secrets';

const config = (values: Record<string, string | undefined>) => ({
  get: (key: string) => values[key],
});

describe('JWT secrets', () => {
  const strong = 'x'.repeat(40);

  it('falls back to a development secret outside production', () => {
    expect(jwtAccessSecret(config({}) as never)).toBeTruthy();
  });

  it.each([
    {},
    { JWT_SECRET: 'change-me-in-production' },
    { JWT_SECRET: 'too-short' },
  ])('refuses a missing or weak access secret in production (%j)', (env) => {
    expect(() =>
      jwtAccessSecret(config({ NODE_ENV: 'production', ...env }) as never),
    ).toThrow(/JWT_SECRET/);
  });

  it('refuses the placeholder refresh secret in production', () => {
    expect(() =>
      jwtRefreshSecret(
        config({
          NODE_ENV: 'production',
          JWT_REFRESH_SECRET: 'change-me-too',
        }) as never,
      ),
    ).toThrow(/JWT_REFRESH_SECRET/);
  });

  it('accepts strong secrets in production', () => {
    const env = config({
      NODE_ENV: 'production',
      JWT_SECRET: strong,
      JWT_REFRESH_SECRET: strong,
    }) as never;
    expect(jwtAccessSecret(env)).toBe(strong);
    expect(jwtRefreshSecret(env)).toBe(strong);
  });
});
