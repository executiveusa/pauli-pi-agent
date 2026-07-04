# PAULI Secrets Configuration Guide

This guide covers how to set up, validate, and use secrets across the PAULI system.

## Quick Start

### 1. Install Dependencies

```bash
cd packages/secrets
npm install
```

### 2. Create Your .env File

```bash
cp .env.example .env
# Edit .env with your actual API keys
```

### 3. Validate Secrets

```bash
cd packages/secrets
npm run validate
```

Expected output:
```
=== Secrets Validation Report ===

✓ All secrets validated successfully

Configured: 15 secrets
```

## Setup Instructions by Environment

### Development Environment

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Add your development API keys:**
   ```env
   OPENROUTER_API_KEY=sk-or-your-development-key
   GITHUB_TOKEN=ghp_your-development-token
   OPENAI_API_KEY=sk-your-development-key
   NODE_ENV=development
   ```

3. **For local LLM proxy (optional):**
   ```env
   LLM_PROXY_ENABLED=true
   LLM_PROXY_URL=http://localhost:8082
   LLM_PROXY_TOKEN=your-proxy-token
   ```

4. **Validate:**
   ```bash
   cd packages/secrets && npm run validate
   ```

### Testing Environment

The `.env.test` file is pre-configured with fake test keys:

```bash
# Run tests with test environment
NODE_ENV=test npm run test
```

Tests automatically load from `.env.test` and use mock secrets.

### Production Environment

**CRITICAL: Production secrets are never committed to git.**

1. **Set via environment variables (recommended for CI/CD):**
   ```bash
   export OPENROUTER_API_KEY="sk-or-prod-key"
   export GITHUB_TOKEN="ghp_prod-token"
   export SUPABASE_URL="https://your-project.supabase.co"
   export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   export NODE_ENV="production"
   ```

2. **Or use a secure vault:**
   - Supabase Secrets (recommended)
   - GitHub Secrets (for CI/CD)
   - HashiCorp Vault
   - AWS Secrets Manager

3. **Validate in CI/CD:**
   ```bash
   npm run validate
   ```

## API Keys Setup

### LLM Providers

#### OpenRouter (Recommended)
1. Visit https://openrouter.ai
2. Sign up and get your API key
3. Add to .env:
   ```env
   OPENROUTER_API_KEY=sk-or-your-key-here
   ```

#### OpenAI
1. Visit https://platform.openai.com/account/api-keys
2. Create a new API key
3. Add to .env:
   ```env
   OPENAI_API_KEY=sk-your-key-here
   ```

#### Anthropic (Claude)
1. Visit https://console.anthropic.com
2. Generate an API key
3. Add to .env:
   ```env
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   ```

#### Groq
1. Visit https://console.groq.com
2. Create an API key
3. Add to .env:
   ```env
   GROQ_API_KEY=your-key-here
   ```

#### Google Gemini
1. Visit https://ai.google.dev
2. Generate an API key
3. Add to .env:
   ```env
   GEMINI_API_KEY=your-key-here
   ```

### GitHub

1. Visit https://github.com/settings/personal-access-tokens/new
2. Create a token with `repo` scope
3. Add to .env:
   ```env
   GITHUB_TOKEN=ghp_your-token-here
   ```

### Supabase

1. Visit https://supabase.com/dashboard
2. Create a new project
3. Get keys from Settings → API
4. Add to .env:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   SUPABASE_ACCESS_TOKEN=your-access-token
   ```

### Cloudflare

1. Visit https://dash.cloudflare.com/profile/api-tokens
2. Create an API token with appropriate permissions
3. Get your Account ID from the URL or Settings
4. Add to .env:
   ```env
   CLOUDFLARE_API_TOKEN=your-token-here
   CLOUDFLARE_ACCOUNT_ID=your-account-id
   ```

### Vercel

1. Visit https://vercel.com/account/tokens
2. Create a new token
3. Add to .env:
   ```env
   VERCEL_TOKEN=your-token-here
   ```

### HuggingFace

1. Visit https://huggingface.co/settings/tokens
2. Create a new token
3. Add to .env:
   ```env
   HUGGINGFACE_TOKEN=hf_your-token-here
   ```

### Notion

1. Visit https://www.notion.so/my-integrations
2. Create a new integration
3. Get the Internal Integration Token
4. Add to .env:
   ```env
   NOTION_API_TOKEN=secret_your-token-here
   ```

### Firecrawl

1. Visit https://www.firecrawl.dev
2. Sign up and get your API key
3. Add to .env:
   ```env
   FIRECRAWL_API_KEY=your-key-here
   ```

## Configuration Files

### .env (Development)

```env
# Never commit this file
NODE_ENV=development

# At least one LLM provider required
OPENROUTER_API_KEY=sk-or-your-key
# OR
OPENAI_API_KEY=sk-your-key

# GitHub operations
GITHUB_TOKEN=ghp_your-token

# Optional LLM Proxy
LLM_PROXY_ENABLED=false
LLM_PROXY_URL=http://localhost:8082
LLM_PROXY_TOKEN=your-token
```

### .env.local (Development Override)

```env
# Gitignored local overrides
# Use this to override settings for your machine only
NODE_ENV=development
OPENROUTER_API_KEY=sk-or-your-personal-key
```

### .env.test

```env
# Pre-configured with fake test keys
# This IS committed to git (no real secrets)
# Used for: npm run test, test suites, CI/CD testing
```

### .env.production

```env
# Never commit this file
# Use environment variables in production instead
NODE_ENV=production
OPENROUTER_API_KEY=sk-or-prod-key
SUPABASE_URL=https://your-prod-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Usage in Code

### Basic Usage

```typescript
// packages/your-package/src/config.ts
import { createSecretsLoader } from '@pauli/secrets';

const loader = createSecretsLoader();

if (!loader.isValid()) {
  throw new Error('Secrets validation failed');
}

export const config = {
  secrets: loader.get(),
};
```

### Specific Service Integration

```typescript
// packages/integrations/src/openrouter.ts
import { createSecretsLoader } from '@pauli/secrets';

const secrets = createSecretsLoader().get();

export function initOpenRouter() {
  if (!secrets.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  return {
    apiKey: secrets.OPENROUTER_API_KEY,
    baseUrl: 'https://openrouter.ai/api/v1',
  };
}
```

### With Error Handling

```typescript
// packages/agent/src/llm.ts
import { createSecretsLoader } from '@pauli/secrets';

export function getLlmConfig() {
  const loader = createSecretsLoader();
  const secrets = loader.getSafe(); // Never throws

  if (!secrets.OPENROUTER_API_KEY && !secrets.OPENAI_API_KEY) {
    console.warn('No LLM API key configured, using mock mode');
    return null;
  }

  return {
    apiKey: secrets.OPENROUTER_API_KEY || secrets.OPENAI_API_KEY,
    provider: secrets.OPENROUTER_API_KEY ? 'openrouter' : 'openai',
  };
}
```

### Testing

```typescript
// test/config.test.ts
import { SecretsLoader } from '@pauli/secrets';

describe('Configuration', () => {
  it('loads test secrets', () => {
    const testEnv = {
      OPENROUTER_API_KEY: 'sk-or-test-123',
      NODE_ENV: 'test',
    };

    const loader = new SecretsLoader().load(testEnv);
    expect(loader.isValid()).toBe(true);
  });
});
```

## Troubleshooting

### Validation Failed: "No primary LLM API key configured"

**Problem:** The system needs at least one LLM provider API key.

**Solution:**
```bash
# Add one of these to .env:
OPENROUTER_API_KEY=sk-or-your-key
# OR
OPENAI_API_KEY=sk-your-key
# OR
ANTHROPIC_API_KEY=sk-ant-your-key
```

### Validation Failed: "GITHUB_TOKEN not configured"

**Problem:** GitHub operations require a token.

**Solution:**
```bash
# Generate at https://github.com/settings/personal-access-tokens/new
GITHUB_TOKEN=ghp_your-token
```

### Validation Failed: "Invalid enum value"

**Problem:** You provided an invalid value for an enum field.

**Example:**
```
VOICE_TTS_VOICE=invalid_voice
# Valid values: alloy, echo, fable, onyx, nova, shimmer
```

**Solution:** Use one of the valid values.

### Validation Failed: "Invalid URL"

**Problem:** A URL field has an invalid format.

**Example:**
```
SUPABASE_URL=not-a-valid-url
# Must be: https://project.supabase.co
```

**Solution:** Ensure URLs are in correct format.

### WARNING: "Production environment detected but Supabase credentials incomplete"

**Problem:** Production mode needs full Supabase setup.

**Solution:**
```bash
NODE_ENV=production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Security Best Practices

1. **Never commit .env files** - Use `.env.example` instead
2. **Use .env.local for machine-specific overrides** - Git ignores these
3. **Rotate API keys regularly** - Especially in production
4. **Use separate keys for each environment** - Dev, test, prod
5. **Restrict key permissions** - Only grant needed scopes
6. **Monitor key usage** - Check provider dashboards regularly
7. **Log key changes** - Keep audit trail in your team
8. **Use managed secrets in production** - CI/CD secrets, Vault, etc.
9. **Never share keys via chat or email** - Use secure vaults
10. **Regenerate if compromised** - Immediately rotate leaked keys

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install
        run: npm ci

      - name: Validate Secrets
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NODE_ENV: test
        run: cd packages/secrets && npm run validate

      - name: Test
        env:
          NODE_ENV: test
        run: npm run test
```

### Vercel

```json
{
  "env": [
    {
      "key": "OPENROUTER_API_KEY",
      "value": "@openrouter_api_key"
    },
    {
      "key": "GITHUB_TOKEN",
      "value": "@github_token"
    },
    {
      "key": "NODE_ENV",
      "value": "production"
    }
  ]
}
```

## Monitoring

### Check Current Configuration

```bash
cd packages/secrets
npm run validate
```

### Audit Secrets Usage

```bash
# Find all uses of secrets in code
grep -r "secrets\." packages/ --include="*.ts" --include="*.js" | head -20

# Find hardcoded API keys (security check)
grep -r "sk-" packages/ --include="*.ts" --include="*.js" | grep -v test | grep -v ".env"
```

## Maintenance

### Adding New Secret

1. Add to `packages/secrets/src/schema.ts`
2. Add tests to `packages/secrets/src/loader.test.ts`
3. Add to `.env.example`
4. Add to `.env.test` (with fake value)
5. Document in this guide
6. Run tests: `npm run test`

### Rotating Secrets

1. Generate new key from provider
2. Update in `.env` (local) or CI/CD secrets
3. Keep old key active during transition
4. Verify new key works
5. Deactivate old key
6. Update provider to revoke old key

### Removing Unused Secret

1. Find all usages: `grep -r "SECRET_NAME" packages/`
2. Remove from code
3. Remove from `packages/secrets/src/schema.ts`
4. Remove from tests
5. Remove from `.env.example`
6. Run tests to confirm

## References

- [@pauli/secrets Package](./packages/secrets/README.md)
- [Zod Documentation](https://zod.dev)
- [Environment Variables Best Practices](https://12factor.net/config)
- [OWASP Secrets Management](https://owasp.org/www-community/Sensitive_Data_Exposure)

## Support

For issues or questions:
1. Check this guide first
2. Review [@pauli/secrets README](./packages/secrets/README.md)
3. Check error messages in `npm run validate` output
4. Review test cases in `packages/secrets/src/loader.test.ts`

---

Last updated: 2026-07-04
