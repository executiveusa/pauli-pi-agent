import { z } from "zod";

const emptyIsUnset = <T extends z.ZodTypeAny>(schema: T) =>
	z.preprocess((v) => (v === "" ? undefined : v), schema.optional());

export const SecretsSchema = z
	.object({
		// LLM Proxy
		LLM_PROXY_URL: z.string().url().optional(),
		LLM_PROXY_TOKEN: z.string().optional(),
		LLM_PROXY_ENABLED: z
			.enum(["true", "false"])
			.transform((v) => v === "true")
			.optional(),

		// API Keys - LLM Providers
		OPENROUTER_API_KEY: emptyIsUnset(z.string().min(1, "OPENROUTER_API_KEY is required")),
		GEMINI_API_KEY: emptyIsUnset(z.string().min(1)),
		GOOGLE_GEMINI_API_KEY: emptyIsUnset(z.string().min(1)), // Free tier from awesome-free-llm-apis
		GROQ_API_KEY: emptyIsUnset(z.string().min(1)),
		MISTRAL_API_KEY: emptyIsUnset(z.string().min(1)), // Free tier from awesome-free-llm-apis
		ZAI_API_KEY: emptyIsUnset(z.string().min(1)), // Z AI / Zhipu free tier
		COHERE_API_KEY: emptyIsUnset(z.string().min(1)), // Free trial tier
		CEREBRAS_API_KEY: emptyIsUnset(z.string().min(1)), // Free tier from awesome-free-llm-apis
		AION_API_KEY: emptyIsUnset(z.string().min(1)), // Aion Labs permanent free tier
		ANTHROPIC_API_KEY: emptyIsUnset(z.string().min(1)),
		OPENAI_API_KEY: emptyIsUnset(z.string().min(1)),

		// API Keys - Infrastructure & Services
		GITHUB_TOKEN: emptyIsUnset(z.string().min(1)),
		CLOUDFLARE_API_TOKEN: emptyIsUnset(z.string().min(1)),
		CLOUDFLARE_ACCOUNT_ID: emptyIsUnset(z.string().min(1)),
		HUGGINGFACE_TOKEN: emptyIsUnset(z.string().min(1)),
		FIRECRAWL_API_KEY: emptyIsUnset(z.string().min(1)),
		NOTION_API_TOKEN: emptyIsUnset(z.string().min(1)),
		SUPABASE_ACCESS_TOKEN: emptyIsUnset(z.string().min(1)),
		VERCEL_TOKEN: emptyIsUnset(z.string().min(1)),

		// ArchonX Mercury Voice Agent
		INCEPTION_API_KEY: emptyIsUnset(z.string().min(1)),
		MERCURY_MODEL: z.string().default("mercury-2"),
		MERCURY_BASE_URL: z.string().url().default("https://api.inceptionlabs.ai/v1"),
		MERCURY_DEFAULT_REASONING: z.enum(["low", "medium", "high"]).default("low"),
		MERCURY_VOICE_REASONING: z.enum(["instant", "low", "medium", "high"]).default("instant"),
		MERCURY_OPERATOR_REASONING: z.enum(["low", "medium", "high"]).default("medium"),
		MERCURY_DIFFUSION_ENABLED: z
			.enum(["true", "false"])
			.transform((v) => v === "true")
			.default("true"),

		// Voice (STT/TTS)
		VOICE_STT_PROVIDER: z.enum(["openai", "google", "azure"]).default("openai"),
		VOICE_TTS_PROVIDER: z.enum(["openai", "google", "azure"]).default("openai"),
		VOICE_TTS_MODEL: z.string().default("tts-1"),
		VOICE_TTS_VOICE: z.enum(["alloy", "echo", "fable", "onyx", "nova", "shimmer"]).default("shimmer"),

		// ArchonX Tenant System
		ARCHONX_CONTROL_PLANE_URL: z.string().url().default("http://localhost:3000"),
		ARCHONX_TENANT_CONFIG_MODE: z.enum(["local", "remote"]).default("local"),
		ARCHONX_DEFAULT_TENANT_ID: z.string().default("client_demo"),
		ARCHONX_USAGE_LOGGING: z
			.enum(["true", "false"])
			.transform((v) => v === "true")
			.default("true"),
		ARCHONX_CLIENT_BYOK_DEFAULT: z
			.enum(["true", "false"])
			.transform((v) => v === "true")
			.default("true"),

		// Pauli Brain / Second Brain
		SUPABASE_URL: z.string().url().optional(),
		SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
		SUPABASE_ANON_KEY: z.string().optional(),
		DATABASE_URL: z.string().url().optional(),

		// Environment
		NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
	})
	.passthrough();

export type Secrets = z.infer<typeof SecretsSchema>;

export interface SecretValidationResult {
	valid: boolean;
	errors: Record<string, string[]>;
	warnings: string[];
	secrets: Partial<Secrets>;
}
