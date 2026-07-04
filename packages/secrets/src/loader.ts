import { SecretsSchema, type Secrets, type SecretValidationResult } from './schema.js';
import { ZodError } from 'zod';

export class SecretsLoader {
  private secrets: Partial<Secrets> = {};
  private validationResult: SecretValidationResult | null = null;

  load(env: Record<string, string | undefined> = process.env): this {
    this.secrets = env;
    return this;
  }

  validate(): SecretValidationResult {
    const errors: Record<string, string[]> = {};
    const warnings: string[] = [];

    try {
      const validated = SecretsSchema.parse(this.secrets);

      // Check for commonly required secrets
      if (!validated.OPENROUTER_API_KEY && !validated.OPENAI_API_KEY && !validated.ANTHROPIC_API_KEY) {
        warnings.push('No primary LLM API key configured (OPENROUTER_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY)');
      }

      if (!validated.GITHUB_TOKEN) {
        warnings.push('GITHUB_TOKEN not configured - GitHub operations will be limited');
      }

      if (validated.NODE_ENV === 'production') {
        if (!validated.SUPABASE_URL || !validated.SUPABASE_SERVICE_ROLE_KEY) {
          warnings.push('Production environment detected but Supabase credentials incomplete');
        }
      }

      this.validationResult = {
        valid: true,
        errors: {},
        warnings,
        secrets: validated,
      };

      return this.validationResult;
    } catch (error) {
      if (error instanceof ZodError) {
        error.issues.forEach(issue => {
          const key = issue.path.join('.');
          if (!errors[key]) {
            errors[key] = [];
          }
          errors[key].push(issue.message);
        });
      }

      this.validationResult = {
        valid: false,
        errors,
        warnings,
        secrets: this.secrets,
      };

      return this.validationResult;
    }
  }

  get(): Partial<Secrets> {
    if (!this.validationResult) {
      this.validate();
    }

    if (!this.validationResult?.valid) {
      throw new Error(`Secrets validation failed: ${JSON.stringify(this.validationResult?.errors)}`);
    }

    return this.validationResult.secrets;
  }

  getSafe(): Partial<Secrets> {
    if (!this.validationResult) {
      this.validate();
    }

    return this.validationResult?.secrets || {};
  }

  getValidationResult(): SecretValidationResult {
    if (!this.validationResult) {
      this.validate();
    }

    return this.validationResult!;
  }

  isValid(): boolean {
    if (!this.validationResult) {
      this.validate();
    }

    return this.validationResult?.valid ?? false;
  }

  getErrors(): Record<string, string[]> {
    if (!this.validationResult) {
      this.validate();
    }

    return this.validationResult?.errors ?? {};
  }

  getWarnings(): string[] {
    if (!this.validationResult) {
      this.validate();
    }

    return this.validationResult?.warnings ?? [];
  }

  printReport(): void {
    const result = this.getValidationResult();

    console.log('\n=== Secrets Validation Report ===\n');

    if (result.valid) {
      console.log('✓ All secrets validated successfully\n');
    } else {
      console.log('✗ Secrets validation failed\n');
      console.log('Errors:');
      Object.entries(result.errors).forEach(([key, msgs]) => {
        console.log(`  ${key}:`);
        msgs.forEach(msg => console.log(`    - ${msg}`));
      });
      console.log();
    }

    if (result.warnings.length > 0) {
      console.log('Warnings:');
      result.warnings.forEach(warning => {
        console.log(`  ⚠ ${warning}`);
      });
      console.log();
    }

    const configuredCount = Object.values(result.secrets).filter(v => v !== undefined).length;
    console.log(`Configured: ${configuredCount} secrets\n`);
  }
}

export function createSecretsLoader(env?: Record<string, string | undefined>): SecretsLoader {
  return new SecretsLoader().load(env || process.env);
}
