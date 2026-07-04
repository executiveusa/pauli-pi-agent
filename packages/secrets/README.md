# @pauli/secrets

Secure secrets management and validation for PAULI. This package provides a centralized, type-safe way to load, validate, and manage all environment secrets across the PAULI system.

## Features

- **Type-Safe**: Full TypeScript support with inferred types
- **Comprehensive Validation**: Zod-based validation for all secret schemas
- **Production-Ready**: Warnings for missing critical secrets in production
- **Enum Validation**: Strict validation of enum values (e.g., NODE_ENV, voice providers)
- **URL Validation**: Automatic validation of URL-format secrets
- **Boolean Coercion**: Automatic string-to-boolean conversion for feature flags
- **Default Values**: Sensible defaults for optional configuration
- **CLI Tools**: Built-in validation commands

## Installation

```bash
npm install @pauli/secrets
```

## Quick Start

### Basic Usage

```typescript
import { createSecretsLoader } from '@pauli/secrets';

// Load from process.env (or pass custom env object)
const loader = createSecretsLoader();

// Validate and get secrets
const secrets = loader.get(); // Throws if invalid
const secrets = loader.getSafe(); // Never throws

// Check validity
if (loader.isValid()) {
  console.log('Secrets are valid');
}

// Print diagnostic report
loader.printReport();
```

### In Application Code

```typescript
import { createSecretsLoader } from '@pauli/secrets';

export const secrets = createSecretsLoader().get();

// Use secrets throughout your app
export function getOpenRouterKey() {
  return secrets.OPENROUTER_API_KEY;
}
```

## Environment Variables

### LLM Proxy

```env
LLM_PROXY_URL=http://localhost:8082
LLM_PROXY_TOKEN=freecc
LLM_PROXY_ENABLED=true
```

### API Keys

```env
# LLM Providers
OPENROUTER_API_KEY=<your-key>
GEMINI_API_KEY=<your-key>
GROQ_API_KEY=<your-key>
MISTRAL_API_KEY=<your-key>
ZAI_API_KEY=<your-key>
ANTHROPIC_API_KEY=<your-key>
OPENAI_API_KEY=<your-key>

# Infrastructure & Services
GITHUB_TOKEN=<your-token>
CLOUDFLARE_API_TOKEN=<your-token>
CLOUDFLARE_ACCOUNT_ID=<your-account>
HUGGINGFACE_TOKEN=<your-token>
FIRECRAWL_API_KEY=<your-key>
NOTION_API_TOKEN=<your-token>
SUPABASE_ACCESS_TOKEN=<your-token>
VERCEL_TOKEN=<your-token>
```

### Mercury Voice Agent (ArchonX)

```env
INCEPTION_API_KEY=<your-key>
MERCURY_MODEL=mercury-2
MERCURY_BASE_URL=https://api.inceptionlabs.ai/v1
MERCURY_DEFAULT_REASONING=low
MERCURY_VOICE_REASONING=instant
MERCURY_OPERATOR_REASONING=medium
MERCURY_DIFFUSION_ENABLED=true
```

Valid values:
- `MERCURY_DEFAULT_REASONING`: `low`, `medium`, `high`
- `MERCURY_VOICE_REASONING`: `instant`, `low`, `medium`, `high`
- `MERCURY_OPERATOR_REASONING`: `low`, `medium`, `high`
- `MERCURY_DIFFUSION_ENABLED`: `true`, `false`

### Voice (STT/TTS)

```env
VOICE_STT_PROVIDER=openai     # openai, google, azure
VOICE_TTS_PROVIDER=openai     # openai, google, azure
VOICE_TTS_MODEL=tts-1
VOICE_TTS_VOICE=shimmer       # alloy, echo, fable, onyx, nova, shimmer
```

### ArchonX Tenant System

```env
ARCHONX_CONTROL_PLANE_URL=http://localhost:3000
ARCHONX_TENANT_CONFIG_MODE=local              # local, remote
ARCHONX_DEFAULT_TENANT_ID=client_demo
ARCHONX_USAGE_LOGGING=true                    # true, false
ARCHONX_CLIENT_BYOK_DEFAULT=true              # true, false
```

### Pauli Brain / Second Brain

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
SUPABASE_ANON_KEY=<anon-key>
DATABASE_URL=postgresql://postgres:password@localhost:5432/second_brain
```

### Environment

```env
NODE_ENV=development    # development, production, test
```

## API Reference

### `SecretsLoader`

Main class for loading and validating secrets.

```typescript
class SecretsLoader {
  // Load environment variables
  load(env?: Record<string, string | undefined>): this

  // Validate loaded secrets
  validate(): SecretValidationResult

  // Get validated secrets (throws if invalid)
  get(): Partial<Secrets>

  // Get secrets safely (never throws)
  getSafe(): Partial<Secrets>

  // Get validation result object
  getValidationResult(): SecretValidationResult

  // Check if valid
  isValid(): boolean

  // Get error map
  getErrors(): Record<string, string[]>

  // Get warnings
  getWarnings(): string[]

  // Print diagnostic report
  printReport(): void
}
```

### `createSecretsLoader(env?)`

Helper function to create and load a `SecretsLoader`.

```typescript
const loader = createSecretsLoader();
const loader = createSecretsLoader(process.env);
const loader = createSecretsLoader({ OPENROUTER_API_KEY: 'test' });
```

### `SecretValidationResult`

```typescript
interface SecretValidationResult {
  valid: boolean;
  errors: Record<string, string[]>;
  warnings: string[];
  secrets: Partial<Secrets>;
}
```

### `Secrets` Type

Full TypeScript type of all validated secrets with proper types for:
- Strings
- URLs
- Booleans
- Enums
- Optional fields
- Default values

## Validation Rules

### Required at Startup

- At least one LLM API key (OPENROUTER_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY)
- GITHUB_TOKEN for GitHub operations
- In production: Supabase credentials

### Format Validation

- URLs must be valid URLs
- Enums must match allowed values
- Boolean strings must be `true` or `false`
- Empty strings treated as missing

### Type Coercion

- `"true"` → `true`
- `"false"` → `false`
- Invalid enums → error

## Testing

```bash
# Run tests
npm run test

# Watch mode
npm run test:watch

# Build
npm run build

# Validate current environment
npm run validate
```

### Testing Secrets Loading

```typescript
import { SecretsLoader } from '@pauli/secrets';

it('loads custom secrets', () => {
  const env = {
    OPENROUTER_API_KEY: 'test-key-123',
    NODE_ENV: 'test',
  };

  const loader = new SecretsLoader().load(env);
  const result = loader.validate();

  expect(result.valid).toBe(true);
  expect(result.secrets.OPENROUTER_API_KEY).toBe('test-key-123');
});
```

## Usage in Packages

### Creating a Secrets Module Singleton

```typescript
// packages/your-package/src/config.ts
import { createSecretsLoader } from '@pauli/secrets';

const loader = createSecretsLoader();

if (!loader.isValid()) {
  console.error('Secrets validation failed:');
  loader.printReport();
  process.exit(1);
}

export const config = {
  secrets: loader.get(),
  isProduction: loader.getSafe().NODE_ENV === 'production',
};
```

### Exporting Specific Secrets

```typescript
// packages/your-package/src/openrouter.ts
import { config } from './config.js';

export const openRouterKey = config.secrets.OPENROUTER_API_KEY;
export const isDevelopment = config.secrets.NODE_ENV === 'development';
```

## Best Practices

1. **Load Early**: Load and validate secrets in your app's entry point
2. **Type Safety**: Use the `Secrets` type for better IDE autocomplete
3. **Check Production**: Always validate before production deploys
4. **Handle Warnings**: Review warnings in `printReport()` before shipping
5. **Safe Access**: Use `getSafe()` in optional code paths
6. **Error Handling**: Use `get()` only in code that requires valid secrets

## CLI Commands

### Validate Secrets

```bash
npm run validate
```

Exits with code 0 if valid and no warnings, 1 if invalid or warnings present.

Prints a formatted report:
```
=== Secrets Validation Report ===

✓ All secrets validated successfully

Warnings:
  ⚠ GITHUB_TOKEN not configured - GitHub operations will be limited

Configured: 5 secrets
```

## Development

### Adding New Secrets

1. Add to `src/schema.ts` in `SecretsSchema`
2. Define Zod type (optional, url, enum, default, etc.)
3. Add tests in `src/loader.test.ts`
4. Update `README.md` with documentation
5. Run tests: `npm run test`

### Zod Schema Examples

```typescript
// Simple string
GITHUB_TOKEN: z.string().min(1).optional(),

// URL
SUPABASE_URL: z.string().url().optional(),

// Enum
NODE_ENV: z.enum(['development', 'production', 'test']),

// Boolean (string -> bool conversion)
LLM_PROXY_ENABLED: z.enum(['true', 'false']).transform(v => v === 'true'),

// With default
MERCURY_MODEL: z.string().default('mercury-2'),

// URL with default
MERCURY_BASE_URL: z.string().url().default('https://api.inceptionlabs.ai/v1'),
```

## Security Considerations

- **Never Log Secrets**: The `printReport()` only shows counts, not values
- **Env Only**: Load from environment variables, not files
- **Type Safety**: TypeScript prevents accidental string leaks
- **Validation**: Catch misconfigurations early in startup
- **Production Checks**: Extra validation in production mode

## License

Part of the PAULI Effect project. See LICENSE file.
