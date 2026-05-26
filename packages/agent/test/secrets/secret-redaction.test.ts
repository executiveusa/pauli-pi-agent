/**
 * Secret Redaction Tests
 * Verify sensitive information is properly detected and redacted
 */

import { describe, test, expect } from 'vitest';
import {
  SecretRedactor,
  redact,
  containsSecrets,
  detectSecretTypes,
  redactObject,
} from '../../src/secrets/secret-redaction.js';

describe('SecretRedactor', () => {
  test('detects and redacts OpenAI API keys', () => {
    const secret = 'sk-proj-abc123def456ghi789jkl012mno345';
    const result = redact(secret);
    expect(result).toContain('***REDACTED***');
    expect(result).not.toContain('sk-');
  });

  test('detects and redacts Anthropic API keys', () => {
    const secret = 'sk-ant-v4-abc123def456ghi789jkl012mno345';
    const result = redact(secret);
    expect(result).toContain('***REDACTED***');
    expect(result).not.toContain('sk-ant');
  });

  test('detects and redacts AWS access keys', () => {
    const secret = 'AKIAIOSFODNN7EXAMPLE';
    const result = redact(secret);
    expect(result).toContain('***REDACTED***');
  });

  test('detects and redacts Bearer tokens', () => {
    const secret = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
    const result = redact(secret);
    expect(result).toContain('***REDACTED***');
  });

  test('detects and redacts database URLs', () => {
    const secret = 'postgres://user:password@localhost:5432/mydb';
    const result = redact(secret);
    expect(result).toContain('***REDACTED***');
    expect(result).not.toContain(':password@');
  });

  test('detects and redacts Firecrawl API keys', () => {
    const secret = 'fc-abc123def456ghi789jkl012mno345';
    const result = redact(secret);
    expect(result).toContain('***REDACTED***');
  });

  test('redacts multiple secrets in one string', () => {
    const input = 'openai: sk-abc123 and anthropic: sk-ant-xyz789';
    const result = redact(input);
    expect(result).toContain('***REDACTED***');
    expect(result).not.toContain('sk-abc');
    expect(result).not.toContain('sk-ant');
  });

  test('preserves non-secret content while redacting', () => {
    const input = 'My API key is sk-abc123def456 for testing';
    const result = redact(input);
    expect(result).toContain('My API key is');
    expect(result).toContain('for testing');
    expect(result).toContain('***REDACTED***');
  });

  test('uses custom placeholder', () => {
    const secret = 'sk-abc123def456';
    const result = redact(secret, '[SECRET]');
    expect(result).toContain('[SECRET]');
    expect(result).not.toContain('***REDACTED***');
  });

  test('detects if string contains secrets', () => {
    expect(containsSecrets('sk-abc123def456')).toBe(true);
    expect(containsSecrets('Bearer token123')).toBe(true);
    expect(containsSecrets('hello world')).toBe(false);
  });

  test('detects secret types in string', () => {
    const input = 'API: sk-abc123def456 and token: Bearer xyz789';
    const types = detectSecretTypes(input);
    expect(types).toContain('openai_key');
    expect(types).toContain('bearer_token');
  });

  test('redacts objects recursively', () => {
    const obj = {
      user: 'john',
      apiKey: 'sk-abc123def456',
      config: {
        database: 'postgres://user:pass@localhost/db',
        token: 'Bearer xyz789',
      },
    };

    const redacted = redactObject(obj);
    expect(redacted.user).toBe('john');
    expect(redacted.apiKey).toContain('***REDACTED***');
    expect(redacted.config.database).toContain('***REDACTED***');
    expect(redacted.config.token).toContain('***REDACTED***');
  });

  test('redacts keys that look like secrets', () => {
    const obj = {
      username: 'john',
      password: 'securepass123',
      api_secret: 'some-secret-value',
      token: 'jwt-token-xyz',
    };

    const redacted = redactObject(obj);
    expect(redacted.username).toBe('john');
    expect(redacted.password).toContain('***REDACTED***');
    expect(redacted.api_secret).toContain('***REDACTED***');
    expect(redacted.token).toContain('***REDACTED***');
  });

  test('handles null and undefined inputs gracefully', () => {
    expect(redact(null as any)).toBe('');
    expect(redact(undefined as any)).toBe('');
    expect(containsSecrets(null as any)).toBe(false);
    expect(containsSecrets(undefined as any)).toBe(false);
  });

  test('handles objects with nested structures', () => {
    const obj = {
      level1: {
        level2: {
          apiKey: 'sk-abc123',
          level3: {
            token: 'Bearer xyz',
          },
        },
      },
    };

    const redacted = redactObject(obj);
    expect(redacted.level1.level2.apiKey).toContain('***REDACTED***');
    expect(redacted.level1.level2.level3.token).toContain('***REDACTED***');
  });

  test('custom patterns can be added', () => {
    const redactor = new SecretRedactor({
      customPatterns: [/custom-secret-[a-zA-Z0-9]+/g],
    });

    const input = 'My secret is custom-secret-abc123';
    const result = redactor.redact(input);
    expect(result).toContain('***REDACTED***');
  });

  test('never leaks secrets in error messages', () => {
    const apiKey = 'sk-abc123def456ghi789jkl012';
    const errorMessage = `Failed to authenticate with API key: ${apiKey}`;

    const redacted = redact(errorMessage);
    expect(redacted).not.toContain('sk-abc');
    expect(redacted).toContain('Failed to authenticate');
  });
});

describe('Secret Redaction - Logging Safety', () => {
  test('audit log entry with secrets is redacted', () => {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      action: 'configure_api',
      user: 'admin',
      details: {
        provider: 'openai',
        apiKey: 'sk-abc123def456',
      },
    };

    const redacted = redactObject(auditEntry);
    const redactedJson = JSON.stringify(redacted);

    expect(redactedJson).not.toContain('sk-abc');
    expect(redactedJson).toContain('***REDACTED***');
  });

  test('error logs with authentication failures are safe', () => {
    const errorLog = {
      error: 'Authentication failed',
      credentials: {
        username: 'user@example.com',
        password: 'MySecurePass123!',
      },
      response: {
        status: 401,
        body: 'Bearer token invalid',
      },
    };

    const redacted = redactObject(errorLog);
    const json = JSON.stringify(redacted);

    expect(json).not.toContain('MySecurePass');
    expect(json).not.toContain('Bearer');
    expect(json).toContain('username');
  });
});
