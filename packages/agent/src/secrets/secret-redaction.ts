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

const SECRET_PATTERNS: Record<string, RegExp> = {
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
    const patterns: Array<[string, RegExp]> = [
      ['openai_key', SECRET_PATTERNS.openaiKey],
      ['anthropic_key', SECRET_PATTERNS.anthropicKey],
      ['aws_access_key', SECRET_PATTERNS.awsAccessKey],
      ['aws_secret_key', SECRET_PATTERNS.awsSecretKey],
      ['bearer_token', SECRET_PATTERNS.bearerToken],
      ['basic_auth', SECRET_PATTERNS.basicAuth],
      ['api_key', SECRET_PATTERNS.apiKey],
      ['database_url', SECRET_PATTERNS.dbUrl],
      ['jwt_token', SECRET_PATTERNS.jwtToken],
      ['password', SECRET_PATTERNS.password],
      ['firecrawl_key', SECRET_PATTERNS.firecrawlKey],
      ['bright_data_key', SECRET_PATTERNS.brightDataKey],
    ];

    for (const [name, pattern] of patterns) {
      pattern.lastIndex = 0;
      if (pattern.test(input)) {
        detected.push(name);
      }
    }

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
