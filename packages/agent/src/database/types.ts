/**
 * PI Agent Control Plane - Database Types
 * TypeScript interfaces matching the PostgreSQL schema
 */

// ============================================================================
// SOURCE INGESTION TYPES
// ============================================================================

export type SourceType = "url" | "video" | "document" | "raw_text";
export type IngestionStatus = "pending" | "success" | "failed";

export interface Source {
	id: string;
	sourceType: SourceType;
	url?: string;
	title?: string;
	author?: string;
	publishedDate?: Date;
	ingestedAt: Date;
	ingestionStatus: IngestionStatus;
	metadataJson?: Record<string, unknown>;
	createdAt: Date;
	updatedAt: Date;
}

export interface SourceItem {
	id: string;
	sourceId: string;
	itemType?: string; // 'chapter', 'page', 'paragraph', 'frame'
	content?: string;
	extractedText?: string;
	mediaUrls?: string[];
	createdAt: Date;
}

export interface IngestionRun {
	id: string;
	sourceId: string;
	status: "in_progress" | "success" | "failed";
	startedAt: Date;
	completedAt?: Date;
	entityCount: number;
	claimCount: number;
	relationCount: number;
	errorMessage?: string;
	metadataJson?: Record<string, unknown>;
}

// ============================================================================
// VIDEO ANALYSIS TYPES
// ============================================================================

export interface VideoAsset {
	id: string;
	sourceId: string;
	title?: string;
	durationSeconds?: number;
	transcript?: string;
	thumbnailUrl?: string;
	importedAt: Date;
}

export interface VideoObservation {
	id: string;
	videoAssetId: string;
	timestamp?: string; // '00:00:05' format
	observationType: string; // 'concept', 'entity', 'text', 'visual'
	content?: string;
	ocrText?: string;
	evidenceRefId?: string;
	confidence: number;
	createdAt: Date;
}

// ============================================================================
// TRANSCRIPT & DOCUMENT TYPES
// ============================================================================

export interface Transcript {
	id: string;
	sourceId: string;
	language: string;
	content: string;
	speakerSegments?: Array<{
		speaker: string;
		startTime: string;
		endTime: string;
		text: string;
	}>;
	createdAt: Date;
}

export interface Document {
	id: string;
	sourceId: string;
	docType?: string; // 'pdf', 'docx', 'xlsx', 'epub'
	content?: string;
	pageCount?: number;
	extractedMetadata?: Record<string, unknown>;
	createdAt: Date;
}

// ============================================================================
// KNOWLEDGE GRAPH TYPES
// ============================================================================

export type EntityType = "person" | "organization" | "concept" | "tool" | "location" | "other";

export interface Entity {
	id: string;
	name: string;
	description?: string;
	entityType: EntityType;
	embedding?: number[]; // 384-dimensional vector
	importanceScore: number;
	evidenceRefIds: string[];
	sourceCount: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface Claim {
	id: string;
	subjectEntityId?: string;
	predicate: string;
	objectEntityId?: string;
	description?: string;
	evidenceRefIds: string[];
	confidence: number;
	createdAt: Date;
	updatedAt: Date;
}

export type RelationType =
	| "depends_on"
	| "similar_to"
	| "causes"
	| "hierarchy"
	| "related_to"
	| "uses"
	| "teaches"
	| "other";

export interface Relation {
	id: string;
	sourceEntityId: string;
	relationType: RelationType;
	targetEntityId: string;
	weight: number;
	evidenceRefIds: string[];
	timestamp: Date;
}

export interface EvidenceSpan {
	id: string;
	sourceId: string;
	spanText: string;
	startOffset?: number;
	endOffset?: number;
	entityIds: string[];
	claimIds: string[];
	timestamp: Date;
}

// ============================================================================
// PERSONA TYPES
// ============================================================================

export type ModelPolicy = "free" | "balanced" | "premium" | "local_only";

export interface PersonaTrait {
	id: string;
	personaId: string;
	traitDescription: string;
	evidenceRefIds: string[];
	confidence: number;
	createdAt: Date;
}

export interface Persona {
	id: string;
	name: string;
	domain: string;
	expertise: string[];
	traits: PersonaTrait[];
	decisionRules: string[];
	knowledgeRefIds: string[]; // Entity IDs
	evidenceRefIds: string[]; // Source IDs
	agentPrompt?: string;
	allowedTools: string[];
	modelPolicy: ModelPolicy;
	confidence: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface PersonaAgentConfig {
	id: string;
	personaId: string;
	systemPrompt?: string;
	toolsJson?: Array<{
		name: string;
		description: string;
		parameters?: Record<string, unknown>;
	}>;
	modelPolicy: ModelPolicy;
	parametersJson?: Record<string, unknown>;
	createdAt: Date;
	updatedAt: Date;
}

// ============================================================================
// REASONING & SYNTHESIS TYPES
// ============================================================================

export type ReasoningStatus = "in_progress" | "completed" | "failed";

export interface ReasoningRun {
	id: string;
	query: string;
	selectedPersonaIds: string[];
	startedAt: Date;
	completedAt?: Date;
	status: ReasoningStatus;
	costEstimate: number;
	costActual?: number;
	modelRoutesJson?: Array<{
		personaId: string;
		provider: string;
		model: string;
		cost: number;
	}>;
	createdAt: Date;
}

export interface ReasoningVote {
	id: string;
	reasoningRunId: string;
	personaId?: string;
	response?: string;
	confidence: number;
	evidenceRefIds: string[];
	reasoningTrace?: Record<string, unknown>;
	createdAt: Date;
}

export interface ReasoningSynthesis {
	id: string;
	reasoningRunId: string;
	synthesisText?: string;
	evidenceRefIds: string[];
	disagreementsJson?: Array<{
		personaAId: string;
		personaBId: string;
		positionA: string;
		positionB: string;
		severity: number;
	}>;
	modelUsed?: string;
	costActual?: number;
	createdAt: Date;
}

export interface ReasoningResult {
	reasoningRun: ReasoningRun;
	votes: ReasoningVote[];
	synthesis: ReasoningSynthesis;
}

// ============================================================================
// FEEDBACK & AUDIT TYPES
// ============================================================================

export type FeedbackType = "rating" | "correction" | "preferred_answer" | "rejected_claim" | "missing_evidence";

export interface FeedbackEvent {
	id: string;
	reasoningRunId?: string;
	feedbackType: FeedbackType;
	rating?: number; // 1-5
	correctionText?: string;
	userId?: string;
	createdAt: Date;
}

export type AuditEventType =
	| "ingest_start"
	| "ingest_success"
	| "ingest_failure"
	| "persona_created"
	| "persona_updated"
	| "persona_deleted"
	| "reasoning_run_started"
	| "reasoning_run_completed"
	| "model_call_made"
	| "circuit_breaker_triggered"
	| "approval_requested"
	| "approval_granted"
	| "approval_denied"
	| "user_login"
	| "user_logout"
	| "user_action"
	| "secret_access_attempt"
	| "permission_denied";

export interface AuditEvent {
	id: string;
	eventType: AuditEventType;
	userId?: string;
	resourceType?: string;
	resourceId?: string;
	action?: string;
	detailsJson?: Record<string, unknown>;
	ipAddress?: string;
	timestamp: Date;
	redacted: boolean;
}

// ============================================================================
// MODEL CALL & BUDGET TYPES
// ============================================================================

export interface ModelCall {
	id: string;
	reasoningRunId?: string;
	provider: string; // 'openai', 'anthropic', 'openrouter', etc.
	model: string;
	inputTokens?: number;
	outputTokens?: number;
	costEstimate?: number;
	costActual?: number;
	latencyMs?: number;
	stopReason?: string;
	timestamp: Date;
}

export interface ModelBudget {
	id: string;
	period: "daily" | "monthly";
	budgetLimitUsd: number;
	spentUsd: number;
	freeModelCalls: number;
	paidModelCalls: number;
	createdAt: Date;
	updatedAt: Date;
}

// ============================================================================
// APPROVAL TYPES
// ============================================================================

export type ApprovalRequestType = "expensive_model_route" | "persona_delete" | "code_deploy" | "other";

export type ApprovalStatus = "pending" | "approved" | "denied";

export interface ApprovalRequest {
	id: string;
	requestType: ApprovalRequestType;
	resourceId?: string;
	requestedBy: string;
	requesterContext?: string; // Why the action is needed
	status: ApprovalStatus;
	approvedBy?: string;
	approvalReason?: string;
	createdAt: Date;
	decidedAt?: Date;
}

// ============================================================================
// SECRETS TYPES
// ============================================================================

export interface SecretsReference {
	id: string;
	secretName: string;
	provider?: string;
	infisicalPath?: string;
	lastRotatedAt?: Date;
	createdAt: Date;
}

// ============================================================================
// SEARCH & CONTEXT TYPES
// ============================================================================

export interface GraphContext {
	entities: Entity[];
	claims: Claim[];
	relations: Relation[];
	evidenceRefs: string[];
}

export interface SearchResult {
	entityId: string;
	entityName: string;
	entityType: EntityType;
	similarity: number;
	relatedClaims: Claim[];
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface PersonaStats {
	traitCount: number;
	evidenceCount: number;
	avgConfidence: number;
	knowledgeEntityCount: number;
}

export interface CostSummary {
	inputTokens: number;
	outputTokens: number;
	estimatedCostUsd: number;
	actualCostUsd?: number;
	freeModelCalls: number;
	paidModelCalls: number;
}

export interface CreateSourceInput {
	sourceType: SourceType;
	url?: string;
	title?: string;
	author?: string;
	publishedDate?: Date;
	metadataJson?: Record<string, unknown>;
}

export interface CreatePersonaInput {
	name: string;
	domain: string;
	sources: string[]; // Source IDs to extract knowledge from
}
