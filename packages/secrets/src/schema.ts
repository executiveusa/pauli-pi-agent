import { z } from 'zod';

export const SecretsSchema = z.object({
  // LLM Proxy
  LLM_PROXY_URL: z.string().url().optional(),
  LLM_PROXY_TOKEN: z.string().optional(),
  LLM_PROXY_ENABLED: z.enum(['true', 'false']).transform(v => v === 'true').optional(),

  // API Keys - LLM Providers
  OPENROUTER_API_KEY: z.string().min(1, 'OPENROUTER_API_KEY is required').optional(),
  GEMINI_API_KEY: z.string().min(1).optional(),
  GROQ_API_KEY: z.string().min(1).optional(),
  MISTRAL_API_KEY: z.string().min(1).optional(),
  ZAI_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),

  // API Keys - Infrastructure & Services
  GITHUB_TOKEN: z.string().min(1).optional(),
  CLOUDFLARE_API_TOKEN: z.string().min(1).optional(),
  CLOUDFLARE_ACCOUNT_ID: z.string().min(1).optional(),
  HUGGINGFACE_TOKEN: z.string().min(1).optional(),
  FIRECRAWL_API_KEY: z.string().min(1).optional(),
  NOTION_API_TOKEN: z.string().min(1).optional(),
  SUPABASE_ACCESS_TOKEN: z.string().min(1).optional(),
  VERCEL_TOKEN: z.string().min(1).optional(),

  // ArchonX Mercury Voice Agent
  INCEPTION_API_KEY: z.string().min(1).optional(),
  MERCURY_MODEL: z.string().default('mercury-2'),
  MERCURY_BASE_URL: z.string().url().default('https://api.inceptionlabs.ai/v1'),
  MERCURY_DEFAULT_REASONING: z.enum(['low', 'medium', 'high']).default('low'),
  MERCURY_VOICE_REASONING: z.enum(['instant', 'low', 'medium', 'high']).default('instant'),
  MERCURY_OPERATOR_REASONING: z.enum(['low', 'medium', 'high']).default('medium'),
  MERCURY_DIFFUSION_ENABLED: z.enum(['true', 'false']).transform(v => v === 'true').default('true'),

  // Voice (STT/TTS)
  VOICE_STT_PROVIDER: z.enum(['openai', 'google', 'azure']).default('openai'),
  VOICE_TTS_PROVIDER: z.enum(['openai', 'google', 'azure']).default('openai'),
  VOICE_TTS_MODEL: z.string().default('tts-1'),
  VOICE_TTS_VOICE: z.enum(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']).default('shimmer'),

  // ArchonX Tenant System
  ARCHONX_CONTROL_PLANE_URL: z.string().url().default('http://localhost:3000'),
  ARCHONX_TENANT_CONFIG_MODE: z.enum(['local', 'remote']).default('local'),
  ARCHONX_DEFAULT_TENANT_ID: z.string().default('client_demo'),
  ARCHONX_USAGE_LOGGING: z.enum(['true', 'false']).transform(v => v === 'true').default('true'),
  ARCHONX_CLIENT_BYOK_DEFAULT: z.enum(['true', 'false']).transform(v => v === 'true').default('true'),

  // Pauli Brain / Second Brain
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  DATABASE_URL: z.string().url().optional(),

  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Agent Context Isolation (Per-Company)
  // Each agent gets ONLY their company's context, signals, and briefs
  AGENT_ISOLATION_MODE: z.enum(['true', 'false']).transform(v => v === 'true').default('true'),

  // Master Agents - One API key per company, no cross-access
  HERMES_NOUS_API_KEY: z.string().optional(), // Macs Digital only
  HERMES_CONTEXT_PATH: z.string().default('companies/macs-digital'),

  VYAPARI_ANTHROPIC_API_KEY: z.string().optional(), // MyWebLane only (Hindi+EN)
  VYAPARI_CONTEXT_PATH: z.string().default('companies/myweb-lane'),

  PAULI_ANTHROPIC_API_KEY: z.string().optional(), // Pauli Effect only
  PAULI_CONTEXT_PATH: z.string().default('companies/pauli-effect'),

  KUPURI_ANTHROPIC_API_KEY: z.string().optional(), // Kupuri Media only
  KUPURI_CONTEXT_PATH: z.string().default('companies/kupuri-media'),

  CHEGGIE_ANTHROPIC_API_KEY: z.string().optional(), // Cheggie only
  CHEGGIE_CONTEXT_PATH: z.string().default('companies/cheggie'),

  CASCADIA_ANTHROPIC_API_KEY: z.string().optional(), // Cascadia Atlas only
  CASCADIA_CONTEXT_PATH: z.string().default('companies/cascadia-atlas'),

  // Agent Update & Circulation
  AGENT_AUTO_UPDATE: z.enum(['true', 'false']).transform(v => v === 'true').default('true'),
  AGENT_UPDATE_INTERVAL_MINUTES: z.coerce.number().default(360), // 6 hours
  AGENT_COMMIT_UPDATES: z.enum(['true', 'false']).transform(v => v === 'true').default('true'),

  // Model Selection & Cost Control
  CASCADIA_MODEL_OVERRIDE: z.enum(['deepseek-4', 'deepseek-flash', 'mistral-free', 'opencode']).optional(),
  PROMPT_FOR_MODEL_SELECTION: z.enum(['true', 'false']).transform(v => v === 'true').default('true'),
  COST_WARNING_ENABLED: z.enum(['true', 'false']).transform(v => v === 'true').default('true'),
  MAX_MONTHLY_SPEND_USD: z.coerce.number().default(50),

  // OpenRouter Configuration
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_DEEPSEEK_MODEL: z.string().default('deepseek/deepseek-chat'),
  OPENROUTER_DEEPSEEK_FLASH_MODEL: z.string().default('deepseek/deepseek-chat'),

  // OpenCode Configuration (Free backup)
  OPENCODE_API_KEY: z.string().optional(),
  OPENCODE_MODEL: z.string().default('mistral-7b'),
  OPENCODE_ENABLED: z.enum(['true', 'false']).transform(v => v === 'true').default('false'),
}).passthrough();

export type Secrets = z.infer<typeof SecretsSchema>;

export interface SecretValidationResult {
  valid: boolean;
  errors: Record<string, string[]>;
  warnings: string[];
  secrets: Partial<Secrets>;
}
