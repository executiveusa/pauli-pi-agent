/**
 * Knowledge Graph Types
 * Defines entities, relationships, and graph structures
 */

export interface Entity {
	id: string;
	type: string;
	name: string;
	description?: string;
	metadata?: Record<string, unknown>;
	confidence: number;
	sourceIds: string[];
	createdAt: Date;
	updatedAt: Date;
}

export interface Relationship {
	id: string;
	sourceEntityId: string;
	targetEntityId: string;
	type: string;
	strength: number; // 0-1 confidence
	metadata?: Record<string, unknown>;
	evidence: string[];
	createdAt: Date;
}

export interface KnowledgeGraph {
	id: string;
	name: string;
	description?: string;
	entities: Entity[];
	relationships: Relationship[];
	metadata?: Record<string, unknown>;
	createdAt: Date;
	updatedAt: Date;
}

export interface ExtractionResult {
	entities: Entity[];
	relationships: Relationship[];
	confidence: number;
	processingTimeMs: number;
}

export interface GraphQuery {
	query: string;
	startEntity?: string;
	maxDepth?: number;
	entityFilter?: string;
	relationshipFilter?: string;
}

export interface GraphQueryResult {
	entities: Entity[];
	relationships: Relationship[];
	paths: Array<{
		entities: Entity[];
		relationships: Relationship[];
		distance: number;
	}>;
	executionTimeMs: number;
}
