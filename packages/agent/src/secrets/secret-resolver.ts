/**
 * Central Secret Resolver
 * Unified interface for resolving all application secrets
 */

import { getSecretsClient } from './infisical-client.js';
import { redactObject } from './secret-redaction.js';

export interface ProviderSecrets {
  openai?: string;
  anthropic?: string;
  openrouter?: string;
  google?: string;
  groq?: string;
  firecrawl?: string;
  brightdata?: string;
  database?: string;
  redis?: string;
  s3?: string;
  speech?: string;
}

export interface ApplicationSecrets {
  providers: ProviderSecrets;
  infisical?: {
    apiUrl: string;
    clientId: string;
    clientSecret: string;
  };
  jwt?: {
    secret: string;
    refreshSecret?: string;
  };
}

/**
 * Resolve all application secrets
 */
export async function resolveApplicationSecrets(): Promise<ApplicationSecrets> {
  const client = getSecretsClient();
  await client.initialize();

  const secrets: ApplicationSecrets = {
    providers: {},
  };

  // Resolve provider API keys (non-critical, fail silently)
  try {
    secrets.providers = {
      openai: await client.getSecret('OPENAI_API_KEY', undefined, false),
      anthropic: await client.getSecret('ANTHROPIC_API_KEY', undefined, false),
      openrouter: await client.getSecret('OPENROUTER_API_KEY', undefined, false),
      google: await client.getSecret('GEMINI_API_KEY', undefined, false),
      groq: await client.getSecret('GROQ_API_KEY', undefined, false),
      firecrawl: await client.getSecret('FIRECRAWL_API_KEY', undefined, false),
      brightdata: await client.getSecret('BRIGHTDATA_API_KEY', undefined, false),
      database: await client.getSecret('DATABASE_URL', undefined, false),
      redis: await client.getSecret('REDIS_URL', undefined, false),
      s3: await client.getSecret('S3_BUCKET_NAME', undefined, false),
      speech: await client.getSecret('SPEECH_API_KEY', undefined, false),
    };
  } catch (error) {
    console.warn('[SecretResolver] Non-critical provider secret missing:', error);
  }

  // Resolve optional Infisical configuration
  try {
    const infisicalApiUrl = await client.getSecret('INFISICAL_API_URL', undefined, false);
    const infisicalClientId = await client.getSecret('INFISICAL_CLIENT_ID', undefined, false);
    const infisicalClientSecret = await client.getSecret('INFISICAL_CLIENT_SECRET', undefined, false);

    if (infisicalApiUrl && infisicalClientId && infisicalClientSecret) {
      secrets.infisical = {
        apiUrl: infisicalApiUrl,
        clientId: infisicalClientId,
        clientSecret: infisicalClientSecret,
      };
    }
  } catch {
    // Infisical is optional
  }

  // Resolve optional JWT configuration
  try {
    const jwtSecret = await client.getSecret('JWT_SECRET', undefined, false);
    if (jwtSecret) {
      secrets.jwt = {
        secret: jwtSecret,
        refreshSecret: await client.getSecret('JWT_REFRESH_SECRET', undefined, false),
      };
    }
  } catch {
    // JWT is optional
  }

  return secrets;
}

/**
 * Get a specific provider secret
 */
export async function getProviderSecret(
  provider: keyof ProviderSecrets,
  required = false
): Promise<string> {
  const client = getSecretsClient();
  await client.initialize();

  const keyMap: Record<string, string> = {
    openai: 'OPENAI_API_KEY',
    anthropic: 'ANTHROPIC_API_KEY',
    openrouter: 'OPENROUTER_API_KEY',
    google: 'GEMINI_API_KEY',
    groq: 'GROQ_API_KEY',
    firecrawl: 'FIRECRAWL_API_KEY',
    brightdata: 'BRIGHTDATA_API_KEY',
    database: 'DATABASE_URL',
    redis: 'REDIS_URL',
    s3: 'S3_BUCKET_NAME',
    speech: 'SPEECH_API_KEY',
  };

  const secretName = keyMap[provider];
  if (!secretName) {
    throw new Error(`Unknown provider: ${provider}`);
  }

  return client.getSecret(secretName, undefined, required);
}

/**
 * Redact secrets from an object before logging/auditing
 */
export function redactSecretsFromObject(obj: Record<string, any>): Record<string, any> {
  return redactObject(obj);
}

/**
 * Verify all required secrets are available at startup
 */
export async function verifyRequiredSecrets(): Promise<{
  ok: boolean;
  issues: string[];
}> {
  const client = getSecretsClient();
  await client.initialize();

  const requiredSecrets = [
    // Database is critical
    'DATABASE_URL',
  ];

  const { ok, missing } = await client.verifySecrets(requiredSecrets);

  const issues: string[] = [];
  if (!ok) {
    missing.forEach((name) => {
      issues.push(
        `Missing required secret: ${name}\n` +
        `  Set via environment variable: ${name}=<value>\n` +
        `  Or in .env.local file`
      );
    });
  }

  return { ok, issues };
}

/**
 * Log secret verification status (without revealing values)
 */
export async function logSecretStatus(): Promise<void> {
  const client = getSecretsClient();
  await client.initialize();

  const status = client.getStatus();
  console.log('[Secrets] Status:', JSON.stringify(status, null, 2));
}
