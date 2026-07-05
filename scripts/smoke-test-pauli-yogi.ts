#!/usr/bin/env npx tsx
/**
 * Pauli Yogi Mode Smoke Test
 * Tests Yogi Mode with free Mistral model via OpenRouter
 */

import { smokeTestPauliYogi } from '../packages/content-engine/src/yogi-mode-pauli.js';

async function main() {
	console.log('\n╔═══════════════════════════════════════════════════════════════╗');
	console.log('║   🧘 PAULI EFFECT - YOGI MODE SMOKE TEST                     ║');
	console.log('║                                                               ║');
	console.log('║   Testing Yogi Mode integration with free Mistral model       ║');
	console.log('║   Cost: $0/run (Free tier)                                   ║');
	console.log('╚═══════════════════════════════════════════════════════════════╝\n');

	try {
		// Load secrets from environment
		const secrets = {
			OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
			PAULI_ANTHROPIC_API_KEY: process.env.PAULI_ANTHROPIC_API_KEY,
		};

		console.log('📋 Environment Check:');
		console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
		console.log(`   OPENROUTER_API_KEY: ${secrets.OPENROUTER_API_KEY ? '✅ Set' : '❌ Not set'}`);
		console.log(`   PAULI_ANTHROPIC_API_KEY: ${secrets.PAULI_ANTHROPIC_API_KEY ? '✅ Set' : '❌ Not set'}\n`);

		// Run smoke test
		await smokeTestPauliYogi(secrets as any);

		console.log('\n✨ Yogi Mode is fully operational and ready for demo! 🚀\n');
		process.exit(0);
	} catch (error) {
		console.error('\n❌ Test failed:', error);

		console.log('\n📚 SETUP INSTRUCTIONS:');
		console.log('   1. Get OpenRouter API key: https://openrouter.ai/settings/keys');
		console.log('   2. Export: export OPENROUTER_API_KEY=your_key_here');
		console.log('   3. (Optional) Set PAULI_ANTHROPIC_API_KEY for full integration');
		console.log('   4. Run test again: npx tsx scripts/smoke-test-pauli-yogi.ts\n');

		process.exit(1);
	}
}

main();
