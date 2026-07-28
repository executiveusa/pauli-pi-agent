import * as readline from 'readline';
import type { Secrets } from '../../../packages/secrets/src/schema.js';
import { FREE_LLM_REGISTRY, getFreeLLMEndpoint } from '../../../packages/secrets/src/free-llm-registry.js';

export type ModelChoice = 'deepseek-4' | 'deepseek-flash' | 'mistral-free' | 'opencode';

export interface ModelConfig {
	id: ModelChoice;
	name: string;
	provider: string;
	costPerMTok: number; // $ per million tokens
	estimatedCostPerRun: number;
	speed: 'fast' | 'medium' | 'slow';
	quality: 'best' | 'good' | 'fair';
	description: string;
	free: boolean;
}

const MODELS: Record<ModelChoice, ModelConfig> = {
	'deepseek-4': {
		id: 'deepseek-4',
		name: 'DeepSeek-4',
		provider: 'OpenRouter',
		costPerMTok: 0.14, // $0.14 per million input tokens
		estimatedCostPerRun: 0.05, // ~$0.05 per content generation
		speed: 'fast',
		quality: 'best',
		description: 'Most capable, reasoning-heavy (BEST FOR DEMOS)',
		free: false,
	},
	'deepseek-flash': {
		id: 'deepseek-flash',
		name: 'DeepSeek-Flash',
		provider: 'OpenRouter',
		costPerMTok: 0.07, // $0.07 per million tokens (cheaper)
		estimatedCostPerRun: 0.02, // ~$0.02 per run
		speed: 'fast',
		quality: 'good',
		description: 'Fast & cheap, good quality (BALANCE)',
		free: false,
	},
	'mistral-free': {
		id: 'mistral-free',
		name: 'Mistral 7B Free',
		provider: 'OpenRouter',
		costPerMTok: 0,
		estimatedCostPerRun: 0,
		speed: 'slow',
		quality: 'fair',
		description: 'Free tier Mistral (LIMITED QUALITY)',
		free: true,
	},
	'opencode': {
		id: 'opencode',
		name: 'OpenCode (Your Subscription)',
		provider: 'OpenCode',
		costPerMTok: 0,
		estimatedCostPerRun: 0,
		speed: 'medium',
		quality: 'good',
		description: 'Your OpenCode subscription (CHECK IF ACTIVE)',
		free: true,
	},
};

/**
 * Interactive prompt to select model
 * Shows cost, quality, speed tradeoffs
 */
export async function promptModelSelection(secrets: Secrets): Promise<ModelChoice> {
	// Check override
	const override = secrets.CASCADIA_MODEL_OVERRIDE as ModelChoice | undefined;
	if (override && !secrets.PROMPT_FOR_MODEL_SELECTION) {
		console.log(`📌 Using preset model: ${MODELS[override].name}`);
		return override;
	}

	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	return new Promise(resolve => {
		console.log('\n═══════════════════════════════════════════════════════════');
		console.log('🤖 Select Model for Cascadia Agent Content Generation');
		console.log('═══════════════════════════════════════════════════════════\n');

		console.log('Available Models:\n');

		// Show all options with costs
		const modelEntries = Object.entries(MODELS) as [ModelChoice, ModelConfig][];
		modelEntries.forEach(([key, model], index) => {
			const costStr = model.free ? '🟢 FREE' : `🔴 $${model.estimatedCostPerRun}/run`;
			const speedIcon = model.speed === 'fast' ? '⚡' : model.speed === 'medium' ? '⏱️' : '🐢';
			const qualityIcon = model.quality === 'best' ? '⭐⭐⭐' : model.quality === 'good' ? '⭐⭐' : '⭐';

			console.log(`  ${index + 1}. ${model.name.padEnd(30)} ${costStr.padEnd(15)}`);
			console.log(`     ${model.description}`);
			console.log(`     Speed: ${speedIcon} ${model.speed.padEnd(8)} Quality: ${qualityIcon}`);
			console.log();
		});

		console.log('───────────────────────────────────────────────────────────');
		console.log('💡 Recommendations:');
		console.log('   • BEST DEMO: DeepSeek-4 (best quality, still cheap)');
		console.log('   • BUDGET: DeepSeek-Flash (70% cheaper, still good)');
		console.log('   • FREE: OpenCode or Mistral (if you have credits)');
		console.log('───────────────────────────────────────────────────────────\n');

		rl.question('Select model (1-4): ', answer => {
			const choice = parseInt(answer) - 1;
			const selected = modelEntries[choice]?.[0];

			if (selected && MODELS[selected]) {
				const model = MODELS[selected];
				console.log(`\n✅ Selected: ${model.name}`);
				console.log(`   Cost: ${model.free ? '🟢 FREE' : `🔴 ~$${model.estimatedCostPerRun}/run`}`);
				console.log(`   Speed: ${model.speed} | Quality: ${model.quality}\n`);

				// Cost warning
				if (!model.free && secrets.COST_WARNING_ENABLED) {
					const runCost = model.estimatedCostPerRun;
					const dailyEstimate = runCost * 4; // 6-hour cycles = 4/day
					const monthlyEstimate = dailyEstimate * 30;

					console.log(`⚠️  Monthly cost estimate: ~$${monthlyEstimate.toFixed(2)}`);
					if (monthlyEstimate > (secrets.MAX_MONTHLY_SPEND_USD || 50)) {
						console.log(`   ⛔ EXCEEDS budget: $${secrets.MAX_MONTHLY_SPEND_USD}`);
					}
					console.log();
				}

				rl.close();
				resolve(selected);
			} else {
				console.log('❌ Invalid selection. Try again.\n');
				rl.close();
				// Recursively prompt again
				promptModelSelection(secrets).then(resolve);
			}
		});
	});
}

/**
 * Get API endpoint for selected model
 */
export function getModelEndpoint(
	model: ModelChoice,
	secrets: Secrets,
): { url: string; headers: Record<string, string> } {
	switch (model) {
		case 'deepseek-4':
		case 'deepseek-flash':
			if (!secrets.OPENROUTER_API_KEY) {
				throw new Error('Missing OPENROUTER_API_KEY for DeepSeek models');
			}
			return {
				url: 'https://openrouter.ai/api/v1/chat/completions',
				headers: {
					'Authorization': `Bearer ${secrets.OPENROUTER_API_KEY}`,
					'HTTP-Referer': 'https://cascadia.local',
					'X-Title': 'Cascadia Atlas',
				},
			};

		case 'opencode':
			if (!secrets.OPENCODE_API_KEY) {
				throw new Error('Missing OPENCODE_API_KEY. Get from: https://opencode.com/settings/api');
			}
			return {
				url: 'https://api.opencode.com/v1/chat/completions',
				headers: {
					'Authorization': `Bearer ${secrets.OPENCODE_API_KEY}`,
				},
			};

		case 'mistral-free':
			if (!secrets.OPENROUTER_API_KEY) {
				throw new Error('Missing OPENROUTER_API_KEY for Mistral free tier');
			}
			return {
				url: 'https://openrouter.ai/api/v1/chat/completions',
				headers: {
					'Authorization': `Bearer ${secrets.OPENROUTER_API_KEY}`,
				},
			};

		default:
			throw new Error(`Unknown model: ${model}`);
	}
}

/**
 * Get actual model ID for API call
 */
export function getModelId(model: ModelChoice, _secrets: Secrets): string {
	switch (model) {
		case 'deepseek-4':
			return 'deepseek/deepseek-chat';
		case 'deepseek-flash':
			return 'deepseek/deepseek-chat'; // Same model, cheaper routing via OpenRouter
		case 'mistral-free':
			return 'mistralai/mistral-7b-instruct';
		case 'opencode':
			return 'mistral-7b'; // Or your OpenCode default
		default:
			throw new Error(`Unknown model: ${model}`);
	}
}

/**
 * Verify model availability
 */
export async function verifyModelAvailable(model: ModelChoice, secrets: Secrets): Promise<boolean> {
	const config = MODELS[model];

	console.log(`\n🔍 Verifying ${config.name}...`);

	try {
		const endpoint = getModelEndpoint(model, secrets);
		const modelId = getModelId(model, secrets);

		// Make a quick test call (tiny prompt)
		const response = await fetch(endpoint.url, {
			method: 'POST',
			headers: {
				...endpoint.headers,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				model: modelId,
				messages: [{ role: 'user', content: 'Say "ok"' }],
				max_tokens: 5,
			}),
		});

		if (response.ok) {
			console.log(`✅ ${config.name} available`);
			return true;
		} else {
			const error = await response.json();
			console.log(`❌ ${config.name} unavailable: ${error.error?.message || 'Unknown error'}`);
			return false;
		}
	} catch (error) {
		console.log(`❌ ${config.name} error: ${error}`);
		return false;
	}
}

/**
 * Find first available model (fallback chain)
 */
export async function findAvailableModel(secrets: Secrets): Promise<ModelChoice> {
	const fallbackChain: ModelChoice[] = [
		'deepseek-4', // Try best first
		'deepseek-flash', // Then fast/cheap
		'opencode', // Then free subscription
		'mistral-free', // Finally free tier
	];

	console.log('\n🔗 Checking model availability (fallback chain)...\n');

	for (const model of fallbackChain) {
		const available = await verifyModelAvailable(model, secrets);
		if (available) {
			return model;
		}
	}

	throw new Error(
		'No models available! Check API keys:\n' +
			'  - OPENROUTER_API_KEY (for DeepSeek/Mistral)\n' +
			'  - OPENCODE_API_KEY (for OpenCode)',
	);
}

/**
 * Discover available free LLM models (agent self-awareness feature)
 * Checks which free providers have API keys configured
 */
export function getAvailableFreeLLMs(secrets: Secrets): string[] {
	const available: string[] = [];

	if (secrets.GOOGLE_GEMINI_API_KEY) available.push('google-gemini-free');
	if (secrets.MISTRAL_API_KEY) available.push('mistral-free');
	if (secrets.COHERE_API_KEY) available.push('cohere-free');
	if (secrets.CEREBRAS_API_KEY) available.push('cerebras-free');
	if (secrets.AION_API_KEY) available.push('aion-free');
	if (secrets.ZAI_API_KEY) available.push('zai-free');

	return available;
}

/**
 * Verify free LLM availability
 */
export async function verifyFreeLLMAvailable(
	providerKey: string,
	secrets: Secrets,
): Promise<boolean> {
	const provider = FREE_LLM_REGISTRY[providerKey];
	if (!provider) return false;

	console.log(`\n🔍 Verifying ${provider.name}...`);

	try {
		const endpoint = getFreeLLMEndpoint(providerKey, secrets as unknown as Record<string, string | undefined>);
		if (!endpoint) {
			console.log(`⚠️  ${provider.name} missing API key`);
			return false;
		}

		// Test call
		const response = await fetch(endpoint.url, {
			method: 'POST',
			headers: {
				...endpoint.headers,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				messages: [{ role: 'user', content: 'Say "ok"' }],
				max_tokens: 5,
			}),
		});

		if (response.ok) {
			console.log(`✅ ${provider.name} available (${provider.rateLimit})`);
			return true;
		} else {
			const error = await response.json();
			console.log(`❌ ${provider.name} unavailable: ${error.error?.message || 'Unknown error'}`);
			return false;
		}
	} catch (error) {
		console.log(`❌ ${provider.name} error: ${error}`);
		return false;
	}
}

/**
 * Show available free models (for interactive selection)
 */
export function listFreeModelsForAgent(agentId: string, secrets: Secrets): string {
	const available = getAvailableFreeLLMs(secrets);
	if (available.length === 0) return 'No free LLM APIs configured';

	let output = `\n🆓 Free LLM Options Available for ${agentId}:\n`;

	available.forEach((providerKey, index) => {
		const provider = FREE_LLM_REGISTRY[providerKey];
		if (provider) {
			output += `  ${index + 1}. ${provider.name}\n`;
			output += `     Quality: ${provider.quality} | Speed: Medium\n`;
			output += `     Rate: ${provider.rateLimit} | Cost: $0/run\n`;
			output += `     Best for: ${provider.useCaseOptimal.join(', ')}\n\n`;
		}
	});

	return output;
}

export const ModelSelector = {
	promptModelSelection,
	getModelEndpoint,
	getModelId,
	verifyModelAvailable,
	findAvailableModel,
	getAvailableFreeLLMs,
	verifyFreeLLMAvailable,
	listFreeModelsForAgent,
	MODELS,
	FREE_LLM_REGISTRY,
};

export default ModelSelector;
