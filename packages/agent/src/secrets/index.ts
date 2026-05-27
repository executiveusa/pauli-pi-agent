/**
 * Secret Management Module
 * Centralized exports for all secret-related utilities
 */

// Infisical client
export {
	getSecret,
	getSecretsClient,
	InfisicalClient,
	type InfisicalConfig,
	initializeSecrets,
	resolveSecret,
	type SecretResolution,
} from "./infisical-client.js";

// Secret redaction
export {
	containsSecrets,
	detectSecretTypes,
	globalRedactor,
	type RedactionConfig,
	redact,
	redactObject,
	SecretRedactor,
} from "./secret-redaction.js";

// Secret resolver
export {
	type ApplicationSecrets,
	getProviderSecret,
	logSecretStatus,
	type ProviderSecrets,
	redactSecretsFromObject,
	resolveApplicationSecrets,
	verifyRequiredSecrets,
} from "./secret-resolver.js";
