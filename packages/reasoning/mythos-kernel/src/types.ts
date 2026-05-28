import type { AgentMessage, Agent } from "@mariozechner/pi-agent-core";

// Depth Levels
export enum MythosDepth {
	INSTANT = "instant",
	FAST = "fast",
	NORMAL = "normal",
	DEEP = "deep",
	MYTHIC = "mythic",
}

// Loop Phases
export enum MythosLoopPhase {
	UNDERSTAND = "understand",
	RETRIEVE = "retrieve",
	STRUCTURE = "structure",
	ROUTE = "route",
	CRITIQUE = "critique",
	SIMULATE = "simulate",
	DECIDE = "decide",
	VERIFY = "verify",
	PACKAGE = "package",
}

// Risk Levels
export enum MythosRiskLevel {
	LOW = "low",
	MEDIUM = "medium",
	HIGH = "high",
	CRITICAL = "critical",
}

// Confidence thresholds
export interface ConfidenceThresholds {
	minTaskConfidence: number; // 0-1
	minGoalConfidence: number; // 0-1
	minCritiquesPass: number; // 0-1
	minDecisionConfidence: number; // 0-1
}

// Goal Packet - immutable request structure
export interface GoalPacket {
	id: string;
	createdAt: Date;
	userQuery: string;
	taskType: string;
	initialDepth: MythosDepth;
	maxDepth: MythosDepth;
	maxLoops: number;
	tokenBudget: number;
	costBudget: number;
	persona?: string;
	constraints: Record<string, string | number | boolean>;
	evidenceRequirements: string[];
	readonly createdTimestamp: number;
}

// Task Classification Result
export interface TaskClassification {
	taskType: string;
	complexity: number; // 0-1
	requiresReasoning: boolean;
	suggestedDepth: MythosDepth;
	confidence: number; // 0-1
	rationale: string;
}

// Depth Policy Decision
export interface DepthPolicyDecision {
	approvedDepth: MythosDepth;
	reasoning: string;
	modelAvailable: boolean;
	costEstimate: number;
	tokenEstimate: number;
}

// Token Budget Tracking
export interface TokenBudget {
	total: number;
	allocated: Map<MythosLoopPhase, number>;
	spent: Map<MythosLoopPhase, number>;
	remaining: number;
	overflowWarning: boolean;
	overflowThreshold: number; // percentage
}

// Loop Phase Result
export interface LoopPhaseResult {
	phase: MythosLoopPhase;
	success: boolean;
	duration: number;
	tokensUsed: number;
	confidence: number; // 0-1
	output: Record<string, unknown>;
	errors?: string[];
}

// Loop State
export interface LoopState {
	loopNumber: number;
	currentPhase: MythosLoopPhase;
	depth: MythosDepth;
	phaseResults: LoopPhaseResult[];
	accumulatedMessages: AgentMessage[];
	tokenBudget: TokenBudget;
	riskLevel: MythosRiskLevel;
	shouldContinue: boolean;
}

// Halt Policy Decision
export interface HaltPolicyDecision {
	shouldHalt: boolean;
	reason: string;
	confidence: number; // 0-1
}

// Stability Guard Evaluation
export interface StabilityGuardEvaluation {
	isStable: boolean;
	scopeExpanded: boolean;
	costExpanded: boolean;
	permissionExpanded: boolean;
	violations: string[];
	recommendations: string[];
}

// Persona Routing Decision
export interface PersonaRoutingDecision {
	recommendedPersona: string;
	applicableDepths: MythosDepth[];
	shouldRoute: boolean;
	confidence: number; // 0-1
}

// Evidence Policy State
export interface EvidencePolicyState {
	requirements: string[];
	collectedEvidence: Map<string, string[]>;
	satisfactionLevel: number; // 0-1
	capConfidence: number; // 0-1
}

// CODA Validation Result
export interface CodaValidationResult {
	isValid: boolean;
	sanitized: string;
	violations: string[];
	removedSections: string[];
}

// Trace Record for Database
export interface TraceRecord {
	traceId: string;
	goalPacketId: string;
	loopNumber: number;
	phase: MythosLoopPhase;
	depth: MythosDepth;
	content: string;
	redacted: boolean;
	detectedSecrets: string[];
	timestamp: Date;
	duration: number;
	tokensUsed: number;
}

// Mythos Decision Record
export interface MythosDecisionRecord {
	decisionId: string;
	goalPacketId: string;
	decisionType: string;
	decision: Record<string, unknown>;
	confidence: number; // 0-1
	timestamp: Date;
	reasoning: string;
}

// Mythos Metrics
export interface MythosMetrics {
	metricsId: string;
	goalPacketId: string;
	totalLoops: number;
	finalDepth: MythosDepth;
	totalTokensUsed: number;
	totalCost: number;
	successRate: number; // 0-1
	timestamp: Date;
}

// Mythos Kernel Configuration
export interface MythosKernelConfig {
	enabled: boolean;
	defaultDepth: MythosDepth;
	maxLoops: number;
	traceEnabled: boolean;
	personaRouterEnabled: boolean;
	evidencePolicy: "strict" | "balanced" | "lenient";
	confidenceThresholds: ConfidenceThresholds;
	tokenBudgetPerDepth: Map<MythosDepth, number>;
	costBudgetPerDepth: Map<MythosDepth, number>;
}

// Hook Context for beforeToolCall/afterToolCall integration
export interface MythosHookContext {
	goalPacket: GoalPacket;
	loopState: LoopState;
	depth: MythosDepth;
	currentPhase: MythosLoopPhase;
	shouldBlock: boolean;
	blockReason?: string;
}

// Orchestration Task Mapping
export interface MythosOrchestrationTask {
	taskId: string;
	phase: MythosLoopPhase;
	dependencies: MythosLoopPhase[];
	handler: (state: LoopState) => Promise<LoopPhaseResult>;
	timeout: number;
	maxRetries: number;
}

// Final Output Package
export interface CodaOutputPackage {
	goalPacketId: string;
	finalAnswer: string;
	supportingEvidence: Array<{
		type: string;
		content: string;
	}>;
	confidence: number; // 0-1
	depth: MythosDepth;
	loopsUsed: number;
	tokensUsed: number;
	cost: number;
}
