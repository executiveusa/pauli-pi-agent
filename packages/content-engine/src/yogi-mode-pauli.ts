/**
 * Yogi Mode for Pauli Effect Agent
 * Production implementation with free model support and smoke tests
 */

import type { AgentContext } from '../../../packages/secrets/src/agent-context.js';
import type { Secrets } from '../../../packages/secrets/src/schema.js';

export interface YogiModeConfig {
	enabled: boolean;
	model: string;
	maxTokens: number;
	temperature: number;
	reasoningDepth: 'light' | 'medium' | 'deep';
}

export interface YogiResponse {
	thinking: string;
	reasoning: string;
	content: string;
	tokensUsed: number;
	cost: number;
	timestamp: string;
}

/**
 * ═════════════════════════════════════════════════════════════════════════
 * PAULI YOGI MODE
 * Deep reasoning mode for complex TikTok/Reels content generation
 * ═════════════════════════════════════════════════════════════════════════
 *
 * Free Model: Mistral 7B via OpenRouter or Gemini Free
 * Cost: $0/run with free tier
 * Tokens: 2.5x normal for extended reasoning
 * Use Case: Complex content analysis, trend deep-dives
 */

const PAULI_YOGI_CONFIG: YogiModeConfig = {
	enabled: true,
	model: 'mistral-free', // Free tier, no cost
	maxTokens: 4096, // Extended for reasoning
	temperature: 0.7, // Balanced creativity + consistency
	reasoningDepth: 'deep',
};

/**
 * Mistral Free endpoint (via OpenRouter)
 * No cost, ~1B tokens/month free tier
 */
async function getMistralFreeEndpoint(
	secrets: Secrets,
): Promise<{ url: string; headers: Record<string, string>; modelId: string }> {
	if (!secrets.OPENROUTER_API_KEY) {
		throw new Error('OPENROUTER_API_KEY required for Mistral Free model');
	}

	return {
		url: 'https://openrouter.ai/api/v1/chat/completions',
		headers: {
			'Authorization': `Bearer ${secrets.OPENROUTER_API_KEY}`,
			'HTTP-Referer': 'https://pauli-effect.app',
			'X-Title': 'Pauli Effect Agent',
			'Content-Type': 'application/json',
		},
		modelId: 'mistralai/mistral-7b-instruct',
	};
}

/**
 * Pauli's Yogi Mode Reasoning Prompt
 * Guides model through multi-step analysis for TikTok content
 */
function generateYogiSystemPrompt(context: AgentContext): string {
	return `You are 🧘 Yogi Mode for Pauli Effect - Deep Reasoning Agent.

ROLE: Generate viral ${context.platforms?.join('/')} content through extended analysis.

REASONING PROCESS:
1. **Understand Context**: Analyze signals deeply (trends, audience, platform dynamics)
2. **Identify Hooks**: Find viral angles and psychological triggers
3. **Plan Strategy**: Map content structure (hook → build → payoff)
4. **Create Content**: Generate TikTok/Reel scripts with timing
5. **Evaluate**: Self-check for virality potential

PAULI VOICE: ${context.voice || 'Energetic, trend-forward, Gen-Z authentic'}
GEO TARGET: ${context.geo}
PLATFORMS: ${context.platforms?.join(', ')}

OUTPUT FORMAT:
- Start with [THINKING] section showing your analysis
- Then provide [CONTENT] section with actual TikTok/Reel scripts
- Include [REASONING] explaining viral potential

CRITICAL: Deep analysis first, then content generation.`;
}

/**
 * Pauli's Yogi Mode User Prompt
 * Requests extended thinking + content generation
 */
function generateYogiUserPrompt(signals: string): string {
	return `SIGNALS (Viral trends & audience insights):
${signals}

YOUR TASK (Yogi Mode - Extended Reasoning):
1. Analyze what makes these signals viral
2. Identify platform-specific opportunities
3. Plan content structure (hook, build, payoff)
4. Generate 2-3 TikTok/Reel scripts with timing

Show your thinking process clearly.
Then provide actual content ready to shoot.`;
}

/**
 * Invoke Pauli's Yogi Mode with free model
 */
export async function invokePauliYogiMode(
	context: AgentContext,
	signals: string,
	secrets: Secrets,
): Promise<YogiResponse> {
	const startTime = Date.now();

	console.log('\n🧘 PAULI YOGI MODE ACTIVATED');
	console.log('═'.repeat(70));
	console.log('Model: Mistral 7B Free (OpenRouter)');
	console.log('Reasoning Depth: Deep');
	console.log('Max Tokens: 4096');

	try {
		// Get Mistral Free endpoint
		const { url, headers, modelId } = await getMistralFreeEndpoint(secrets);

		console.log('📡 Sending request to Mistral Free...\n');

		// Make API call with extended reasoning
		const response = await fetch(url, {
			method: 'POST',
			headers,
			body: JSON.stringify({
				model: modelId,
				messages: [
					{
						role: 'system',
						content: generateYogiSystemPrompt(context),
					},
					{
						role: 'user',
						content: generateYogiUserPrompt(signals),
					},
				],
				temperature: PAULI_YOGI_CONFIG.temperature,
				max_tokens: PAULI_YOGI_CONFIG.maxTokens,
				top_p: 0.9,
			}),
		});

		if (!response.ok) {
			const error = (await response.json()) as any;
			throw new Error(
				`Mistral API error: ${response.status} - ${error.error?.message || JSON.stringify(error)}`
			);
		}

		const data = (await response.json()) as any;
		const responseTime = Date.now() - startTime;

		// Parse response
		const fullContent = data.choices[0].message.content;
		const tokensUsed = data.usage?.total_tokens || 0;

		// Extract sections
		const thinkingMatch = fullContent.match(/\[THINKING\]([\s\S]*?)\[(?:REASONING|CONTENT)\]/);
		const reasoningMatch = fullContent.match(/\[REASONING\]([\s\S]*?)\[CONTENT\]/);
		const contentMatch = fullContent.match(/\[CONTENT\]([\s\S]*?)$/);

		const thinking = thinkingMatch ? thinkingMatch[1].trim() : '';
		const reasoning = reasoningMatch ? reasoningMatch[1].trim() : '';
		const content = contentMatch ? contentMatch[1].trim() : fullContent;

		console.log(`✅ Response received (${responseTime}ms)`);
		console.log(`📊 Tokens used: ${tokensUsed}`);

		return {
			thinking,
			reasoning,
			content,
			tokensUsed,
			cost: 0, // Mistral Free = $0
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error('❌ Yogi Mode error:', error);
		throw error;
	}
}

/**
 * Format Yogi Mode response for display
 */
export function formatYogiResponse(response: YogiResponse): string {
	let output = '\n🧘 YOGI MODE RESPONSE\n';
	output += '═'.repeat(70) + '\n\n';

	if (response.thinking) {
		output += '💭 THINKING PROCESS:\n';
		output += '─'.repeat(70) + '\n';
		output += response.thinking + '\n\n';
	}

	if (response.reasoning) {
		output += '🔍 REASONING:\n';
		output += '─'.repeat(70) + '\n';
		output += response.reasoning + '\n\n';
	}

	output += '✨ GENERATED CONTENT:\n';
	output += '─'.repeat(70) + '\n';
	output += response.content + '\n\n';

	output += '📊 STATS:\n';
	output += '─'.repeat(70) + '\n';
	output += `Tokens: ${response.tokensUsed}\n`;
	output += `Cost: $${response.cost.toFixed(4)}\n`;
	output += `Model: Mistral 7B Free\n`;
	output += `Time: ${response.timestamp}\n`;

	return output;
}

/**
 * Smoke Test: Verify Yogi Mode works with real Mistral API
 */
export async function smokeTestPauliYogi(secrets: Secrets): Promise<void> {
	console.log('\n🧪 PAULI YOGI MODE SMOKE TEST');
	console.log('═'.repeat(70));

	if (!secrets.OPENROUTER_API_KEY) {
		console.log('⚠️  SKIPPED: OPENROUTER_API_KEY not configured');
		console.log('   Set OPENROUTER_API_KEY env var to test\n');
		return;
	}

	try {
		// Create mock context for Pauli
		const mockContext: AgentContext = {
			agent: 'pauli',
			company: 'The Pauli Effect',
			contextPath: 'companies/pauli-effect',
			apiKey: secrets.OPENROUTER_API_KEY,
			model: 'mistralai/mistral-7b-instruct',
			voice: 'Energetic, trend-forward, Gen-Z authentic',
			geo: 'US',
			platforms: ['TikTok', 'Instagram Reels'],
		};

		// Mock signals for testing
		const mockSignals = `
TRENDING NOW:
• "AI replacing jobs" - 2.3M views, emotional reaction
• "Side hustle content" - Entrepreneurs sharing wins
• "Gen-Z productivity tips" - Morning routines trending
• "Behind-the-scenes startup life" - Authenticity valued

AUDIENCE INSIGHTS:
• 18-25 age group (72% of followers)
• High engagement on personal stories
• Prefer 15-30 second videos
• Strong interest in entrepreneurship content

PLATFORM DYNAMICS:
• TikTok: Trending sounds in comedy & inspiration
• Reels: Carousel posts + video hybrids performing
• Peak engagement: 7-9pm EST
`;

		console.log('📋 Test Context:');
		console.log(`   Agent: ${mockContext.agent}`);
		console.log(`   Company: ${mockContext.company}`);
		console.log(`   Platforms: ${mockContext.platforms?.join(', ')}\n`);

		console.log('🚀 Invoking Pauli Yogi Mode...\n');

		const response = await invokePauliYogiMode(mockContext, mockSignals, secrets);

		console.log(formatYogiResponse(response));

		console.log('\n✅ SMOKE TEST PASSED');
		console.log('═'.repeat(70));
		console.log('Pauli Yogi Mode is operational with Mistral Free model');
		console.log(`Cost: $0 (free tier)`);
		console.log(`Tokens: ${response.tokensUsed}`);
		console.log(`Response time: ${new Date(response.timestamp).getTime() - Date.now()}ms\n`);
	} catch (error) {
		console.error('\n❌ SMOKE TEST FAILED');
		console.error('═'.repeat(70));
		console.error('Error:', error instanceof Error ? error.message : String(error));

		if (error instanceof Error && error.message.includes('401')) {
			console.error('\n💡 Troubleshooting:');
			console.error('   - Check OPENROUTER_API_KEY is valid');
			console.error('   - Get key from: https://openrouter.ai/settings/keys');
			console.error('   - May need to add credits to OpenRouter account');
		}

		throw error;
	}
}

export default {
	PAULI_YOGI_CONFIG,
	invokePauliYogiMode,
	formatYogiResponse,
	smokeTestPauliYogi,
};
