/**
 * Free LLM API Registry
 * Self-aware fallback system for agents when primary models unavailable
 * Sources: awesome-free-llm-apis, agent cost constraints
 */

export interface FreeLLMProvider {
	name: string;
	baseUrl: string;
	requiresAuth: boolean;
	rateLimit: string;
	tokenLimit: string;
	quality: 'best' | 'good' | 'fair' | 'limited';
	costPerRun: number;
	models: FreeLLMModel[];
	useCaseOptimal: string[];
}

export interface FreeLLMModel {
	id: string;
	provider: string;
	contextWindow: number;
	maxOutput: number;
	speed: 'fast' | 'medium' | 'slow';
	quality: 'best' | 'good' | 'fair';
	modality: string[];
	headers?: Record<string, string>;
}

/**
 * Free tier permanent options (no credit card needed)
 * Ranked by quality for demo/fallback use
 */
export const FREE_LLM_REGISTRY: Record<string, FreeLLMProvider> = {
	'google-gemini-free': {
		name: 'Google Gemini (Free Tier)',
		baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
		requiresAuth: true, // Requires GOOGLE_GEMINI_API_KEY
		rateLimit: '15 RPM (Gemini 3.5 Flash)',
		tokenLimit: '1.5K RPD',
		quality: 'best',
		costPerRun: 0,
		models: [
			{
				id: 'gemini-3.5-flash',
				provider: 'Google',
				contextWindow: 1_000_000,
				maxOutput: 65_000,
				speed: 'fast',
				quality: 'best',
				modality: ['text', 'image', 'audio', 'video'],
			},
			{
				id: 'gemini-2.5-flash',
				provider: 'Google',
				contextWindow: 1_000_000,
				maxOutput: 65_000,
				speed: 'fast',
				quality: 'good',
				modality: ['text', 'image', 'audio', 'video'],
			},
		],
		useCaseOptimal: ['demos', 'multimodal content', 'complex reasoning'],
	},

	'mistral-free': {
		name: 'Mistral AI (Free Experiment)',
		baseUrl: 'https://api.mistral.ai/v1',
		requiresAuth: true, // Requires MISTRAL_API_KEY
		rateLimit: '~1 RPS, 500K TPM',
		tokenLimit: '~1B tokens/month',
		quality: 'good',
		costPerRun: 0,
		models: [
			{
				id: 'mistral-nemo-12b',
				provider: 'Mistral',
				contextWindow: 128_000,
				maxOutput: 128_000,
				speed: 'fast',
				quality: 'good',
				modality: ['text'],
			},
			{
				id: 'mistral-small-4',
				provider: 'Mistral',
				contextWindow: 256_000,
				maxOutput: 256_000,
				speed: 'medium',
				quality: 'good',
				modality: ['text', 'image', 'code'],
			},
		],
		useCaseOptimal: ['content generation', 'coding', 'budget demos'],
	},

	'cohere-free': {
		name: 'Cohere (Free Trial)',
		baseUrl: 'https://api.cohere.com/v2',
		requiresAuth: true, // Requires COHERE_API_KEY
		rateLimit: '20 RPM',
		tokenLimit: '1,000 API calls/month',
		quality: 'good',
		costPerRun: 0,
		models: [
			{
				id: 'command-r7b',
				provider: 'Cohere',
				contextWindow: 128_000,
				maxOutput: 4_000,
				speed: 'fast',
				quality: 'good',
				modality: ['text'],
			},
			{
				id: 'command-r',
				provider: 'Cohere',
				contextWindow: 128_000,
				maxOutput: 4_000,
				speed: 'medium',
				quality: 'good',
				modality: ['text'],
			},
		],
		useCaseOptimal: ['demonstrations', 'low-volume production', 'API testing'],
	},

	'cerebras-free': {
		name: 'Cerebras (Free Tier)',
		baseUrl: 'https://api.cerebras.ai/v1',
		requiresAuth: true, // Requires CEREBRAS_API_KEY
		rateLimit: 'Unlimited (1M tokens/day cap)',
		tokenLimit: '1M tokens/day',
		quality: 'good',
		costPerRun: 0,
		models: [
			{
				id: 'llama-3.1-70b',
				provider: 'Cerebras',
				contextWindow: 8_000, // Limited on free tier
				maxOutput: 4_000,
				speed: 'fast', // Ultra-fast: ~2,600 tok/s
				quality: 'good',
				modality: ['text'],
			},
		],
		useCaseOptimal: ['fast inference', 'high throughput', 'token-heavy tasks'],
	},

	'aion-free': {
		name: 'Aion Labs (Free Permanent)',
		baseUrl: 'https://api.aionlabs.ai/v1',
		requiresAuth: true, // Requires AION_API_KEY
		rateLimit: '15 RPM',
		tokenLimit: '20K tokens/day',
		quality: 'good',
		costPerRun: 0,
		models: [
			{
				id: 'aion-2.5',
				provider: 'Aion Labs',
				contextWindow: 128_000,
				maxOutput: 32_000,
				speed: 'medium',
				quality: 'good',
				modality: ['text'],
			},
		],
		useCaseOptimal: ['roleplay', 'storytelling', 'creative content'],
	},

	'zai-free': {
		name: 'Z AI / Zhipu (Free)',
		baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
		requiresAuth: true, // Requires ZAI_API_KEY
		rateLimit: '1 concurrent request',
		tokenLimit: 'Unlimited daily',
		quality: 'good',
		costPerRun: 0,
		models: [
			{
				id: 'glm-4.7-flash',
				provider: 'Z AI',
				contextWindow: 200_000,
				maxOutput: 128_000,
				speed: 'medium',
				quality: 'good',
				modality: ['text'],
			},
		],
		useCaseOptimal: ['large context', 'long documents', 'multilingual'],
	},
};

/**
 * Agent-aware fallback selection logic
 * Each agent knows WHEN to use free models
 */
export interface AgentFallbackStrategy {
	agentId: string;
	triggers: {
		budgetExceeded: boolean;
		demoMode: boolean;
		primaryUnavailable: boolean;
		costControlActive: boolean;
	};
	preferredFallbacks: string[]; // Ordered by preference for this agent
}

export const AGENT_FALLBACK_STRATEGIES: Record<string, AgentFallbackStrategy> = {
	cascadia: {
		agentId: 'cascadia',
		triggers: {
			budgetExceeded: true, // Switch to free if over budget
			demoMode: true, // Always offer demo mode with free
			primaryUnavailable: true,
			costControlActive: true,
		},
		preferredFallbacks: [
			'google-gemini-free', // Best for multimodal demos
			'mistral-free', // Good for content generation
			'cerebras-free', // Fast inference
			'cohere-free',
		],
	},

	pauli: {
		agentId: 'pauli',
		triggers: {
			budgetExceeded: true,
			demoMode: true,
			primaryUnavailable: true,
			costControlActive: true,
		},
		preferredFallbacks: [
			'mistral-free', // Good balance for Pauli Effect content
			'google-gemini-free',
			'cerebras-free',
			'aion-free', // Good for storytelling
		],
	},

	hermes: {
		agentId: 'hermes',
		triggers: {
			budgetExceeded: true,
			demoMode: true,
			primaryUnavailable: true,
			costControlActive: true,
		},
		preferredFallbacks: [
			'google-gemini-free', // Multimodal for Macs content
			'mistral-free',
			'cerebras-free', // Fast for time-sensitive content
			'cohere-free',
		],
	},
};

/**
 * Self-awareness: Agent knows when to trigger fallback
 */
export function shouldUseFreeModel(agentId: string, context: {
	budgetExceeded?: boolean;
	demoMode?: boolean;
	primaryUnavailable?: boolean;
	costControlActive?: boolean;
}): boolean {
	const strategy = AGENT_FALLBACK_STRATEGIES[agentId];
	if (!strategy) return false;

	return (
		(context.budgetExceeded && strategy.triggers.budgetExceeded) ||
		(context.demoMode && strategy.triggers.demoMode) ||
		(context.primaryUnavailable && strategy.triggers.primaryUnavailable) ||
		(context.costControlActive && strategy.triggers.costControlActive)
	);
}

/**
 * Get best fallback for agent's use case
 */
export function selectFreeFallback(
	agentId: string,
	availableProviders: string[],
): string | null {
	const strategy = AGENT_FALLBACK_STRATEGIES[agentId];
	if (!strategy) return null;

	// Find first preferred fallback that's available
	for (const preferred of strategy.preferredFallbacks) {
		if (availableProviders.includes(preferred)) {
			return preferred;
		}
	}

	return availableProviders.length > 0 ? availableProviders[0] : null;
}

/**
 * Get model endpoint with headers
 */
export function getFreeLLMEndpoint(
	providerKey: string,
	secrets: Record<string, string | undefined>,
): { url: string; headers: Record<string, string> } | null {
	const provider = FREE_LLM_REGISTRY[providerKey];
	if (!provider) return null;

	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
	};

	// Provider-specific auth
	switch (providerKey) {
		case 'google-gemini-free':
			if (!secrets.GOOGLE_GEMINI_API_KEY) return null;
			return {
				url: `${provider.baseUrl}/models/gemini-3.5-flash:generateContent?key=${secrets.GOOGLE_GEMINI_API_KEY}`,
				headers,
			};

		case 'mistral-free':
			if (!secrets.MISTRAL_API_KEY) return null;
			headers['Authorization'] = `Bearer ${secrets.MISTRAL_API_KEY}`;
			return { url: `${provider.baseUrl}/chat/completions`, headers };

		case 'cohere-free':
			if (!secrets.COHERE_API_KEY) return null;
			headers['Authorization'] = `Bearer ${secrets.COHERE_API_KEY}`;
			return { url: `${provider.baseUrl}/chat`, headers };

		case 'cerebras-free':
			if (!secrets.CEREBRAS_API_KEY) return null;
			headers['Authorization'] = `Bearer ${secrets.CEREBRAS_API_KEY}`;
			return { url: `${provider.baseUrl}/chat/completions`, headers };

		case 'aion-free':
			if (!secrets.AION_API_KEY) return null;
			headers['Authorization'] = `Bearer ${secrets.AION_API_KEY}`;
			return { url: `${provider.baseUrl}/chat/completions`, headers };

		case 'zai-free':
			if (!secrets.ZAI_API_KEY) return null;
			headers['Authorization'] = `Bearer ${secrets.ZAI_API_KEY}`;
			return { url: `${provider.baseUrl}/chat/completions`, headers };

		default:
			return null;
	}
}

export const FreeModelRegistry = {
	FREE_LLM_REGISTRY,
	AGENT_FALLBACK_STRATEGIES,
	shouldUseFreeModel,
	selectFreeFallback,
	getFreeLLMEndpoint,
};

export default FreeModelRegistry;
