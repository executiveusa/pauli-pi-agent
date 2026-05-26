/**
 * Secret Redaction Utility
 * Detects and redacts sensitive information from logs and audit trails
 */

export interface RedactionConfig {
  includePatterns?: boolean;
  includePaths?: boolean;
  includeValues?: boolean;
  customPatterns?: RegExp[];
}

const SECRET_PATTERNS = {
  // OpenAI/OpenRouter format: sk-* followed by alphanumeric
  openaiKey: /sk-[a-zA-Z0-9]{20,}/g,
  // Anthropic format: sk-ant-* or claude-*
  anthropicKey: /(sk-ant-|claude-)[a-zA-Z0-9_-]{20,}/g,
  // AWS format: AKIA followed by alphanumeric
  awsAccessKey: /AKIA[0-9A-Z]{16}/g,
  // AWS Secret Key format: 40 chars
  awsSecretKey: /aws_secret_access_key\s*=\s*([a-zA-Z0-9/+]{40})/g,
  // Bearer tokens
  bearerToken: /Bearer\s+[a-zA-Z0-9._-]+/gi,
  // Basic auth
  basicAuth: /Basic\s+[a-zA-Z0-9+/=]+/gi,
  // Generic API key patterns
  apiKey: /api[_-]?key\s*[=:]\s*['\"]?([a-zA-Z0-9_\-\.]{20,})['\"]?/gi,
  // Database URLs
  dbUrl: /(postgres|mysql|mongodb):\/\/[^\s]+@[^\s]+/gi,
  // JWT tokens (basic pattern)
  jwtToken: /eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}/g,
  // Password patterns
  password: /password\s*[=:]\s*['\"]([^'\"]+)['\"]/gi,
  // Firecrawl API key
  firecrawlKey: /fc-[a-zA-Z0-9]{20,}/g,
  // BrightData/Proxy API key
  brightDataKey: /brd-[a-zA-Z0-9]{20,}/g,
};

export class SecretRedactor {
  private customPatterns: RegExp[];

  constructor(config?: RedactionConfig) {
    this.customPatterns = config?.customPatterns || [];
  }

  /**
   * Redact sensitive information from a string
   */
  redact(input: string | null | undefined, placeholder = '***REDACTED***'): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    let result = input;

    // Apply built-in patterns
    Object.values(SECRET_PATTERNS).forEach((pattern) => {
      result = result.replace(pattern, placeholder);
    });

    // Apply custom patterns
    this.customPatterns.forEach((pattern) => {
      result = result.replace(pattern, placeholder);
    });

    return result;
  }

  /**
   * Detect if a string contains secrets (without redacting)
   */
  containsSecrets(input: string | null | undefined): boolean {
    if (!input || typeof input !== 'string') {
      return false;
    }

    const allPatterns = [
      ...Object.values(SECRET_PATTERNS),
      ...this.customPatterns,
    ];

    return allPatterns.some((pattern) => {
      pattern.lastIndex = 0;
      return pattern.test(input);
    });
  }

  /**
   * Extract detected secret types from a string
   */
  detectSecretTypes(input: string | null | undefined): string[] {
    if (!input || typeof input !== 'string') {
      return [];
    }

    const detected: string[] = [];

    if (SECRET_PATTERNS.openaiKey.test(input)) detected.push('openai_key');
    if (SECRET_PATTERNS.anthropicKey.test(input)) detected.push('anthropic_key');
    if (SECRET_PATTERNS.awsAccessKey.test(input)) detected.push('aws_access_key');
    if (SECRET_PATTERNS.awsSecretKey.test(input)) detected.push('aws_secret_key');
    if (SECRET_PATTERNS.bearerToken.test(input)) detected.push('bearer_token');
    if (SECRET_PATTERNS.basicAuth.test(input)) detected.push('basic_auth');
    if (SECRET_PATTERNS.apiKey.test(input)) detected.push('api_key');
    if (SECRET_PATTERNS.dbUrl.test(input)) detected.push('database_url');
    if (SECRET_PATTERNS.jwtToken.test(input)) detected.push('jwt_token');
    if (SECRET_PATTERNS.password.test(input)) detected.push('password');
    if (SECRET_PATTERNS.firecrawlKey.test(input)) detected.push('firecrawl_key');
    if (SECRET_PATTERNS.brightDataKey.test(input)) detected.push('bright_data_key');

    return detected;
  }

  /**
   * Redact an object recursively (deep copy)
   */
  redactObject(
    obj: Record<string, any> | null | undefined,
    placeholder = '***REDACTED***'
  ): Record<string, any> {
    if (!obj || typeof obj !== 'object') {
      return {};
    }

    const redacted: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      // Always redact keys that look like secrets
      if (this.isSuspiciousKey(key)) {
        redacted[key] = placeholder;
      } else if (typeof value === 'string') {
        redacted[key] = this.redact(value, placeholder);
      } else if (value && typeof value === 'object') {
        redacted[key] = this.redactObject(value as Record<string, any>, placeholder);
      } else {
        redacted[key] = value;
      }
    }

    return redacted;
  }

  private isSuspiciousKey(key: string): boolean {
    const suspiciousKeywords = [
      'password',
      'secret',
      'token',
      'key',
      'credential',
      'auth',
      'apikey',
      'api_key',
      'access_key',
      'secret_key',
      'bearer',
      'jwt',
    ];

    const lowerKey = key.toLowerCase();
    return suspiciousKeywords.some((keyword) => lowerKey.includes(keyword));
  }
}

export const globalRedactor = new SecretRedactor();

export function redact(input: string | null | undefined, placeholder?: string): string {
  return globalRedactor.redact(input, placeholder);
}

export function containsSecrets(input: string | null | undefined): boolean {
  return globalRedactor.containsSecrets(input);
}

export function detectSecretTypes(input: string | null | undefined): string[] {
  return globalRedactor.detectSecretTypes(input);
}

export function redactObject(
  obj: Record<string, any> | null | undefined,
  placeholder?: string
): Record<string, any> {
  return globalRedactor.redactObject(obj, placeholder);
}
