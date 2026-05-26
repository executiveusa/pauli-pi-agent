/**
 * Secret Management Module
 * Centralized exports for all secret-related utilities
 */

// Infisical client
export {
  InfisicalClient,
  initializeSecrets,
  getSecretsClient,
  resolveSecret,
  getSecret,
  type InfisicalConfig,
  type SecretResolution,
} from './infisical-client';

// Secret redaction
export {
  SecretRedactor,
  globalRedactor,
  redact,
  containsSecrets,
  detectSecretTypes,
  redactObject,
  type RedactionConfig,
} from './secret-redaction';

// Secret resolver
export {
  resolveApplicationSecrets,
  getProviderSecret,
  redactSecretsFromObject,
  verifyRequiredSecrets,
  logSecretStatus,
  type ProviderSecrets,
  type ApplicationSecrets,
} from './secret-resolver';
