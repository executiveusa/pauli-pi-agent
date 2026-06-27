/**
 * Command Registry
 *
 * The single source of truth for all commands in the Pauli Pi Software Factory.
 * Every action that an agent or user can invoke is defined here as a typed data record.
 *
 * Commands are:
 * - Typed with full TypeScript interfaces
 * - Associated with a specific agent
 * - Gated by permission level
 * - Optionally requiring human approval
 * - Optionally bound to a keyboard shortcut
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type CommandCategory =
	| "audit"
	| "build"
	| "design"
	| "qa"
	| "deploy"
	| "monetize"
	| "review"
	| "monitor"
	| "admin";

export type Permission =
	| "all" // Any authenticated user
	| "reviewer" // Can view and request reviews
	| "developer" // Can run builds, tests, and analysis
	| "admin"; // Full access including deployments and approvals

export type AgentId =
	| "master"
	| "watcher"
	| "builder"
	| "design"
	| "monetization"
	| "browser-qa"
	| "backend"
	| "frontend"
	| "deployment"
	| "judge";

export interface Command {
	/** Unique identifier used to look up and invoke this command */
	id: string;
	/** Human-readable title shown in UI */
	title: string;
	/** Description shown in tooltips and command palette */
	description: string;
	/** Lucide icon name for the command */
	icon: string;
	/** Grouping for UI organization */
	category: CommandCategory;
	/** Minimum permission level required to execute */
	permission: Permission;
	/** Which agent handles this command */
	agent: AgentId;
	/** Method/function name to invoke on the agent */
	action: string;
	/** Optional static arguments passed to the action */
	args?: Record<string, unknown>;
	/** If true, execution is held until a human explicitly approves */
	requires_approval?: boolean;
	/** Optional single-character keyboard shortcut (with modifier key) */
	shortcut?: string;
}

// ─── Command Registry ─────────────────────────────────────────────────────────

/**
 * The complete command registry.
 *
 * All commands are defined as data. No logic lives here — commands are
 * dispatched to agents by the Master Agent based on the `agent` and `action` fields.
 *
 * Ordering within each category determines display order in UI.
 */
export const COMMAND_REGISTRY: Command[] = [
	// ─── Audit ──────────────────────────────────────────────────────────────

	{
		id: "audit-project",
		title: "Audit Project",
		description:
			"Run full project audit: completeness, tech debt, gaps, and opportunities",
		icon: "Search",
		category: "audit",
		permission: "developer",
		agent: "master",
		action: "auditProject",
		shortcut: "a",
	},
	{
		id: "production-readiness",
		title: "Production Readiness Check",
		description:
			"Security, performance, reliability, and observability checks before deployment",
		icon: "Shield",
		category: "audit",
		permission: "developer",
		agent: "master",
		action: "checkProductionReadiness",
	},

	// ─── Build ──────────────────────────────────────────────────────────────

	{
		id: "productionize",
		title: "Productionize Project",
		description:
			"Full factory pipeline: audit → fix → design → test → monetize → deploy",
		icon: "Factory",
		category: "build",
		permission: "developer",
		agent: "master",
		action: "productionize",
		shortcut: "f",
	},
	{
		id: "build-queue",
		title: "Build Queue",
		description: "View and manage the active build queue",
		icon: "List",
		category: "build",
		permission: "developer",
		agent: "builder",
		action: "getQueue",
	},

	// ─── Design ─────────────────────────────────────────────────────────────

	{
		id: "design-review",
		title: "Design Review",
		description:
			"Score design quality using the UDEC framework against Synthia standards",
		icon: "Palette",
		category: "design",
		permission: "developer",
		agent: "design",
		action: "reviewDesign",
		shortcut: "d",
	},

	// ─── QA ─────────────────────────────────────────────────────────────────

	{
		id: "browser-qa",
		title: "Browser QA",
		description:
			"Launch browser validation: links, responsive, accessibility, console errors",
		icon: "Globe",
		category: "qa",
		permission: "developer",
		agent: "browser-qa",
		action: "runBrowserQA",
		shortcut: "q",
	},

	// ─── Monetize ────────────────────────────────────────────────────────────

	{
		id: "monetize",
		title: "Monetization Analysis",
		description:
			"Generate 3 revenue paths, subscription tiers, affiliate opportunities, and revenue score",
		icon: "DollarSign",
		category: "monetize",
		permission: "developer",
		agent: "monetization",
		action: "analyzeMonetization",
		shortcut: "m",
	},

	// ─── Review ──────────────────────────────────────────────────────────────

	{
		id: "judge-review",
		title: "Judge Review",
		description:
			"Request final Judge evaluation: PASS, PASS WITH CONDITIONS, or FAIL verdict",
		icon: "Scale",
		category: "review",
		permission: "developer",
		agent: "judge",
		action: "runJudgeReview",
		shortcut: "j",
	},

	// ─── Deploy ──────────────────────────────────────────────────────────────

	{
		id: "deploy",
		title: "Deploy",
		description: "Deploy to Vercel after Judge PASS verdict and human approval",
		icon: "Rocket",
		category: "deploy",
		permission: "admin",
		agent: "deployment",
		action: "deploy",
		requires_approval: true,
		shortcut: "p",
	},
	{
		id: "approve-deployment",
		title: "Approve Deployment",
		description: "Human approval gate: authorize a pending production deployment",
		icon: "CheckCircle",
		category: "deploy",
		permission: "admin",
		agent: "deployment",
		action: "approveDeployment",
		requires_approval: true,
	},
	{
		id: "reject-deployment",
		title: "Reject Deployment",
		description: "Block a pending deployment and require re-evaluation with reason",
		icon: "XCircle",
		category: "deploy",
		permission: "admin",
		agent: "deployment",
		action: "rejectDeployment",
	},

	// ─── Monitor ─────────────────────────────────────────────────────────────

	{
		id: "watcher-status",
		title: "Watcher Status",
		description:
			"View all agent health, active monitors, cost tracking, and watcher alerts",
		icon: "Eye",
		category: "monitor",
		permission: "developer",
		agent: "watcher",
		action: "getStatus",
	},

	// ─── Admin ───────────────────────────────────────────────────────────────

	{
		id: "pause-agent",
		title: "Pause Agent",
		description: "Manually pause a specific agent and hold its task queue",
		icon: "PauseCircle",
		category: "admin",
		permission: "admin",
		agent: "master",
		action: "pauseAgent",
		args: { agentId: null }, // caller must pass agentId
	},
	{
		id: "resume-agent",
		title: "Resume Agent",
		description: "Resume a paused agent and re-enter its task queue",
		icon: "PlayCircle",
		category: "admin",
		permission: "admin",
		agent: "master",
		action: "resumeAgent",
		args: { agentId: null },
	},
	{
		id: "clear-escalations",
		title: "Clear Escalations",
		description: "Acknowledge and clear active watcher escalations after manual resolution",
		icon: "BellOff",
		category: "admin",
		permission: "admin",
		agent: "watcher",
		action: "clearEscalations",
		requires_approval: true,
	},
];

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Get all commands in a specific category, in display order.
 */
export function getCommandsByCategory(category: CommandCategory): Command[] {
	return COMMAND_REGISTRY.filter((c) => c.category === category);
}

/**
 * Look up a command by its unique ID.
 * Returns undefined if not found.
 */
export function getCommandById(id: string): Command | undefined {
	return COMMAND_REGISTRY.find((c) => c.id === id);
}

/**
 * Get all commands handled by a specific agent.
 */
export function getCommandsByAgent(agent: AgentId): Command[] {
	return COMMAND_REGISTRY.filter((c) => c.agent === agent);
}

/**
 * Get all commands accessible at a given permission level.
 *
 * Permission hierarchy (lowest → highest): all → reviewer → developer → admin
 * A user at level N can see all commands at levels <= N.
 *
 * @example
 * // Returns commands with permission "all", "reviewer", and "developer"
 * getCommandsByPermission("developer")
 */
export function getCommandsByPermission(permission: Permission): Command[] {
	const levels: Permission[] = ["all", "reviewer", "developer", "admin"];
	const userLevel = levels.indexOf(permission);
	return COMMAND_REGISTRY.filter(
		(c) => levels.indexOf(c.permission) <= userLevel,
	);
}

/**
 * Get all commands that require human approval.
 */
export function getApprovalRequiredCommands(): Command[] {
	return COMMAND_REGISTRY.filter((c) => c.requires_approval === true);
}

/**
 * Get all commands with keyboard shortcuts.
 * Useful for building keyboard shortcut help UI.
 */
export function getCommandsWithShortcuts(): Command[] {
	return COMMAND_REGISTRY.filter((c) => c.shortcut !== undefined);
}

/**
 * Get all unique categories represented in the registry.
 */
export function getAllCategories(): CommandCategory[] {
	return [...new Set(COMMAND_REGISTRY.map((c) => c.category))];
}

/**
 * Group all commands by category for UI rendering.
 */
export function getCommandsGroupedByCategory(): Map<CommandCategory, Command[]> {
	const grouped = new Map<CommandCategory, Command[]>();
	for (const command of COMMAND_REGISTRY) {
		const existing = grouped.get(command.category) ?? [];
		existing.push(command);
		grouped.set(command.category, existing);
	}
	return grouped;
}
