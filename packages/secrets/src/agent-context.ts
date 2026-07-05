import { readFileSync } from 'fs';
import { join } from 'path';
import type { Secrets } from './schema.js';

export type AgentId = 'hermes' | 'vyapari' | 'pauli' | 'kupuri' | 'cheggie' | 'cascadia';

export interface AgentContext {
	agent: AgentId;
	company: string;
	contextPath: string;
	apiKey: string;
	model: string;
	voice?: string;
	geo?: string;
	platforms?: string[];
}

const AGENT_CONFIG: Record<AgentId, Partial<AgentContext>> = {
	hermes: { company: 'Macs Digital', model: 'nousresearch/nous-hermes-2-mixtral-8x7b-dpo', geo: 'US', platforms: ['LinkedIn', 'YouTube'] },
	vyapari: { company: 'MyWebLane', model: 'claude-haiku-4-5-20251001', geo: 'IN', voice: 'Hindi+English', platforms: ['YouTube', 'Instagram'] },
	pauli: { company: 'The Pauli Effect', model: 'claude-haiku-4-5-20251001', geo: 'US', platforms: ['TikTok', 'Instagram Reels'] },
	kupuri: { company: 'Kupuri Media', model: 'claude-haiku-4-5-20251001', geo: 'MX', voice: 'Spanish+English', platforms: ['Instagram', 'TikTok'] },
	cheggie: { company: 'Cheggie', model: 'claude-haiku-4-5-20251001', geo: 'RS', voice: 'Serbian+English', platforms: ['LinkedIn', 'Instagram'] },
	cascadia: { company: 'Cascadia Atlas', model: 'claude-opus-4-8', geo: 'PNW', platforms: ['Demo', 'LinkedIn'] },
};

/**
 * Load agent context with STRICT isolation
 * Each agent only sees their own company data, signals, and briefs
 * No cross-agent access allowed
 */
export function loadAgentContext(agent: AgentId, secrets: Secrets): AgentContext {
	const config = AGENT_CONFIG[agent];
	if (!config) throw new Error(`Unknown agent: ${agent}`);

	const apiKeyEnvVar = `${agent.toUpperCase()}_ANTHROPIC_API_KEY`;
	const contextPathEnvVar = `${agent.toUpperCase()}_CONTEXT_PATH`;

	const apiKey = secrets[apiKeyEnvVar as keyof Secrets] as string | undefined;
	if (!apiKey) {
		throw new Error(`Missing API key: ${apiKeyEnvVar}`);
	}

	const contextPath = (secrets[contextPathEnvVar as keyof Secrets] as string | undefined) || config.contextPath || `companies/${agent}`;

	return {
		agent,
		company: config.company || agent,
		contextPath,
		apiKey,
		model: config.model || 'claude-haiku-4-5-20251001',
		voice: config.voice,
		geo: config.geo,
		platforms: config.platforms,
	};
}

/**
 * Load agent's private signals (no cross-access)
 * Path: companies/<company>/_signals/raw/today.md
 */
export function loadAgentSignals(context: AgentContext): string {
	const signalsPath = join(context.contextPath, '_signals', 'raw', 'today.md');
	try {
		return readFileSync(signalsPath, 'utf-8');
	} catch (error) {
		throw new Error(`Failed to load signals for ${context.company} at ${signalsPath}: ${error}`);
	}
}

/**
 * Load agent's approved content templates (isolated)
 * Path: companies/<company>/content/approved/*.md
 */
export function loadAgentApprovedContent(context: AgentContext): Record<string, string> {
	const approvedPath = join(context.contextPath, 'content', 'approved');
	const result: Record<string, string> = {};
	try {
		// In real implementation, use fs.readdirSync + readFileSync per file
		// For now, return structure
		return result;
	} catch (error) {
		return result; // Graceful fallback if dir doesn't exist
	}
}

/**
 * Load agent's briefs (isolated)
 * Path: companies/<company>/briefs/*.md
 */
export function loadAgentBriefs(context: AgentContext): Record<string, string> {
	const briefsPath = join(context.contextPath, 'briefs');
	const result: Record<string, string> = {};
	try {
		// In real implementation, use fs.readdirSync + readFileSync per file
		return result;
	} catch (error) {
		return result;
	}
}

/**
 * Enforce strict isolation: agent can ONLY access their own context
 */
export function enforceAgentIsolation(agent: AgentId, requestedPath: string): boolean {
	const config = AGENT_CONFIG[agent];
	const agentContextPath = config.contextPath || `companies/${agent}`;
	// Path must start with agent's context path
	return requestedPath.startsWith(agentContextPath);
}

export default {
	loadAgentContext,
	loadAgentSignals,
	loadAgentApprovedContent,
	loadAgentBriefs,
	enforceAgentIsolation,
};
