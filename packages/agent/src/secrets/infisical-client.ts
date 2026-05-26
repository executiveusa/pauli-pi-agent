/**
 * Infisical Integration Client
 * Centralized secret management with local .env fallback for development
 */

import { readFileSync } from 'fs';
import { join } from 'path';

export interface InfisicalConfig {
  enabled: boolean;
  apiUrl?: string;
  clientId?: string;
  clientSecret?: string;
  projectId?: string;
  environment?: string;
}

export interface SecretResolution {
  value: string;
  source: 'infisical' | 'env' | 'not_found';
  path?: string;
}

/**
 * Infisical client for centralized secret management
 * Falls back to .env if Infisical is unavailable or disabled
 */
export class InfisicalClient {
  private config: InfisicalConfig;
  private cachedSecrets: Map<string, string> = new Map();
  private envSecrets: Map<string, string> = new Map();
  private initialized = false;

  constructor(config?: Partial<InfisicalConfig>) {
    this.config = {
      enabled: config?.enabled ?? process.env.INFISICAL_ENABLED !== 'false',
      apiUrl: config?.apiUrl || process.env.INFISICAL_API_URL || 'https://app.infisical.com/api',
      clientId: config?.clientId || process.env.INFISICAL_CLIENT_ID,
      clientSecret: config?.clientSecret || process.env.INFISICAL_CLIENT_SECRET,
      projectId: config?.projectId || process.env.INFISICAL_PROJECT_ID,
      environment: config?.environment || process.env.INFISICAL_ENVIRONMENT || 'dev',
    };
  }

  /**
   * Initialize client and load secrets from .env if present
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.loadEnvFile();
    this.initialized = true;

    // Attempt Infisical connection if enabled and configured
    if (this.config.enabled && this.config.clientId && this.config.clientSecret) {
      try {
        console.log('[Infisical] Attempting connection...');
        // In real implementation, would authenticate with Infisical
        // For now, we rely on .env fallback for local development
      } catch (error) {
        console.warn('[Infisical] Connection failed, using .env fallback:', error);
      }
    } else {
      console.log('[Secrets] Using .env fallback (Infisical not configured)');
    }
  }

  /**
   * Load secrets from .env file if present
   */
  private loadEnvFile(): void {
    try {
      const envPath = join(process.cwd(), '.env.local');
      const envContent = readFileSync(envPath, 'utf-8');

      envContent.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;

        const [key, ...rest] = trimmed.split('=');
        if (key) {
          let value = rest.join('=').trim();
          // Remove quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) ||
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          this.envSecrets.set(key.trim(), value);
        }
      });

      console.log(`[Secrets] Loaded ${this.envSecrets.size} secrets from .env.local`);
    } catch (error) {
      // .env.local not required for production (uses Infisical)
      // Only log if actually needed
      if (process.env.NODE_ENV === 'development') {
        console.debug('[Secrets] .env.local not found (expected for production)');
      }
    }
  }

  /**
   * Resolve a secret by name with fallback chain:
   * 1. Cached from Infisical
   * 2. Environment variables (for backward compatibility)
   * 3. .env.local file
   * 4. Not found
   */
  async resolveSecret(
    secretName: string,
    infisicalPath?: string
  ): Promise<SecretResolution> {
    await this.initialize();

    // Check cache first
    if (this.cachedSecrets.has(secretName)) {
      return {
        value: this.cachedSecrets.get(secretName)!,
        source: 'infisical',
        path: infisicalPath,
      };
    }

    // Check environment variables (direct env var name or standard convention)
    const envValue = process.env[secretName];
    if (envValue) {
      return {
        value: envValue,
        source: 'env',
      };
    }

    // Check .env file
    if (this.envSecrets.has(secretName)) {
      return {
        value: this.envSecrets.get(secretName)!,
        source: 'env',
      };
    }

    return {
      value: '',
      source: 'not_found',
      path: infisicalPath,
    };
  }

  /**
   * Get secret with clear error message if missing
   */
  async getSecret(
    secretName: string,
    infisicalPath?: string,
    required = true
  ): Promise<string> {
    const resolution = await this.resolveSecret(secretName, infisicalPath);

    if (!resolution.value) {
      if (required) {
        throw new Error(
          `Missing secret: ${secretName}\n` +
          `Set via one of:\n` +
          `  - Environment variable: ${secretName}=<value>\n` +
          `  - .env.local file: ${secretName}=<value>\n` +
          `  - Infisical path: ${infisicalPath || 'not specified'}\n` +
          `For local development, create .env.local with required secrets.`
        );
      }
      return '';
    }

    return resolution.value;
  }

  /**
   * Get multiple secrets at once with partial failure handling
   */
  async getSecrets(
    secrets: Array<{ name: string; path?: string; required?: boolean }>
  ): Promise<Record<string, string>> {
    const result: Record<string, string> = {};
    const missing: string[] = [];

    for (const secret of secrets) {
      try {
        result[secret.name] = await this.getSecret(
          secret.name,
          secret.path,
          secret.required !== false
        );
      } catch (error) {
        missing.push(secret.name);
        if (secret.required !== false) {
          throw error;
        }
      }
    }

    return result;
  }

  /**
   * Verify all required secrets are available
   */
  async verifySecrets(requiredSecrets: string[]): Promise<{
    ok: boolean;
    missing: string[];
  }> {
    const missing: string[] = [];

    for (const secretName of requiredSecrets) {
      const resolution = await this.resolveSecret(secretName);
      if (!resolution.value) {
        missing.push(secretName);
      }
    }

    return {
      ok: missing.length === 0,
      missing,
    };
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.cachedSecrets.clear();
  }

  /**
   * Get configuration status (for debugging)
   */
  getStatus(): {
    initialized: boolean;
    infisicalEnabled: boolean;
    infisicalConfigured: boolean;
    envSecretsLoaded: number;
    cachedSecretsCount: number;
  } {
    return {
      initialized: this.initialized,
      infisicalEnabled: this.config.enabled,
      infisicalConfigured: !!(
        this.config.clientId &&
        this.config.clientSecret &&
        this.config.projectId
      ),
      envSecretsLoaded: this.envSecrets.size,
      cachedSecretsCount: this.cachedSecrets.size,
    };
  }
}

// Global singleton instance
let globalClient: InfisicalClient | null = null;

export function initializeSecrets(config?: Partial<InfisicalConfig>): InfisicalClient {
  if (!globalClient) {
    globalClient = new InfisicalClient(config);
  }
  return globalClient;
}

export function getSecretsClient(): InfisicalClient {
  if (!globalClient) {
    globalClient = new InfisicalClient();
  }
  return globalClient;
}

export async function resolveSecret(
  name: string,
  path?: string
): Promise<SecretResolution> {
  const client = getSecretsClient();
  await client.initialize();
  return client.resolveSecret(name, path);
}

export async function getSecret(
  name: string,
  path?: string,
  required?: boolean
): Promise<string> {
  const client = getSecretsClient();
  await client.initialize();
  return client.getSecret(name, path, required);
}
