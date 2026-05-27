# Secret Management Guide

PI Agent uses centralized secret management with Infisical for production and local .env fallback for development.

## Quick Start

### Development Environment

1. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

2. Edit `.env.local` and add your secrets:
```bash
DATABASE_URL=postgres://user:password@localhost:5432/db
OPENAI_API_KEY=sk-your-key
```

3. The application will automatically load secrets from `.env.local` during development.

### Production Environment

For production, use Infisical for centralized secret management:

1. Set up Infisical workspace and project
2. Configure environment variables:
```bash
INFISICAL_ENABLED=true
INFISICAL_API_URL=https://app.infisical.com/api
INFISICAL_CLIENT_ID=your-client-id
INFISICAL_CLIENT_SECRET=your-client-secret
INFISICAL_PROJECT_ID=your-project-id
```

3. The application will fetch secrets from Infisical with local .env fallback

## Secret Resolution Order

Secrets are resolved in this order (first match wins):

1. **Infisical** (if enabled and configured)
2. **Environment Variables** (process.env)
3. **.env.local file** (if present)
4. **Error** (with helpful remediation message)

## Using Secrets in Code

### Basic Usage

```typescript
import { getSecret, resolveApplicationSecrets } from '@pi-ai/agent/secrets';

// Get a single secret
const apiKey = await getSecret('OPENAI_API_KEY');

// Get all application secrets
const secrets = await resolveApplicationSecrets();
const { providers, jwt } = secrets;
```

### Error Handling

```typescript
import { getSecret } from '@pi-ai/agent/secrets';

// Required secret - throws helpful error if missing
try {
  const dbUrl = await getSecret('DATABASE_URL', undefined, true);
} catch (error) {
  // Error includes remediation steps
  console.error(error.message);
}

// Optional secret - returns empty string if missing
const optionalKey = await getSecret('OPTIONAL_KEY', undefined, false);
```

### Secret Redaction

Always redact secrets before logging:

```typescript
import { redact, redactObject, containsSecrets } from '@pi-ai/agent/secrets';

// Redact a string
const redacted = redact('API key is sk-abc123');
// Result: 'API key is ***REDACTED***'

// Redact an object recursively
const auditLog = redactObject({
  user: 'john',
  apiKey: 'sk-secret',
  config: {
    token: 'Bearer xyz',
  },
});

// Check if string contains secrets
if (containsSecrets(userInput)) {
  console.error('User input contains secrets - rejecting');
}
```

## Security Best Practices

### ✅ Do

- Use `.env.example` as template, never commit actual secrets
- Always redact secrets before logging or auditing
- Use Infisical for production deployments
- Rotate API keys regularly
- Use strong database passwords
- Set `DATABASE_URL` as minimum required secret

### ❌ Don't

- Commit `.env.local` or any file with actual secrets
- Log secret values anywhere
- Use the same secret across environments
- Share API keys in logs, errors, or audit trails
- Store secrets in database records (use secrets_references table only)
- Hardcode secrets in code

## Available Secrets

### Required

- `DATABASE_URL` - PostgreSQL connection string (critical for startup)

### Model Providers (Optional - can use free models if not set)

- `OPENAI_API_KEY` - OpenAI API key
- `ANTHROPIC_API_KEY` - Anthropic API key
- `OPENROUTER_API_KEY` - OpenRouter API key
- `GEMINI_API_KEY` - Google Gemini API key
- `GROQ_API_KEY` - Groq API key

### Data Ingestion

- `FIRECRAWL_API_KEY` - Firecrawl web scraping
- `BRIGHTDATA_API_KEY` - BrightData proxy/browser
- `BRIGHTDATA_BROWSER_USER` - BrightData browser username
- `BRIGHTDATA_BROWSER_PASS` - BrightData browser password

### Storage & Infrastructure

- `REDIS_URL` - Redis cache connection
- `S3_BUCKET_NAME` - S3 bucket name
- `S3_REGION` - S3 region
- `S3_ACCESS_KEY_ID` - S3 access key
- `S3_SECRET_ACCESS_KEY` - S3 secret key
- `MINIO_ENDPOINT` - MinIO endpoint (local S3)
- `MINIO_ACCESS_KEY` - MinIO access key
- `MINIO_SECRET_KEY` - MinIO secret key

### Authentication

- `JWT_SECRET` - JWT signing secret (generate: `openssl rand -base64 32`)
- `JWT_REFRESH_SECRET` - JWT refresh token secret

### Speech & Audio

- `SPEECH_API_KEY` - Text-to-speech provider API key
- `SPEECH_PROVIDER` - TTS provider (e.g., "elevenlabs")

### Infisical Configuration

- `INFISICAL_ENABLED` - Enable Infisical integration (default: true)
- `INFISICAL_API_URL` - Infisical API endpoint
- `INFISICAL_CLIENT_ID` - Infisical service account ID
- `INFISICAL_CLIENT_SECRET` - Infisical service account secret
- `INFISICAL_PROJECT_ID` - Infisical project ID
- `INFISICAL_ENVIRONMENT` - Infisical environment (dev/staging/prod)

### Application Configuration

- `NODE_ENV` - Environment (development/staging/production)
- `PORT` - Application port
- `LOG_LEVEL` - Log level (debug/info/warn/error)
- `PI_MODEL_POLICY` - Default model policy (free/balanced/premium/local_only)
- `API_BUDGET_MONTHLY` - Monthly API budget in USD

## Troubleshooting

### "Missing secret: DATABASE_URL"

Database URL is required for startup. Add to `.env.local`:
```
DATABASE_URL=postgres://user:password@localhost:5432/db
```

### Secrets not loading from .env.local

Check:
1. File exists at `.env.local` (case-sensitive on Linux/Mac)
2. Environment variable format: `KEY=value`
3. No spaces around `=` sign (usually works, but avoid)
4. File is readable by application process

### Infisical not connecting

Check:
1. `INFISICAL_ENABLED=true`
2. `INFISICAL_CLIENT_ID` and `INFISICAL_CLIENT_SECRET` are set
3. Infisical API URL is correct
4. Network can reach Infisical endpoint
5. Service account has access to specified project

### Secrets appearing in logs

Check:
1. Always use `redact()` before logging user input
2. Use `redactObject()` for objects before JSON.stringify
3. Check error messages don't include secret values
4. Verify audit logging uses `redactSecretsFromObject()`

## Testing

All tests use fixtures and never make live API calls:

```typescript
// Mock secrets in tests
process.env.OPENAI_API_KEY = 'sk-test-key';

// Test that secrets are redacted
const result = redact('API key is sk-test-key');
expect(result).toContain('***REDACTED***');
```

Never commit real secrets to test files - use placeholder values only.

## Infisical Setup (Optional)

For advanced production setup:

1. Create Infisical workspace at https://app.infisical.com
2. Create project for PI Agent
3. Create service account (Machine Identity)
4. Add service account to project with full access
5. Create API key for service account
6. Set environment variables:
   - `INFISICAL_CLIENT_ID` = Service account ID
   - `INFISICAL_CLIENT_SECRET` = Service account API key
   - `INFISICAL_PROJECT_ID` = Project ID
7. Sync secrets to your Infisical environments

See: https://infisical.com/docs/documentation/getting-started/introduction for detailed Infisical documentation.
