import type { ConfigService } from '@nestjs/config';

/// Placeholders from .env.example and the development fallbacks. A deployment
/// still using any of these would let anyone mint valid tokens.
const INSECURE_SECRETS = new Set([
  'change-me-in-production',
  'change-me-too',
  'dev-only-access-secret',
  'dev-only-refresh-secret',
]);

function resolveSecret(
  config: Pick<ConfigService, 'get'>,
  key: 'JWT_SECRET' | 'JWT_REFRESH_SECRET',
  devFallback: string,
) {
  const value = config.get<string>(key);
  if (config.get<string>('NODE_ENV') === 'production') {
    if (!value || INSECURE_SECRETS.has(value) || value.length < 32) {
      throw new Error(
        `${key} must be set to a unique secret of at least 32 characters in production`,
      );
    }
    return value;
  }
  return value ?? devFallback;
}

export const jwtAccessSecret = (config: Pick<ConfigService, 'get'>) =>
  resolveSecret(config, 'JWT_SECRET', 'dev-only-access-secret');

export const jwtRefreshSecret = (config: Pick<ConfigService, 'get'>) =>
  resolveSecret(config, 'JWT_REFRESH_SECRET', 'dev-only-refresh-secret');
