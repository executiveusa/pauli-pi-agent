/**
 * Knowledge Graph Manager
 * Manages graph structure, storage, and operations
 */

import type { Entity, Relationship, KnowledgeGraph, GraphQuery, GraphQueryResult } from "./types.js";
import { EntityExtractor } from "./extractor.js";

export class GraphManager {
	private graph: KnowledgeGraph;
	private entityIndex: Map<string, Entity> = new Map();
	private relationshipIndex: Map<string, Set<string>> = new Map();
	private extractor: EntityExtractor;

	constructor(graphId: string, graphName: string, extractor: EntityExtractor = new EntityExtractor()) {
		this.graph = {
			id: graphId,
			name: graphName,
			entities: [],
			relationships: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		this.extractor = extractor;
	}

	async addEntity(entity: Entity): Promise<void> {
		if (!this.entityIndex.has(entity.id)) {
			this.graph.entities.push(entity);
			this.entityIndex.set(entity.id, entity);
			this.graph.updatedAt = new Date();
		}
	}

	async addRelationship(relationship: Relationship): Promise<void> {
		this.graph.relationships.push(relationship);

		// Update relationship index
		const sourceKey = `${relationship.sourceEntityId}_${relationship.targetEntityId}`;
		if (!this.relationshipIndex.has(relationship.sourceEntityId)) {
			this.relationshipIndex.set(relationship.sourceEntityId, new Set());
		}
		this.relationshipIndex.get(relationship.sourceEntityId)?.add(relationship.targetEntityId);

		this.graph.updatedAt = new Date();
	}

	async buildFromText(text: string, sourceId: string): Promise<void> {
		const extraction = await this.extractor.extract(text, sourceId);

		for (const entity of extraction.entities) {
			await this.addEntity(entity);
		}

		for (const relationship of extraction.relationships) {
			await this.addRelationship(relationship);
		}
	}

	async query(query: GraphQuery): Promise<GraphQueryResult> {
		const startTime = Date.now();
		const maxDepth = query.maxDepth || 2;

		let results: {
			entities: Entity[];
			relationships: Relationship[];
			paths: Array<{ entities: Entity[]; relationships: Relationship[]; distance: number }>;
		} = {
			entities: [],
			relationships: [],
			paths: [],
		};

		if (query.startEntity) {
			// Breadth-first search from starting entity
			const visited = new Set<string>();
			const queue: Array<{ entityId: string; depth: number }> = [{ entityId: query.startEntity, depth: 0 }];

			while (queue.length > 0) {
				const current = queue.shift();
				if (!current || current.depth > maxDepth || visited.has(current.entityId)) continue;

				visited.add(current.entityId);
				const entity = this.entityIndex.get(current.entityId);
				if (entity) {
					results.entities.push(entity);

					// Find related entities
					const relatedIds = this.relationshipIndex.get(current.entityId) || new Set();
					for (const relatedId of relatedIds) {
						if (!visited.has(relatedId) && current.depth < maxDepth) {
							queue.push({ entityId: relatedId, depth: current.depth + 1 });
						}
					}
				}
			}

			// Get relationships between found entities
			const entityIds = new Set(results.entities.map((e) => e.id));
			results.relationships = this.graph.relationships.filter(
				(r) => entityIds.has(r.sourceEntityId) && entityIds.has(r.targetEntityId),
			);
		} else {
			// Return all entities and relationships
			results.entities = this.graph.entities;
			results.relationships = this.graph.relationships;
		}

		// Apply filters
		if (query.entityFilter) {
			results.entities = results.entities.filter((e) => e.type === query.entityFilter);
		}

		if (query.relationshipFilter) {
			results.relationships = results.relationships.filter((r) => r.type === query.relationshipFilter);
		}

		return {
			entities: results.entities,
			relationships: results.relationships,
			paths: results.paths,
			executionTimeMs: Date.now() - startTime,
		};
	}

	getGraph(): KnowledgeGraph {
		return this.graph;
	}

	getEntity(entityId: string): Entity | undefined {
		return this.entityIndex.get(entityId);
	}

	getEntityConnections(entityId: string): Array<{ entity: Entity; relationships: Relationship[] }> {
		const connections: Array<{ entity: Entity; relationships: Relationship[] }> = [];
		const relatedIds = this.relationshipIndex.get(entityId) || new Set();

		for (const relatedId of relatedIds) {
			const entity = this.entityIndex.get(relatedId);
			if (entity) {
				const relationships = this.graph.relationships.filter(
					(r) => (r.sourceEntityId === entityId && r.targetEntityId === relatedId) ||
					       (r.targetEntityId === entityId && r.sourceEntityId === relatedId)
				);
				connections.push({ entity, relationships });
			}
		}

		return connections;
	}

	getGraphStatistics(): {
		entityCount: number;
		relationshipCount: number;
		entityTypeCount: Record<string, number>;
		relationshipTypeCount: Record<string, number>;
		avgConnectionsPerEntity: number;
		graphDensity: number;
	} {
		const entityTypes: Record<string, number> = {};
		const relationshipTypes: Record<string, number> = {};

		for (const entity of this.graph.entities) {
			entityTypes[entity.type] = (entityTypes[entity.type] || 0) + 1;
		}

		for (const rel of this.graph.relationships) {
			relationshipTypes[rel.type] = (relationshipTypes[rel.type] || 0) + 1;
		}

		const totalConnections = Array.from(this.relationshipIndex.values()).reduce((sum, s) => sum + s.size, 0);
		const avgConnections = this.graph.entities.length > 0 ? totalConnections / this.graph.entities.length : 0;
		const maxPossibleEdges = (this.graph.entities.length * (this.graph.entities.length - 1)) / 2;
		const density = maxPossibleEdges > 0 ? this.graph.relationships.length / maxPossibleEdges : 0;

		return {
			entityCount: this.graph.entities.length,
			relationshipCount: this.graph.relationships.length,
			entityTypeCount: entityTypes,
			relationshipTypeCount: relationshipTypes,
			avgConnectionsPerEntity: avgConnections,
			graphDensity: density,
		};
	}

	merge(other: KnowledgeGraph): void {
		for (const entity of other.entities) {
			const existing = this.entityIndex.get(entity.id);
			if (!existing) {
				this.graph.entities.push(entity);
				this.entityIndex.set(entity.id, entity);
			} else {
				existing.sourceIds = Array.from(new Set([...existing.sourceIds, ...entity.sourceIds]));
				existing.confidence = Math.max(existing.confidence, entity.confidence);
				existing.updatedAt = new Date();
			}
		}

		for (const rel of other.relationships) {
			// Check for duplicate relationships
			const exists = this.graph.relationships.some(
				(r) => r.sourceEntityId === rel.sourceEntityId && r.targetEntityId === rel.targetEntityId && r.type === rel.type,
			);
			if (!exists) {
				this.graph.relationships.push(rel);
			}
		}

		this.graph.updatedAt = new Date();
	}
}

export function createGraphManager(graphId: string, graphName: string): GraphManager {
	return new GraphManager(graphId, graphName);
}
