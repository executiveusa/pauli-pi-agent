/**
 * Third-Party Integration Registry
 * Agent Mail + Composio + Latitude
 *
 * Unified system for connecting external services to all agents
 * Currently shares API keys (acknowledged as "spaghetti" - will refactor later)
 */

import { z } from 'zod';

export type IntegrationProvider = 'agentmail' | 'composio' | 'latitude';

export interface IntegrationConfig {
	provider: IntegrationProvider;
	apiKey: string;
	baseUrl: string;
	description: string;
	status: 'configured' | 'pending' | 'error';
	lastTested?: string;
	testResult?: boolean;
}

export interface AgentMailConfig extends IntegrationConfig {
	provider: 'agentmail';
	fromEmail: string;
	replyToEmail?: string;
	maxEmailsPerDay?: number;
	enableAutoReply?: boolean;
}

export interface ComposioConfig extends IntegrationConfig {
	provider: 'composio';
	workspaceId: string;
	enabledActions: string[];
	rateLimit?: number;
}

export interface LatitudeConfig extends IntegrationConfig {
	provider: 'latitude';
	projectId: string;
	environment: 'dev' | 'staging' | 'production';
	enableTelemetry: boolean;
}

export interface ThirdPartyIntegrations {
	agentmail?: AgentMailConfig;
	composio?: ComposioConfig;
	latitude?: LatitudeConfig;
}

export interface IntegrationTestResult {
	provider: IntegrationProvider;
	success: boolean;
	message: string;
	timestamp: string;
	responseTime?: number;
}

/**
 * ════════════════════════════════════════════════════════════════════
 * AGENT MAIL CONFIGURATION
 * ════════════════════════════════════════════════════════════════════
 *
 * Service: Agent Mail
 * Console: https://console.agentmail.to/dashboard/api-keys
 * Purpose: Email communication for agents, send/receive, auto-reply
 *
 * Features:
 *   • Send emails from agent identities
 *   • Receive and parse incoming emails
 *   • Auto-reply functionality
 *   • Email threading
 *   • Attachment support
 *
 * Rate Limits: 100 emails/day (free), 1000/day (pro)
 */

export const AgentMailSchema = z.object({
	AGENTMAIL_API_KEY: z.string().min(1, 'Agent Mail API Key required'),
	AGENTMAIL_FROM_EMAIL: z.string().email('Valid email required'),
	AGENTMAIL_REPLY_TO: z.string().email().optional(),
	AGENTMAIL_MAX_EMAILS_PER_DAY: z.number().default(100),
	AGENTMAIL_ENABLE_AUTO_REPLY: z.boolean().default(false),
	AGENTMAIL_WEBHOOK_URL: z.string().url().optional(),
});

export type AgentMailSecrets = z.infer<typeof AgentMailSchema>;

/**
 * ════════════════════════════════════════════════════════════════════
 * COMPOSIO CONFIGURATION
 * ════════════════════════════════════════════════════════════════════
 *
 * Service: Composio
 * Console: https://dashboard.composio.dev/executiveusa/HERMES/settings/api-keys
 * Purpose: Action orchestration, 100+ app integrations
 *
 * Features:
 *   • 100+ pre-built integrations (Slack, GitHub, Jira, etc.)
 *   • Unified API for multiple tools
 *   • Workflow automation
 *   • Custom action definitions
 *
 * Rate Limits: 1000 actions/day (free), 10000/day (pro)
 */

export const ComposioSchema = z.object({
	COMPOSIO_API_KEY: z.string().min(1, 'Composio API Key required'),
	COMPOSIO_WORKSPACE_ID: z.string().min(1, 'Workspace ID required'),
	COMPOSIO_ENABLED_ACTIONS: z.string().default('github,slack,jira,gmail,notion'),
	COMPOSIO_RATE_LIMIT: z.number().default(1000),
	COMPOSIO_TIMEOUT_MS: z.number().default(30000),
});

export type ComposioSecrets = z.infer<typeof ComposioSchema>;

/**
 * ════════════════════════════════════════════════════════════════════
 * LATITUDE CONFIGURATION
 * ════════════════════════════════════════════════════════════════════
 *
 * Service: Latitude
 * Console: https://console.latitude.so/projects/the-pauli-effect-s-project/onboarding
 * Purpose: AI workflow engine, conversation management, telemetry
 *
 * Features:
 *   • AI conversation flows
 *   • Session management
 *   • Analytics and telemetry
 *   • Multi-step workflows
 *   • Conversation history
 *
 * Rate Limits: Unlimited conversations, metered by usage
 */

export const LatitudeSchema = z.object({
	LATITUDE_API_KEY: z.string().min(1, 'Latitude API Key required'),
	LATITUDE_PROJECT_ID: z.string().min(1, 'Project ID required'),
	LATITUDE_ENVIRONMENT: z.enum(['dev', 'staging', 'production']).default('production'),
	LATITUDE_ENABLE_TELEMETRY: z.boolean().default(true),
	LATITUDE_BASE_URL: z.string().url().default('https://api.latitude.so'),
	LATITUDE_WEBHOOK_URL: z.string().url().optional(),
});

export type LatitudeSecrets = z.infer<typeof LatitudeSchema>;

/**
 * Combined schema for all integrations
 */
export const ThirdPartyIntegrationsSchema = z.object({
	...AgentMailSchema.shape,
	...ComposioSchema.shape,
	...LatitudeSchema.shape,
}).partial();

/**
 * Agent-specific integration routing
 * Each agent can have custom settings for each provider
 */
export interface AgentIntegrationSettings {
	agent: string;
	email?: string;
	composioActions?: string[];
	latitudeProjectId?: string;
	enabledIntegrations: IntegrationProvider[];
}

export const AGENT_INTEGRATION_MAP: Record<string, AgentIntegrationSettings> = {
	hermes: {
		agent: 'hermes',
		email: 'hermes@macs-digital.com',
		composioActions: ['github', 'slack', 'jira', 'gmail'],
		latitudeProjectId: 'macs-digital-hermes',
		enabledIntegrations: ['agentmail', 'composio', 'latitude'],
	},

	vyapari: {
		agent: 'vyapari',
		email: 'vyapari@myweb-lane.com',
		composioActions: ['youtube', 'gmail', 'slack', 'notion'],
		latitudeProjectId: 'myweb-lane-vyapari',
		enabledIntegrations: ['agentmail', 'composio', 'latitude'],
	},

	pauli: {
		agent: 'pauli',
		email: 'pauli@pauli-effect.com',
		composioActions: ['tiktok', 'instagram', 'gmail', 'slack'],
		latitudeProjectId: 'pauli-effect-pauli',
		enabledIntegrations: ['agentmail', 'composio', 'latitude'],
	},

	kupuri: {
		agent: 'kupuri',
		email: 'kupuri@kupuri-media.com',
		composioActions: ['instagram', 'tiktok', 'gmail', 'slack'],
		latitudeProjectId: 'kupuri-media-kupuri',
		enabledIntegrations: ['agentmail', 'composio', 'latitude'],
	},

	cheggie: {
		agent: 'cheggie',
		email: 'cheggie@cheggie.com',
		composioActions: ['linkedin', 'instagram', 'gmail', 'slack'],
		latitudeProjectId: 'cheggie-cheggie',
		enabledIntegrations: ['agentmail', 'composio', 'latitude'],
	},

	cascadia: {
		agent: 'cascadia',
		email: 'cascadia@cascadia-atlas.com',
		composioActions: ['github', 'slack', 'gmail', 'notion', 'jira'],
		latitudeProjectId: 'cascadia-atlas-cascadia',
		enabledIntegrations: ['agentmail', 'composio', 'latitude'],
	},
};

/**
 * Test integration connectivity
 */
export async function testIntegration(
	provider: IntegrationProvider,
	apiKey: string,
	endpoint?: string,
): Promise<IntegrationTestResult> {
	const timestamp = new Date().toISOString();

	try {
		switch (provider) {
			case 'agentmail':
				return await testAgentMail(apiKey, timestamp);

			case 'composio':
				return await testComposio(apiKey, timestamp);

			case 'latitude':
				return await testLatitude(apiKey, timestamp);

			default:
				return {
					provider,
					success: false,
					message: `Unknown provider: ${provider}`,
					timestamp,
				};
		}
	} catch (error) {
		return {
			provider,
			success: false,
			message: `Test failed: ${error instanceof Error ? error.message : String(error)}`,
			timestamp,
		};
	}
}

async function testAgentMail(apiKey: string, timestamp: string): Promise<IntegrationTestResult> {
	const startTime = Date.now();

	try {
		const response = await fetch('https://api.agentmail.to/v1/auth/verify', {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${apiKey}`,
				'Content-Type': 'application/json',
			},
		});

		const responseTime = Date.now() - startTime;

		if (response.ok) {
			return {
				provider: 'agentmail',
				success: true,
				message: 'Agent Mail API key verified successfully',
				timestamp,
				responseTime,
			};
		} else {
			return {
				provider: 'agentmail',
				success: false,
				message: `Agent Mail auth failed: ${response.status} ${response.statusText}`,
				timestamp,
				responseTime,
			};
		}
	} catch (error) {
		return {
			provider: 'agentmail',
			success: false,
			message: `Agent Mail connection error: ${error instanceof Error ? error.message : String(error)}`,
			timestamp,
		};
	}
}

async function testComposio(apiKey: string, timestamp: string): Promise<IntegrationTestResult> {
	const startTime = Date.now();

	try {
		const response = await fetch('https://api.composio.dev/v1/integrations', {
			method: 'GET',
			headers: {
				'X-API-KEY': apiKey,
				'Content-Type': 'application/json',
			},
		});

		const responseTime = Date.now() - startTime;

		if (response.ok) {
			return {
				provider: 'composio',
				success: true,
				message: 'Composio API key verified successfully',
				timestamp,
				responseTime,
			};
		} else {
			return {
				provider: 'composio',
				success: false,
				message: `Composio auth failed: ${response.status} ${response.statusText}`,
				timestamp,
				responseTime,
			};
		}
	} catch (error) {
		return {
			provider: 'composio',
			success: false,
			message: `Composio connection error: ${error instanceof Error ? error.message : String(error)}`,
			timestamp,
		};
	}
}

async function testLatitude(apiKey: string, timestamp: string): Promise<IntegrationTestResult> {
	const startTime = Date.now();

	try {
		const response = await fetch('https://api.latitude.so/v1/projects', {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${apiKey}`,
				'Content-Type': 'application/json',
			},
		});

		const responseTime = Date.now() - startTime;

		if (response.ok) {
			return {
				provider: 'latitude',
				success: true,
				message: 'Latitude API key verified successfully',
				timestamp,
				responseTime,
			};
		} else {
			return {
				provider: 'latitude',
				success: false,
				message: `Latitude auth failed: ${response.status} ${response.statusText}`,
				timestamp,
				responseTime,
			};
		}
	} catch (error) {
		return {
			provider: 'latitude',
			success: false,
			message: `Latitude connection error: ${error instanceof Error ? error.message : String(error)}`,
			timestamp,
		};
	}
}

/**
 * Format integration status report
 */
export function formatIntegrationReport(results: IntegrationTestResult[]): string {
	const timestamp = new Date().toISOString();
	let report = `\n📊 INTEGRATION TEST REPORT - ${timestamp}\n`;
	report += `${'═'.repeat(70)}\n\n`;

	for (const result of results) {
		const status = result.success ? '✅' : '❌';
		const responseTime = result.responseTime ? ` (${result.responseTime}ms)` : '';
		report += `${status} ${result.provider.toUpperCase()}: ${result.message}${responseTime}\n`;
	}

	report += `\n${'═'.repeat(70)}`;
	return report;
}

export const ThirdPartyIntegrations = {
	AgentMailSchema,
	ComposioSchema,
	LatitudeSchema,
	ThirdPartyIntegrationsSchema,
	AGENT_INTEGRATION_MAP,
	testIntegration,
	formatIntegrationReport,
};

export default ThirdPartyIntegrations;
