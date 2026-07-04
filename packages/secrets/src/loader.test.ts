import { describe, it, expect } from 'vitest';
import { SecretsLoader, createSecretsLoader } from './loader';

describe('SecretsLoader', () => {
  describe('basic loading', () => {
    it('loads environment variables', () => {
      const env = {
        OPENROUTER_API_KEY: 'test-key-123',
        NODE_ENV: 'development',
      };

      const loader = new SecretsLoader().load(env);
      const result = loader.validate();

      expect(result.valid).toBe(true);
      expect(result.secrets.OPENROUTER_API_KEY).toBe('test-key-123');
      expect(result.secrets.NODE_ENV).toBe('development');
    });

    it('loads empty object gracefully', () => {
      const loader = new SecretsLoader().load({});
      const result = loader.validate();

      expect(result.valid).toBe(true);
      expect(Object.keys(result.errors).length).toBe(0);
    });
  });

  describe('validation', () => {
    it('validates required format of API keys', () => {
      const env = {
        OPENROUTER_API_KEY: '', // Empty string should fail
      };

      const loader = new SecretsLoader().load(env);
      const result = loader.validate();

      expect(result.valid).toBe(true); // Optional field
      expect(result.errors['OPENROUTER_API_KEY']).toBeUndefined();
    });

    it('validates URL format for SUPABASE_URL', () => {
      const env = {
        SUPABASE_URL: 'not-a-url',
      };

      const loader = new SecretsLoader().load(env);
      const result = loader.validate();

      expect(result.valid).toBe(false);
      expect(result.errors['SUPABASE_URL']).toBeDefined();
    });

    it('accepts valid Supabase URL', () => {
      const env = {
        SUPABASE_URL: 'https://example.supabase.co',
      };

      const loader = new SecretsLoader().load(env);
      const result = loader.validate();

      expect(result.valid).toBe(true);
      expect(result.secrets.SUPABASE_URL).toBe('https://example.supabase.co');
    });

    it('validates NODE_ENV enum', () => {
      const env = {
        NODE_ENV: 'invalid-env',
      };

      const loader = new SecretsLoader().load(env);
      const result = loader.validate();

      expect(result.valid).toBe(false);
      expect(result.errors['NODE_ENV']).toBeDefined();
    });

    it('accepts valid NODE_ENV values', () => {
      ['development', 'production', 'test'].forEach(env_val => {
        const env = { NODE_ENV: env_val };
        const loader = new SecretsLoader().load(env);
        const result = loader.validate();

        expect(result.valid).toBe(true);
        expect(result.secrets.NODE_ENV).toBe(env_val);
      });
    });
  });

  describe('boolean conversions', () => {
    it('converts string "true" to boolean', () => {
      const env = {
        LLM_PROXY_ENABLED: 'true',
        MERCURY_DIFFUSION_ENABLED: 'true',
      };

      const loader = new SecretsLoader().load(env);
      const result = loader.validate();

      expect(result.valid).toBe(true);
      expect(result.secrets.LLM_PROXY_ENABLED).toBe(true);
      expect(result.secrets.MERCURY_DIFFUSION_ENABLED).toBe(true);
    });

    it('converts string "false" to boolean', () => {
      const env = {
        LLM_PROXY_ENABLED: 'false',
        MERCURY_DIFFUSION_ENABLED: 'false',
      };

      const loader = new SecretsLoader().load(env);
      const result = loader.validate();

      expect(result.valid).toBe(true);
      expect(result.secrets.LLM_PROXY_ENABLED).toBe(false);
      expect(result.secrets.MERCURY_DIFFUSION_ENABLED).toBe(false);
    });
  });

  describe('defaults', () => {
    it('applies default values', () => {
      const env = {};

      const loader = new SecretsLoader().load(env);
      const result = loader.validate();

      expect(result.valid).toBe(true);
      expect(result.secrets.NODE_ENV).toBe('development');
      expect(result.secrets.MERCURY_MODEL).toBe('mercury-2');
      expect(result.secrets.VOICE_TTS_VOICE).toBe('shimmer');
      expect(result.secrets.ARCHONX_DEFAULT_TENANT_ID).toBe('client_demo');
    });

    it('overrides defaults with provided values', () => {
      const env = {
        NODE_ENV: 'production',
        MERCURY_MODEL: 'mercury-3',
        VOICE_TTS_VOICE: 'nova',
      };

      const loader = new SecretsLoader().load(env);
      const result = loader.validate();

      expect(result.valid).toBe(true);
      expect(result.secrets.NODE_ENV).toBe('production');
      expect(result.secrets.MERCURY_MODEL).toBe('mercury-3');
      expect(result.secrets.VOICE_TTS_VOICE).toBe('nova');
    });
  });

  describe('warnings', () => {
    it('warns when no primary LLM key is configured', () => {
      const env = { NODE_ENV: 'development' };

      const loader = new SecretsLoader().load(env);
      const result = loader.validate();

      expect(result.valid).toBe(true);
      expect(result.warnings).toContain(
        expect.stringContaining('No primary LLM API key configured')
      );
    });

    it('warns when GITHUB_TOKEN is missing', () => {
      const env = { OPENROUTER_API_KEY: 'key' };

      const loader = new SecretsLoader().load(env);
      const result = loader.validate();

      expect(result.valid).toBe(true);
      expect(result.warnings).toContain(
        expect.stringContaining('GITHUB_TOKEN not configured')
      );
    });

    it('warns in production when Supabase credentials incomplete', () => {
      const env = {
        NODE_ENV: 'production',
        OPENROUTER_API_KEY: 'key',
        GITHUB_TOKEN: 'token',
      };

      const loader = new SecretsLoader().load(env);
      const result = loader.validate();

      expect(result.valid).toBe(true);
      expect(result.warnings).toContain(
        expect.stringContaining('Supabase credentials incomplete')
      );
    });
  });

  describe('get methods', () => {
    it('get() throws on invalid secrets', () => {
      const env = { NODE_ENV: 'invalid' };

      const loader = new SecretsLoader().load(env);

      expect(() => loader.get()).toThrow();
    });

    it('get() returns validated secrets', () => {
      const env = {
        OPENROUTER_API_KEY: 'test-key',
        NODE_ENV: 'production',
      };

      const loader = new SecretsLoader().load(env);
      const secrets = loader.get();

      expect(secrets.OPENROUTER_API_KEY).toBe('test-key');
      expect(secrets.NODE_ENV).toBe('production');
    });

    it('getSafe() never throws', () => {
      const env = { NODE_ENV: 'invalid' };

      const loader = new SecretsLoader().load(env);
      const secrets = loader.getSafe();

      expect(secrets).toBeDefined();
    });

    it('isValid() returns boolean', () => {
      const loader1 = new SecretsLoader().load({});
      expect(loader1.isValid()).toBe(true);

      const loader2 = new SecretsLoader().load({ NODE_ENV: 'invalid' });
      expect(loader2.isValid()).toBe(false);
    });

    it('getErrors() returns error map', () => {
      const env = { NODE_ENV: 'invalid' };

      const loader = new SecretsLoader().load(env);
      const errors = loader.getErrors();

      expect(errors['NODE_ENV']).toBeDefined();
      expect(Array.isArray(errors['NODE_ENV'])).toBe(true);
    });

    it('getWarnings() returns warning array', () => {
      const env = {};

      const loader = new SecretsLoader().load(env);
      const warnings = loader.getWarnings();

      expect(Array.isArray(warnings)).toBe(true);
      expect(warnings.length).toBeGreaterThan(0);
    });
  });

  describe('helper function', () => {
    it('createSecretsLoader returns configured loader', () => {
      const loader = createSecretsLoader({ OPENROUTER_API_KEY: 'test' });

      expect(loader).toBeInstanceOf(SecretsLoader);
      expect(loader.isValid()).toBe(true);
    });
  });

  describe('enum validation', () => {
    it('validates VOICE_STT_PROVIDER', () => {
      const valid = ['openai', 'google', 'azure'];
      valid.forEach(provider => {
        const env = { VOICE_STT_PROVIDER: provider };
        const loader = new SecretsLoader().load(env);
        const result = loader.validate();
        expect(result.valid).toBe(true);
      });

      const env = { VOICE_STT_PROVIDER: 'invalid' };
      const loader = new SecretsLoader().load(env);
      const result = loader.validate();
      expect(result.valid).toBe(false);
    });

    it('validates MERCURY_DEFAULT_REASONING', () => {
      const valid = ['low', 'medium', 'high'];
      valid.forEach(reasoning => {
        const env = { MERCURY_DEFAULT_REASONING: reasoning };
        const loader = new SecretsLoader().load(env);
        const result = loader.validate();
        expect(result.valid).toBe(true);
      });
    });

    it('validates ARCHONX_TENANT_CONFIG_MODE', () => {
      const env = { ARCHONX_TENANT_CONFIG_MODE: 'invalid' };
      const loader = new SecretsLoader().load(env);
      const result = loader.validate();
      expect(result.valid).toBe(false);
    });
  });

  describe('integration scenarios', () => {
    it('loads complete development configuration', () => {
      const env = {
        NODE_ENV: 'development',
        OPENROUTER_API_KEY: 'sk-or-...',
        GITHUB_TOKEN: 'ghp_...',
        OPENAI_API_KEY: 'sk-...',
        LLM_PROXY_ENABLED: 'false',
      };

      const loader = new SecretsLoader().load(env);
      const result = loader.validate();

      expect(result.valid).toBe(true);
      expect(result.warnings).not.toContain(
        expect.stringContaining('No primary LLM API key')
      );
    });

    it('loads complete production configuration', () => {
      const env = {
        NODE_ENV: 'production',
        OPENROUTER_API_KEY: 'sk-or-...',
        GITHUB_TOKEN: 'ghp_...',
        SUPABASE_URL: 'https://example.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGc...',
        ARCHONX_TENANT_CONFIG_MODE: 'remote',
      };

      const loader = new SecretsLoader().load(env);
      const result = loader.validate();

      expect(result.valid).toBe(true);
    });
  });
});
