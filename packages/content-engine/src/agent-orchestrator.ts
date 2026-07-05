import { execSync } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import type { AgentId, AgentContext } from '../../../packages/secrets/src/agent-context.js';
import { loadAgentContext, loadAgentSignals, enforceAgentIsolation } from '../../../packages/secrets/src/agent-context.js';
import type { Secrets } from '../../../packages/secrets/src/schema.js';

export interface AgentUpdate {
	agent: AgentId;
	company: string;
	timestamp: string;
	contentGenerated: string;
	postsApproved: number;
	commitHash: string;
}

export class MasterAgentOrchestrator {
	private secrets: Secrets;
	private isolation: boolean;
	private autoCommit: boolean;

	constructor(secrets: Secrets) {
		this.secrets = secrets;
		this.isolation = secrets.AGENT_ISOLATION_MODE === 'true';
		this.autoCommit = secrets.AGENT_COMMIT_UPDATES === 'true';
	}

	/**
	 * Run master agent with strict context isolation
	 * Each agent ONLY processes their company's signals and generates content
	 */
	async runMasterAgent(agent: AgentId): Promise<AgentUpdate> {
		// Load isolated context (no cross-access)
		const context = loadAgentContext(agent, this.secrets);

		// Enforce isolation
		if (this.isolation && !enforceAgentIsolation(agent, context.contextPath)) {
			throw new Error(`ISOLATION VIOLATION: ${agent} cannot access ${context.contextPath}`);
		}

		console.log(`\n🚀 Starting ${agent} agent (${context.company})`);
		console.log(`📍 Context: ${context.contextPath}`);
		console.log(`🌍 Geo: ${context.geo} | Platforms: ${context.platforms?.join(', ')}`);

		// Load agent's PRIVATE signals (no visibility into other companies)
		const signals = loadAgentSignals(context);
		console.log(`📊 Loaded signals (${signals.length} chars)`);

		// Generate content via agent's dedicated API key
		const contentGenerated = await this.invokeAgent(context, signals);

		// Parse generated posts
		const postsApproved = this.parseAndSaveContent(context, contentGenerated);

		// Auto-commit updates if enabled
		let commitHash = '';
		if (this.autoCommit) {
			commitHash = this.commitAgentUpdate(context, contentGenerated);
		}

		const update: AgentUpdate = {
			agent,
			company: context.company,
			timestamp: new Date().toISOString(),
			contentGenerated,
			postsApproved,
			commitHash,
		};

		console.log(`✅ ${agent} completed: ${postsApproved} posts approved`);
		return update;
	}

	/**
	 * Invoke agent with isolated context + dedicated API key
	 */
	private async invokeAgent(context: AgentContext, signals: string): Promise<string> {
		// Hermes uses NousResearch API
		if (context.agent === 'hermes') {
			const response = await fetch('https://inference-api.nousresearch.com/v1/chat/completions', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${context.apiKey}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					model: context.model,
					max_tokens: 2048,
					messages: [
						{
							role: 'system',
							content: `You are ${context.company}'s master content agent. Generate viral ${context.platforms?.join('/')} content based on ONLY the signals provided. You have EXCLUSIVE access to ${context.company}'s context only.`,
						},
						{
							role: 'user',
							content: `${signals}\n\nGenerate 3-5 ${context.geo} viral posts. Format as:\n\n## Post 1\n[content]\n\n---`,
						},
					],
				}),
			});

			const data = (await response.json()) as any;
			return data.choices[0].message.content;
		}

		// Other agents use Anthropic (Claude)
		const anthropicUrl = 'https://api.anthropic.com/v1/messages';
		const response = await fetch(anthropicUrl, {
			method: 'POST',
			headers: {
				'x-api-key': context.apiKey,
				'Content-Type': 'application/json',
				'anthropic-version': '2023-06-01',
			},
			body: JSON.stringify({
				model: context.model,
				max_tokens: 2048,
				system: `You are ${context.company}'s master content agent (${context.voice || 'English'}). Generate viral ${context.platforms?.join('/')} content ONLY from the signals provided. You ONLY work with ${context.company} data.`,
				messages: [
					{
						role: 'user',
						content: `${signals}\n\nGenerate 3-5 ${context.geo} viral posts for ${context.platforms?.join('/')}. Format clearly.`,
					},
				],
			}),
		});

		const data = (await response.json()) as any;
		return data.content[0].text;
	}

	/**
	 * Parse generated content and save to company's approval folder
	 */
	private parseAndSaveContent(context: AgentContext, generated: string): number {
		const approvedDir = join(context.contextPath, 'content', 'approved');
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
		const filename = `${context.agent}-${timestamp}.md`;
		const filepath = join(approvedDir, filename);

		const content = `# ${context.company} Generated Content
Date: ${new Date().toISOString()}
Agent: ${context.agent}
Geo: ${context.geo}
Platforms: ${context.platforms?.join(', ')}

${generated}
`;

		writeFileSync(filepath, content);

		// Count posts (rough estimate: "## Post" markers)
		const postCount = (generated.match(/^##\s+Post/gm) || []).length;
		console.log(`💾 Saved to ${approvedDir}/${filename}`);

		return postCount;
	}

	/**
	 * Auto-commit agent updates back to branch
	 */
	private commitAgentUpdate(context: AgentContext, generated: string): string {
		try {
			execSync(`cd ${context.contextPath} && git add content/approved/`, { stdio: 'pipe' });
			const commitMsg = `chore(${context.agent}): auto-update content for ${context.company}`;
			const hash = execSync(`git commit -m "${commitMsg}" --quiet && git rev-parse HEAD`, {
				encoding: 'utf-8',
				stdio: 'pipe',
			}).trim();
			return hash;
		} catch (error) {
			console.warn(`⚠️ Could not auto-commit for ${context.agent}`);
			return '';
		}
	}

	/**
	 * Circulation: Sync all agent updates to central signal store
	 * Each agent's output → shared dashboard/brief (read-only to others)
	 */
	async circulate(updates: AgentUpdate[]): Promise<void> {
		const circulation = {
			timestamp: new Date().toISOString(),
			agents: updates.map(u => ({
				agent: u.agent,
				company: u.company,
				geo: u.company, // Approximate from company name
				postsGenerated: u.postsApproved,
				status: 'completed',
				commitHash: u.commitHash,
			})),
		};

		const circulationPath = 'companies/_circulation/latest.json';
		writeFileSync(circulationPath, JSON.stringify(circulation, null, 2));
		console.log(`\n📡 Circulation update: ${updates.length} agents completed`);
	}

	/**
	 * Run all master agents in parallel (each isolated)
	 */
	async runAllAgents(): Promise<AgentUpdate[]> {
		const agents: AgentId[] = ['hermes', 'vyapari', 'pauli', 'kupuri', 'cheggie', 'cascadia'];

		const updates = await Promise.all(
			agents.map(agent =>
				this.runMasterAgent(agent).catch(err => {
					console.error(`❌ ${agent} failed:`, err.message);
					return {
						agent,
						company: agent,
						timestamp: new Date().toISOString(),
						contentGenerated: '',
						postsApproved: 0,
						commitHash: '',
					};
				}),
			),
		);

		// Circulation: sync all updates
		await this.circulate(updates);

		return updates;
	}
}

export default MasterAgentOrchestrator;
