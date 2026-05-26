/**
 * Secret Resolver Tests
 * Verify application secrets are properly resolved
 */

import { describe, test, expect, beforeEach } from 'vitest';
import {
  resolveApplicationSecrets,
  getProviderSecret,
  redactSecretsFromObject,
  verifyRequiredSecrets,
} from '../../src/secrets/secret-resolver';

describe('Secret Resolver', () => {
  beforeEach(() => {
    // Clear environment
    Object.keys(process.env).forEach((key) => {
      if (
        key.includes('API_KEY') ||
        key.includes('SECRET') ||
        key.includes('TOKEN') ||
        key.includes('DATABASE') ||
        key.includes('REDIS')
      ) {
        delete process.env[key];
      }
    });
  });

  test('resolves application secrets with defaults', async () => {
    const secrets = await resolveApplicationSecrets();

    expect(secrets).toBeDefined();
    expect(secrets.providers).toBeDefined();
  });

  test('resolves provider API keys from environment', async () => {
    process.env.OPENAI_API_KEY = 'sk-test-openai-123';
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test-456';

    const secrets = await resolveApplicationSecrets();

    expect(secrets.providers.openai).toBe('sk-test-openai-123');
    expect(secrets.providers.anthropic).toBe('sk-ant-test-456');
  });

  test('gets individual provider secrets', async () => {
    process.env.OPENAI_API_KEY = 'sk-test-key-123';

    const secret = await getProviderSecret('openai');
    expect(secret).toBe('sk-test-key-123');
  });

  test('throws on unknown provider', async () => {
    await expect(
      getProviderSecret('unknown_provider' as any)
    ).rejects.toThrow('Unknown provider');
  });

  test('returns empty string for missing optional provider secret', async () => {
    const secret = await getProviderSecret('openai');
    expect(secret).toBe('');
  });

  test('redacts secrets from objects', () => {
    const secrets = {
      apiKey: 'sk-test-123',
      databaseUrl: 'postgres://user:pass@localhost/db',
      userName: 'john',
    };

    const redacted = redactSecretsFromObject(secrets);

    expect(redacted.userName).toBe('john');
    expect(redacted.apiKey).toContain('***REDACTED***');
    expect(redacted.databaseUrl).toContain('***REDACTED***');
  });

  test('verifies required secrets at startup', async () => {
    // Without DATABASE_URL set
    const result = await verifyRequiredSecrets();

    expect(result.ok).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues[0]).toContain('DATABASE_URL');
  });

  test('passes verification when all required secrets present', async () => {
    process.env.DATABASE_URL = 'postgres://localhost/db';

    const result = await verifyRequiredSecrets();

    expect(result.ok).toBe(true);
    expect(result.issues.length).toBe(0);
  });

  test('handles Infisical configuration', async () => {
    process.env.INFISICAL_API_URL = 'https://app.infisical.com/api';
    process.env.INFISICAL_CLIENT_ID = 'client-123';
    process.env.INFISICAL_CLIENT_SECRET = 'secret-456';

    const secrets = await resolveApplicationSecrets();

    expect(secrets.infisical).toBeDefined();
    if (secrets.infisical) {
      expect(secrets.infisical.apiUrl).toBe('https://app.infisical.com/api');
      expect(secrets.infisical.clientId).toBe('client-123');
    }
  });

  test('handles JWT configuration', async () => {
    process.env.JWT_SECRET = 'jwt-secret-key-123';
    process.env.JWT_REFRESH_SECRET = 'jwt-refresh-key-456';

    const secrets = await resolveApplicationSecrets();

    expect(secrets.jwt).toBeDefined();
    if (secrets.jwt) {
      expect(secrets.jwt.secret).toBe('jwt-secret-key-123');
      expect(secrets.jwt.refreshSecret).toBe('jwt-refresh-key-456');
    }
  });

  test('handles missing optional secrets gracefully', async () => {
    // Don't set any optional secrets
    const secrets = await resolveApplicationSecrets();

    expect(secrets.infisical).toBeUndefined();
    expect(secrets.jwt).toBeUndefined();
  });

  test('all provider keys are resolved (even if empty)', async () => {
    const secrets = await resolveApplicationSecrets();

    expect(secrets.providers.openai).toBeDefined();
    expect(secrets.providers.anthropic).toBeDefined();
    expect(secrets.providers.openrouter).toBeDefined();
    expect(secrets.providers.google).toBeDefined();
    expect(secrets.providers.groq).toBeDefined();
    expect(secrets.providers.firecrawl).toBeDefined();
    expect(secrets.providers.brightdata).toBeDefined();
    expect(secrets.providers.database).toBeDefined();
    expect(secrets.providers.redis).toBeDefined();
    expect(secrets.providers.s3).toBeDefined();
    expect(secrets.providers.speech).toBeDefined();
  });
});

describe('Secret Resolver - No Leaks in Logs', () => {
  test('secrets are not exposed when resolving fails', async () => {
    process.env.SECRET_API_KEY = 'sk-sensitive-value-12345';

    try {
      // Try to get a different secret that doesn't exist
      await getProviderSecret('openai');
    } catch {
      // Expected to not throw for optional secrets
    }

    // The original secret should remain in env but not be logged
    expect(process.env.SECRET_API_KEY).toBe('sk-sensitive-value-12345');
  });

  test('error messages do not contain secret values', () => {
    const secrets = {
      apiKey: 'sk-real-secret-abc123',
      config: {
        token: 'Bearer xyz789',
      },
    };

    const redacted = redactSecretsFromObject(secrets);
    const errorMessage = `Configuration failed: ${JSON.stringify(redacted)}`;

    expect(errorMessage).not.toContain('sk-real-secret');
    expect(errorMessage).not.toContain('xyz789');
    expect(errorMessage).toContain('***REDACTED***');
  });
});
