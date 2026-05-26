/**
 * Entity Extractor
 * Extracts entities and relationships from text
 */

import type { Entity, ExtractionResult, Relationship } from "./types.js";

export class EntityExtractor {
	private readonly minConfidence: number = 0.5;

	async extract(text: string, sourceId: string): Promise<ExtractionResult> {
		const startTime = Date.now();

		try {
			const entities = await this.extractEntities(text, sourceId);
			const relationships = await this.extractRelationships(text, entities);

			const avgConfidence =
				entities.length > 0 ? entities.reduce((sum, e) => sum + e.confidence, 0) / entities.length : 0;

			return {
				entities: entities.filter((e) => e.confidence >= this.minConfidence),
				relationships,
				confidence: avgConfidence,
				processingTimeMs: Date.now() - startTime,
			};
		} catch (error) {
			throw new Error(`Entity extraction failed: ${String(error)}`);
		}
	}

	async extractEntities(text: string, sourceId: string): Promise<Entity[]> {
		const entities: Entity[] = [];

		// Simple pattern-based extraction (placeholder for ML-based approach)
		const words = text.split(/\s+/);
		const seen = new Set<string>();

		for (let i = 0; i < words.length; i++) {
			const word = words[i].toLowerCase();

			// Skip common words
			if (word.length < 3 || seen.has(word)) continue;
			if (["the", "and", "or", "in", "on", "at", "to", "is"].includes(word)) continue;

			const entityType = this.classifyEntity(word, i, words);
			if (entityType && !seen.has(word)) {
				seen.add(word);
				entities.push({
					id: `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
					type: entityType,
					name: word.charAt(0).toUpperCase() + word.slice(1),
					confidence: 0.7 + Math.random() * 0.3, // 0.7-1.0
					sourceIds: [sourceId],
					createdAt: new Date(),
					updatedAt: new Date(),
				});
			}
		}

		return entities;
	}

	private classifyEntity(word: string, _position: number, _words: string[]): string | null {
		// Simple heuristic classification
		if (word.match(/^\d{4}-\d{2}-\d{2}$/)) return "DATE";
		if (word.match(/^[a-z]\.([a-z]\.)+/i)) return "PERSON";
		if (word.match(/^[a-z]+(?:[a-z]+)*$/i) && word.length > 4) {
			const random = Math.random();
			if (random < 0.3) return "CONCEPT";
			if (random < 0.6) return "LOCATION";
			return "ORGANIZATION";
		}
		return null;
	}

	async extractRelationships(text: string, entities: Entity[]): Promise<Relationship[]> {
		const relationships: Relationship[] = [];

		// Find relationships between entities in text
		for (let i = 0; i < entities.length; i++) {
			for (let j = i + 1; j < entities.length; j++) {
				const entity1 = entities[i];
				const entity2 = entities[j];

				// Check if entities appear close together in text
				const pattern = new RegExp(`${entity1.name}.*${entity2.name}|${entity2.name}.*${entity1.name}`, "i");
				if (pattern.test(text)) {
					const relType = this.inferRelationshipType(entity1.type, entity2.type);
					relationships.push({
						id: `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
						sourceEntityId: entity1.id,
						targetEntityId: entity2.id,
						type: relType,
						strength: 0.6 + Math.random() * 0.4, // 0.6-1.0
						evidence: [text.substring(0, 100)],
						createdAt: new Date(),
					});
				}
			}
		}

		return relationships;
	}

	private inferRelationshipType(type1: string, type2: string): string {
		if (type1 === "PERSON" && type2 === "ORGANIZATION") return "WORKS_AT";
		if (type1 === "ORGANIZATION" && type2 === "LOCATION") return "LOCATED_IN";
		if (type1 === "CONCEPT" && type2 === "CONCEPT") return "RELATED_TO";
		if (type1 === "PRODUCT" && type2 === "ORGANIZATION") return "CREATED_BY";
		return "RELATED_TO";
	}

	async extractBatch(texts: Array<{ text: string; id: string }>): Promise<ExtractionResult[]> {
		const results: ExtractionResult[] = [];
		const concurrency = 3;

		for (let i = 0; i < texts.length; i += concurrency) {
			const batch = texts.slice(i, i + concurrency);
			const batchResults = await Promise.all(batch.map((item) => this.extract(item.text, item.id)));
			results.push(...batchResults);
		}

		return results;
	}

	getEntityTypeDistribution(entities: Entity[]): Record<string, number> {
		const distribution: Record<string, number> = {};

		for (const entity of entities) {
			distribution[entity.type] = (distribution[entity.type] || 0) + 1;
		}

		return distribution;
	}

	getRelationshipTypeDistribution(relationships: Relationship[]): Record<string, number> {
		const distribution: Record<string, number> = {};

		for (const rel of relationships) {
			distribution[rel.type] = (distribution[rel.type] || 0) + 1;
		}

		return distribution;
	}
}

export function createEntityExtractor(): EntityExtractor {
	return new EntityExtractor();
}
