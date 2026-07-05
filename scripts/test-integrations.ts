#!/usr/bin/env npx tsx
/**
 * Integration Test Runner
 * Test Agent Mail, Composio, and Latitude connections
 */

import type { Secrets } from '../packages/secrets/src/schema.js';
import { testIntegration, formatIntegrationReport } from '../packages/secrets/src/third-party-integrations.js';

interface TestConfig {
	apiKey: string;
	name: string;
	required: boolean;
}

const INTEGRATION_TESTS: Record<string, TestConfig> = {
	agentmail: {
		name: 'Agent Mail',
		required: false,
		get apiKey() {
			return process.env.AGENTMAIL_API_KEY || '';
		},
	},
	composio: {
		name: 'Composio',
		required: false,
		get apiKey() {
			return process.env.COMPOSIO_API_KEY || '';
		},
	},
	latitude: {
		name: 'Latitude',
		required: false,
		get apiKey() {
			return process.env.LATITUDE_API_KEY || '';
		},
	},
};

async function runTests() {
	console.log('\n🔧 INTEGRATION TEST SUITE');
	console.log('═'.repeat(70));
	console.log('Testing Agent Mail, Composio, and Latitude connections\n');

	const results = [];
	let skipped = 0;
	let tested = 0;

	for (const [provider, config] of Object.entries(INTEGRATION_TESTS)) {
		if (!config.apiKey) {
			console.log(`⏭️  SKIPPED: ${config.name} (no API key in environment)`);
			console.log(`   Set ${provider.toUpperCase()}_API_KEY to test\n`);
			skipped++;
			continue;
		}

		console.log(`🔍 Testing ${config.name}...`);
		try {
			const result = await testIntegration(provider as any, config.apiKey);
			results.push(result);

			if (result.success) {
				console.log(`✅ PASS: ${result.message}`);
				if (result.responseTime) {
					console.log(`   Response time: ${result.responseTime}ms`);
				}
			} else {
				console.log(`❌ FAIL: ${result.message}`);
			}
			console.log();
			tested++;
		} catch (error) {
			console.log(`❌ ERROR: ${error instanceof Error ? error.message : String(error)}\n`);
			results.push({
				provider: provider as any,
				success: false,
				message: error instanceof Error ? error.message : String(error),
				timestamp: new Date().toISOString(),
			});
			tested++;
		}
	}

	console.log('═'.repeat(70));
	console.log(formatIntegrationReport(results));
	console.log('═'.repeat(70));

	const passedCount = results.filter((r) => r.success).length;
	const failedCount = results.filter((r) => !r.success).length;

	console.log(`\n📊 SUMMARY:`);
	console.log(`  Tested:  ${tested}`);
	console.log(`  Passed:  ${passedCount} ✅`);
	console.log(`  Failed:  ${failedCount} ❌`);
	console.log(`  Skipped: ${skipped} ⏭️`);

	if (failedCount > 0) {
		console.log('\n⚠️  Some tests failed. Check your API keys and try again.');
		console.log('   Docs: See INTEGRATIONS_SETUP_GUIDE.md for troubleshooting');
		process.exit(1);
	} else if (tested === 0) {
		console.log('\n⚠️  No tests were run. Set API keys in environment:');
		console.log('   AGENTMAIL_API_KEY=<key>');
		console.log('   COMPOSIO_API_KEY=<key>');
		console.log('   LATITUDE_API_KEY=<key>');
		process.exit(1);
	} else {
		console.log('\n✅ All tests passed! Integrations are ready to use.\n');
		process.exit(0);
	}
}

// Run tests
runTests().catch((error) => {
	console.error('Fatal error:', error);
	process.exit(1);
});
